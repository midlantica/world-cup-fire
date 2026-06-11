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

function statusCode(espnStatus: string): MatchStatus['code'] {
  if (espnStatus === 'STATUS_FINAL') return 'ft'
  if (espnStatus === 'STATUS_HALFTIME') return 'ht'
  if (
    espnStatus === 'STATUS_IN_PROGRESS' ||
    espnStatus === 'STATUS_FIRST_HALF' ||
    espnStatus === 'STATUS_SECOND_HALF'
  )
    return 'live'
  return 'ns'
}

function normaliseClock(
  espnStatus: Record<string, unknown>
): string | undefined {
  const detail = espnStatus?.displayClock as string | undefined
  return detail && detail !== '0:00' && detail !== "0'" ? detail : undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normaliseEvent(ev: any): Match {
  const comp = ev.competitions?.[0] ?? {}
  const competitors: unknown[] = comp.competitors ?? []

  const homeComp = (competitors[0] ?? {}) as Record<string, unknown>
  const awayComp = (competitors[1] ?? {}) as Record<string, unknown>

  const homeTeam = (homeComp.team as Record<string, unknown>) ?? {}
  const awayTeam = (awayComp.team as Record<string, unknown>) ?? {}

  const homeName = (homeTeam.displayName as string) ?? ''
  const awayName = (awayTeam.displayName as string) ?? ''

  const homeData = TEAM_BY_NAME.get(homeName)
  const awayData = TEAM_BY_NAME.get(awayName)

  const espnStatusName = (
    (ev.status as Record<string, unknown>)?.type as Record<string, unknown>
  )?.name as string

  const code = statusCode(espnStatusName)
  const clock = normaliseClock(
    (ev.status as Record<string, unknown>)?.type as Record<string, unknown>
  )

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

// ── Singleton polling state ────────────────────────────────────────────────
// useScores() is called by multiple components (ScoresSection, AppHeader, etc.)
// but they all share the same useState/useFetch data. We keep the timer at
// module level so only ONE interval ever runs, regardless of how many
// components mount.
let scoresLiveTimer: ReturnType<typeof setInterval> | null = null
let scoresWatcherStop: (() => void) | null = null
// Only count client-side instances — SSR has no timers/watchers to manage.
let scoresInstanceCount = 0

function stopScoresPolling() {
  if (scoresLiveTimer) {
    clearInterval(scoresLiveTimer)
    scoresLiveTimer = null
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
  })

  const matches = computed<Match[]>(() => {
    if (!rawEvents.value) return []
    return rawEvents.value
      .map(normaliseEvent)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
  // The watcher and timer are module-level singletons — only set up once even
  // though multiple components call useScores().
  const hasLiveMatches = computed(() =>
    matches.value.some(
      (m) => m.status.code === 'live' || m.status.code === 'ht'
    )
  )

  // Only set up timers/watchers on the client — SSR has no setInterval and
  // module-level variables persist across requests on the server, so counting
  // SSR instances would permanently block the client-side singleton guard.
  if (import.meta.client) {
    scoresInstanceCount++
    if (scoresInstanceCount === 1) {
      // First client instance: set up the singleton watcher
      scoresWatcherStop = watch(
        hasLiveMatches,
        (live) => {
          if (live) {
            if (!scoresLiveTimer) {
              scoresLiveTimer = setInterval(() => {
                if (hasLiveMatches.value) {
                  refresh()
                } else {
                  stopScoresPolling()
                }
              }, LIVE_POLL_INTERVAL_MS)
            }
          } else {
            stopScoresPolling()
          }
        },
        { immediate: true }
      )
    }

    onUnmounted(() => {
      scoresInstanceCount--
      if (scoresInstanceCount === 0) {
        // Last client instance unmounted — tear down everything
        stopScoresPolling()
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
