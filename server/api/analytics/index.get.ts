// GET /api/analytics
// Returns 30-day analytics summary for the /analytics dashboard page.

import { analyticsStore } from '../../utils/analytics'
import { countPools } from '../../utils/pools'

const DAYS = 30

export default defineEventHandler(async () => {
  const store = analyticsStore()
  const [days, poolsTotal] = await Promise.all([store.list(DAYS), countPools()])

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

  // Top pages (sorted desc)
  const topPages = Object.entries(allPages)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20)

  // Per-day summaries (most recent first)
  const daySummaries = days.map((day) => {
    const dayTopPages = Object.entries(day.pages)
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
    poolsTotal,
  }
})
