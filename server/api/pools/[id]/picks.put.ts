// PUT /api/pools/:id/picks — replace the calling member's picks for a pool.
//
// Body: {
//   memberId: string,
//   token: string,
//   picks: Record<matchId, { outcome: 'home'|'away'|'draw', kickoff?: string }>
// }
//
// AUTH: the (memberId, token) pair must match a member of the pool. A member may
// only write their OWN picks — the token authorizes exactly one member row.
//
// Picks are stored as-is. The client already enforces the pick window (canPick)
// so we trust the picks that arrive here are legitimate.

import {
  requirePool,
  writePool,
  toPublicPool,
  type PickOutcome,
} from '../../../utils/pools'

interface IncomingPick {
  outcome: PickOutcome
  kickoff?: string
}

const VALID_OUTCOMES: PickOutcome[] = ['home', 'away', 'draw']

export default defineEventHandler(async (event) => {
  const { pool } = await requirePool(event)

  const body = await readBody<{
    memberId?: string
    token?: string
    picks?: Record<string, IncomingPick>
    name?: string
  }>(event)

  const memberId = body?.memberId
  const token = body?.token
  const incoming = body?.picks ?? {}
  const newName = (body?.name ?? '').trim().slice(0, 40)

  if (!memberId || !token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing credentials' })
  }

  const member = pool.members.find((m) => m.id === memberId)
  if (!member || member.token !== token) {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized' })
  }

  const next: Record<string, PickOutcome> = {}

  for (const [matchId, pick] of Object.entries(incoming)) {
    if (!pick || !VALID_OUTCOMES.includes(pick.outcome)) continue
    next[matchId] = pick.outcome
  }

  // Optional name update — any authenticated member may rename themselves.
  if (newName) {
    member.name = newName
    // Keep ownerName in sync if this member is the owner.
    if (member.isOwner) pool.ownerName = newName
  }

  // Only replace picks if the caller actually sent some. An empty incoming
  // picks map (name-only update) means keep existing picks unchanged.
  if (Object.keys(incoming).length > 0) {
    member.picks = next
  }

  await writePool(pool)

  return { pool: toPublicPool(pool) }
})
