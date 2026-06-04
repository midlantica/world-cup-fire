// POST /api/pools/:id/join — add the caller as a member of a pool (or re-attach
// to an existing member that shares their name).
//
// Body: { yourName: string }
// Returns: { pool: PublicPool, memberId, token } — the member's secret write
// token (stored client-side). Capped at MAX_MEMBERS.
//
// RE-ATTACH BY NAME: if a member with the SAME (case-insensitive) name already
// exists in the pool, we return that member's existing id + token instead of
// creating a duplicate row. This is what lets someone who created/joined a pool
// in another browser (or after clearing storage / in incognito) "rejoin" their
// OWN pool from the invite link without spawning a second copy of themselves —
// e.g. the owner re-opening their own share link on a different device.

import {
  readPool,
  writePool,
  toPublicPool,
  shortId,
  secretToken,
  MAX_MEMBERS,
  type StoredMember,
} from '../../../utils/pools'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }

  const body = await readBody<{ yourName?: string }>(event)
  const yourName = (body?.yourName ?? '').trim().slice(0, 40) || 'You'

  const pool = await readPool(id)
  if (!pool) {
    throw createError({ statusCode: 404, statusMessage: 'Pool not found' })
  }

  // Re-attach by name: if a member with this name already exists, hand back its
  // existing credentials instead of creating a duplicate. Lets the owner (or any
  // member) rejoin their own pool from the link on a new device / browser.
  const existing = pool.members.find(
    (m) => m.name.trim().toLowerCase() === yourName.toLowerCase()
  )
  if (existing) {
    return {
      pool: toPublicPool(pool),
      memberId: existing.id,
      token: existing.token,
      isOwner: existing.isOwner,
    }
  }

  if (pool.members.length >= MAX_MEMBERS) {
    throw createError({ statusCode: 409, statusMessage: 'Pool is full' })
  }

  const member: StoredMember = {
    id: shortId(6),
    name: yourName,
    isOwner: false,
    token: secretToken(),
    picks: {},
  }

  pool.members.push(member)
  await writePool(pool)

  return {
    pool: toPublicPool(pool),
    memberId: member.id,
    token: member.token,
  }
})
