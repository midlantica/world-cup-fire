// POST /api/pools/:id/join — add the caller as a new member of a pool.
//
// Body: { yourName: string }
// Returns: { pool: PublicPool, memberId, token } — the member's secret write
// token (stored client-side). Capped at MAX_MEMBERS. If the same person re-opens
// the link they'll just get a NEW member row unless the client already holds a
// token for this pool (the client checks that before calling join).

import {
  readPool,
  writePool,
  toPublicPool,
  shortId,
  secretToken,
  MAX_MEMBERS,
  type StoredMember,
} from '../../../utils/pools'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }

  const body = await readBody<{ yourName?: string }>(event)
  const yourName = (body?.yourName ?? '').trim().slice(0, 40) || 'You'

  const pool = await readPool(id)
  if (!pool) {
    throw createError({ statusCode: 404, statusMessage: 'Pool not found' })
  }

  if (pool.members.length >= MAX_MEMBERS) {
    throw createError({ statusCode: 409, statusMessage: 'Pool is full' })
  }

  const member: StoredMember = {
    id: shortId(6),
    name: yourName,
    isOwner: false,
    token: secretToken(),
    picks: {},
  }

  pool.members.push(member)
  await writePool(pool)

  return {
    pool: toPublicPool(pool),
    memberId: member.id,
    token: member.token,
  }
})
