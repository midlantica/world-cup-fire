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

/** Strip secrets so a pool can be returned publicly (leaderboard reads). */
export function toPublicPool(pool: StoredPool): PublicPool {
  return {
    id: pool.id,
    name: pool.name,
    ownerName: pool.ownerName,
    createdAt: pool.createdAt,
    members: pool.members.map((m) => ({
      id: m.id,
      name: m.name,
      isOwner: m.isOwner,
      picks: m.picks,
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
    // Local dev without Netlify context — use the ephemeral in-memory store.
    console.warn(
      '[pools] Netlify Blobs not configured — using in-memory store (dev only).'
    )
    cachedStore = makeMemoryStore()
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

/** Write a pool back to the store. */
export async function writePool(pool: StoredPool): Promise<void> {
  await poolStore().write(pool)
}

/** Delete a pool from the store. */
export async function deletePoolBlob(id: string): Promise<void> {
  await poolStore().remove(id)
}
