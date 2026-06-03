// PATCH /api/pools/:id — rename the pool / owner (OWNER ONLY).
//
// Body: { token: string, poolName?: string, yourName?: string }
// The token must match the pool's OWNER member. Returns the updated PublicPool.

import { readPool, writePool, toPublicPool } from '../../utils/pools'

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

  const pool = await readPool(id)
  if (!pool) {
    throw createError({ statusCode: 404, statusMessage: 'Pool not found' })
  }

  const owner = pool.members.find((m) => m.isOwner)
  if (!owner || owner.token !== token) {
    throw createError({ statusCode: 403, statusMessage: 'Owner only' })
  }

  const poolName = (body?.poolName ?? '').trim().slice(0, 50)
  const yourName = (body?.yourName ?? '').trim().slice(0, 40)
  if (poolName) pool.name = poolName
  if (yourName) {
    owner.name = yourName
    pool.ownerName = yourName
  }

  await writePool(pool)
  return { pool: toPublicPool(pool) }
})
