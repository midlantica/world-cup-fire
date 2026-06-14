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
import {
  updateWithOptimisticRetry,
  type VersionedValue,
} from './optimistic-update'

// ── Data shapes ───────────────────────────────────────────────────────────────

export interface DayRecord {
  date: string // "YYYY-MM-DD"
  pageViews: number
  visitors: string[] // hashed fingerprints
  sessions: string[] // session ids
  pages: Record<string, number> // path → count
  hourly: Record<string, number> // "YYYY-MM-DDTHH" → count
  /** Local fallback revision; production concurrency uses the blob ETag. */
  version?: number
}

// ── Store abstraction ─────────────────────────────────────────────────────────

interface AnalyticsStore {
  read(date: string): Promise<DayRecord | null>
  readVersioned(date: string): Promise<VersionedValue<DayRecord, string | null>>
  writeVersioned(record: DayRecord, revision: string | null): Promise<boolean>
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
    async readVersioned(date) {
      const entry = await store.getWithMetadata(date, { type: 'json' })
      if (entry && !entry.etag) {
        throw new Error(`Analytics day ${date} was read without an ETag`)
      }
      return entry
        ? {
            value: normalizeDay(entry.data as Partial<DayRecord>, date),
            revision: entry.etag!,
          }
        : { value: emptyDay(date), revision: null }
    },
    async writeVersioned(record, revision) {
      const result = await store.set(
        record.date,
        JSON.stringify(record),
        revision === null ? { onlyIfNew: true } : { onlyIfMatch: revision }
      )
      return result.modified
    },
    async list(days) {
      const results: DayRecord[] = []
      const today = utcDateStr(new Date())
      for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() - i)
        const date = utcDateStr(d)
        // RESILIENCE: a transient Blobs API failure (or a corrupt blob) on a
        // single day must NOT 500 the whole analytics endpoint — skip the day
        // and keep aggregating. Previously one throw here took down /analytics.
        let rec: unknown = null
        try {
          rec = await store.get(date, { type: 'json' })
        } catch (e) {
          console.warn(`[analytics] Failed to read day blob ${date}:`, e)
        }
        if (rec) results.push(normalizeDay(rec as Partial<DayRecord>, date))
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
  const writeTails = new Map<string, Promise<void>>()

  async function ensureDir() {
    await mkdir(dir, { recursive: true })
  }

  function filePath(date: string) {
    const safe = date.replace(/[^0-9-]/g, '')
    return join(dir, `${safe}.json`)
  }

  async function readFileDay(date: string): Promise<DayRecord | null> {
    await ensureDir()
    try {
      const raw = await readFile(filePath(date), 'utf8')
      return normalizeDay(JSON.parse(raw) as Partial<DayRecord>, date)
    } catch {
      return null
    }
  }

  async function withWriteLock<T>(key: string, work: () => Promise<T>) {
    const previous = writeTails.get(key) ?? Promise.resolve()
    let release!: () => void
    const current = new Promise<void>((resolve) => {
      release = resolve
    })
    writeTails.set(key, current)
    await previous
    try {
      return await work()
    } finally {
      release()
      if (writeTails.get(key) === current) writeTails.delete(key)
    }
  }

  return {
    read(date) {
      return readFileDay(date)
    },
    async readVersioned(date) {
      const record = await readFileDay(date)
      return record
        ? { value: record, revision: String(record.version ?? 0) }
        : { value: emptyDay(date), revision: null }
    },
    writeVersioned(record, revision) {
      return withWriteLock(record.date, async () => {
        const current = await readFileDay(record.date)
        if (revision === null) {
          if (current) return false
        } else if (!current || revision !== String(current.version ?? 0)) {
          return false
        }
        await writeFile(filePath(record.date), JSON.stringify(record), 'utf8')
        return true
      })
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
          results.push(
            normalizeDay(JSON.parse(raw) as Partial<DayRecord>, date)
          )
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

/**
 * Coerce a possibly partial/legacy day record into a fully-shaped DayRecord
 * so downstream aggregation (`.length`, `Object.entries`, `for…of`) never
 * throws on a missing field. Defensive against blobs written by older code.
 */
export function normalizeDay(rec: Partial<DayRecord>, date: string): DayRecord {
  return {
    date: typeof rec.date === 'string' ? rec.date : date,
    pageViews: typeof rec.pageViews === 'number' ? rec.pageViews : 0,
    visitors: Array.isArray(rec.visitors) ? rec.visitors : [],
    sessions: Array.isArray(rec.sessions) ? rec.sessions : [],
    pages:
      rec.pages && typeof rec.pages === 'object' && !Array.isArray(rec.pages)
        ? rec.pages
        : {},
    hourly:
      rec.hourly && typeof rec.hourly === 'object' && !Array.isArray(rec.hourly)
        ? rec.hourly
        : {},
    version: typeof rec.version === 'number' ? rec.version : undefined,
  }
}

const VISITOR_CAP = 50_000

/**
 * Record a single pageview with optimistic-concurrency retry.
 *
 * Analytics counters use the same unversioned read-modify-write pattern as
 * pools, so concurrent requests can silently drop counts. We retry up to
 * MAX_RETRIES times on a version mismatch before giving up (a dropped count
 * is acceptable; a crash is not).
 *
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

  await updateWithOptimisticRetry<DayRecord, string | null>({
    read: () => store.readVersioned(date),
    write: (record, revision) => store.writeVersioned(record, revision),
    mutate: (rec) => {
      rec.version = (rec.version ?? 0) + 1
      rec.pageViews++

      if (
        !rec.visitors.includes(visitorHash) &&
        rec.visitors.length < VISITOR_CAP
      ) {
        rec.visitors.push(visitorHash)
      }

      if (
        !rec.sessions.includes(sessionId) &&
        rec.sessions.length < VISITOR_CAP
      ) {
        rec.sessions.push(sessionId)
      }

      rec.pages[path] = (rec.pages[path] ?? 0) + 1
      rec.hourly[hour] = (rec.hourly[hour] ?? 0) + 1
      return rec
    },
    onMissing: () => {
      throw new Error('Analytics store did not return an empty day')
    },
    onConflict: () => {
      throw new Error('Analytics day changed too many times')
    },
  })
}

// ── Pools-created counter ─────────────────────────────────────────────────────
//
// A single blob/file keyed "pools-counter" that holds a running total of how
// many pools have ever been created, plus a per-day breakdown so the analytics
// dashboard can show a sparkline or daily delta.

export interface PoolsCounter {
  total: number
  /** date → pools created that day */
  daily: Record<string, number>
  /** Local fallback revision; production concurrency uses the blob ETag. */
  version?: number
}

interface CounterStore {
  read(): Promise<PoolsCounter>
  readVersioned(): Promise<VersionedValue<PoolsCounter, string | null>>
  writeVersioned(c: PoolsCounter, revision: string | null): Promise<boolean>
}

const COUNTER_KEY = 'pools-counter'

function makeCounterBlobStore(): CounterStore {
  const store = getStore({ name: 'analytics', consistency: 'strong' })
  return {
    async read() {
      const raw = await store.get(COUNTER_KEY, { type: 'json' })
      return (raw as PoolsCounter | null) ?? { total: 0, daily: {} }
    },
    async readVersioned() {
      const entry = await store.getWithMetadata(COUNTER_KEY, { type: 'json' })
      if (entry && !entry.etag) {
        throw new Error('Pools counter was read without an ETag')
      }
      return entry
        ? {
            value: entry.data as PoolsCounter,
            revision: entry.etag!,
          }
        : { value: { total: 0, daily: {} }, revision: null }
    },
    async writeVersioned(c, revision) {
      const result = await store.set(
        COUNTER_KEY,
        JSON.stringify(c),
        revision === null ? { onlyIfNew: true } : { onlyIfMatch: revision }
      )
      return result.modified
    },
  }
}

function makeCounterFileStore(): CounterStore {
  const dir = resolve(process.cwd(), '.data', 'analytics')
  const file = join(dir, `${COUNTER_KEY}.json`)
  let writeTail = Promise.resolve()

  async function ensureDir() {
    await mkdir(dir, { recursive: true })
  }

  async function readFileCounter(): Promise<PoolsCounter | null> {
    await ensureDir()
    try {
      const raw = await readFile(file, 'utf8')
      return JSON.parse(raw) as PoolsCounter
    } catch {
      return null
    }
  }

  async function withWriteLock<T>(work: () => Promise<T>) {
    const previous = writeTail
    let release!: () => void
    writeTail = new Promise<void>((resolve) => {
      release = resolve
    })
    await previous
    try {
      return await work()
    } finally {
      release()
    }
  }

  return {
    async read() {
      return (await readFileCounter()) ?? { total: 0, daily: {} }
    },
    async readVersioned() {
      const counter = await readFileCounter()
      return counter
        ? { value: counter, revision: String(counter.version ?? 0) }
        : { value: { total: 0, daily: {} }, revision: null }
    },
    writeVersioned(c, revision) {
      return withWriteLock(async () => {
        const current = await readFileCounter()
        if (revision === null) {
          if (current) return false
        } else if (!current || revision !== String(current.version ?? 0)) {
          return false
        }
        await writeFile(file, JSON.stringify(c), 'utf8')
        return true
      })
    },
  }
}

let _counterStore: CounterStore | null = null

function counterStore(): CounterStore {
  if (_counterStore) return _counterStore
  if (blobsConfigured()) {
    try {
      _counterStore = makeCounterBlobStore()
    } catch {
      _counterStore = makeCounterFileStore()
    }
  } else {
    _counterStore = makeCounterFileStore()
  }
  return _counterStore
}

/** Atomically increment the pools-created counter by 1. */
export async function incrementPoolsCreated(): Promise<void> {
  const store = counterStore()
  const today = utcDateStr(new Date())
  try {
    await updateWithOptimisticRetry<PoolsCounter, string | null>({
      read: () => store.readVersioned(),
      write: (counter, revision) => store.writeVersioned(counter, revision),
      mutate: (counter) => {
        counter.version = (counter.version ?? 0) + 1
        counter.total += 1
        counter.daily[today] = (counter.daily[today] ?? 0) + 1
        return counter
      },
      onMissing: () => {
        throw new Error('Counter store did not return an empty counter')
      },
      onConflict: () => {
        throw new Error('Pools counter changed too many times')
      },
    })
  } catch (e) {
    console.error('[analytics] incrementPoolsCreated error:', e)
  }
}

/** Read the current pools counter (for the analytics dashboard). */
export async function readPoolsCounter(): Promise<PoolsCounter> {
  try {
    return await counterStore().read()
  } catch {
    return { total: 0, daily: {} }
  }
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
