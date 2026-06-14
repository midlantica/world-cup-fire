// GET /api/pools/:id — read a pool's public record (for the leaderboard).
//
// Returns the token-free PublicPool so the invite link is shareable. 404 when the
// pool doesn't exist (e.g. deleted by the owner).

import { requirePool, toPublicPool } from '../../utils/pools'

export default defineEventHandler(async (event) => {
  const { pool } = await requirePool(event)
  const token = getHeader(event, 'x-pool-token')
  const selfMemberId = token
    ? pool.members.find((member) => member.token === token)?.id
    : undefined
  return { pool: await toPublicPool(pool, selfMemberId) }
})
