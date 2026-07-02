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
import { assertRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, 'pool-create', 5)

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
  const [publicPool] = await Promise.all([
    toPublicPool(pool, owner.id),
    // The helper catches analytics failures, but awaiting it keeps serverless
    // runtimes alive long enough for successful increments to be persisted.
    incrementPoolsCreated(),
  ])

  return {
    pool: publicPool,
    poolId: pool.id,
    memberId: owner.id,
    token: owner.token,
  }
})
