// Server-side API route: proxies ESPN's FIFA World Cup scoreboard
// Accepts ?dates=YYYYMMDD or ?dates=YYYYMMDD-YYYYMMDD
// Returns normalised match list

const CACHE_TTL_LIVE_MS = 30_000 // 30 s during live matches
const CACHE_TTL_IDLE_MS = 5 * 60_000 // 5 min otherwise

interface CacheEntry {
  data: unknown[]
  fetchedAt: number
  hasLive: boolean
}

const cache = new Map<string, CacheEntry>()

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dates = (query.dates as string | undefined) ?? ''

  const cacheKey = dates || 'default'
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached) {
    const ttl = cached.hasLive ? CACHE_TTL_LIVE_MS : CACHE_TTL_IDLE_MS
    if (now - cached.fetchedAt < ttl) return cached.data
  }

  const url = dates
    ? `${BASE}/scoreboard?dates=${dates}&limit=100`
    : `${BASE}/scoreboard?limit=100`

  const raw = await $fetch<Record<string, unknown>>(url)
  const events = (raw.events as unknown[]) ?? []

  const hasLive = events.some((e: unknown) => {
    const ev = e as Record<string, unknown>
    const status = ev.status as Record<string, unknown> | undefined
    const type = status?.type as Record<string, unknown> | undefined
    return type?.state === 'in' || type?.name === 'STATUS_HALFTIME'
  })

  cache.set(cacheKey, { data: events, fetchedAt: now, hasLive })
  return events
})
