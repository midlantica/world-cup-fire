// PATCH /api/pools/:id — rename the pool / owner (OWNER ONLY).
//
// Body: { token: string, poolName?: string, yourName?: string }
// The token must match the pool's OWNER member. Returns the updated PublicPool.
// Uses updatePoolWithRetry to prevent concurrent writes from overwriting each other.

import {
  updatePoolWithRetry,
  toPublicPool,
  type StoredPool,
} from '../../utils/pools'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }

  const body = await readBody<{
    token?: string
    poolName?: string
    yourName?: string
  }>(event)
  const token = body?.token
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const poolName = (body?.poolName ?? '').trim().slice(0, 50)
  const yourName = (body?.yourName ?? '').trim().slice(0, 40)

  let ownerId = ''

  const updated = await updatePoolWithRetry(id, (pool: StoredPool) => {
    const owner = pool.members.find((m) => m.isOwner)
    if (!owner || owner.token !== token) {
      throw createError({ statusCode: 403, statusMessage: 'Owner only' })
    }

    if (poolName) pool.name = poolName
    if (yourName) {
      owner.name = yourName
      pool.ownerName = yourName
    }

    ownerId = owner.id
    return pool
  })

  return { pool: toPublicPool(updated, ownerId) }
})
