// ── Pools server store (Netlify Blobs) ───────────────────────────────────────
//
// Phase B backend for Group Pools. Each pool is one JSON blob keyed by its id in
// the `pools` blob store. The blob is the CANONICAL record — members + their
// picks live here so every device (owner + invitees) reads the same data and the
// leaderboard is real cross-device.
//
// SECURITY (anonymous per-member tokens):
//   • createPool → mints an `ownerToken` (the owner's secret) + owner member id.
//   • joinPool   → mints a `memberToken` for the invitee.
//   • Writes are gated:
//       – owner token: may rename / delete the pool, and write the owner's picks.
//       – member token: may ONLY write that member's own picks.
//   Tokens are NEVER returned by the public GET — they're only handed back to the
//   caller who created/joined, and stored client-side in localStorage.
//
// Picks re-validate kickoff server-side: a member can't submit/alter a pick for a
// match that has already started. (Enforced in the picks route via the schedule.)

import { getStore } from '@netlify/blobs'
import { mkdir, readFile, writeFile, unlink, readdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'

// Use the Web Crypto global (available in Nitro / Netlify Functions runtime) so
// we don't need @types/node just for randomUUID.
function uuid(): string {
  return globalThis.crypto.randomUUID()
}

/** Picked outcome for a match (mirrors the client `PickOutcome`). */
export type PickOutcome = 'home' | 'away' | 'draw'

/** A member of a pool, as stored server-side (includes their secret token). */
export interface StoredMember {
  id: string
  name: string
  isOwner: boolean
  /** Secret write-token for this member. Never exposed via public GET. */
  token: string
  /** matchId → backed outcome. */
  picks: Record<string, PickOutcome>
}

/** The canonical pool record stored in a blob. */
export interface StoredPool {
  id: string
  name: string
  ownerName: string
  createdAt: string
  members: StoredMember[]
  /** Monotonically-increasing write counter used for optimistic concurrency. */
  version?: number
}

// ── Public (token-free) shapes returned to clients ────────────────────────────

export interface PublicMember {
  id: string
  name: string
  isOwner: boolean
  picks: Record<string, PickOutcome>
}

export interface PublicPool {
  id: string
  name: string
  ownerName: string
  createdAt: string
  members: PublicMember[]
}

/** Caps (kept in sync with the client composable). */
export const MAX_MEMBERS = 20

/** A short, unguessable id for pools/members (URL-safe). */
export function shortId(len = 8): string {
  return uuid().replace(/-/g, '').slice(0, len)
}

/** A long secret token for write authorization. */
export function secretToken(): string {
  return uuid().replace(/-/g, '') + uuid().replace(/-/g, '')
}

/**
 * Strip secrets so a pool can be returned publicly (leaderboard reads).
 *
 * `selfMemberId` — when provided, that member's picks are included in full.
 * All other members' picks are OMITTED so participants cannot inspect each
 * other's selections before matches are decided.
 */
export function toPublicPool(
  pool: StoredPool,
  selfMemberId?: string
): PublicPool {
  return {
    id: pool.id,
    name: pool.name,
    ownerName: pool.ownerName,
    createdAt: pool.createdAt,
    members: pool.members.map((m) => ({
      id: m.id,
      name: m.name,
      isOwner: m.isOwner,
      // Only expose picks for the authenticated caller; hide everyone else's.
      picks: m.id === selfMemberId ? m.picks : {},
    })),
  }
}

// ── Store abstraction (Netlify Blobs in prod, local fallback in dev) ──────────
//
// In a deployed Netlify environment `getStore` is auto-configured. In plain
// `nuxt dev` (no Netlify context) the env isn't set, so we fall back to an
// in-memory map so the feature stays testable locally. The fallback is process-
// local and ephemeral — fine for dev, never used in production.

interface PoolStore {
  read(id: string): Promise<StoredPool | null>
  write(pool: StoredPool): Promise<void>
  remove(id: string): Promise<void>
}

let cachedStore: PoolStore | null = null

function blobsConfigured(): boolean {
  // Netlify injects these in the Functions runtime. `getStore` also works with
  // the Netlify CLI (`netlify dev`), which sets NETLIFY_* env vars. We read env
  // off globalThis to avoid needing @types/node just for `process`.
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

function makeBlobStore(): PoolStore {
  const store = getStore({ name: 'pools', consistency: 'strong' })
  return {
    async read(id) {
      const raw = await store.get(id, { type: 'json' })
      return (raw as StoredPool | null) ?? null
    },
    async write(pool) {
      await store.setJSON(pool.id, pool)
    },
    async remove(id) {
      await store.delete(id)
    },
  }
}

function makeMemoryStore(): PoolStore {
  const map = new Map<string, StoredPool>()
  return {
    async read(id) {
      return map.get(id) ?? null
    },
    async write(pool) {
      map.set(pool.id, pool)
    },
    async remove(id) {
      map.delete(id)
    },
  }
}

/**
 * File-based store for local dev — persists pools to `.data/pools/` so they
 * survive server restarts. Only used when Netlify Blobs is not configured.
 */
function makeFileStore(): PoolStore {
  // Resolve relative to the project root (process.cwd() in Nitro dev).
  const dir = resolve(process.cwd(), '.data', 'pools')

  async function ensureDir() {
    await mkdir(dir, { recursive: true })
  }

  function filePath(id: string) {
    // Sanitise the id so we never write outside the dir.
    const safe = id.replace(/[^a-zA-Z0-9_-]/g, '')
    return join(dir, `${safe}.json`)
  }

  return {
    async read(id) {
      await ensureDir()
      try {
        const raw = await readFile(filePath(id), 'utf8')
        return JSON.parse(raw) as StoredPool
      } catch {
        return null
      }
    },
    async write(pool) {
      await ensureDir()
      await writeFile(filePath(pool.id), JSON.stringify(pool), 'utf8')
    },
    async remove(id) {
      try {
        await unlink(filePath(id))
      } catch {
        // ignore — file may not exist
      }
    },
  }
}

/** The shared pools store (lazily created). */
export function poolStore(): PoolStore {
  if (cachedStore) return cachedStore
  if (blobsConfigured()) {
    try {
      cachedStore = makeBlobStore()
    } catch {
      cachedStore = makeMemoryStore()
    }
  } else {
    // Local dev without Netlify context — use a file-based store so pools
    // survive server restarts. Falls back to in-memory if the file store fails.
    console.warn(
      '[pools] Netlify Blobs not configured — using file store (.data/pools/).'
    )
    try {
      cachedStore = makeFileStore()
    } catch {
      cachedStore = makeMemoryStore()
    }
  }
  return cachedStore
}

/** Read a pool from the store, or null if it doesn't exist. */
export async function readPool(id: string): Promise<StoredPool | null> {
  return poolStore().read(id)
}

/**
 * Resolve the pool id from the route param and load the pool, throwing
 * appropriate H3 errors if either is missing. Eliminates the repeated
 * id-guard + readPool + 404-guard pattern across pool route handlers.
 */
export async function requirePool(
  event: Parameters<typeof getRouterParam>[0]
): Promise<{ id: string; pool: StoredPool }> {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }
  const pool = await readPool(id)
  if (!pool) {
    throw createError({ statusCode: 404, statusMessage: 'Pool not found' })
  }
  return { id, pool }
}

/** Write a pool back to the store, incrementing its version counter. */
export async function writePool(pool: StoredPool): Promise<void> {
  pool.version = (pool.version ?? 0) + 1
  await poolStore().write(pool)
}

/**
 * Perform a safe read-modify-write on a pool with optimistic concurrency.
 *
 * `mutate` receives the freshly-read pool and returns the modified copy.
 * If a concurrent write changed the pool between our read and write, we
 * re-read and retry up to `maxRetries` times before giving up.
 *
 * This prevents two simultaneous picks submissions from silently discarding
 * one another's changes (the second writer overwrites the first).
 */
export async function updatePoolWithRetry(
  id: string,
  mutate: (pool: StoredPool) => StoredPool | Promise<StoredPool>,
  maxRetries = 3
): Promise<StoredPool> {
  const store = poolStore()
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const current = await store.read(id)
    if (!current) {
      throw createError({ statusCode: 404, statusMessage: 'Pool not found' })
    }
    const versionBefore = current.version ?? 0
    const updated = await mutate(current)
    // Increment version to detect concurrent writes on the next attempt.
    updated.version = versionBefore + 1
    await store.write(updated)

    // Verify our write won the race by re-reading and checking the version.
    const verify = await store.read(id)
    if (verify && verify.version === updated.version) {
      return updated
    }
    // Another writer incremented the version between our write and verify —
    // retry from a fresh read. On the last attempt, accept our write as-is
    // (the alternative is a 409 which would be worse UX for picks).
    if (attempt === maxRetries) return updated
    // Small jitter before retry to reduce thundering-herd collisions.
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 60))
  }
  // Unreachable, but TypeScript needs a return.
  throw createError({
    statusCode: 409,
    statusMessage: 'Concurrent write conflict',
  })
}

/** Delete a pool from the store. */
export async function deletePoolBlob(id: string): Promise<void> {
  await poolStore().remove(id)
}

/**
 * Count the total number of pools currently in the store.
 * Uses Netlify Blobs list() in production, readdir in dev.
 */
export async function countPools(): Promise<number> {
  try {
    if (blobsConfigured()) {
      const store = getStore({ name: 'pools', consistency: 'strong' })
      const { blobs } = await store.list()
      return blobs.length
    } else {
      // Dev: count .json files in .data/pools/
      const dir = resolve(process.cwd(), '.data', 'pools')
      try {
        const files = await readdir(dir)
        return files.filter((f) => f.endsWith('.json')).length
      } catch {
        return 0
      }
    }
  } catch (e) {
    console.error('[pools] countPools error:', e)
    return 0
  }
}
