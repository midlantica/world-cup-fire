// PUT /api/pools/:id/picks — replace the calling member's picks for a pool.
//
// Body: {
//   memberId: string,
//   token: string,
//   picks: Record<matchId, { outcome: 'home'|'away'|'draw' }>
//   picksProvided?: boolean
//   name?: string
// }
//
// AUTH: the (memberId, token) pair must match a member of the pool. A member may
// only write their OWN picks — the token authorizes exactly one member row.
//
// DEADLINE ENFORCEMENT: kickoff timestamps come from the server-side World Cup
// schedule. Existing picks for started matches are retained and cannot be
// changed or deleted; new picks are accepted only for known future matches.
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
import { mergePicksForSync } from '../../../utils/pick-sync'
import { getWorldCupKickoffs } from '../../../utils/world-cup-schedule'

interface IncomingPick {
  outcome: PickOutcome
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

  // Validate outcomes before entering the retry loop.
  const validatedIncoming: Record<string, PickOutcome> = {}
  for (const [matchId, pick] of Object.entries(incoming)) {
    if (!pick || !VALID_OUTCOMES.includes(pick.outcome)) continue
    validatedIncoming[matchId] = pick.outcome
  }

  let kickoffByMatchId: ReadonlyMap<string, number> | null = null
  if (picksProvided || Object.keys(incoming).length > 0) {
    try {
      kickoffByMatchId = await getWorldCupKickoffs()
    } catch {
      throw createError({
        statusCode: 503,
        statusMessage: 'Unable to verify match deadlines',
      })
    }
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
      member.picks = mergePicksForSync(
        member.picks ?? {},
        validatedIncoming,
        kickoffByMatchId!,
        Date.now()
      )
    }

    selfMemberId = member.id
    return pool
  })

  return { pool: await toPublicPool(updated, selfMemberId) }
})
