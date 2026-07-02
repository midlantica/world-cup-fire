import {
  toPublicPool,
  updatePoolWithRetry,
  type StoredMember,
  type StoredPool,
} from '../../../utils/pools'
import { consumeSyncCode, hashSyncCode } from '../../../utils/pool-sync'
import { assertRateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, 'pool-sync', 10)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }

  const body = await readBody<{ code?: string }>(event)
  const code = (body?.code ?? '').trim()
  if (code.length < 32) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid sync code',
    })
  }

  const digest = await hashSyncCode(code)
  let owner: StoredMember | null = null

  const updated = await updatePoolWithRetry(id, (pool: StoredPool) => {
    if (!consumeSyncCode(pool, digest, Date.now())) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sync code is invalid, expired, or already used',
      })
    }

    owner = pool.members.find((member) => member.isOwner) ?? null
    if (!owner) {
      throw createError({ statusCode: 500, statusMessage: 'Pool has no owner' })
    }
    return pool
  })

  const syncedOwner = owner as StoredMember | null
  if (!syncedOwner) {
    throw createError({ statusCode: 500, statusMessage: 'Sync failed' })
  }

  return {
    pool: await toPublicPool(updated, syncedOwner.id),
    memberId: syncedOwner.id,
    token: syncedOwner.token,
    isOwner: true,
  }
})
