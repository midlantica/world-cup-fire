// Server-side API route: proxies ESPN's FIFA World Cup standings
// Returns all 12 groups with team standings

const CACHE_TTL_MS = 5 * 60_000 // 5 min

interface CacheEntry {
  data: unknown
  fetchedAt: number
}

let cache: CacheEntry | null = null

const BASE = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world'

export default defineEventHandler(async () => {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.data

  const raw = await $fetch<Record<string, unknown>>(`${BASE}/standings`)
  const groups = (raw.children as unknown[]) ?? []

  cache = { data: groups, fetchedAt: now }
  return groups
})
