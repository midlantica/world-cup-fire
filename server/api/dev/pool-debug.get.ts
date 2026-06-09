// GET /api/dev/pool-debug?poolId=<id> — temporary debug endpoint
// Returns the raw server state for a pool (pick counts per member)
// DELETE THIS FILE after debugging is done

import { readPool } from '../../utils/pools'

export default defineEventHandler(async (event) => {
  const poolId = getQuery(event).poolId as string
  if (!poolId) return { error: 'missing poolId' }

  const pool = await readPool(poolId)
  if (!pool) return { error: 'pool not found' }

  return {
    poolId: pool.id,
    poolName: pool.name,
    members: pool.members.map((m) => ({
      id: m.id,
      name: m.name,
      isOwner: m.isOwner,
      pickCount: Object.keys(m.picks).length,
      picks: m.picks,
    })),
  }
})
