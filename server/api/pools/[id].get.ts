// GET /api/pools/:id — read a pool's public record (for the leaderboard).
//
// Returns the token-free PublicPool so the invite link is shareable. 404 when the
// pool doesn't exist (e.g. deleted by the owner).

import { readPool, toPublicPool } from '../../utils/pools'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }

  const pool = await readPool(id)
  if (!pool) {
    throw createError({ statusCode: 404, statusMessage: 'Pool not found' })
  }

  return { pool: toPublicPool(pool) }
})
