import {
  TEAM_BY_NAME,
  RIVALRY_PAIRS,
  WC_START,
  WC_FINAL,
  venueLocation,
  matchVenueOverride,
} from '../constants/worldcup'
import { useTimezone } from './useTimezone'
import { nowDate } from './useMockTime'

export interface MatchStatus {
  code: 'ns' | 'live' | 'ht' | 'ft'
  clock?: string
}

export type MatchBadge = 'fire' | 'wild' | null

export interface Match {
  id: string
  date: string
  home: string
  homeShort: string
  homeScore: string | null
  homeColor: string
  homeAltColor: string
  homeIso2: string
  homeAbbrev: string
  away: string
  awayShort: string
  awayScore: string | null
  awayColor: string
  awayAltColor: string
  awayIso2: string
  awayAbbrev: string
  group: string | null
  venue: string | null
  venueLocation: string | null
  status: MatchStatus
  qualityScore: number
  badge: MatchBadge
  /** Unix ms timestamp rounded to the nearest 30-min slot — used for grouping */
  kickoffSlot: number
}

// ---------------------------------------------------------------------------
// Tournament week definitions
// ---------------------------------------------------------------------------

export type WeekTab = 'week1' | 'week2' | 'week3' | 'week4' | 'week5' | 'week6'

export type Stage = 'group' | 'knockout'

export interface TabDef {
  key: WeekTab
  label: string
  /** Short date range label shown under the week label */
  dateRange: string
  start: Date
  end: Date
  stage: Stage
}

/** Parse a YYYY-MM-DD string as a local midnight Date (avoids UTC offset issues) */
function parseDate(s: string): Date {
  const parts = s.split('-').map(Number)
  return new Date(parts[0]!, parts[1]! - 1, parts[2]!)
}

/** Format a Date as "Mon D" (e.g. "Jun 11") */
function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Week boundaries (Mon–Sun, except Week 1 starts on the first match day)
//
//  Group Stage
//   Week 1: Thurs Jun 11 – Sun Jun 14
//   Week 2: Mon  Jun 15 – Sun Jun 21
//   Week 3: Mon  Jun 22 – Sat Jun 27   (group stage ends Sat Jun 27)
//
//  Knockout Stage
//   Week 4: Sun  Jun 28 – Sun Jul  5
//   Week 5: Mon  Jul  6 – Sun Jul 12
//   Week 6: Mon  Jul 13 – Sun Jul 19   (Final Jul 19)
// ---------------------------------------------------------------------------

const W1S = parseDate('2026-06-11')
const W1E = parseDate('2026-06-14')
const W2S = parseDate('2026-06-15')
const W2E = parseDate('2026-06-21')
const W3S = parseDate('2026-06-22')
const W3E = parseDate('2026-06-27')
const W4S = parseDate('2026-06-28')
const W4E = parseDate('2026-07-05')
const W5S = parseDate('2026-07-06')
const W5E = parseDate('2026-07-12')
const W6S = parseDate('2026-07-13')
const W6E = WC_FINAL

export const WC_TABS: TabDef[] = [
  {
    key: 'week1',
    label: 'Week 1',
    dateRange: `${fmtDate(W1S)} – ${fmtDate(W1E)}`,
    start: W1S,
    end: W1E,
    stage: 'group',
  },
  {
    key: 'week2',
    label: 'Week 2',
    dateRange: `${fmtDate(W2S)} – ${fmtDate(W2E)}`,
    start: W2S,
    end: W2E,
    stage: 'group',
  },
  {
    key: 'week3',
    label: 'Week 3',
    dateRange: `${fmtDate(W3S)} – ${fmtDate(W3E)}`,
    start: W3S,
    end: W3E,
    stage: 'group',
  },
  {
    key: 'week4',
    label: 'Week 4',
    dateRange: `${fmtDate(W4S)} – ${fmtDate(W4E)}`,
    start: W4S,
    end: W4E,
    stage: 'knockout',
  },
  {
    key: 'week5',
    label: 'Week 5',
    dateRange: `${fmtDate(W5S)} – ${fmtDate(W5E)}`,
    start: W5S,
    end: W5E,
    stage: 'knockout',
  },
  {
    key: 'week6',
    label: 'Week 6',
    dateRange: `${fmtDate(W6S)} – ${fmtDate(W6E)}`,
    start: W6S,
    end: W6E,
    stage: 'knockout',
  },
]

/**
 * Determine the default tab:
 * - If today is within a WC week, return that week's tab
 * - If WC hasn't started yet, return 'week1'
 * - If WC is over, return 'week6'
 *
 * NOTE: tab.end is midnight (start of that day), so we compare now < the
 * *next* midnight after tab.end (i.e. now < tab.end + 1 day) to include the
 * full final day of each week.
 */
function defaultTab(): WeekTab {
  const now = nowDate()
  const DAY_MS = 24 * 60 * 60 * 1000
  for (const tab of WC_TABS) {
    if (now >= tab.start && now < new Date(tab.end.getTime() + DAY_MS))
      return tab.key
  }
  if (now < WC_START) return 'week1'
  return 'week6'
}

// ---------------------------------------------------------------------------
// Quality scoring
// ---------------------------------------------------------------------------

const RIVALRY_SET = new Set<string>(
  RIVALRY_PAIRS.map(([a, b]) => [a, b].sort().join('|'))
)

function isRivalry(a: string, b: string): boolean {
  return RIVALRY_SET.has([a, b].sort().join('|'))
}

function computeQuality(home: string, away: string): number {
  const h = TEAM_BY_NAME.get(home)
  const a = TEAM_BY_NAME.get(away)

  if (!h || !a) return 20

  const avgRank = (h.fifaRank + a.fifaRank) / 2
  const rankScore = Math.max(0, 100 - avgRank)
  const diff = Math.abs(h.fifaRank - a.fifaRank)
  const closenessBonus = Math.max(0, 20 - diff)
  const rivalryBonus = isRivalry(home, away) ? 20 : 0

  const raw = rankScore * 0.6 + closenessBonus + rivalryBonus
  return Math.min(100, Math.round(raw))
}

// ---------------------------------------------------------------------------
// ESPN event → Match normalisation
// ---------------------------------------------------------------------------

function statusCode(
  espnStatusName: string,
  espnState?: string,
  completed?: boolean
): MatchStatus['code'] {
  // Primary: match by name (most reliable)
  if (
    espnStatusName === 'STATUS_FINAL' ||
    espnStatusName === 'STATUS_FULL_TIME' ||
    espnStatusName === 'STATUS_FULL_PEN'
  )
    return 'ft'
  if (espnStatusName === 'STATUS_HALFTIME') return 'ht'
  if (
    espnStatusName === 'STATUS_IN_PROGRESS' ||
    espnStatusName === 'STATUS_FIRST_HALF' ||
    espnStatusName === 'STATUS_SECOND_HALF' ||
    espnStatusName === 'STATUS_EXTRA_TIME' ||
    espnStatusName === 'STATUS_SHOOTOUT'
  )
    return 'live'

  // Fallback: use state + completed flags so unknown name variants still work
  if (espnState === 'post' && completed) return 'ft'
  if (espnState === 'in') return 'live'

  return 'ns'
}

function normaliseClock(
  espnStatus: Record<string, unknown>
): string | undefined {
  const detail = espnStatus?.displayClock as string | undefined
  return detail && detail !== '0:00' && detail !== "0'" ? detail : undefined
}

/**
 * Optimistic LIVE: at kickoff, instantly promote a still-scheduled match to
 * `live` so the UI reflects the start with zero perceived delay, while the API
 * catches up in the background.
 *
 * Guard rails:
 *  • Only applies to matches the API still reports as `ns`. Any real status
 *    (live/ht/ft) always wins — the API is the source of truth.
 *  • Only applies once kickoff time has actually passed (diff >= 0).
 *  • Only applies within OPTIMISTIC_GRACE_MS of kickoff. If the match still
 *    hasn't started after that window, it's assumed delayed/postponed and we
 *    fall back to the scheduled view (no fake live game lingering).
 *
 * @param m       the normalised match
 * @param nowMs   current wall-clock time (passed in so this stays pure/testable)
 */
function applyOptimisticLive(m: Match, nowMs: number): Match {
  if (m.status.code !== 'ns') return m
  if (!m.date) return m

  const kickoff = new Date(m.date).getTime()
  if (Number.isNaN(kickoff)) return m

  const sinceKickoff = nowMs - kickoff
  // Not started yet, or past the grace window (likely delayed) → leave as-is
  if (sinceKickoff < 0 || sinceKickoff > OPTIMISTIC_GRACE_MS) return m

  // Within the window: optimistically show LIVE at 0-0, clock at the elapsed
  // minute (1' minimum, so it never shows "0'").
  const minute = Math.max(1, Math.floor(sinceKickoff / 60_000) + 1)
  return {
    ...m,
    homeScore: '0',
    awayScore: '0',
    status: { code: 'live', clock: `${minute}'` },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normaliseEvent(ev: any): Match {
  const comp = ev.competitions?.[0] ?? {}
  const competitors = (comp.competitors ?? []) as Array<Record<string, unknown>>

  const homeComp =
    competitors.find((competitor) => competitor.homeAway === 'home') ??
    competitors[0] ??
    {}
  const awayComp =
    competitors.find((competitor) => competitor.homeAway === 'away') ??
    competitors[1] ??
    {}

  const homeTeam = (homeComp.team as Record<string, unknown>) ?? {}
  const awayTeam = (awayComp.team as Record<string, unknown>) ?? {}

  const homeName = (homeTeam.displayName as string) ?? ''
  const awayName = (awayTeam.displayName as string) ?? ''

  const homeData = TEAM_BY_NAME.get(homeName)
  const awayData = TEAM_BY_NAME.get(awayName)

  const espnStatusType =
    ((ev.status as Record<string, unknown>)?.type as Record<string, unknown>) ??
    {}
  const espnStatusName = espnStatusType?.name as string
  const espnState = espnStatusType?.state as string | undefined
  const espnCompleted = espnStatusType?.completed as boolean | undefined

  const code = statusCode(espnStatusName, espnState, espnCompleted)
  const clock = normaliseClock(ev.status as Record<string, unknown>)

  const homeScore = code !== 'ns' ? ((homeComp.score as string) ?? '0') : null
  const awayScore = code !== 'ns' ? ((awayComp.score as string) ?? '0') : null

  const quality = computeQuality(homeName, awayName)
  const badge: MatchBadge =
    code !== 'ft'
      ? quality >= 50
        ? 'fire'
        : quality >= 35
          ? 'wild'
          : null
      : null

  const group = homeData?.group ?? awayData?.group ?? null

  return {
    id: String(ev.id ?? ''),
    date: String(ev.date ?? ''),
    home: homeName,
    homeShort: homeData?.shortName ?? homeData?.name ?? homeName,
    homeScore,
    homeColor: homeData?.color ?? '888888',
    homeAltColor: homeData?.altColor ?? 'ffffff',
    homeIso2: homeData?.iso2 ?? '',
    homeAbbrev: homeData?.abbrev ?? homeName.slice(0, 3).toUpperCase(),
    away: awayName,
    awayShort: awayData?.shortName ?? awayData?.name ?? awayName,
    awayScore,
    awayColor: awayData?.color ?? '888888',
    awayAltColor: awayData?.altColor ?? 'ffffff',
    awayIso2: awayData?.iso2 ?? '',
    awayAbbrev: awayData?.abbrev ?? awayName.slice(0, 3).toUpperCase(),
    group,
    venue: (() => {
      const eventId = String(ev.id ?? '')
      // Prefer our static map — it's verified against FIFA and more reliable
      // than the ESPN API which can return wrong venues (e.g. Banorte vs Azteca).
      const override = matchVenueOverride(eventId)
      if (override) return override
      return (
        ((comp.venue as Record<string, unknown>)?.fullName as string) ?? null
      )
    })(),
    venueLocation: (() => {
      const eventId = String(ev.id ?? '')
      const override = matchVenueOverride(eventId)
      const name =
        override ??
        ((comp.venue as Record<string, unknown>)?.fullName as string) ??
        null
      return venueLocation(name)
    })(),
    status: { code, clock },
    qualityScore: quality,
    badge,
    kickoffSlot: (() => {
      const ms = new Date(String(ev.date ?? '')).getTime()
      const SLOT_MS = 30 * 60_000
      return Math.floor(ms / SLOT_MS) * SLOT_MS
    })(),
  }
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Format a local-midnight Date as YYYYMMDD without UTC conversion.
 *  Using toISOString() would shift the date in positive UTC timezones
 *  (e.g. NZ UTC+12: local Jun 11 00:00 → UTC Jun 10 12:00 → "20260610").
 */
function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function tabDateRange(tab: WeekTab): string {
  const def = WC_TABS.find((t) => t.key === tab)
  if (!def) return ''
  return `${toYYYYMMDD(def.start)}-${toYYYYMMDD(def.end)}`
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

const LIVE_POLL_INTERVAL_MS = 10_000 // 10 s client-side polling during live matches
const KICKOFF_POLL_INTERVAL_MS = 10_000 // 10 s polling when kickoff is imminent
/** How far before kickoff (ms) to start aggressive polling */
const KICKOFF_LEAD_MS = 3 * 60_000 // 3 minutes
/** Interval to check whether any kickoff is now imminent (time-based, not reactive) */
const KICKOFF_CHECK_INTERVAL_MS = 30_000 // check every 30 s

// ── Optimistic LIVE ──────────────────────────────────────────────────────────
// At kickoff, flip a scheduled match to LIVE *instantly* (zero perceived delay)
// while the real API "catches up" in the background. The API stays the source
// of truth: the moment it reports real live/ht/ft, that wins.
//
// Safeguard for delays/postponements (weather, etc.): we only stay optimistic
// for a grace window. If kickoff has passed by more than OPTIMISTIC_GRACE_MS and
// the API STILL says the match hasn't started, we assume it's delayed and revert
// to showing the scheduled time (rather than a fake live game forever).
const OPTIMISTIC_GRACE_MS = 5 * 60_000 // 5 minutes
/** Reactive 1-Hz clock that drives the optimistic-status recompute. */
let optimisticTickTimer: ReturnType<typeof setInterval> | null = null

// ── Singleton polling state ────────────────────────────────────────────────
// useScores() is called by multiple components (ScoresSection, AppHeader, etc.)
// but they all share the same useState/useFetch data. We keep the timer at
// module level so only ONE interval ever runs, regardless of how many
// components mount.
let scoresLiveTimer: ReturnType<typeof setInterval> | null = null
let scoresKickoffTimer: ReturnType<typeof setInterval> | null = null
let scoresKickoffCheckTimer: ReturnType<typeof setInterval> | null = null
let scoresWatcherStop: (() => void) | null = null
// Only count client-side instances — SSR has no timers/watchers to manage.
let scoresInstanceCount = 0

// ── Live score overrides ───────────────────────────────────────────────────
// When the GameDetail modal polls /api/match-detail and derives a fresher
// score from keyEvents, it writes here so the wall cards stay in sync without
// waiting for the next /api/schedule poll cycle.
// Key: match id  Value: { homeScore, awayScore, status }
interface ScoreOverride {
  homeScore: string | null
  awayScore: string | null
  status: MatchStatus
}
const liveScoreOverrides = ref<Map<string, ScoreOverride>>(new Map())

/** Push a fresher score/status from an external poller (e.g. match-detail)
 *  into the shared scores state so all wall cards update immediately.
 *
 *  IMPORTANT: this is idempotent. If the incoming override is value-equal to
 *  the one already stored, we do nothing. Replacing the Map unconditionally
 *  would recompute `matches`, which re-fires the modal's `watch(matches)` →
 *  reassigns `selectedMatch` → re-runs the push watcher → replaces the Map
 *  again … an infinite reactive loop that froze/crashed the browser the moment
 *  a live score arrived. The equality guard lets the cycle settle. */
export function pushLiveScoreOverride(
  matchId: string,
  override: ScoreOverride
) {
  const existing = liveScoreOverrides.value.get(matchId)
  if (
    existing &&
    existing.homeScore === override.homeScore &&
    existing.awayScore === override.awayScore &&
    existing.status.code === override.status.code &&
    existing.status.clock === override.status.clock
  ) {
    // No change — bail out so we don't trigger a needless reactive recompute.
    return
  }
  // Replace the whole map so Vue's reactivity detects the change
  const next = new Map(liveScoreOverrides.value)
  next.set(matchId, override)
  liveScoreOverrides.value = next
}

/** Clear the override for a match (e.g. when the modal closes or the
 *  schedule poll catches up and is now at least as fresh). */
export function clearLiveScoreOverride(matchId: string) {
  if (!liveScoreOverrides.value.has(matchId)) return
  const next = new Map(liveScoreOverrides.value)
  next.delete(matchId)
  liveScoreOverrides.value = next
}

function stopScoresPolling() {
  if (scoresLiveTimer) {
    clearInterval(scoresLiveTimer)
    scoresLiveTimer = null
  }
}

function stopKickoffPolling() {
  if (scoresKickoffTimer) {
    clearInterval(scoresKickoffTimer)
    scoresKickoffTimer = null
  }
}

function stopKickoffCheckTimer() {
  if (scoresKickoffCheckTimer) {
    clearInterval(scoresKickoffCheckTimer)
    scoresKickoffCheckTimer = null
  }
}

export function useScores() {
  const { iana } = useTimezone()
  const activeTab = useState<WeekTab>('scores-tab', () => defaultTab())

  const dateRange = computed(() => tabDateRange(activeTab.value))

  const {
    data: rawEvents,
    pending,
    error,
    refresh,
  } = useFetch<unknown[]>('/api/schedule', {
    query: computed(() => ({ dates: dateRange.value })),
    watch: [dateRange],
    // Keep existing data visible while re-fetching (no blank/pending flash)
    dedupe: 'defer',
  })

  // Raw matches straight from the API (the source of truth).
  const rawMatches = computed<Match[]>(() => {
    if (!rawEvents.value) return []
    return rawEvents.value
      .map(normaliseEvent)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  // Reactive 1-Hz "tick" so the optimistic-live computed re-evaluates as the
  // wall clock crosses each kickoff (computed values don't re-run on time alone).
  // SSR: seed from nowDate() and never tick (no timers on the server).
  const tick = useState<number>('scores-tick', () => nowDate().getTime())

  // Public matches list = raw API data + optimistic-LIVE overlay at kickoff
  // + any fresher score/status pushed in by the match-detail poller.
  // Any match the API already reports as live/ht/ft is passed through untouched.
  const matches = computed<Match[]>(() => {
    const nowMs = tick.value
    const overrides = liveScoreOverrides.value
    return rawMatches.value.map((m) => {
      const base = applyOptimisticLive(m, nowMs)
      const ov = overrides.get(base.id)
      if (!ov) return base
      // Only apply the override when it's at least as "advanced" as the API:
      // live/ht override beats ns; ft override always wins.
      // Never downgrade a known ft back to live.
      if (base.status.code === 'ft') return base
      return {
        ...base,
        homeScore: ov.homeScore,
        awayScore: ov.awayScore,
        status: ov.status,
      }
    })
  })

  const matchesByDay = computed(() => {
    const groups = new Map<string, Match[]>()
    for (const m of matches.value) {
      const day = new Date(m.date).toLocaleDateString('en-CA', {
        timeZone: iana.value,
      })
      if (!groups.has(day)) groups.set(day, [])
      groups.get(day)!.push(m)
    }
    return groups
  })

  // Auto-refresh every 10 s when there are live/HT matches on the current tab.
  // The server cache (30 s TTL) means ESPN is only hit at most once per 30 s
  // regardless of how many clients are polling.
  //
  // Also polls every 10 s when any match kickoff is within 3 minutes, so the
  // status flips to LIVE exactly at kickoff rather than up to 60 s late.
  //
  // The watcher and timer are module-level singletons — only set up once even
  // though multiple components call useScores().
  const hasLiveMatches = computed(() =>
    matches.value.some(
      (m) => m.status.code === 'live' || m.status.code === 'ht'
    )
  )

  /** Returns true if any scheduled match kicks off within the next 3 minutes.
   *  NOTE: This is intentionally NOT a computed — it must be called with the
   *  current Date.now() each time, since computed values only re-run when
   *  reactive dependencies change (not when wall-clock time advances). */
  function checkImminentKickoff(): boolean {
    const nowMs = Date.now()
    return rawMatches.value.some((m) => {
      if (m.status.code !== 'ns') return false
      const kickoff = new Date(m.date).getTime()
      const diff = kickoff - nowMs
      return diff >= 0 && diff <= KICKOFF_LEAD_MS
    })
  }

  /** True if any API-scheduled match is within the optimistic-live window:
   *  i.e. kicking off in the next minute, OR already started but still inside
   *  the grace window (where we're showing it as optimistically LIVE).
   *  Drives whether the 1-Hz tick needs to run. */
  function needsOptimisticTick(): boolean {
    const nowMs = Date.now()
    return rawMatches.value.some((m) => {
      if (m.status.code !== 'ns') return false
      const kickoff = new Date(m.date).getTime()
      if (Number.isNaN(kickoff)) return false
      const diff = nowMs - kickoff
      // From 60 s before kickoff through the end of the grace window
      return diff >= -60_000 && diff <= OPTIMISTIC_GRACE_MS
    })
  }

  /** Start the 1-Hz tick (drives optimistic-live recompute) if not already running. */
  function startOptimisticTick() {
    if (optimisticTickTimer) return
    // Update immediately so the optimistic state appears without a 1s delay.
    tick.value = Date.now()
    optimisticTickTimer = setInterval(() => {
      tick.value = Date.now()
      // Self-stop once we're no longer in any optimistic window (and nothing
      // is genuinely live — the live poller keeps data fresh in that case).
      if (!needsOptimisticTick()) {
        stopOptimisticTick()
      }
    }, 1_000)
  }

  function stopOptimisticTick() {
    if (optimisticTickTimer) {
      clearInterval(optimisticTickTimer)
      optimisticTickTimer = null
    }
  }

  // Only set up timers/watchers on the client — SSR has no setInterval and
  // module-level variables persist across requests on the server, so counting
  // SSR instances would permanently block the client-side singleton guard.
  if (import.meta.client) {
    scoresInstanceCount++
    if (scoresInstanceCount === 1) {
      // Kick the tick once on mount in case we load mid-window.
      if (needsOptimisticTick()) startOptimisticTick()

      // First client instance: set up the singleton watcher
      scoresWatcherStop = watch(
        hasLiveMatches,
        (live, wasLive) => {
          if (live) {
            // Live match running — stop fine-grained kickoff poller (live poller takes over)
            // but keep the kickoff check timer running so back-to-back games are covered
            stopKickoffPolling()
            if (!scoresLiveTimer) {
              scoresLiveTimer = setInterval(() => {
                if (hasLiveMatches.value) {
                  refresh()
                } else {
                  // Do one final refresh to capture the FT score, then stop
                  refresh()
                  stopScoresPolling()
                }
              }, LIVE_POLL_INTERVAL_MS)
            }
          } else {
            // Transition from live → not-live: fire one final refresh to lock
            // in the final score before stopping the polling interval.
            if (wasLive) {
              refresh()
            }
            stopScoresPolling()
          }
        },
        { immediate: true }
      )

      // Kickoff-imminent check: runs every 30 s to detect when a kickoff is
      // approaching. Uses real Date.now() each tick — not a reactive computed —
      // so it correctly detects the window even without a data change.
      scoresKickoffCheckTimer = setInterval(() => {
        // Spin up the 1-Hz optimistic tick as soon as we enter the window
        // (≈60 s before kickoff through the grace period). It self-stops.
        if (needsOptimisticTick()) startOptimisticTick()

        if (hasLiveMatches.value) {
          // Live poller already running — no need for kickoff poller
          stopKickoffPolling()
          return
        }
        if (checkImminentKickoff()) {
          // Kickoff within 3 min: start fine-grained polling if not already running
          if (!scoresKickoffTimer) {
            // Refresh immediately so we don't wait a full interval
            refresh()
            scoresKickoffTimer = setInterval(() => {
              if (hasLiveMatches.value || !checkImminentKickoff()) {
                stopKickoffPolling()
              } else {
                refresh()
              }
            }, KICKOFF_POLL_INTERVAL_MS)
          }
        } else {
          stopKickoffPolling()
        }
      }, KICKOFF_CHECK_INTERVAL_MS)
    }

    onUnmounted(() => {
      scoresInstanceCount--
      if (scoresInstanceCount === 0) {
        // Last client instance unmounted — tear down everything
        stopScoresPolling()
        stopKickoffPolling()
        stopKickoffCheckTimer()
        stopOptimisticTick()
        scoresWatcherStop?.()
        scoresWatcherStop = null
      }
    })
  }

  return {
    activeTab,
    matches,
    matchesByDay,
    pending,
    error,
    refresh,
  }
}
