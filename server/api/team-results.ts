// Server-side API route: fetches recent results for a national team
// Uses ESPN's "all" league which aggregates across all competitions
// Accepts ?teamId=<espnTeamId>&limit=<n>

const CACHE_TTL_MS = 10 * 60_000 // 10 min

interface RecentResult {
  id: string
  date: string
  homeTeam: string
  homeTeamId: string
  homeScore: string
  awayTeam: string
  awayTeamId: string
  awayScore: string
  status: string
  venue: string | null
}

interface CacheEntry {
  data: RecentResult[]
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const teamId = query.teamId as string | undefined
  const limit = Math.min(Number(query.limit ?? 10), 25)

  if (!teamId) {
    throw createError({ statusCode: 400, message: 'teamId is required' })
  }

  const cacheKey = teamId
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data.slice(0, limit)
  }

  const raw = await $fetch<Record<string, unknown>>(
    `${BASE}/teams/${teamId}/schedule`
  )

  const events = (raw.events as Array<Record<string, unknown>>) ?? []

  const results: RecentResult[] = []

  for (const ev of events) {
    const comps = (ev.competitions as Array<Record<string, unknown>>) ?? []
    const comp = comps[0]
    if (!comp) continue

    const statusType =
      ((comp.status as Record<string, unknown>)?.type as Record<
        string,
        unknown
      >) ?? {}
    const completed = statusType.completed as boolean | undefined
    const statusName = (statusType.name as string) ?? ''

    // Only include completed matches
    if (!completed && statusName !== 'STATUS_FULL_TIME') continue

    const competitors =
      (comp.competitors as Array<Record<string, unknown>>) ?? []
    const homeComp =
      competitors.find((c) => c.homeAway === 'home') ?? competitors[0]
    const awayComp =
      competitors.find((c) => c.homeAway === 'away') ?? competitors[1]
    if (!homeComp || !awayComp) continue

    const homeTeam = homeComp.team as Record<string, unknown>
    const awayTeam = awayComp.team as Record<string, unknown>

    const homeScore = homeComp.score as Record<string, unknown> | undefined
    const awayScore = awayComp.score as Record<string, unknown> | undefined

    const venue = (comp.venue as Record<string, unknown>)?.fullName as
      | string
      | null

    results.push({
      id: String(ev.id ?? ''),
      date: String(ev.date ?? ''),
      homeTeam: (homeTeam?.displayName as string) ?? '',
      homeTeamId: String(homeTeam?.id ?? ''),
      homeScore: (homeScore?.displayValue as string) ?? '0',
      awayTeam: (awayTeam?.displayName as string) ?? '',
      awayTeamId: String(awayTeam?.id ?? ''),
      awayScore: (awayScore?.displayValue as string) ?? '0',
      status: statusName,
      venue: venue ?? null,
    })
  }

  // Sort most recent first
  results.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  cache.set(cacheKey, { data: results, fetchedAt: now })
  return results.slice(0, limit)
})
