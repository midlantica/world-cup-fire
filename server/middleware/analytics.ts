// server/middleware/analytics.ts
// Tracks page views, unique visitors (by hashed IP), and sessions.
// Data is stored in Netlify Blobs under the "analytics" store.
// Only runs in production (Netlify) — skipped locally to avoid noise.

import { getStore } from '@netlify/blobs'
import { createHash } from 'node:crypto'

// Skip tracking for API routes, static assets, and admin page
const SKIP_PREFIXES = ['/api/', '/_nuxt/', '/__nuxt', '/favicon', '/admin']

function hashIp(ip: string): string {
  return createHash('sha256')
    .update(ip + 'mls-salt-2026')
    .digest('hex')
    .slice(0, 16)
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
}

function hourKey(): string {
  const d = new Date()
  return `${d.toISOString().slice(0, 13)}:00` // "YYYY-MM-DDTHH:00"
}

interface StoredDayStats {
  pageViews: number
  uniqueVisitors: string[]
  sessions: number
  topPages: Record<string, number>
  hourly: Record<string, number>
}

export default defineEventHandler(async (event) => {
  const path = event.path ?? '/'

  // Skip non-page routes
  if (SKIP_PREFIXES.some((p) => path.startsWith(p))) return

  // Only run on Netlify (env var NETLIFY is set automatically)
  if (!process.env.NETLIFY && !process.env.NETLIFY_BLOBS_CONTEXT) return

  try {
    const store = getStore('analytics')
    const dayKey = todayKey()
    const hKey = hourKey()

    // Get raw IP from headers
    const ip =
      (event.headers?.get?.('x-forwarded-for') ?? '').split(',')[0]?.trim() ||
      (event.node?.req?.socket?.remoteAddress ?? 'unknown')
    const visitorId = hashIp(ip)

    // Session: use a cookie or treat each request as a session hit
    // (simple approach: count requests per visitor per hour as 1 session)
    const sessionKey = `session:${visitorId}:${hKey}`

    // Load today's stats
    const raw = (await store
      .get(dayKey, { type: 'json' })
      .catch(() => null)) as StoredDayStats | null
    const stats: StoredDayStats = raw ?? {
      pageViews: 0,
      uniqueVisitors: [],
      sessions: 0,
      topPages: {},
      hourly: {},
    }

    // Check if this is a new session this hour
    const sessionSeen = await store.get(sessionKey).catch(() => null)
    const isNewSession = !sessionSeen

    // Update stats
    stats.pageViews += 1
    if (!stats.uniqueVisitors.includes(visitorId)) {
      stats.uniqueVisitors.push(visitorId)
    }
    if (isNewSession) {
      stats.sessions += 1
      // Mark session as seen (expires after 1 hour via TTL-like key)
      await store.set(sessionKey, '1')
    }

    // Top pages — normalize path (strip query strings)
    const cleanPath = path.split('?')[0] || '/'
    stats.topPages[cleanPath] = (stats.topPages[cleanPath] ?? 0) + 1

    // Hourly breakdown
    stats.hourly[hKey] = (stats.hourly[hKey] ?? 0) + 1

    await store.set(dayKey, JSON.stringify(stats))
  } catch {
    // Never let analytics errors affect the user
  }
})
