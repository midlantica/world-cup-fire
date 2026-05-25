import { TEAM_BY_NAME, RIVALRY_PAIRS } from '../constants/worldcup'

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

export type WeekTab = 'last' | 'this' | 'next'

// ---------------------------------------------------------------------------
// Quality scoring
// ---------------------------------------------------------------------------

const RIVALRY_SET = new Set<string>(
  RIVALRY_PAIRS.map(([a, b]) => [a, b].sort().join('|'))
)

function isRivalry(a: string, b: string): boolean {
  return RIVALRY_SET.has([a, b].sort().join('|'))
}

/**
 * Compute a 0–100 quality score for a WC match.
 *
 * Factors:
 *  - Average FIFA ranking (lower rank number = better team)
 *  - Ranking closeness (evenly matched = more exciting)
 *  - Classic rivalry bonus
 */
function computeQuality(home: string, away: string): number {
  const h = TEAM_BY_NAME.get(home)
  const a = TEAM_BY_NAME.get(away)

  if (!h || !a) return 20

  const avgRank = (h.fifaRank + a.fifaRank) / 2
  // Better average rank → higher base score (rank 1 = 100, rank 100 = 0)
  const rankScore = Math.max(0, 100 - avgRank)

  // Closeness bonus: teams within 10 ranks of each other
  const diff = Math.abs(h.fifaRank - a.fifaRank)
  const closenessBonus = Math.max(0, 20 - diff)

  // Rivalry bonus
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

  // ESPN returns home team first
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

  // Group from standings data isn't in scoreboard — derive from our constants
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

function weekRange(offset: 0 | -1 | 1): string {
  const now = new Date()
  // Anchor to Monday of the current week
  const day = now.getDay() // 0=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${toYYYYMMDD(monday)}-${toYYYYMMDD(sunday)}`
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useScores() {
  const activeTab = useState<WeekTab>('scores-tab', () => 'this')

  const dateRange = computed(() => {
    if (activeTab.value === 'last') return weekRange(-1)
    if (activeTab.value === 'next') return weekRange(1)
    return weekRange(0)
  })

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

  // Group matches by day label for display
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
