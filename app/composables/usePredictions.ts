// ── Predictions composable ────────────────────────────────────────────────────
// Lets a user predict the outcome of every match in the tournament — all 48
// group-stage games AND all knockout rounds — and see their predicted bracket
// cascade all the way to the Final.
//
// Separate from usePicks.ts (which is for the live "pick before kickoff" game).
// Predictions are always open for all matches regardless of status.
//
// Storage: localStorage, keyed by match id (group stage) or bracket slot id
// (knockout). Predictions persist across reloads with no backend required.

import {
  WC_GROUPS,
  WC_TEAMS,
  WC_2026_BRACKET_SEEDING,
} from '../constants/worldcup'
import type { BracketSlot } from '../constants/worldcup'

// Re-export BracketSlot so pages can import it from here
export type { BracketSlot }

const STORAGE_KEY = 'wc-predictions-v1'

/** Which outcome the user predicted for a match. */
export type PredictOutcome = 'home' | 'away' | 'draw'

type PredictionsMap = Record<string, PredictOutcome>

/** A team's computed standing within a group based on predictions. */
export interface PredictedStandingEntry {
  teamName: string
  shortName: string
  iso2: string
  abbrev: string
  color: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  rank: number
}

/** A predicted bracket match — either seeded from group results or picked by user. */
export interface BracketMatch {
  /** Unique slot id, e.g. "R32-1", "R16-1", "QF-1", "SF-1", "F" */
  slotId: string
  /** Round label */
  round: 'R32' | 'R16' | 'QF' | 'SF' | '3rd' | 'F'
  /** Home team name (resolved from group predictions, or '' if not yet known) */
  home: string
  homeIso2: string
  homeColor: string
  homeAbbrev: string
  homeShort: string
  /** Away team name */
  away: string
  awayIso2: string
  awayColor: string
  awayAbbrev: string
  awayShort: string
  /** User's pick for this bracket match */
  pick: 'home' | 'away' | null
  /** The predicted winner (resolved from pick, or '' if not yet picked) */
  winner: string
  /** Whether both teams are known (can be picked) */
  ready: boolean
  /** Whether this match has a real FT result that overrides the user's pick */
  locked: boolean
  /** FIFA official match number */
  matchNumber: number
  /** ISO date string for the match kickoff time */
  date?: string
}

/** Minimal match shape needed for group standings computation */
export interface GroupMatch {
  id: string
  home: string
  away: string
  group: string | null
  homeIso2: string
  awayIso2: string
  homeColor: string
  awayColor: string
  homeAbbrev: string
  awayAbbrev: string
  homeShort: string
  awayShort: string
  /** Match status — 'ft' means result is final and locked */
  statusCode: 'ns' | 'live' | 'ht' | 'ft'
  homeScore: string | null
  awayScore: string | null
  /** ISO date string for the match kickoff time */
  date?: string
  /**
   * For knockout matches decided by penalties (90-min score is a draw),
   * the name of the team that advanced. Used to determine the bracket winner
   * when homeScore === awayScore.
   */
  penWinner?: string | null
  /**
   * FIFA official match number (73–104 for knockout matches).
   * Used to key ftResults so the lookup is robust against ESPN display-name
   * mismatches (e.g. "Korea Republic" vs "South Korea").
   */
  matchNumber?: number | null
}

function loadPredictions(): PredictionsMap {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PredictionsMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function usePredictions() {
  const predictions = useState<PredictionsMap>('wc-predictions', () =>
    loadPredictions()
  )
  const predictionsReady = useState<boolean>(
    'wc-predictions-ready',
    () => false
  )

  if (import.meta.client) {
    onMounted(() => {
      if (Object.keys(predictions.value).length === 0) {
        const stored = loadPredictions()
        if (Object.keys(stored).length > 0) predictions.value = stored
      }
      predictionsReady.value = true
    })
  }

  function persist() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions.value))
    } catch {
      // storage full / unavailable — ignore
    }
  }

  /** Get the predicted outcome for a match id (or null). */
  function getPrediction(matchId: string): PredictOutcome | null {
    return predictions.value[matchId] ?? null
  }

  /** Set a prediction for a match. */
  function setPrediction(matchId: string, outcome: PredictOutcome) {
    predictions.value = { ...predictions.value, [matchId]: outcome }
    persist()
  }

  /** Toggle a prediction: setting the same outcome again clears it. */
  function togglePrediction(matchId: string, outcome: PredictOutcome) {
    if (predictions.value[matchId] === outcome) {
      clearPrediction(matchId)
    } else {
      setPrediction(matchId, outcome)
    }
  }

  /** Clear a prediction. */
  function clearPrediction(matchId: string) {
    if (!(matchId in predictions.value)) return
    const next = { ...predictions.value }
    delete next[matchId]
    predictions.value = next
    persist()
  }

  /** Clear all predictions. */
  function clearAll() {
    predictions.value = {}
    persist()
  }

  /**
   * Compute predicted group standings for a given group letter from a list of
   * group-stage matches. Uses the same FIFA sort logic as useStandings.ts.
   */
  function predictedGroupStandings(
    groupLetter: string,
    groupMatches: GroupMatch[]
  ): PredictedStandingEntry[] {
    const stats = new Map<
      string,
      {
        teamName: string
        shortName: string
        iso2: string
        abbrev: string
        color: string
        played: number
        wins: number
        draws: number
        losses: number
        goalsFor: number
        goalsAgainst: number
        goalDiff: number
        points: number
      }
    >()

    // Seed all teams in this group
    const groupTeams = WC_TEAMS.filter((t) => t.group === groupLetter)
    for (const team of groupTeams) {
      stats.set(team.name, {
        teamName: team.name,
        shortName: team.shortName ?? team.name,
        iso2: team.iso2,
        abbrev: team.abbrev,
        color: team.color,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      })
    }

    // Apply results: use actual score for finished/live matches, prediction otherwise
    for (const match of groupMatches) {
      const home = stats.get(match.home)
      const away = stats.get(match.away)
      if (!home || !away) continue

      // Determine the effective outcome
      let outcome: PredictOutcome | null = null
      let hs: number | null = null
      let as_: number | null = null

      if (
        (match.statusCode === 'ft' ||
          match.statusCode === 'live' ||
          match.statusCode === 'ht') &&
        match.homeScore !== null &&
        match.awayScore !== null
      ) {
        // Use the real result (including live/in-progress scores)
        const parsedHs = parseInt(match.homeScore, 10)
        const parsedAs = parseInt(match.awayScore, 10)
        if (!Number.isNaN(parsedHs) && !Number.isNaN(parsedAs)) {
          hs = parsedHs
          as_ = parsedAs
          outcome = hs > as_ ? 'home' : as_ > hs ? 'away' : 'draw'
        }
      } else {
        // Use the user's prediction (no goal data available)
        outcome = predictions.value[match.id] ?? null
      }

      if (!outcome) continue

      home.played++
      away.played++

      // Accumulate goals when we have real scores
      if (hs !== null && as_ !== null) {
        home.goalsFor += hs
        home.goalsAgainst += as_
        home.goalDiff += hs - as_
        away.goalsFor += as_
        away.goalsAgainst += hs
        away.goalDiff += as_ - hs
      }

      if (outcome === 'draw') {
        home.draws++
        away.draws++
        home.points++
        away.points++
      } else if (outcome === 'home') {
        home.wins++
        away.losses++
        home.points += 3
      } else {
        away.wins++
        home.losses++
        away.points += 3
      }
    }

    // Sort by FIFA tiebreakers — same order as useStandings.ts fifaSort
    const sorted = [...stats.values()].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
      if (a.goalsAgainst !== b.goalsAgainst)
        return a.goalsAgainst - b.goalsAgainst
      if (b.wins !== a.wins) return b.wins - a.wins
      return a.teamName.localeCompare(b.teamName)
    })

    return sorted.map((e, idx) => ({ ...e, rank: idx + 1 }))
  }

  /**
   * Compute predicted advancers for all groups.
   * Returns a map of group letter → { first, second, third }
   */
  function predictedAdvancers(
    allGroupMatches: GroupMatch[]
  ): Map<string, { first: string; second: string; third: string }> {
    const result = new Map<
      string,
      { first: string; second: string; third: string }
    >()

    for (const groupLetter of WC_GROUPS) {
      const groupMatches = allGroupMatches.filter(
        (m) => m.group === groupLetter
      )
      const standings = predictedGroupStandings(groupLetter, groupMatches)
      result.set(groupLetter, {
        first: standings[0]?.teamName ?? '',
        second: standings[1]?.teamName ?? '',
        third: standings[2]?.teamName ?? '',
      })
    }

    return result
  }

  /**
   * Resolve a team name from a bracket slot descriptor.
   * Handles: '1A', '2B', '3rd-ABCDF', 'W-R32-1', 'W-R16-2', 'W-QF-1',
   *          'W-SF-1', 'L-SF-1' (for 3rd place playoff)
   *
   * assignedThirdPlace tracks which 3rd-place teams have already been
   * assigned to a slot so the same team is never placed in two matches.
   */
  function resolveSlot(
    slot: string,
    advancers: Map<string, { first: string; second: string; third: string }>,
    bracketWinners: Map<string, string>,
    bracketLosers: Map<string, string>,
    assignedThirdPlace: Set<string>
  ): string {
    // Winner/runner-up from group: '1A', '2B', etc.
    const groupMatch = slot.match(/^([12])([A-L])$/)
    if (groupMatch) {
      const pos = groupMatch[1]
      const group = groupMatch[2]!
      const adv = advancers.get(group)
      if (!adv) return ''
      return pos === '1' ? adv.first : adv.second
    }

    // 3rd place wildcard: '3rd-ABCDF' etc.
    // Return the first available 3rd-place team from the listed groups that
    // hasn't already been assigned to another slot.
    const thirdMatch = slot.match(/^3rd-([A-L]+)$/)
    if (thirdMatch) {
      const groups = thirdMatch[1]!.split('')
      for (const g of groups) {
        const adv = advancers.get(g)
        if (adv?.third && !assignedThirdPlace.has(adv.third)) {
          assignedThirdPlace.add(adv.third)
          return adv.third
        }
      }
      return ''
    }

    // Winner of a previous bracket match: 'W-R32-1', 'W-R16-2', 'W-QF-1', 'W-SF-1'
    const winnerMatch = slot.match(/^W-(.+)$/)
    if (winnerMatch) {
      return bracketWinners.get(winnerMatch[1]!) ?? ''
    }

    // Loser of a previous bracket match: 'L-SF-1', 'L-SF-2' (3rd place playoff)
    const loserMatch = slot.match(/^L-(.+)$/)
    if (loserMatch) {
      return bracketLosers.get(loserMatch[1]!) ?? ''
    }

    return ''
  }

  /**
   * Build the full predicted bracket from group predictions + bracket picks.
   * If knockoutMatches is provided, any completed (FT) knockout match result
   * takes precedence over the user's stored pick for that slot.
   * Returns an array of BracketMatch objects for all rounds.
   */
  function predictedBracket(
    allGroupMatches: GroupMatch[],
    knockoutMatches: GroupMatch[] = []
  ): BracketMatch[] {
    const advancers = predictedAdvancers(allGroupMatches)
    const bracketWinners = new Map<string, string>()
    const bracketLosers = new Map<string, string>()
    const assignedThirdPlace = new Set<string>()

    // Build a lookup of FT knockout results.
    //
    // Primary key: matchNumber (from WC_2026_BRACKET_SEEDING) — this is the
    // most reliable key because it's immune to ESPN display-name mismatches
    // (e.g. "Korea Republic" vs "South Korea") and unresolved slot names.
    //
    // Also stores the actual home/away team names from the real match so the
    // bracket card can display the correct teams even when the predicted slot
    // hasn't resolved (e.g. a 3rd-place wildcard with no group picks made).
    //
    // Handles three cases:
    //   1. Normal win in 90 min: homeScore !== awayScore → higher score wins
    //   2. Draw after 90 min decided by ET/penalties: penWinner carries the
    //      advancing team name (populated from ESPN's competitor.winner flag)
    //   3. Fallback: if scores are equal and no penWinner, skip (result unknown)
    // Build a date lookup: matchNumber → ISO date string (for all knockout matches).
    // Seed with known static dates for SF/3rd/Final — ESPN's API doesn't return
    // these future matches in the full-tournament date range query.
    const STATIC_MATCH_DATES: Record<number, string> = {
      101: '2026-07-14T19:00Z', // SF-1: Tue Jul 14
      102: '2026-07-15T19:00Z', // SF-2: Wed Jul 15
      103: '2026-07-18T21:00Z', // 3rd Place: Sat Jul 18
      104: '2026-07-19T19:00Z', // Final: Sun Jul 19
    }
    const matchDates = new Map<number, string>(
      Object.entries(STATIC_MATCH_DATES).map(([k, v]) => [Number(k), v])
    )
    for (const m of knockoutMatches) {
      if (m.matchNumber != null && m.date) {
        matchDates.set(m.matchNumber, m.date)
      }
    }

    const ftResults = new Map<
      number,
      { winner: string; loser: string; actualHome: string; actualAway: string }
    >()
    for (const m of knockoutMatches) {
      if (
        m.statusCode === 'ft' &&
        m.homeScore !== null &&
        m.awayScore !== null &&
        m.matchNumber != null
      ) {
        const hs = parseInt(m.homeScore, 10)
        const as_ = parseInt(m.awayScore, 10)
        if (Number.isNaN(hs) || Number.isNaN(as_)) continue

        let winner: string
        let loser: string

        if (hs !== as_) {
          // Normal win in 90 min
          winner = hs > as_ ? m.home : m.away
          loser = hs > as_ ? m.away : m.home
        } else if (m.penWinner) {
          // Draw after 90 min — use the penalty/ET winner
          winner = m.penWinner
          loser = m.penWinner === m.home ? m.away : m.home
        } else {
          // Scores equal, no penalty winner known yet — skip
          continue
        }

        ftResults.set(m.matchNumber, {
          winner,
          loser,
          actualHome: m.home,
          actualAway: m.away,
        })
      }
    }

    function teamData(name: string) {
      const t = WC_TEAMS.find((t) => t.name === name)
      return {
        iso2: t?.iso2 ?? '',
        color: t?.color ?? '888888',
        abbrev: t?.abbrev ?? (name ? name.slice(0, 3).toUpperCase() : ''),
        shortName: t?.shortName ?? t?.name ?? name,
      }
    }

    const result: BracketMatch[] = []

    for (const slot of WC_2026_BRACKET_SEEDING) {
      const homeTeam = resolveSlot(
        slot.home,
        advancers,
        bracketWinners,
        bracketLosers,
        assignedThirdPlace
      )
      const awayTeam = resolveSlot(
        slot.away,
        advancers,
        bracketWinners,
        bracketLosers,
        assignedThirdPlace
      )

      // Look up the real FT result by match number — immune to name mismatches.
      const ftResult = ftResults.get(slot.matchNumber) ?? null

      // When a real result exists, use the actual teams from the real match.
      // This handles cases where the predicted slot team (e.g. from a 3rd-place
      // wildcard) doesn't match the ESPN display name, or the slot is unresolved.
      const displayHome = ftResult?.actualHome ?? homeTeam
      const displayAway = ftResult?.actualAway ?? awayTeam

      const homeData = teamData(displayHome)
      const awayData = teamData(displayAway)

      let pick =
        (predictions.value[slot.slotId] as 'home' | 'away' | undefined) ?? null
      // A slot is "ready" if both teams are known (either from real result or predictions)
      const ready = displayHome !== '' && displayAway !== ''

      let winner: string
      let loser: string

      if (ftResult) {
        // Real result overrides user pick; set pick to reflect the real winner
        winner = ftResult.winner
        loser = ftResult.loser
        pick = winner === displayHome ? 'home' : 'away'
      } else {
        winner =
          pick === 'home' ? displayHome : pick === 'away' ? displayAway : ''
        loser =
          pick === 'home' ? displayAway : pick === 'away' ? displayHome : ''
      }

      // Record winner/loser for downstream slots
      if (winner) bracketWinners.set(slot.slotId, winner)
      if (loser) bracketLosers.set(slot.slotId, loser)

      result.push({
        slotId: slot.slotId,
        round: slot.round,
        home: displayHome,
        homeIso2: homeData.iso2,
        homeColor: homeData.color,
        homeAbbrev: homeData.abbrev,
        homeShort: homeData.shortName,
        away: displayAway,
        awayIso2: awayData.iso2,
        awayColor: awayData.color,
        awayAbbrev: awayData.abbrev,
        awayShort: awayData.shortName,
        pick,
        winner,
        ready,
        locked: ftResult !== null,
        matchNumber: slot.matchNumber,
        date: matchDates.get(slot.matchNumber),
      })
    }

    return result
  }

  // ── Progress counters ──────────────────────────────────────────────────────

  /** Count of group-stage predictions made (keyed by ESPN match id = numeric). */
  const groupPickCount = computed(
    () => Object.keys(predictions.value).filter((id) => /^\d+$/.test(id)).length
  )

  /** Count of bracket predictions made (keyed by slot id like R32-1, QF-2, F). */
  const bracketPickCount = computed(
    () =>
      Object.keys(predictions.value).filter((id) => !/^\d+$/.test(id)).length
  )

  return {
    predictions,
    predictionsReady,
    groupPickCount,
    bracketPickCount,
    getPrediction,
    setPrediction,
    togglePrediction,
    clearPrediction,
    clearAll,
    predictedGroupStandings,
    predictedAdvancers,
    predictedBracket,
  }
}
