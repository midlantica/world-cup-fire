// DELETE /api/pools/:id/members/:memberId
// OWNER ONLY — only the pool owner can remove other members.
// Requires x-pool-token header matching the owner's token.
// The owner cannot remove themselves (use DELETE /api/pools/:id to delete the whole pool).
// Uses updatePoolWithRetry to prevent concurrent writes from overwriting each other.

import {
  updatePoolWithRetry,
  toPublicPool,
  type StoredPool,
} from '../../../../utils/pools'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }

  const memberId = getRouterParam(event, 'memberId')
  if (!memberId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing memberId' })
  }

  // Verify the caller holds the OWNER token for this pool.
  const token = getHeader(event, 'x-pool-token')

  let ownerId = ''

  const updated = await updatePoolWithRetry(id, (pool: StoredPool) => {
    const owner = pool.members.find((m) => m.isOwner)
    if (!owner || owner.token !== token) {
      throw createError({ statusCode: 403, statusMessage: 'Owner only' })
    }

    // The owner cannot remove themselves via this endpoint.
    // Use DELETE /api/pools/:id to delete the entire pool instead.
    if (memberId === owner.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot remove yourself — delete the pool instead',
      })
    }

    const before = pool.members.length
    pool.members = pool.members.filter((m) => m.id !== memberId)

    if (pool.members.length === before) {
      throw createError({ statusCode: 404, statusMessage: 'Member not found' })
    }

    ownerId = owner.id
    return pool
  })

  return { pool: toPublicPool(updated, ownerId) }
})
