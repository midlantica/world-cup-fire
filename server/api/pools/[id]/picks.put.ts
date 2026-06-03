// PUT /api/pools/:id/picks — replace the calling member's picks for a pool.
//
// Body: {
//   memberId: string,
//   token: string,
//   picks: Record<matchId, { outcome: 'home'|'away'|'draw', kickoff: string }>
// }
//
// AUTH: the (memberId, token) pair must match a member of the pool. A member may
// only write their OWN picks — the token authorizes exactly one member row.
//
// KICKOFF RE-VALIDATION: each incoming pick carries the match's kickoff ISO time
// (from the client's match snapshot). Picks whose kickoff is already in the past
// are rejected for NEW/CHANGED selections, so a member can't add or alter a pick
// after a match has begun. Existing stored picks for started matches are kept
// as-is (we never silently drop a previously-made pick).

import {
  readPool,
  writePool,
  toPublicPool,
  type PickOutcome,
} from '../../../utils/pools'

interface IncomingPick {
  outcome: PickOutcome
  kickoff: string
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
  }>(event)

  const memberId = body?.memberId
  const token = body?.token
  const incoming = body?.picks ?? {}

  if (!memberId || !token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing credentials' })
  }

  const pool = await readPool(id)
  if (!pool) {
    throw createError({ statusCode: 404, statusMessage: 'Pool not found' })
  }

  const member = pool.members.find((m) => m.id === memberId)
  if (!member || member.token !== token) {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized' })
  }

  const now = Date.now()
  const next: Record<string, PickOutcome> = {}

  for (const [matchId, pick] of Object.entries(incoming)) {
    if (!pick || !VALID_OUTCOMES.includes(pick.outcome)) continue
    const kickoff = new Date(pick.kickoff).getTime()
    const started = !Number.isNaN(kickoff) && kickoff <= now

    if (started) {
      // Match already kicked off — only honour a pick that was ALREADY stored
      // (unchanged). Reject brand-new or altered late picks.
      const existing = member.picks[matchId]
      if (existing !== undefined) next[matchId] = existing
      // (if no prior pick, the late pick is dropped silently)
    } else {
      next[matchId] = pick.outcome
    }
  }

  member.picks = next
  await writePool(pool)

  return { pool: toPublicPool(pool) }
})
