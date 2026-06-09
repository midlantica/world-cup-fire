// ── Picks composable ──────────────────────────────────────────────────────────
// Lets a user pick the team they think will win in any upcoming match. Picks are
// stored locally (localStorage) so they persist across reloads, and a snapshot
// of the picked match is kept alongside the pick so the Picks page can render the
// full card without re-fetching the schedule.
//
// A pick can only be made from ~1 hour before kick-off onwards is NOT enforced
// here — eligibility is exposed via `canPick(match)` so the UI can decide when to
// surface the check / X buttons. (Per the design: picks open ~1 hour before a
// game begins.)

import type { Match } from './useScores'
import { useTimezone } from './useTimezone'
import { now as mockNow } from './useMockTime'

const STORAGE_KEY = 'wc-picks-v1'

/** How long before kick-off picks open (ms). ~1 hour per the design. */
const PICK_WINDOW_MS = 60 * 60 * 1000

/** The outcome a user backed for a match: a side wins, or (group only) a draw. */
export type PickOutcome = 'home' | 'away' | 'draw'

/** A single saved pick: the match snapshot + which outcome the user backed. */
export interface Pick {
  /** Match id (stable key). */
  matchId: string
  /**
   * The picked team's full name for a win pick (matches Match.home /
   * Match.away). For a draw pick this is '' — read `outcome` instead.
   */
  team: string
  /** Which outcome the user backed: 'home' | 'away' | 'draw'. */
  outcome: PickOutcome
  /** ISO timestamp the pick was made. */
  pickedAt: string
  /** Snapshot of the match at pick time so the Picks page can render it. */
  match: Match
}

type PicksMap = Record<string, Pick>

function loadPicks(): PicksMap {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PicksMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function usePicks() {
  const picks = useState<PicksMap>('wc-picks', () => loadPicks())
  const { iana } = useTimezone()

  // True once picks have actually been read from localStorage on the client.
  // On the server (and during the first client tick before hydration) this is
  // false, so the UI can avoid flashing "deadline" nudges based on an empty map
  // that hasn't been loaded yet.
  const picksReady = useState<boolean>('wc-picks-ready', () => false)

  // Keep localStorage in sync. (Hydrate once on client too, in case the state
  // was first created during SSR with an empty map.)
  if (import.meta.client) {
    onMounted(() => {
      if (Object.keys(picks.value).length === 0) {
        const stored = loadPicks()
        if (Object.keys(stored).length > 0) picks.value = stored
      }
      picksReady.value = true
    })
  }

  function persist() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(picks.value))
    } catch {
      // storage full / unavailable — ignore
    }
  }

  /** Number of matches the user has picked (drives the header badge). */
  const pickCount = computed(() => Object.keys(picks.value).length)

  /** All picks as an array, newest match first by kickoff. */
  const pickList = computed<Pick[]>(() =>
    Object.values(picks.value).sort(
      (a, b) =>
        new Date(a.match.date).getTime() - new Date(b.match.date).getTime()
    )
  )

  /** The team picked for a given match id (or null if none / a draw pick). */
  function pickedTeam(matchId: string): string | null {
    const p = picks.value[matchId]
    if (!p || p.outcome === 'draw') return null
    return p.team
  }

  /** The outcome picked for a given match id (or null if none). */
  function pickedOutcome(matchId: string): PickOutcome | null {
    return picks.value[matchId]?.outcome ?? null
  }

  /**
   * WTL (Win·Tie·Lose) view of a match's pick, ANCHORED to the home team:
   *   'win'  → home picked   ('home')
   *   'tie'  → draw picked   ('draw')
   *   'lose' → away picked   ('away')
   * Returns null when nothing is picked. This is what the unified WtlToggle
   * control binds to, so the same single unit drives every pick.
   */
  function wtlOutcome(matchId: string): 'win' | 'tie' | 'lose' | null {
    const o = picks.value[matchId]?.outcome
    if (o === 'home') return 'win'
    if (o === 'draw') return 'tie'
    if (o === 'away') return 'lose'
    return null
  }

  /** Apply a WTL choice to a match (home wins / draw / away wins). */
  function pickWtl(match: Match, choice: 'win' | 'tie' | 'lose') {
    if (choice === 'tie') pickDraw(match)
    else pick(match, choice === 'win' ? match.home : match.away)
  }

  /** True if a specific team is the current win pick for its match. */
  function isPicked(matchId: string, team: string): boolean {
    const p = picks.value[matchId]
    return !!p && p.outcome !== 'draw' && p.team === team
  }

  /** True if a draw is the current pick for this match. */
  function isDrawPicked(matchId: string): boolean {
    return picks.value[matchId]?.outcome === 'draw'
  }

  /**
   * Whether a DRAW may be picked for this match. Only group-stage games can end
   * level (knockout games go to extra time / penalties), so the [T] control is
   * surfaced only when the match belongs to a group.
   */
  function canPickDraw(match: Match): boolean {
    return canPick(match) && match.group !== null
  }

  /**
   * Whether picks are open for a match: it must be upcoming (not started /
   * finished) and within ~1 hour of kick-off. We treat any not-yet-started
   * match as pickable as well so users can plan ahead — but honour the "no
   * picks once the game has begun" rule.
   *
   * NOTE: per the brief picks open ~1h before kickoff. To keep the feature
   * usable before/at the tournament we allow picking any not-started match,
   * and only *lock* once the match is live/finished.
   *
   * MOCK MODE: mock match IDs start with 'mock-' — allow picking on finished
   * mock matches so the pool leaderboard can be tested before the WC starts.
   */
  function canPick(match: Match): boolean {
    if (match.id.startsWith('mock-')) return match.status.code !== 'live'
    return match.status.code === 'ns'
  }

  /** Whether the match is within the highlighted ~1h pre-kickoff window. */
  function isPickWindowOpen(match: Match): boolean {
    if (match.status.code !== 'ns') return false
    const kickoff = new Date(match.date).getTime()
    if (Number.isNaN(kickoff)) return false
    return kickoff - mockNow() <= PICK_WINDOW_MS
  }

  /**
   * If a pick for this match exists but is a stub (match.home === ''), replace
   * the stub's match snapshot with the real match data. Called by MatchCard
   * whenever it renders a match that has a pick, so stubs get hydrated as soon
   * as the schedule loads — without requiring the user to re-pick.
   */
  function hydrateStub(match: Match) {
    const p = picks.value[match.id]
    if (!p) return
    // Only hydrate if it's a stub (empty home name) and the real match has data.
    if (p.match.home !== '' || !match.home) return
    picks.value = {
      ...picks.value,
      [match.id]: { ...p, match },
    }
    persist()
  }

  /** Pick a team to WIN a match (replaces any existing pick for that match). */
  function pick(match: Match, team: string) {
    const outcome: PickOutcome = team === match.home ? 'home' : 'away'
    picks.value = {
      ...picks.value,
      [match.id]: {
        matchId: match.id,
        team,
        outcome,
        pickedAt: new Date().toISOString(),
        match,
      },
    }
    persist()
  }

  /** Pick a DRAW for a (group-stage) match. */
  function pickDraw(match: Match) {
    picks.value = {
      ...picks.value,
      [match.id]: {
        matchId: match.id,
        team: '',
        outcome: 'draw',
        pickedAt: new Date().toISOString(),
        match,
      },
    }
    persist()
  }

  /** Toggle a win pick: picking the same team again clears it. */
  function togglePick(match: Match, team: string) {
    if (isPicked(match.id, team)) clearPick(match.id)
    else pick(match, team)
  }

  /** Toggle a draw pick: picking a draw again clears it. */
  function toggleDraw(match: Match) {
    if (isDrawPicked(match.id)) clearPick(match.id)
    else pickDraw(match)
  }

  /** Remove the pick for a match entirely. */
  function clearPick(matchId: string) {
    if (!(matchId in picks.value)) return
    const next = { ...picks.value }
    delete next[matchId]
    picks.value = next
    persist()
  }

  /** Remove every pick. */
  function clearAll() {
    picks.value = {}
    persist()
  }

  // ── Day grouping (shared by My Picks + any pool summary) ──────────────────
  interface PickDayGroup {
    /** YYYY-MM-DD key in the user's timezone. */
    key: string
    /** Human label, e.g. "Friday, June 12". */
    label: string
    picks: Pick[]
  }

  function formatDayHeader(day: string): string {
    return new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  /** Picks grouped by calendar day (user's timezone), for the date separators. */
  const pickListByDay = computed<PickDayGroup[]>(() => {
    const map = new Map<string, Pick[]>()
    for (const p of pickList.value) {
      const day = new Date(p.match.date).toLocaleDateString('en-CA', {
        timeZone: iana.value,
      })
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(p)
    }
    return Array.from(map.entries()).map(([key, picks]) => ({
      key,
      label: formatDayHeader(key),
      picks,
    }))
  })

  return {
    picks,
    picksReady,
    pickCount,

    pickList,
    pickListByDay,
    pickedTeam,
    pickedOutcome,
    wtlOutcome,
    pickWtl,
    isPicked,
    isDrawPicked,
    canPick,
    canPickDraw,
    isPickWindowOpen,
    pick,
    pickDraw,

    hydrateStub,
    togglePick,
    toggleDraw,
    clearPick,
    clearAll,
  }
}
