// Server-side API route: proxies ESPN's FIFA World Cup scoreboard
// Accepts ?dates=YYYYMMDD or ?dates=YYYYMMDD-YYYYMMDD
// Returns normalised match list

// ── Mock data toggle ──────────────────────────────────────────────────────────
// Set to true to inject fake finished Week 1 results (for pool leaderboard
// testing before the real tournament begins). Week 2, Week 3, and Knockout
// date ranges fall through to the real ESPN API so upcoming matches are visible.
// Set to false when the real tournament starts and ESPN has live data for all weeks.
const USE_MOCK = false

// ── Mock "now" — must match useMockTime.ts MOCK_NOW_ISO ──────────────────────
// Games whose kickoff is AFTER this time are served as STATUS_SCHEDULED (0-0)
// so picks remain open. Games before this time are served as STATUS_FINAL.
// Set to '' to use real current time as the cutoff (future games stay scheduled).
const MOCK_NOW_ISO = ''

const CACHE_TTL_LIVE_MS = 30_000 // 30 s during live matches
const CACHE_TTL_IDLE_MS = 5 * 60_000 // 5 min otherwise

interface CacheEntry {
  data: unknown[]
  fetchedAt: number
  hasLive: boolean
}

const cache = new Map<string, CacheEntry>()

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

function toDate(yyyymmdd: string): Date {
  return new Date(
    `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00Z`
  )
}

// ── Apply mock time: games in the future relative to MOCK_NOW_ISO become scheduled ──
// This lets us test the "before tournament" state (all picks open) and then
// advance MOCK_NOW_ISO to see results appear game by game.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyMockTime(events: any[]): any[] {
  // '' = use real current time as the cutoff (so future games stay scheduled)
  const mockNow = MOCK_NOW_ISO ? new Date(MOCK_NOW_ISO) : new Date()
  return events.map((ev) => {
    const kickoff = new Date(ev.date)
    if (kickoff <= mockNow) return ev // already in the past → keep STATUS_FINAL
    // Future game → serve as STATUS_SCHEDULED with 0-0 scores
    return {
      ...ev,
      status: {
        type: {
          id: '1',
          name: 'STATUS_SCHEDULED',
          state: 'pre',
          completed: false,
          description: 'Scheduled',
          detail: kickoff.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          }),
          shortDetail: kickoff.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            timeZone: 'UTC',
          }),
        },
        displayClock: '0:00',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      competitions: ev.competitions.map((comp: any) => ({
        ...comp,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        competitors: comp.competitors.map((c: any) => ({ ...c, score: '0' })),
      })),
    }
  })
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dates = (query.dates as string | undefined) ?? ''

  // ── Mock mode: inject fake finished results for Week 1 only ─────────────────
  // Requests that overlap with the mock date range (Jun 11–21 UTC) are served
  // from MOCK_EVENTS (with mock-time filtering applied). All other ranges fall
  // through to the real ESPN API so Week 3+ and Knockout tabs show real data.
  if (USE_MOCK) {
    const { MOCK_EVENTS } = await import('./schedule.mock')

    // Mock covers Jun 11 00:00 UTC through Jul 3 00:00 UTC (exclusive)
    // i.e. Group stage (Jun 11–28) + Round of 32 (Jun 29–Jul 2).
    // Jul 3+ falls through to ESPN for real data.
    const MOCK_START = new Date('2026-06-11T00:00:00Z')
    const MOCK_END = new Date('2026-07-03T00:00:00Z')

    if (!dates) {
      // No date filter — return all mock events with time applied
      return applyMockTime(MOCK_EVENTS)
    }

    // Parse "YYYYMMDD" or "YYYYMMDD-YYYYMMDD" (dash always at position 8)
    const dashIdx = dates.indexOf('-', 1)
    const rangeStart = dashIdx > 0 ? dates.slice(0, dashIdx) : dates
    const rangeEnd = dashIdx > 0 ? dates.slice(dashIdx + 1) : dates

    const reqStart = toDate(rangeStart)
    const reqEnd = new Date(toDate(rangeEnd).getTime() + 24 * 60 * 60 * 1000) // inclusive end

    // Does the requested range overlap with the mock week?
    const overlaps = reqStart < MOCK_END && reqEnd > MOCK_START

    if (overlaps) {
      // Return only the mock events that fall within the requested range,
      // with mock-time filtering applied (future games → scheduled)
      const filtered = MOCK_EVENTS.filter((ev) => {
        const d = new Date(ev.date)
        return d >= reqStart && d < reqEnd
      })
      return applyMockTime(filtered)
    }
    // No overlap with mock week — fall through to ESPN for real data
  }

  // ── Live ESPN data ───────────────────────────────────────────────────────────
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
