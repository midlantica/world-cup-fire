// ── Pools composable ──────────────────────────────────────────────────────────

// Lets a user create "pools" — named groups they can share with friends & family
// via a link so everyone can make picks and compete on a leaderboard.
//
// PHASE A (this file): everything lives in localStorage. There is no cross-device
// sync yet — a pool's members + their picks are seeded locally so the UI (pool
// cards, leaderboards, edit/delete) is fully functional and reviewable. The
// owner is always the local user.
//
// PHASE B (future): swap the read/write internals here for `$fetch('/api/pools/…')`
// backed by @netlify/blobs, keeping this same public surface. Member writes are
// gated by a per-member token; only the owner can edit/delete. Picks re-validate
// kickoff server-side. See docs / plan for the security model.

import type { Pick, PickOutcome } from './usePicks'

const STORAGE_KEY = 'wc-pools-v1'

/** Max members per pool (keeps leaderboards readable + writes cheap). */
export const MAX_MEMBERS = 20
/** Max pools a single user may own. */
export const MAX_POOLS = 5

/** A pool member and their picks (matchId → picked team name). */
export interface PoolMember {
  /** Stable member id. */
  id: string
  /** Display name. */
  name: string
  /** True for the local user who owns the pool. */
  isOwner?: boolean
  /**
   * True for the member that represents the LOCAL user on this device. For an
   * owned pool this is the same as the owner; for a joined pool it's the
   * invitee's own (non-owner) member row. Picks sync into whichever member is
   * the local "self".
   */
  isSelf?: boolean
  /** Their picks: matchId → backed outcome ('home' | 'away' | 'draw'). */
  picks: Record<string, PickOutcome>
}

export interface Pool {
  /** Unguessable random id, also used in the share link. */
  id: string
  /** Pool display name (e.g. "Chelsea Mates Pool"). */
  name: string
  /** The owner's display name. */
  ownerName: string
  /** ISO timestamp the pool was created. */
  createdAt: string
  /** Members (owner first). */
  members: PoolMember[]
  /**
   * True if the local user OWNS this pool (created it here). False when this
   * pool was JOINED via an invite link — in Phase A (no backend) a joined pool
   * is a local stub so the invitee's picks have somewhere to live and the pool
   * shows up under Group Pools. The owner's real members/picks live on their
   * device until Phase B sync lands.
   */
  owned: boolean
}

/** A single leaderboard row (computed). */
export interface LeaderRow {
  memberId: string
  name: string
  isOwner: boolean
  /** True for the row representing the LOCAL user (gets the "you" tag). */
  isSelf: boolean
  /** Correct picks so far. */
  score: number
  /** Matches that have finished and were picked. */
  decided: number
  /** Total picks the member has made (all matches, decided or not). */
  picksMade: number
  /** Accuracy = score / decided, as a 0–1 fraction (0 when none decided). */
  accuracy: number
  rank: number
}

function randomId(len = 8): string {
  let s = ''
  while (s.length < len) s += Math.random().toString(36).slice(2)
  return s.slice(0, len)
}

function loadPools(): Pool[] {
  if (!import.meta.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Pool[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function usePools() {
  const pools = useState<Pool[]>('wc-pools', () => loadPools())

  if (import.meta.client) {
    onMounted(() => {
      if (pools.value.length === 0) {
        const stored = loadPools()
        if (stored.length > 0) pools.value = stored
      }
    })
  }

  function persist() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pools.value))
    } catch {
      // storage unavailable — ignore
    }
  }

  const poolCount = computed(() => pools.value.length)
  const canCreate = computed(() => pools.value.length < MAX_POOLS)

  function getPool(id: string): Pool | undefined {
    return pools.value.find((p) => p.id === id)
  }

  function poolLink(id: string): string {
    const origin = import.meta.client
      ? window.location.origin
      : 'https://worldcupfire.netlify.app'
    const pool = getPool(id)
    // Encode the owner's name + pool name into the link so the invitee's local
    // stub can seed the owner onto the leaderboard and use the real pool name.
    // (Phase A: the owner's picks still can't sync until the Phase B backend.)
    const params = new URLSearchParams({ p: id })
    if (pool?.ownerName) params.set('o', pool.ownerName)
    if (pool?.name) params.set('n', pool.name)
    return `${origin}/picks?${params.toString()}`
  }

  /** Create a pool owned by the local user. Returns it, or null if at the cap. */
  function createPool(input: {
    yourName: string
    poolName: string
  }): Pool | null {
    if (!canCreate.value) return null
    const owner: PoolMember = {
      id: randomId(6),
      name: input.yourName.trim() || 'You',
      isOwner: true,
      isSelf: true,
      picks: {},
    }
    const pool: Pool = {
      id: randomId(8),
      name: input.poolName.trim() || 'My Pool',
      ownerName: owner.name,
      createdAt: new Date().toISOString(),
      members: [owner],
      owned: true,
    }
    pools.value = [...pools.value, pool]
    persist()
    return pool
  }

  /** True if the local user has already created or joined the pool with `id`. */
  function hasPool(id: string): boolean {
    return pools.value.some((p) => p.id === id)
  }

  /**
   * Join a pool from an invite link. In Phase A (no backend) we can't fetch the
   * owner's real pool, so we create a LOCAL stub for it: the invitee becomes a
   * non-owner "self" member whose picks sync in locally, and the pool shows up
   * under Group Pools. Returns the (new or existing) pool. Idempotent.
   */
  function joinPool(
    id: string,
    input: { yourName: string; poolName?: string; ownerName?: string }
  ): Pool | null {
    const existing = getPool(id)
    if (existing) return existing
    const self: PoolMember = {
      id: randomId(6),
      name: input.yourName.trim() || 'You',
      isOwner: false,
      isSelf: true,
      picks: {},
    }
    // Seed the owner (from the invite link) onto the leaderboard so the invitee
    // sees who they're competing against. The owner's picks can't sync until
    // Phase B, so their row scores 0 until then.
    const members: PoolMember[] = []
    const ownerName = input.ownerName?.trim()
    if (ownerName) {
      members.push({
        id: randomId(6),
        name: ownerName,
        isOwner: true,
        isSelf: false,
        picks: {},
      })
    }
    members.push(self)
    const pool: Pool = {
      id,
      name: input.poolName?.trim() || 'Shared Pool',
      ownerName: ownerName || '',
      createdAt: new Date().toISOString(),
      members,
      owned: false,
    }
    pools.value = [...pools.value, pool]
    persist()
    return pool
  }

  /** Leave (remove the local copy of) a joined pool. */
  function leavePool(id: string) {
    pools.value = pools.value.filter((p) => p.id !== id)
    persist()
  }

  /** Rename a pool / owner name. */
  function updatePool(
    id: string,
    input: { yourName: string; poolName: string }
  ) {
    pools.value = pools.value.map((p) => {
      if (p.id !== id) return p
      const members = p.members.map((m) =>
        m.isOwner ? { ...m, name: input.yourName.trim() || m.name } : m
      )
      return {
        ...p,
        name: input.poolName.trim() || p.name,
        ownerName: input.yourName.trim() || p.ownerName,
        members,
      }
    })
    persist()
  }

  function deletePool(id: string) {
    pools.value = pools.value.filter((p) => p.id !== id)
    persist()
  }

  /**
   * Sync the LOCAL user's picks into every pool, from the personal picks map.
   * The local user is the member flagged `isSelf` — for an owned pool that's the
   * owner; for a joined (invite-link) pool that's the invitee's own row. Call
   * this whenever personal picks change so each pool reflects the current
   * selections of whoever is using this device.
   */
  function syncOwnerPicks(personalPicks: Record<string, Pick>) {
    const flat: Record<string, PickOutcome> = {}
    for (const [matchId, pick] of Object.entries(personalPicks)) {
      flat[matchId] = pick.outcome
    }
    let changed = false
    pools.value = pools.value.map((p) => {
      const self = p.members.find((m) => m.isSelf)
      if (!self) return p
      if (JSON.stringify(self.picks) === JSON.stringify(flat)) return p
      changed = true
      return {
        ...p,
        members: p.members.map((m) =>
          m.isSelf ? { ...m, picks: { ...flat } } : m
        ),
      }
    })
    if (changed) persist()
  }

  /**
   * Compute a ranked leaderboard for a pool. A member scores a point for each
   * FINISHED match where their backed OUTCOME ('home' | 'away' | 'draw')
   * matches the actual result. `resolveResult` maps a matchId → the finished
   * outcome (or null if not finished), supplied by the caller from the
   * schedule.
   *
   * Ranking tiebreakers, in order:
   *   1. correct picks (score)        — most right wins
   *   2. accuracy (score / decided)   — better hit-rate breaks ties
   *   3. picks made                   — more skin in the game
   *   4. name (A→Z)                   — stable final tiebreak
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
    // Rank is based on correct-pick count only, so equal scores share a rank.
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
    canCreate,
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
    leaderboard,
  }
}
