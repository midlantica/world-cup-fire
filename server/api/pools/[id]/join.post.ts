// POST /api/pools/:id/join — add the caller as a member of a pool (or re-attach
// to an existing member slot using their secret token).
//
// Body: { yourName: string, token?: string }
// Returns: { pool: PublicPool, memberId, token } — the member's secret write
// token (stored client-side). Capped at MAX_MEMBERS.
//
// RE-ATTACH BY TOKEN: if the caller supplies a token that matches an existing
// member, we return that member's credentials (name may have drifted — we use
// the stored name). This lets someone who created/joined a pool in another
// browser (or after clearing storage / in incognito) "rejoin" their OWN slot
// from the invite link without spawning a second copy of themselves.
//
// NOTE: re-attach by name alone was removed — it allowed name-squatting where
// any user could claim another member's token just by knowing their display name.
//
// CONCURRENCY: uses updatePoolWithRetry for the member-add path to prevent
// concurrent joins from overwriting each other.

import {
  readPool,
  updatePoolWithRetry,
  toPublicPool,
  shortId,
  secretToken,
  MAX_MEMBERS,
  type StoredMember,
  type StoredPool,
} from '../../../utils/pools'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing pool id' })
  }

  const body = await readBody<{ yourName?: string; token?: string }>(event)
  const yourName = (body?.yourName ?? '').trim().slice(0, 40) || 'You'
  const callerToken = (body?.token ?? '').trim()

  // Re-attach by token: if the caller already holds a valid member token for
  // this pool, return their existing slot. This covers the "rejoining on a new
  // device" case without exposing other members' credentials.
  // This is a read-only path — no write needed, so no retry required.
  if (callerToken) {
    const pool = await readPool(id)
    if (!pool) {
      throw createError({ statusCode: 404, statusMessage: 'Pool not found' })
    }
    const existing = pool.members.find((m) => m.token === callerToken)
    if (existing) {
      return {
        pool: toPublicPool(pool, existing.id),
        memberId: existing.id,
        token: existing.token,
        isOwner: existing.isOwner,
      }
    }
    // Token supplied but not found — fall through and create a new member slot.
    // (Don't 403 here: the token may be stale from a deleted/recreated pool.)
  }

  let newMember: StoredMember | null = null

  const updated = await updatePoolWithRetry(id, (pool: StoredPool) => {
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
    newMember = member
    return pool
  })

  if (!newMember) {
    throw createError({ statusCode: 500, statusMessage: 'Join failed' })
  }

  return {
    pool: toPublicPool(updated, (newMember as StoredMember).id),
    memberId: (newMember as StoredMember).id,
    token: (newMember as StoredMember).token,
  }
})
