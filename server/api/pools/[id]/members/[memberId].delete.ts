// DELETE /api/pools/:id/members/:memberId
// Any pool member can remove another member (but not themselves).
// Requires x-pool-token header matching any valid member token.

import { requirePool, writePool, toPublicPool } from '../../../../utils/pools'

export default defineEventHandler(async (event) => {
  const { pool } = await requirePool(event)

  const memberId = getRouterParam(event, 'memberId')
  if (!memberId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing memberId' })
  }

  // Verify the caller holds a valid token for ANY member of this pool.
  const token = getHeader(event, 'x-pool-token')
  const caller = pool.members.find((m) => m.token === token)
  if (!caller) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // A member cannot delete themselves.
  if (memberId === caller.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot remove yourself',
    })
  }

  const before = pool.members.length
  pool.members = pool.members.filter((m) => m.id !== memberId)

  if (pool.members.length === before) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' })
  }

  await writePool(pool)
  return { pool: toPublicPool(pool) }
})
