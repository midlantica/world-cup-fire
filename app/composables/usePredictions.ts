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

    // Build a lookup: "HomeTeam|AwayTeam" → { winner, loser } for FT knockout matches
    const ftResults = new Map<string, { winner: string; loser: string }>()
    for (const m of knockoutMatches) {
      if (
        m.statusCode === 'ft' &&
        m.homeScore !== null &&
        m.awayScore !== null
      ) {
        const hs = parseInt(m.homeScore, 10)
        const as_ = parseInt(m.awayScore, 10)
        if (!Number.isNaN(hs) && !Number.isNaN(as_) && hs !== as_) {
          const winner = hs > as_ ? m.home : m.away
          const loser = hs > as_ ? m.away : m.home
          ftResults.set(`${m.home}|${m.away}`, { winner, loser })
          ftResults.set(`${m.away}|${m.home}`, { winner, loser })
        }
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

      const homeData = teamData(homeTeam)
      const awayData = teamData(awayTeam)

      // Check if there's a real FT result for this matchup
      const ftResult =
        homeTeam && awayTeam
          ? (ftResults.get(`${homeTeam}|${awayTeam}`) ?? null)
          : null

      let pick =
        (predictions.value[slot.slotId] as 'home' | 'away' | undefined) ?? null
      const ready = homeTeam !== '' && awayTeam !== ''

      let winner: string
      let loser: string

      if (ftResult) {
        // Real result overrides user pick
        winner = ftResult.winner
        loser = ftResult.loser
        pick = winner === homeTeam ? 'home' : 'away'
      } else {
        winner = pick === 'home' ? homeTeam : pick === 'away' ? awayTeam : ''
        loser = pick === 'home' ? awayTeam : pick === 'away' ? homeTeam : ''
      }

      // Record winner/loser for downstream slots
      if (winner) bracketWinners.set(slot.slotId, winner)
      if (loser) bracketLosers.set(slot.slotId, loser)

      result.push({
        slotId: slot.slotId,
        round: slot.round,
        home: homeTeam,
        homeIso2: homeData.iso2,
        homeColor: homeData.color,
        homeAbbrev: homeData.abbrev,
        homeShort: homeData.shortName,
        away: awayTeam,
        awayIso2: awayData.iso2,
        awayColor: awayData.color,
        awayAbbrev: awayData.abbrev,
        awayShort: awayData.shortName,
        pick,
        winner,
        ready,
        locked: ftResult !== null,
        matchNumber: slot.matchNumber,
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
