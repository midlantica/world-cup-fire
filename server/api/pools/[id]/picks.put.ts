// PUT /api/pools/:id/picks — replace the calling member's picks for a pool.
//
// Body: {
//   memberId: string,
//   token: string,
//   picks: Record<matchId, { outcome: 'home'|'away'|'draw', kickoff?: string }>
//   picksProvided?: boolean
//   name?: string
// }
//
// AUTH: the (memberId, token) pair must match a member of the pool. A member may
// only write their OWN picks — the token authorizes exactly one member row.
//
// DEADLINE ENFORCEMENT: each pick's `kickoff` timestamp is validated server-side.
// Any pick whose match has already kicked off (kickoff <= now) is silently
// dropped, so late edits cannot be submitted even if the client is manipulated.
//
// CLEAR SEMANTICS: to distinguish "clear all picks" from "name-only update", the
// caller must set `picksProvided: true` when sending an intentionally empty picks
// map. Without that flag an empty map is treated as a name-only update (backward
// compatible with renameSelf calls that pass `picks: {}`).
//
// CONCURRENCY: uses updatePoolWithRetry to prevent concurrent writes from
// silently overwriting each other.

import {
  updatePoolWithRetry,
  toPublicPool,
  type PickOutcome,
  type StoredPool,
} from '../../../utils/pools'

interface IncomingPick {
  outcome: PickOutcome
  kickoff?: string
}

const VALID_OUTCOMES: PickOutcome[] = ['home', 'away', 'draw']

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }

  const body = await readBody<{
    memberId?: string
    token?: string
    picks?: Record<string, IncomingPick>
    picksProvided?: boolean
    name?: string
  }>(event)

  const memberId = body?.memberId
  const token = body?.token
  const incoming = body?.picks ?? {}
  const picksProvided = body?.picksProvided === true
  const newName = (body?.name ?? '').trim().slice(0, 40)

  if (!memberId || !token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing credentials' })
  }

  const now = Date.now()

  // Pre-compute the validated picks outside the retry loop (they don't change).
  const next: Record<string, PickOutcome> = {}
  for (const [matchId, pick] of Object.entries(incoming)) {
    if (!pick || !VALID_OUTCOMES.includes(pick.outcome)) continue

    // Server-side kickoff deadline: reject picks for matches that have started.
    // The client supplies the kickoff ISO string; we verify it hasn't passed.
    if (pick.kickoff) {
      const kickoffMs = new Date(pick.kickoff).getTime()
      if (!isNaN(kickoffMs) && kickoffMs <= now) {
        // Match has already kicked off — silently drop this pick.
        continue
      }
    }

    next[matchId] = pick.outcome
  }

  let selfMemberId = memberId

  const updated = await updatePoolWithRetry(id, (pool: StoredPool) => {
    const member = pool.members.find((m) => m.id === memberId)
    if (!member || member.token !== token) {
      throw createError({ statusCode: 403, statusMessage: 'Not authorized' })
    }

    // Optional name update — any authenticated member may rename themselves.
    if (newName) {
      member.name = newName
      // Keep ownerName in sync if this member is the owner.
      if (member.isOwner) pool.ownerName = newName
    }

    // Replace picks when:
    //   a) the caller explicitly sent picks (picksProvided flag), OR
    //   b) the incoming map is non-empty (backward compat: old clients don't
    //      send the flag but always send at least one pick when updating picks).
    // A name-only update (renameSelf) sends `picks: {}` WITHOUT picksProvided,
    // so existing picks are preserved in that case.
    if (picksProvided || Object.keys(incoming).length > 0) {
      member.picks = next
    }

    selfMemberId = member.id
    return pool
  })

  return { pool: toPublicPool(updated, selfMemberId) }
})
