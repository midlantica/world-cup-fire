import {
  secretToken,
  updatePoolWithRetry,
  type StoredPool,
} from '../../../utils/pools'
import {
  addSyncCode,
  hashSyncCode,
  SYNC_CODE_TTL_MS,
} from '../../../utils/pool-sync'
import { assertRateLimit } from '../../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, 'sync-code', 10)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }

  const token = getHeader(event, 'x-pool-token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const code = secretToken()
  const digest = await hashSyncCode(code)
  const now = Date.now()
  const expiresAt = new Date(now + SYNC_CODE_TTL_MS).toISOString()

  await updatePoolWithRetry(id, (pool: StoredPool) => {
    const owner = pool.members.find((member) => member.isOwner)
    if (!owner || owner.token !== token) {
      throw createError({ statusCode: 403, statusMessage: 'Owner only' })
    }

    addSyncCode(pool, { digest, expiresAt }, now)
    return pool
  })

  return { code, expiresAt }
})
