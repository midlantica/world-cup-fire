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

import type { Pick as UserPick, PickOutcome } from './usePicks'
import { usePicks } from './usePicks'

/**
 * Merge a map of server-side pick outcomes into the local picks store.
 * For picks already in local storage the outcome is updated (in case it
 * changed on another device). For picks not yet in local storage a minimal
 * stub is written so the Matches page can display the outcome immediately;
 * the full match snapshot is filled in the next time the schedule loads.
 *
 * Returns the merged picks map (does NOT write to localStorage or reactive
 * state — the caller decides how to persist).
 */
export function mergeServerPicks(
  serverPicks: Record<string, PickOutcome>,
  localPicks: Record<string, UserPick>
): Record<string, UserPick> {
  const merged: Record<string, UserPick> = { ...localPicks }
  for (const [matchId, outcome] of Object.entries(serverPicks)) {
    if (merged[matchId]) {
      // Update outcome in case it changed on the other device.
      merged[matchId] = { ...merged[matchId], outcome }
    } else {
      // No local snapshot — write a stub. The match snapshot will be
      // filled in the next time the schedule loads and the user makes or
      // views a pick. For now the outcome is preserved.
      merged[matchId] = {
        matchId,
        team:
          outcome === 'home'
            ? '__home__'
            : outcome === 'away'
              ? '__away__'
              : '',
        outcome,
        pickedAt: new Date().toISOString(),
        // Minimal match stub — enough for the picks store to hold it.
        // Cast to satisfy the Match type; real snapshot fills in later.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        match: {
          id: matchId,
          home: '',
          away: '',
          date: '',
          status: { code: 'ns' as const },
          group: null,
          homeScore: null,
          awayScore: null,
          venue: '',
          round: '',
        } as any,
      }
    }
  }
  return merged
}

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

      // ── Bidirectional reverse-sync ────────────────────────────────────────
      // If the server's self-member has picks that aren't in local picks
      // (e.g. picks made on another device), merge them into local picks so
      // the W/D chips show on this device and the next syncOwnerPicks push
      // sends the full set back to the server.
      if (import.meta.client) {
        const c = creds.value[id]
        if (c) {
          const selfMember = ui.members.find((m) => m.isSelf)
          if (selfMember && Object.keys(selfMember.picks).length > 0) {
            const { picks: localPicks } = usePicks()
            const currentPicks = localPicks.value
            const serverPickIds = Object.keys(selfMember.picks)
            // Merge if the server has picks this device doesn't know about, OR
            // if any outcome differs (pick changed on another device).
            const needsSync = serverPickIds.some(
              (mid) =>
                !currentPicks[mid] ||
                currentPicks[mid]!.outcome !== selfMember.picks[mid]
            )
            if (needsSync) {
              // Merge server picks into local picks using the shared helper.
              // For picks not in local storage a stub is written; hydrateStub()
              // fills in the match snapshot when the MatchCard renders.
              const merged = mergeServerPicks(selfMember.picks, currentPicks)
              // Write merged picks to localStorage AND update reactive state.
              // Updating picks.value triggers the watch(picks) in app.vue which
              // will push the full merged set back to the server — completing
              // the bidirectional sync loop.
              try {
                localStorage.setItem('wc-picks-v1', JSON.stringify(merged))
              } catch {
                // ignore storage errors
              }
              localPicks.value = merged
            }
          }
        }
      }

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

  // Hydrate from localStorage on mount.
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
  //
  // NOTE: We do NOT call refreshPools() here. The pools page (pools.vue) calls
  // `await refreshPools()` explicitly in its own onMounted after nextTick, which
  // ensures creds are fully hydrated before the fetch. Calling refreshPools()
  // here (unawaited) would race with that explicit call and could cause
  // mergePool() to run with stale creds, producing incorrect isSelf flags or
  // overwriting a correctly-merged pool with a stale version.
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
      // refreshPools() is intentionally NOT called here — pools.vue.onMounted
      // awaits it explicitly after nextTick() so creds are fully hydrated first.
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

  /**
   * Generate a private "sync to another device" URL for the pool owner.
   * The URL embeds the owner's secret token so the receiving device can
   * re-attach to the owner member slot and pull all picks from the server.
   *
   * IMPORTANT: this link is private — it should only be sent to the owner's
   * own devices, never shared publicly. The token grants owner-level write
   * access to the pool.
   *
   * Returns null if the caller doesn't hold owner creds for this pool.
   */
  function ownerSyncLink(id: string): string | null {
    const c = creds.value[id]
    if (!c?.isOwner) return null
    const origin = import.meta.client
      ? window.location.origin
      : 'https://worldcupfire.netlify.app'
    const params = new URLSearchParams({ p: id, sync: c.token })
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
   *
   * If we already hold a token for this pool (e.g. rejoining on a new device
   * after clearing storage), we pass it to the server so it can re-attach us
   * to our existing member slot rather than creating a duplicate.
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
        // Pass our existing token (if any) so the server can re-attach us to
        // our existing member slot instead of creating a duplicate row.
        // (creds.value[id] is undefined here since we returned early above if
        // it existed — this is a forward-looking hook for future callers that
        // bypass the early-return, e.g. a forced re-join.)
        body: {
          yourName: input.yourName,
          token: (creds.value[id] as PoolCreds | undefined)?.token,
        },
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

  /** Remove a member from a pool (owner only). */
  async function deleteMember(
    poolId: string,
    memberId: string
  ): Promise<Pool | null> {
    const c = creds.value[poolId]
    if (!c?.isOwner) return null
    try {
      const res = await $fetch<{ pool: ApiPool }>(
        `/api/pools/${poolId}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: { 'x-pool-token': c.token },
        }
      )
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
   * Rename the local user in a specific pool. Works for both owners and joined
   * members — sends the new name via the picks endpoint (which any member can
   * call with their token). Preserves existing picks unchanged.
   */
  async function renameSelf(id: string, newName: string): Promise<Pool | null> {
    const c = creds.value[id]
    if (!c) return null
    try {
      const res = await $fetch<{ pool: ApiPool }>(`/api/pools/${id}/picks`, {
        method: 'PUT',
        body: {
          memberId: c.memberId,
          token: c.token,
          picks: {}, // no pick changes — name-only update
          name: newName,
        },
      })
      const ui = toUiPool(res.pool)
      mergePool(ui)
      return ui
    } catch {
      return null
    }
  }

  /**
   * Sync the LOCAL user's picks into every pool they belong to. Sends each pool
   * the picks for the device's own member, with each pick's kickoff time so the
   * server can reject late edits. Called whenever personal picks change.
   */
  async function syncOwnerPicks(personalPicks: Record<string, UserPick>) {
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
              body: {
                memberId: c.memberId,
                token: c.token,
                picks: payload,
                // Always set picksProvided so the server knows this is an
                // intentional picks update (even when the map is empty, which
                // means "clear all picks" rather than "name-only update").
                picksProvided: true,
              },
            }
          )
          // Merge the server response but preserve the locally-known member
          // names — the response may be stale if it raced with a renameSelf
          // call that completed just before this response arrived.
          const incoming = toUiPool(res.pool)
          const existing = pools.value.find((p: Pool) => p.id === id)
          if (existing) {
            // Preserve each member's name from the local cache if we have it,
            // so a concurrent rename isn't overwritten by a stale picks sync.
            incoming.members = incoming.members.map((m: PoolMember) => {
              const local = existing.members.find(
                (lm: PoolMember) => lm.id === m.id
              )
              return local ? { ...m, name: local.name } : m
            })
            // Also preserve pool-level ownerName from local cache.
            incoming.ownerName = existing.ownerName
            incoming.name = existing.name
          }
          mergePool(incoming)
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
   *
   * `selfPicks` — when provided, the self member's picks are taken from this
   * local map instead of the server pool data. This prevents the leaderboard
   * from flashing 0 picks for the local user when the server hasn't been
   * synced yet (e.g. immediately after page load before syncOwnerPicks runs).
   */
  function leaderboard(
    id: string,
    resolveResult: (matchId: string) => PickOutcome | null,
    selfPicks?: Record<string, UserPick>
  ): LeaderRow[] {
    const pool = getPool(id)
    if (!pool) return []
    const rows: LeaderRow[] = pool.members.map((m) => {
      // For the self member, prefer local picks over server picks so the
      // leaderboard always reflects the user's actual selections even before
      // the server sync has completed.
      const effectivePicks: Record<string, PickOutcome> =
        m.isSelf && selfPicks
          ? Object.fromEntries(
              Object.entries(selfPicks).map(([mid, p]) => [mid, p.outcome])
            )
          : m.picks
      let score = 0
      let decided = 0
      const picksMade = Object.keys(effectivePicks).length
      for (const [matchId, outcome] of Object.entries(effectivePicks)) {
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

  /** True if this device holds credentials for at least one pool. */
  const hasAnyCreds = computed(() => Object.keys(creds.value).length > 0)

  return {
    pools,
    poolCount,
    ownedCount,
    canCreate,
    selfName,
    hasAnyCreds,
    MAX_MEMBERS,
    MAX_POOLS,

    getPool,
    hasPool,
    joinPool,
    leavePool,
    poolLink,
    ownerSyncLink,
    createPool,
    updatePool,
    deletePool,
    deleteMember,
    renameSelf,
    syncOwnerPicks,
    refreshPools,
    leaderboard,
  }
}
