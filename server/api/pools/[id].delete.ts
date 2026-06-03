// DELETE /api/pools/:id — delete a pool entirely (OWNER ONLY).
//
// Auth via the owner token, passed as the `x-pool-token` header (DELETE has no
// body in some clients) or a `?token=` query param. Returns { ok: true }.

import { readPool, deletePoolBlob } from '../../utils/pools'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }

  const headerToken = getHeader(event, 'x-pool-token')
  const queryToken = getQuery(event).token as string | undefined
  const token = headerToken || queryToken
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const pool = await readPool(id)
  if (!pool) {
    // Already gone — treat as success so the client can clean up locally.
    return { ok: true }
  }

  const owner = pool.members.find((m) => m.isOwner)
  if (!owner || owner.token !== token) {
    throw createError({ statusCode: 403, statusMessage: 'Owner only' })
  }

  await deletePoolBlob(id)
  return { ok: true }
})
