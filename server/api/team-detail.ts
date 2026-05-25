// Server-side API route: proxies ESPN's FIFA World Cup team detail
// Accepts ?teamId=<espnTeamId>

const CACHE_TTL_MS = 10 * 60_000 // 10 min

interface CacheEntry {
  data: Record<string, unknown>
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const teamId = query.teamId as string | undefined

  if (!teamId) {
    throw createError({ statusCode: 400, message: 'teamId is required' })
  }

  const now = Date.now()
  const cached = cache.get(teamId)
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) return cached.data

  const raw = await $fetch<Record<string, unknown>>(`${BASE}/teams/${teamId}`)

  cache.set(teamId, { data: raw, fetchedAt: now })
  return raw
})
