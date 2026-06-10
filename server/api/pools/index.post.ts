// POST /api/pools — create a new pool owned by the caller.
//
// Body: { yourName: string, poolName: string }
// Returns: { pool: PublicPool, poolId, memberId, token } — the token is the
// owner's secret (stored client-side); it's NOT part of the public pool.

import {
  shortId,
  secretToken,
  writePool,
  toPublicPool,
  type StoredPool,
  type StoredMember,
} from '../../utils/pools'
import { incrementPoolsCreated } from '../../utils/analytics'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ yourName?: string; poolName?: string }>(event)
  const yourName = (body?.yourName ?? '').trim().slice(0, 40) || 'You'
  const poolName = (body?.poolName ?? '').trim().slice(0, 50) || 'My Pool'

  const owner: StoredMember = {
    id: shortId(6),
    name: yourName,
    isOwner: true,
    token: secretToken(),
    picks: {},
  }

  const pool: StoredPool = {
    id: shortId(10),
    name: poolName,
    ownerName: owner.name,
    createdAt: new Date().toISOString(),
    members: [owner],
  }

  await writePool(pool)
  // Fire-and-forget — a counter failure must never block pool creation.
  incrementPoolsCreated().catch(() => {})

  return {
    pool: toPublicPool(pool, owner.id),
    poolId: pool.id,
    memberId: owner.id,
    token: owner.token,
  }
})
