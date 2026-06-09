// ── Analytics server store ────────────────────────────────────────────────────
//
// Lightweight pageview analytics backed by Netlify Blobs in production and a
// local JSON file in dev. One blob per UTC day, keyed as "YYYY-MM-DD".
//
// Each day blob holds:
//   - pageViews: total hit count
//   - visitors:  Set of hashed visitor fingerprints (IP + UA, SHA-256 truncated)
//   - sessions:  Set of session ids (30-min idle window, passed by client)
//   - pages:     Record<path, count>
//   - hourly:    Record<"YYYY-MM-DDTHH", count>
//
// The visitor/session sets are stored as plain arrays in JSON and converted back
// to Sets on read. We cap each set at 50 000 entries to bound blob size.

import { getStore } from '@netlify/blobs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'

// ── Data shapes ───────────────────────────────────────────────────────────────

export interface DayRecord {
  date: string // "YYYY-MM-DD"
  pageViews: number
  visitors: string[] // hashed fingerprints
  sessions: string[] // session ids
  pages: Record<string, number> // path → count
  hourly: Record<string, number> // "YYYY-MM-DDTHH" → count
}

// ── Store abstraction ─────────────────────────────────────────────────────────

interface AnalyticsStore {
  read(date: string): Promise<DayRecord | null>
  write(record: DayRecord): Promise<void>
  list(days: number): Promise<DayRecord[]>
}

function blobsConfigured(): boolean {
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

function makeBlobStore(): AnalyticsStore {
  const store = getStore({ name: 'analytics', consistency: 'strong' })
  return {
    async read(date) {
      const raw = await store.get(date, { type: 'json' })
      return (raw as DayRecord | null) ?? null
    },
    async write(record) {
      await store.setJSON(record.date, record)
    },
    async list(days) {
      const results: DayRecord[] = []
      const today = utcDateStr(new Date())
      for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - i)
        const date = utcDateStr(d)
        const rec = await store.get(date, { type: 'json' })
        if (rec) results.push(rec as DayRecord)
        else if (date === today) {
          // Always include today even if empty
          results.push(emptyDay(date))
        }
      }
      return results
    },
  }
}

function makeFileStore(): AnalyticsStore {
  const dir = resolve(process.cwd(), '.data', 'analytics')

  async function ensureDir() {
    await mkdir(dir, { recursive: true })
  }

  function filePath(date: string) {
    const safe = date.replace(/[^0-9-]/g, '')
    return join(dir, `${safe}.json`)
  }

  return {
    async read(date) {
      await ensureDir()
      try {
        const raw = await readFile(filePath(date), 'utf8')
        return JSON.parse(raw) as DayRecord
      } catch {
        return null
      }
    },
    async write(record) {
      await ensureDir()
      await writeFile(filePath(record.date), JSON.stringify(record), 'utf8')
    },
    async list(days) {
      await ensureDir()
      const results: DayRecord[] = []
      const today = utcDateStr(new Date())
      for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - i)
        const date = utcDateStr(d)
        try {
          const raw = await readFile(filePath(date), 'utf8')
          results.push(JSON.parse(raw) as DayRecord)
        } catch {
          if (date === today) results.push(emptyDay(date))
        }
      }
      return results
    },
  }
}

let _store: AnalyticsStore | null = null

export function analyticsStore(): AnalyticsStore {
  if (_store) return _store
  if (blobsConfigured()) {
    try {
      _store = makeBlobStore()
    } catch {
      _store = makeFileStore()
    }
  } else {
    console.warn(
      '[analytics] Netlify Blobs not configured — using file store (.data/analytics/).'
    )
    _store = makeFileStore()
  }
  return _store
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function utcDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function utcHourStr(d: Date): string {
  return d.toISOString().slice(0, 13) // "YYYY-MM-DDTHH"
}

export function emptyDay(date: string): DayRecord {
  return {
    date,
    pageViews: 0,
    visitors: [],
    sessions: [],
    pages: {},
    hourly: {},
  }
}

const VISITOR_CAP = 50_000

/**
 * Record a single pageview. Returns the updated day record.
 * `visitorHash` — truncated SHA-256 of IP+UA (computed by the API route).
 * `sessionId`   — opaque id from the client (localStorage, 30-min idle).
 */
export async function recordPageview(
  path: string,
  visitorHash: string,
  sessionId: string
): Promise<void> {
  const store = analyticsStore()
  const now = new Date()
  const date = utcDateStr(now)
  const hour = utcHourStr(now)

  const rec = (await store.read(date)) ?? emptyDay(date)

  rec.pageViews++

  // Visitors (unique per day)
  if (
    !rec.visitors.includes(visitorHash) &&
    rec.visitors.length < VISITOR_CAP
  ) {
    rec.visitors.push(visitorHash)
  }

  // Sessions (unique per day)
  if (!rec.sessions.includes(sessionId) && rec.sessions.length < VISITOR_CAP) {
    rec.sessions.push(sessionId)
  }

  // Per-page counts
  rec.pages[path] = (rec.pages[path] ?? 0) + 1

  // Hourly counts
  rec.hourly[hour] = (rec.hourly[hour] ?? 0) + 1

  await store.write(rec)
}

// ── SHA-256 fingerprint (Web Crypto — available in Nitro/Netlify runtime) ─────

export async function hashFingerprint(ip: string, ua: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}|${ua}`)
  const buf = await globalThis.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
