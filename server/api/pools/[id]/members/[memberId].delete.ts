// DELETE /api/pools/:id/members/:memberId
// Owner-only: remove a member from the pool.
// Requires x-pool-token header matching the owner's token.

import { requirePool, writePool, toPublicPool } from '../../../../utils/pools'

export default defineEventHandler(async (event) => {
  const { pool } = await requirePool(event)

  const memberId = getRouterParam(event, 'memberId')
  if (!memberId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing memberId' })
  }

  // Verify the caller holds the owner token.
  const token = getHeader(event, 'x-pool-token')
  const owner = pool.members.find((m) => m.isOwner)
  if (!owner || owner.token !== token) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // Cannot delete the owner themselves.
  if (memberId === owner.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot remove the pool owner',
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
