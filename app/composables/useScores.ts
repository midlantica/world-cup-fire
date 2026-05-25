import {
  TEAM_BY_NAME,
  RIVALRY_PAIRS,
  WC_START,
  WC_GROUP_END,
  WC_KNOCKOUT_START,
  WC_FINAL,
} from '../constants/worldcup'

export interface MatchStatus {
  code: 'ns' | 'live' | 'ht' | 'ft'
  clock?: string
}

export type MatchBadge = 'fire' | 'wild' | null

export interface Match {
  id: string
  date: string
  home: string
  homeScore: string | null
  homeColor: string
  homeAltColor: string
  homeIso2: string
  homeAbbrev: string
  away: string
  awayScore: string | null
  awayColor: string
  awayAltColor: string
  awayIso2: string
  awayAbbrev: string
  group: string | null
  venue: string | null
  status: MatchStatus
  qualityScore: number
  badge: MatchBadge
}

// ---------------------------------------------------------------------------
// Tournament week definitions
// ---------------------------------------------------------------------------

export type WeekTab = 'week1' | 'week2' | 'week3' | 'week4' | 'knockout'

export interface TabDef {
  key: WeekTab
  label: string
  /** Short date range label, e.g. "Jun 11 – Jun 17" */
  dateRange: string
  start: Date
  end: Date
}

/** Format a Date as "Mon D" (e.g. "Jun 11") */
function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Add N days to a date (returns new Date) */
function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// WC 2026 group stage: Jun 11 – Jul 2 (22 days = ~3.1 weeks)
// We split into 4 roughly equal chunks:
//   Week 1: Jun 11 – Jun 17  (days 0–6)
//   Week 2: Jun 18 – Jun 24  (days 7–13)
//   Week 3: Jun 25 – Jul 1   (days 14–20)
//   Week 4: Jul 2            (day 21 — final group stage day)
// Knockout: Jul 4 – Jul 19

// Named date constants to avoid array-index undefined issues
const W1S = WC_START
const W1E = addDays(WC_START, 6)
const W2S = addDays(WC_START, 7)
const W2E = addDays(WC_START, 13)
const W3S = addDays(WC_START, 14)
const W3E = addDays(WC_START, 20)
const W4S = addDays(WC_START, 21)
const W4E = WC_GROUP_END
const KOS = WC_KNOCKOUT_START
const KOE = WC_FINAL

export const WC_TABS: TabDef[] = [
  {
    key: 'week1',
    label: 'Week 1',
    dateRange: `${fmtDate(W1S)} – ${fmtDate(W1E)}`,
    start: W1S,
    end: W1E,
  },
  {
    key: 'week2',
    label: 'Week 2',
    dateRange: `${fmtDate(W2S)} – ${fmtDate(W2E)}`,
    start: W2S,
    end: W2E,
  },
  {
    key: 'week3',
    label: 'Week 3',
    dateRange: `${fmtDate(W3S)} – ${fmtDate(W3E)}`,
    start: W3S,
    end: W3E,
  },
  {
    key: 'week4',
    label: 'Week 4',
    dateRange: `${fmtDate(W4S)} – ${fmtDate(W4E)}`,
    start: W4S,
    end: W4E,
  },
  {
    key: 'knockout',
    label: 'Knockout Stage',
    dateRange: `${fmtDate(KOS)} – ${fmtDate(KOE)}`,
    start: KOS,
    end: KOE,
  },
]

/**
 * Determine the default tab:
 * - If today is within a WC week, return that week's tab
 * - If WC hasn't started yet, return 'week1'
 * - If WC is over, return 'knockout'
 */
function defaultTab(): WeekTab {
  const now = new Date()
  for (const tab of WC_TABS) {
    if (now >= tab.start && now <= tab.end) return tab.key
  }
  // Before tournament starts
  if (now < WC_START) return 'week1'
  // After tournament ends
  return 'knockout'
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
    espnStatus === 'STATUS_SECOND_HALF'
  )
    return 'live'
  return 'ns'
}

function normaliseClock(
  espnStatus: Record<string, unknown>
): string | undefined {
  const detail = espnStatus?.displayClock as string | undefined
  return detail && detail !== '0:00' ? detail : undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseEvent(ev: any): Match {
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
    homeScore,
    homeColor: homeData?.color ?? '888888',
    homeAltColor: homeData?.altColor ?? 'ffffff',
    homeIso2: homeData?.iso2 ?? '',
    homeAbbrev: homeData?.abbrev ?? homeName.slice(0, 3).toUpperCase(),
    away: awayName,
    awayScore,
    awayColor: awayData?.color ?? '888888',
    awayAltColor: awayData?.altColor ?? 'ffffff',
    awayIso2: awayData?.iso2 ?? '',
    awayAbbrev: awayData?.abbrev ?? awayName.slice(0, 3).toUpperCase(),
    group,
    venue: (comp.venue as Record<string, unknown>)?.fullName as string | null,
    status: { code, clock },
    qualityScore: quality,
    badge,
  }
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function tabDateRange(tab: WeekTab): string {
  const def = WC_TABS.find((t) => t.key === tab)
  if (!def) return ''
  return `${toYYYYMMDD(def.start)}-${toYYYYMMDD(def.end)}`
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useScores() {
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
      const day = m.date.slice(0, 10)
      if (!groups.has(day)) groups.set(day, [])
      groups.get(day)!.push(m)
    }
    return groups
  })

  return {
    activeTab,
    matches,
    matchesByDay,
    pending,
    error,
    refresh,
  }
}
