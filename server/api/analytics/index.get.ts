// GET /api/analytics
// Returns 30-day analytics summary for the /analytics dashboard page.
//
// In dev (no Netlify Blobs), we proxy the live production API so the dashboard
// shows real data. Falls back to the local file store if the request fails or
// there is no network connection.

import { analyticsStore } from '../../utils/analytics'
import { getPoolsStats } from '../../utils/pools'

const DAYS = 30
const PROD_URL = 'https://worldcupfire.com/api/analytics'
const EXCLUDED_PAGES = new Set(['/analytics'])

function isDevMode(): boolean {
  const env =
    (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process?.env ?? {}
  return env.NODE_ENV === 'development'
}

function isNetlifyConfigured(): boolean {
  const env =
    (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process?.env ?? {}
  return Boolean(
    env.NETLIFY ||
    env.NETLIFY_BLOBS_CONTEXT ||
    env.SITE_ID ||
    env.NETLIFY_SITE_ID
  )
}

export default defineEventHandler(async () => {
  // ── Dev proxy: fetch live data from production ──────────────────────────────
  if (isDevMode() && !isNetlifyConfigured()) {
    try {
      const res = await fetch(PROD_URL, {
        headers: { 'User-Agent': 'world-cup-fire-dev-proxy/1.0' },
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const data = await res.json()
        // Re-apply the exclusion filter in case production data includes /analytics
        if (data?.topPages) {
          data.topPages = data.topPages.filter(
            (p: { path: string }) => !EXCLUDED_PAGES.has(p.path)
          )
        }
        if (data?.days) {
          for (const day of data.days) {
            if (day.topPages) {
              day.topPages = day.topPages.filter(
                (p: { path: string }) => !EXCLUDED_PAGES.has(p.path)
              )
            }
          }
        }
        console.info('[analytics] Proxied live data from production ✓')
        return data
      }
    } catch (err) {
      console.warn(
        '[analytics] Could not reach production — falling back to local data.',
        (err as Error).message
      )
    }
  }

  // ── Aggregate from the store ────────────────────────────────────────────────
  // Wrapped so a transient Blobs failure degrades gracefully (empty data)
  // instead of 500ing the dashboard. getPoolsStats() already self-catches.
  const store = analyticsStore()
  let days: Awaited<ReturnType<typeof store.list>> = []
  let poolsStats: Awaited<ReturnType<typeof getPoolsStats>>
  try {
    ;[days, poolsStats] = await Promise.all([store.list(DAYS), getPoolsStats()])
  } catch (e) {
    console.error('[analytics] aggregation error:', e)
    days = []
    poolsStats = {
      total: 0,
      solo: 0,
      active: 0,
      totalMembers: 0,
      avgMembersPerActivePool: 0,
    }
  }

  // Totals across all days
  let totalPageViews = 0
  const allVisitors = new Set<string>()
  const allSessions = new Set<string>()
  const allPages: Record<string, number> = {}

  for (const day of days) {
    totalPageViews += day.pageViews
    for (const v of day.visitors) allVisitors.add(v)
    for (const s of day.sessions) allSessions.add(s)
    for (const [path, count] of Object.entries(day.pages)) {
      allPages[path] = (allPages[path] ?? 0) + count
    }
  }

  // Top pages (sorted desc) — exclude the /analytics page itself
  const topPages = Object.entries(allPages)
    .filter(([path]) => !EXCLUDED_PAGES.has(path))
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20)

  // Per-day summaries (most recent first)
  const daySummaries = days.map((day) => {
    const dayTopPages = Object.entries(day.pages)
      .filter(([path]) => !EXCLUDED_PAGES.has(path))
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    const hourly = Object.entries(day.hourly).map(([hour, views]) => ({
      hour,
      views,
    }))

    return {
      date: day.date,
      pageViews: day.pageViews,
      uniqueVisitors: day.visitors.length,
      sessions: day.sessions.length,
      topPages: dayTopPages,
      hourly,
    }
  })

  return {
    days: daySummaries,
    totals: {
      pageViews: totalPageViews,
      uniqueVisitors: allVisitors.size,
      sessions: allSessions.size,
    },
    topPages,
    pools: poolsStats,
  }
})
