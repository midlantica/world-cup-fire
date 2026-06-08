// Server-side API route: proxies ESPN's FIFA World Cup match summary API
// Accepts ?eventId=<espnEventId>
// Returns boxscore stats, odds, rosters, head-to-head, venue, leaders

// ── Mock data toggle ──────────────────────────────────────────────────────────
// Set to true to serve fake match detail data (for design/pool testing).
// Set to false when the real tournament starts and ESPN has live data.
const USE_MOCK = false

const CACHE_TTL_LIVE_MS = 30_000 // 30 s during live matches
const CACHE_TTL_IDLE_MS = 5 * 60_000 // 5 min for completed/pre-match

interface CacheEntry {
  data: Record<string, unknown>
  fetchedAt: number
  isLive: boolean
}

const cache = new Map<string, CacheEntry>()

function isLiveEvent(data: Record<string, unknown>): boolean {
  const header = data.header as Record<string, unknown> | undefined
  const comps = (header?.competitions as Array<Record<string, unknown>>) ?? []
  const status = comps[0]?.status as Record<string, unknown> | undefined
  const type = status?.type as Record<string, unknown> | undefined
  return type?.state === 'in' || type?.name === 'STATUS_HALFTIME'
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const eventId = query.eventId as string | undefined

  if (!eventId) {
    throw createError({ statusCode: 400, message: 'eventId is required' })
  }

  // ── Mock mode: return fake match detail keyed by mock event ID ───────────────
  if (USE_MOCK) {
    const { MOCK_DETAILS } = await import('./match-detail.mock')
    const mockDetail = MOCK_DETAILS[eventId]
    // Return mock detail if we have it, otherwise empty object (NS matches)
    return mockDetail ?? {}
  }

  const now = Date.now()
  const cached = cache.get(eventId)
  if (cached) {
    const ttl = cached.isLive ? CACHE_TTL_LIVE_MS : CACHE_TTL_IDLE_MS
    if (now - cached.fetchedAt < ttl) return cached.data
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`
  const data = await $fetch<Record<string, unknown>>(url)

  const isLive = isLiveEvent(data)
  cache.set(eventId, { data, fetchedAt: now, isLive })
  return data
})
