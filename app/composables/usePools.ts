// ── Pools composable ──────────────────────────────────────────────────────────

// Lets a user create "pools" — named groups they can share with friends & family
// via a link so everyone can make picks and compete on a leaderboard.
//
// PHASE B (this file): pools are persisted server-side via @netlify/blobs behind
// `/api/pools/…`, so members + their picks SYNC across devices and the
// leaderboard is real. The public surface here is unchanged from Phase A, but the
// create/join/update/delete/sync operations are now ASYNC (they hit the API).
//
// SECURITY (anonymous per-member tokens):
//   • create → server mints an owner token; we store it locally (token registry).
//   • join   → server mints a member token; we store it locally.
//   • Writes (rename/delete/picks) send the token; the server authorizes it.
//   • A pool shows up on this device only if we hold a token for it. The token
//     registry (localStorage) is the source of "which pools am I in + as whom".
//
// The reactive `pools` array is a CACHE of the server state for the pools this
// device belongs to. It's hydrated on mount and after every mutation.

import type { Pick, PickOutcome } from './usePicks'

/** Local registry of the pools this device belongs to + its credentials. */
const TOKENS_KEY = 'wc-pool-tokens-v1'
/** Cache of the last-known server pools (so the UI paints instantly on load). */
const CACHE_KEY = 'wc-pools-cache-v1'

/** Max members per pool (keeps leaderboards readable + writes cheap). */
export const MAX_MEMBERS = 20
/** Max pools a single user may own. */
export const MAX_POOLS = 5

/** A pool member and their picks (matchId → backed outcome). */
export interface PoolMember {
  id: string
  name: string
  isOwner?: boolean
  /** True for the member that represents the LOCAL user on this device. */
  isSelf?: boolean
  picks: Record<string, PickOutcome>
}

export interface Pool {
  id: string
  name: string
  ownerName: string
  createdAt: string
  members: PoolMember[]
  /** True if the local user OWNS this pool (holds the owner token). */
  owned: boolean
}

/** A single leaderboard row (computed). */
export interface LeaderRow {
  memberId: string
  name: string
  isOwner: boolean
  isSelf: boolean
  score: number
  decided: number
  picksMade: number
  accuracy: number
  rank: number
}

/** Per-pool credentials this device holds. */
interface PoolCreds {
  memberId: string
  token: string
  isOwner: boolean
}

/** Shape of a member as returned by the public API. */
interface ApiMember {
  id: string
  name: string
  isOwner: boolean
  picks: Record<string, PickOutcome>
}
interface ApiPool {
  id: string
  name: string
  ownerName: string
  createdAt: string
  members: ApiMember[]
}

function loadCreds(): Record<string, PoolCreds> {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, PoolCreds>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadCache(): Pool[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Pool[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function usePools() {
  const pools = useState<Pool[]>('wc-pools', () => loadCache())
  // Credentials live in their own state so they survive across the app.
  const creds = useState<Record<string, PoolCreds>>('wc-pool-creds', () =>
    loadCreds()
  )

  function persistCache() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(pools.value))
    } catch {
      // ignore
    }
  }

  function persistCreds() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(TOKENS_KEY, JSON.stringify(creds.value))
    } catch {
      // ignore
    }
  }

  /** Map an API pool → the UI Pool shape using this device's creds. */
  function toUiPool(api: ApiPool): Pool {
    const c = creds.value[api.id]
    const selfId = c?.memberId
    return {
      id: api.id,
      name: api.name,
      ownerName: api.ownerName,
      createdAt: api.createdAt,
      owned: !!c?.isOwner,
      members: api.members.map((m) => ({
        id: m.id,
        name: m.name,
        isOwner: m.isOwner,
        isSelf: m.id === selfId,
        picks: m.picks ?? {},
      })),
    }
  }

  /** Fetch a single pool from the server and merge it into the cache. */
  async function fetchPool(id: string): Promise<Pool | null> {
    try {
      const res = await $fetch<{ pool: ApiPool }>(`/api/pools/${id}`)
      const ui = toUiPool(res.pool)
      mergePool(ui)
      return ui
    } catch (err) {
      // ONLY forget the pool on a definitive 404 (it was deleted upstream).
      // A transient failure — network blip, timeout, 5xx, or an offline reload
      // — must NOT wipe our creds/cache, otherwise a single flaky refresh would
      // permanently lose a valid pool from this device. We keep the cached copy
      // (painted from localStorage) and try again next refresh.
      const status =
        (err as { statusCode?: number; status?: number })?.statusCode ??
        (err as { status?: number })?.status
      if (status === 404) removeLocal(id)
      return null
    }
  }

  /** Insert/replace a pool in the reactive cache + persist. */
  function mergePool(pool: Pool) {
    const idx = pools.value.findIndex((p) => p.id === pool.id)
    if (idx === -1) pools.value = [...pools.value, pool]
    else {
      const next = [...pools.value]
      next[idx] = pool
      pools.value = next
    }
    persistCache()
  }

  /** Drop a pool + its creds from this device (left/deleted/not-found). */
  function removeLocal(id: string) {
    pools.value = pools.value.filter((p) => p.id !== id)
    if (creds.value[id]) {
      const next = { ...creds.value }
      delete next[id]
      creds.value = next
      persistCreds()
    }
    persistCache()
  }

  /** Re-fetch every pool we hold creds for (live leaderboards). */
  async function refreshPools() {
    const ids = Object.keys(creds.value)
    await Promise.all(ids.map((id) => fetchPool(id)))
  }

  // Hydrate from the server on mount.
  //
  // IMPORTANT (SSR): `useState(...)` runs its initializer on the SERVER during
  // SSR, where `loadCreds()` / `loadCache()` can't see localStorage and return
  // empty. That empty value is serialized into the Nuxt payload and ADOPTED by
  // the client on hydration — so `useState` does NOT re-run the initializer on
  // the client. Without re-reading localStorage here, a page refresh would wipe
  // every pool this device belongs to (creds + cache both look empty), which is
  // exactly the "my pool disappeared after refresh" bug. So we re-hydrate from
  // localStorage on mount BEFORE refreshing from the server. (usePicks does the
  // same dance for the personal picks map.)
  if (import.meta.client) {
    onMounted(() => {
      if (Object.keys(creds.value).length === 0) {
        const storedCreds = loadCreds()
        if (Object.keys(storedCreds).length > 0) creds.value = storedCreds
      }
      if (pools.value.length === 0) {
        const storedCache = loadCache()
        if (storedCache.length > 0) pools.value = storedCache
      }
      refreshPools()
    })
  }

  const poolCount = computed(() => pools.value.length)
  // Cap counts OWNED pools only (joined pools don't count against the cap).
  const ownedCount = computed(() => pools.value.filter((p) => p.owned).length)
  const canCreate = computed(() => ownedCount.value < MAX_POOLS)

  // The local user's display name, learned from any pool they already belong to
  // (the `isSelf` member). Lets the create/join modals pre-fill their name
  // instead of asking for it again every time. Prefer an OWNED pool's name (the
  // one they chose when they first created a pool), else fall back to any pool.
  const selfName = computed(() => {
    const owned = pools.value.find((p) => p.owned)
    const ownedSelf = owned?.members.find((m) => m.isSelf)?.name
    if (ownedSelf) return ownedSelf
    for (const p of pools.value) {
      const self = p.members.find((m) => m.isSelf)?.name
      if (self) return self
    }
    return ''
  })

  function getPool(id: string): Pool | undefined {
    return pools.value.find((p) => p.id === id)
  }

  function poolLink(id: string): string {
    const origin = import.meta.client
      ? window.location.origin
      : 'https://worldcupfire.netlify.app'
    // Only the pool id is needed now — the invitee fetches the real pool
    // (name, owner, members) from the server. We still pass o/n as a friendly
    // fallback for the join modal title before the fetch resolves.
    const pool = getPool(id)
    const params = new URLSearchParams({ p: id })
    if (pool?.ownerName) params.set('o', pool.ownerName)
    if (pool?.name) params.set('n', pool.name)
    return `${origin}/pools?${params.toString()}`
  }

  /** Create a pool owned by the local user. Returns it, or null on failure/cap. */
  async function createPool(input: {
    yourName: string
    poolName: string
  }): Promise<Pool | null> {
    if (!canCreate.value) return null
    try {
      const res = await $fetch<{
        pool: ApiPool
        poolId: string
        memberId: string
        token: string
      }>('/api/pools', {
        method: 'POST',
        body: { yourName: input.yourName, poolName: input.poolName },
      })
      creds.value = {
        ...creds.value,
        [res.poolId]: {
          memberId: res.memberId,
          token: res.token,
          isOwner: true,
        },
      }
      persistCreds()
      const ui = toUiPool(res.pool)
      mergePool(ui)
      return ui
    } catch {
      return null
    }
  }

  /** True if the local user already created or joined the pool with `id`. */
  function hasPool(id: string): boolean {
    return !!creds.value[id]
  }

  /**
   * Join a pool from an invite link. Fetches the real pool from the server,
   * adds the local user as a member, and stores their token. Idempotent: if we
   * already hold creds for this pool we just refresh it.
   */
  async function joinPool(
    id: string,
    input: { yourName: string; poolName?: string; ownerName?: string }
  ): Promise<Pool | null> {
    if (creds.value[id]) {
      return await fetchPool(id)
    }
    try {
      const res = await $fetch<{
        pool: ApiPool
        memberId: string
        token: string
        // Present (and true) when the server RE-ATTACHED us to the existing
        // owner member — e.g. the owner rejoining their own pool from the link
        // on a new device. We must preserve owner abilities in that case.
        isOwner?: boolean
      }>(`/api/pools/${id}/join`, {
        method: 'POST',
        body: { yourName: input.yourName },
      })
      creds.value = {
        ...creds.value,
        [id]: {
          memberId: res.memberId,
          token: res.token,
          isOwner: res.isOwner ?? false,
        },
      }

      persistCreds()
      const ui = toUiPool(res.pool)
      mergePool(ui)
      return ui
    } catch {
      return null
    }
  }

  /** Leave (remove the local copy + creds of) a joined pool. */
  function leavePool(id: string) {
    // Phase B note: we leave the member row on the server (their picks stay on
    // the leaderboard). Removing it server-side would need a dedicated route;
    // for now leaving simply forgets the pool on this device.
    removeLocal(id)
  }

  /** Rename a pool / owner name (owner only). */
  async function updatePool(
    id: string,
    input: { yourName: string; poolName: string }
  ): Promise<Pool | null> {
    const c = creds.value[id]
    if (!c?.isOwner) return null
    try {
      const res = await $fetch<{ pool: ApiPool }>(`/api/pools/${id}`, {
        method: 'PATCH',
        body: {
          token: c.token,
          poolName: input.poolName,
          yourName: input.yourName,
        },
      })
      const ui = toUiPool(res.pool)
      mergePool(ui)
      return ui
    } catch {
      return null
    }
  }

  /** Delete a pool (owner only). */
  async function deletePool(id: string): Promise<boolean> {
    const c = creds.value[id]
    if (!c?.isOwner) return false
    try {
      await $fetch(`/api/pools/${id}`, {
        method: 'DELETE',
        headers: { 'x-pool-token': c.token },
      })
      removeLocal(id)
      return true
    } catch {
      return false
    }
  }

  /**
   * Sync the LOCAL user's picks into every pool they belong to. Sends each pool
   * the picks for the device's own member, with each pick's kickoff time so the
   * server can reject late edits. Called whenever personal picks change.
   */
  async function syncOwnerPicks(personalPicks: Record<string, Pick>) {
    const payload: Record<string, { outcome: PickOutcome; kickoff: string }> =
      {}
    for (const [matchId, pick] of Object.entries(personalPicks)) {
      payload[matchId] = { outcome: pick.outcome, kickoff: pick.match.date }
    }

    const ids = Object.keys(creds.value)
    await Promise.all(
      ids.map(async (id) => {
        const c = creds.value[id]
        if (!c) return
        try {
          const res = await $fetch<{ pool: ApiPool }>(
            `/api/pools/${id}/picks`,
            {
              method: 'PUT',
              body: { memberId: c.memberId, token: c.token, picks: payload },
            }
          )
          mergePool(toUiPool(res.pool))
        } catch {
          // ignore individual pool sync failures
        }
      })
    )
  }

  /**
   * Compute a ranked leaderboard for a pool. A member scores a point for each
   * FINISHED match where their backed OUTCOME matches the actual result.
   * `resolveResult` maps a matchId → the finished outcome (or null).
   */
  function leaderboard(
    id: string,
    resolveResult: (matchId: string) => PickOutcome | null
  ): LeaderRow[] {
    const pool = getPool(id)
    if (!pool) return []
    const rows: LeaderRow[] = pool.members.map((m) => {
      let score = 0
      let decided = 0
      const picksMade = Object.keys(m.picks).length
      for (const [matchId, outcome] of Object.entries(m.picks)) {
        const result = resolveResult(matchId)
        if (result === null) continue
        decided++
        if (result === outcome) score++
      }
      const accuracy = decided > 0 ? score / decided : 0
      return {
        memberId: m.id,
        name: m.name,
        isOwner: !!m.isOwner,
        isSelf: !!m.isSelf,
        score,
        decided,
        picksMade,
        accuracy,
        rank: 0,
      }
    })
    rows.sort(
      (a, b) =>
        b.score - a.score ||
        b.accuracy - a.accuracy ||
        b.picksMade - a.picksMade ||
        a.name.localeCompare(b.name)
    )
    let lastScore = -1
    let lastRank = 0
    rows.forEach((r, i) => {
      if (r.score !== lastScore) {
        lastRank = i + 1
        lastScore = r.score
      }
      r.rank = lastRank
    })
    return rows
  }

  return {
    pools,
    poolCount,
    ownedCount,
    canCreate,
    selfName,
    MAX_MEMBERS,
    MAX_POOLS,

    getPool,
    hasPool,
    joinPool,
    leavePool,
    poolLink,
    createPool,
    updatePool,
    deletePool,
    syncOwnerPicks,
    refreshPools,
    leaderboard,
  }
}
