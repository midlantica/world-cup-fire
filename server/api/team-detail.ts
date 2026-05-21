/**
 * GET /api/team-detail?teamId=<espnTeamId>
 *
 * Returns:
 *   - roster: full squad list with position, jersey, nationality
 *   - leaders: season-long stat leaders for this team
 *     (goals, assists, yellowCards, tackles, dribbles, saves)
 *
 * Caches for 10 minutes.
 */

const CACHE_TTL_MS = 10 * 60_000

interface CacheEntry {
  data: TeamDetailResponse
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()

export interface RosterPlayer {
  id: string
  displayName: string
  shortName: string
  jersey: string
  position: string
  positionName: string
  nationality: string
  headshot: string
  starter?: boolean
}

export interface StatLeader {
  athleteId: string
  displayName: string
  jersey: string
  headshot: string
  value: number
  displayValue: string
}

export interface StatCategory {
  name: string
  displayName: string
  leaders: StatLeader[]
}

export interface TeamDetailResponse {
  teamId: string
  roster: RosterPlayer[]
  leaders: StatCategory[]
}

const STAT_NAMES = [
  'goals',
  'assists',
  'yellowCards',
  'redCards',
  'saves',
  'tackles',
  'successfulDribbles',
  'totalShots',
  'shotsOnTarget',
]

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const teamId = query.teamId as string | undefined

  if (!teamId) {
    throw createError({ statusCode: 400, message: 'teamId is required' })
  }

  const now = Date.now()
  const cached = cache.get(teamId)
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }

  // ── Fetch roster + season stats in parallel ───────────────────────────────
  const [rosterResult, statsResult] = await Promise.allSettled([
    $fetch<Record<string, unknown>>(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams/${teamId}/roster`
    ),
    $fetch<Record<string, unknown>>(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams/${teamId}/statistics`
    ),
  ])

  // ── Parse roster ──────────────────────────────────────────────────────────
  const roster: RosterPlayer[] = []

  if (rosterResult.status === 'fulfilled') {
    const raw = rosterResult.value
    const athletes = (raw.athletes as Array<Record<string, unknown>>) ?? []

    for (const group of athletes) {
      const items = (group.items as Array<Record<string, unknown>>) ?? []
      for (const p of items) {
        const pos = p.position as Record<string, unknown> | undefined
        const headshots = p.headshot as Record<string, unknown> | undefined
        const links = (p.links as Array<Record<string, unknown>>) ?? []
        const flag = p.flag as Record<string, unknown> | undefined

        roster.push({
          id: p.id as string,
          displayName: p.displayName as string,
          shortName: p.shortName as string,
          jersey: (p.jersey as string) ?? '',
          position:
            (pos?.abbreviation as string) ?? (pos?.name as string) ?? '',
          positionName: (pos?.displayName as string) ?? '',
          nationality: (flag?.alt as string) ?? '',
          headshot: (headshots?.href as string) ?? '',
        })
      }
    }
  }

  // ── Parse season leaders ──────────────────────────────────────────────────
  const leaders: StatCategory[] = []

  if (statsResult.status === 'fulfilled') {
    const raw = statsResult.value
    const splits = raw.splits as Record<string, unknown> | undefined
    const categories =
      (splits?.categories as Array<Record<string, unknown>>) ?? []

    for (const cat of categories) {
      const catName = (cat.name as string) ?? ''
      const stats = (cat.stats as Array<Record<string, unknown>>) ?? []

      for (const stat of stats) {
        const statName = stat.name as string
        if (!STAT_NAMES.includes(statName)) continue

        const leaders_raw =
          (stat.leaders as Array<Record<string, unknown>>) ?? []
        if (!leaders_raw.length) continue

        const statLeaders: StatLeader[] = leaders_raw.slice(0, 5).map((l) => {
          const ath = l.athlete as Record<string, unknown> | undefined
          const headshots = ath?.headshot as Record<string, unknown> | undefined
          return {
            athleteId: (ath?.id as string) ?? '',
            displayName: (ath?.displayName as string) ?? 'Unknown',
            jersey: (ath?.jersey as string) ?? '',
            headshot: (headshots?.href as string) ?? '',
            value: (l.value as number) ?? 0,
            displayValue: (l.displayValue as string) ?? String(l.value ?? 0),
          }
        })

        leaders.push({
          name: statName,
          displayName: stat.displayName as string,
          leaders: statLeaders,
        })
      }
    }
  }

  const result: TeamDetailResponse = { teamId, roster, leaders }
  cache.set(teamId, { data: result, fetchedAt: now })
  return result
})
