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
import { filterPoolForViewer } from './pool-visibility'
import { updateWithOptimisticRetry } from './optimistic-update'
import type { StoredSyncCode } from './pool-sync'
import { getWorldCupKickoffs } from './world-cup-schedule'

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
  /** Short-lived, one-use owner sync codes. Only hashes are stored. */
  syncCodes?: StoredSyncCode[]
  /** Monotonically-increasing write counter used for optimistic concurrency. */
  version?: number
}

// ── Public (token-free) shapes returned to clients ────────────────────────────

export interface PublicMember {
  id: string
  name: string
  isOwner: boolean
  picks: Record<string, PickOutcome>
  /** Total picks made, including outcomes hidden until kickoff. */
  picksMade: number
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
 * Strip secrets and unstarted opponents' outcomes from a pool response.
 * A valid self member receives their own complete map for cross-device sync.
 * If the schedule is unavailable, opponents' outcomes remain hidden.
 */
export async function toPublicPool(
  pool: StoredPool,
  selfMemberId?: string
): Promise<PublicPool> {
  let kickoffByMatchId: ReadonlyMap<string, number> = new Map()
  const hasOpponentPicks = pool.members.some(
    (member) =>
      member.id !== selfMemberId && Object.keys(member.picks ?? {}).length > 0
  )

  if (hasOpponentPicks) {
    try {
      kickoffByMatchId = await getWorldCupKickoffs()
    } catch {
      // Fail closed: an empty map hides every non-self outcome.
    }
  }

  return filterPoolForViewer(pool, selfMemberId, kickoffByMatchId, Date.now())
}

// ── Store abstraction (Netlify Blobs in prod, local fallback in dev) ──────────
//
// In a deployed Netlify environment `getStore` is auto-configured. In plain
// `nuxt dev` (no Netlify context) the env isn't set, so we fall back to an
// in-memory map so the feature stays testable locally. The fallback is process-
// local and ephemeral — fine for dev, never used in production.

export interface PoolStoreSnapshot {
  pool: StoredPool
  revision: string
}

export type PoolWriteCondition =
  | { onlyIfRevision: string }
  | { onlyIfNew: true }

export interface PoolStore {
  read(id: string): Promise<StoredPool | null>
  readVersioned(id: string): Promise<PoolStoreSnapshot | null>
  write(pool: StoredPool, condition?: PoolWriteCondition): Promise<boolean>
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
    async readVersioned(id) {
      const entry = await store.getWithMetadata(id, { type: 'json' })
      if (!entry) return null
      if (!entry.etag) {
        throw new Error(`Pool ${id} was read without an ETag`)
      }
      return {
        pool: entry.data as StoredPool,
        revision: entry.etag,
      }
    },
    async write(pool, condition) {
      const options =
        condition && 'onlyIfRevision' in condition
          ? { onlyIfMatch: condition.onlyIfRevision }
          : condition
            ? { onlyIfNew: true as const }
            : undefined
      // @netlify/blobs 10.7.9 drops conditional options inside setJSON.
      // `set` forwards them correctly; get({ type: 'json' }) still parses this.
      const result = await store.set(pool.id, JSON.stringify(pool), options)
      return result.modified
    },
    async remove(id) {
      await store.delete(id)
    },
  }
}

function makeMemoryStore(): PoolStore {
  const map = new Map<string, StoredPool>()
  const revisions = new Map<string, number>()

  function clone(pool: StoredPool): StoredPool {
    return structuredClone(pool)
  }

  return {
    async read(id) {
      const pool = map.get(id)
      return pool ? clone(pool) : null
    },
    async readVersioned(id) {
      const pool = map.get(id)
      if (!pool) return null
      return {
        pool: clone(pool),
        revision: String(revisions.get(id) ?? 0),
      }
    },
    async write(pool, condition) {
      const exists = map.has(pool.id)
      if (condition && 'onlyIfNew' in condition && exists) return false
      if (
        condition &&
        'onlyIfRevision' in condition &&
        (!exists ||
          condition.onlyIfRevision !== String(revisions.get(pool.id) ?? 0))
      ) {
        return false
      }
      map.set(pool.id, clone(pool))
      revisions.set(pool.id, (revisions.get(pool.id) ?? 0) + 1)
      return true
    },
    async remove(id) {
      map.delete(id)
      revisions.delete(id)
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
  const writeTails = new Map<string, Promise<void>>()

  async function ensureDir() {
    await mkdir(dir, { recursive: true })
  }

  function filePath(id: string) {
    // Sanitise the id so we never write outside the dir.
    const safe = id.replace(/[^a-zA-Z0-9_-]/g, '')
    return join(dir, `${safe}.json`)
  }

  async function readFilePool(id: string): Promise<StoredPool | null> {
    await ensureDir()
    try {
      const raw = await readFile(filePath(id), 'utf8')
      return JSON.parse(raw) as StoredPool
    } catch {
      return null
    }
  }

  async function withWriteLock<T>(id: string, work: () => Promise<T>) {
    const previous = writeTails.get(id) ?? Promise.resolve()
    let release!: () => void
    const current = new Promise<void>((resolve) => {
      release = resolve
    })
    writeTails.set(id, current)
    await previous
    try {
      return await work()
    } finally {
      release()
      if (writeTails.get(id) === current) writeTails.delete(id)
    }
  }

  return {
    read(id) {
      return readFilePool(id)
    },
    async readVersioned(id) {
      const pool = await readFilePool(id)
      return pool ? { pool, revision: String(pool.version ?? 0) } : null
    },
    write(pool, condition) {
      return withWriteLock(pool.id, async () => {
        const current = await readFilePool(pool.id)
        if (condition && 'onlyIfNew' in condition && current) return false
        if (
          condition &&
          'onlyIfRevision' in condition &&
          (!current ||
            condition.onlyIfRevision !== String(current.version ?? 0))
        ) {
          return false
        }
        await writeFile(filePath(pool.id), JSON.stringify(pool), 'utf8')
        return true
      })
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

/** Create a pool without overwriting the astronomically unlikely id collision. */
export async function writePool(pool: StoredPool): Promise<void> {
  pool.version = (pool.version ?? 0) + 1
  const created = await poolStore().write(pool, { onlyIfNew: true })
  if (!created) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Pool id collision',
    })
  }
}

/**
 * Perform an atomic read-modify-write on a pool with optimistic concurrency.
 *
 * `mutate` receives the freshly-read pool and returns the modified copy.
 * The store only accepts the write if the revision read by this attempt is
 * still current. Conflicts are re-read and retried, so mutations are applied
 * to the latest state rather than overwriting it.
 */
export async function updatePoolInStore(
  store: PoolStore,
  id: string,
  mutate: (pool: StoredPool) => StoredPool | Promise<StoredPool>,
  maxRetries = 3
): Promise<StoredPool> {
  return updateWithOptimisticRetry({
    maxRetries,
    read: async () => {
      const snapshot = await store.readVersioned(id)
      return snapshot
        ? { value: snapshot.pool, revision: snapshot.revision }
        : null
    },
    mutate: async (pool) => {
      const versionBefore = pool.version ?? 0
      const updated = await mutate(pool)
      updated.version = versionBefore + 1
      return updated
    },
    write: (updated, revision) =>
      store.write(updated, { onlyIfRevision: revision }),
    onMissing: () => {
      throw createError({ statusCode: 404, statusMessage: 'Pool not found' })
    },
    onConflict: () => {
      throw createError({
        statusCode: 409,
        statusMessage: 'Pool changed too many times; please retry',
      })
    },
  })
}

export function updatePoolWithRetry(
  id: string,
  mutate: (pool: StoredPool) => StoredPool | Promise<StoredPool>,
  maxRetries = 3
): Promise<StoredPool> {
  return updatePoolInStore(poolStore(), id, mutate, maxRetries)
}

/** Delete a pool from the store. */
export async function deletePoolBlob(id: string): Promise<void> {
  await poolStore().remove(id)
}

export interface PoolsStats {
  /** Total pools in the store. */
  total: number
  /** Pools with only the owner — invite link was never used. */
  solo: number
  /** Pools with 2+ members — at least one person joined. */
  active: number
  /** Total members across all pools (owners + joiners). */
  totalMembers: number
  /** Average members per active pool (2+ member pools only). */
  avgMembersPerActivePool: number
}

/**
 * Scan all pools and return engagement stats.
 * Uses Netlify Blobs list() + get() in production, readdir in dev.
 */
export async function getPoolsStats(): Promise<PoolsStats> {
  try {
    let pools: StoredPool[] = []

    if (blobsConfigured()) {
      const store = getStore({ name: 'pools', consistency: 'strong' })
      const { blobs } = await store.list()
      // Fetch all pools in parallel (capped to avoid overwhelming the runtime)
      const chunks: (typeof blobs)[] = []
      for (let i = 0; i < blobs.length; i += 20) {
        chunks.push(blobs.slice(i, i + 20))
      }
      for (const chunk of chunks) {
        const results = await Promise.all(
          chunk.map((b) => store.get(b.key, { type: 'json' }))
        )
        for (const r of results) {
          if (r) pools.push(r as StoredPool)
        }
      }
    } else {
      // Dev: read all .json files in .data/pools/
      const dir = resolve(process.cwd(), '.data', 'pools')
      try {
        const files = await readdir(dir)
        const jsonFiles = files.filter((f) => f.endsWith('.json'))
        pools = await Promise.all(
          jsonFiles.map(async (f) => {
            const raw = await readFile(join(dir, f), 'utf8')
            return JSON.parse(raw) as StoredPool
          })
        )
      } catch {
        pools = []
      }
    }

    const total = pools.length
    const solo = pools.filter((p) => p.members.length <= 1).length
    const active = pools.filter((p) => p.members.length >= 2).length
    const totalMembers = pools.reduce((sum, p) => sum + p.members.length, 0)
    const activePools = pools.filter((p) => p.members.length >= 2)
    const avgMembersPerActivePool =
      activePools.length === 0
        ? 0
        : Math.round(
            (activePools.reduce((sum, p) => sum + p.members.length, 0) /
              activePools.length) *
              10
          ) / 10

    return { total, solo, active, totalMembers, avgMembersPerActivePool }
  } catch (e) {
    console.error('[pools] getPoolsStats error:', e)
    return {
      total: 0,
      solo: 0,
      active: 0,
      totalMembers: 0,
      avgMembersPerActivePool: 0,
    }
  }
}
