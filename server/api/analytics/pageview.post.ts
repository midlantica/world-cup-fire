// server/api/analytics/pageview.post.ts
// Records a client-side page navigation (SPA route change).
// Called from the client whenever Vue Router navigates to a new path.

import { getStore } from '@netlify/blobs'
import { createHash } from 'node:crypto'

const SKIP_PREFIXES = ['/api/', '/_nuxt/', '/__nuxt', '/favicon', '/admin']

function getExcludedIps(): string[] {
  return (process.env.ANALYTICS_EXCLUDE_IPS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function hashIp(ip: string): string {
  return createHash('sha256')
    .update(ip + 'mls-salt-2026')
    .digest('hex')
    .slice(0, 16)
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function hourKey(): string {
  const d = new Date()
  return `${d.toISOString().slice(0, 13)}:00`
}

interface StoredDayStats {
  pageViews: number
  uniqueVisitors: string[]
  sessions: number
  topPages: Record<string, number>
  hourly: Record<string, number>
}

export default defineEventHandler(async (event) => {
  // Only run on Netlify
  if (!process.env.NETLIFY && !process.env.NETLIFY_BLOBS_CONTEXT) {
    return { ok: false }
  }

  const body = await readBody(event).catch(() => null)
  const path: string =
    typeof body?.path === 'string' ? body.path.split('?')[0] || '/' : '/'

  // Skip non-page paths
  if (SKIP_PREFIXES.some((p) => path.startsWith(p))) return { ok: false }

  try {
    const store = getStore('analytics')
    const dayKey = todayKey()
    const hKey = hourKey()

    const ip =
      (event.headers?.get?.('x-forwarded-for') ?? '').split(',')[0]?.trim() ||
      (event.node?.req?.socket?.remoteAddress ?? 'unknown')

    if (getExcludedIps().includes(ip)) return { ok: false }

    const visitorId = hashIp(ip)

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

    stats.pageViews += 1
    if (!stats.uniqueVisitors.includes(visitorId)) {
      stats.uniqueVisitors.push(visitorId)
    }

    // Record the path
    stats.topPages[path] = (stats.topPages[path] ?? 0) + 1

    // Hourly
    stats.hourly[hKey] = (stats.hourly[hKey] ?? 0) + 1

    await store.set(dayKey, JSON.stringify(stats))
    return { ok: true }
  } catch {
    return { ok: false }
  }
})
