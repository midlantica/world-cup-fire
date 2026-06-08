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

import {
  requirePool,
  writePool,
  toPublicPool,
  shortId,
  secretToken,
  MAX_MEMBERS,
  type StoredMember,
} from '../../../utils/pools'

export default defineEventHandler(async (event) => {
  const { pool } = await requirePool(event)

  const body = await readBody<{ yourName?: string; token?: string }>(event)
  const yourName = (body?.yourName ?? '').trim().slice(0, 40) || 'You'
  const callerToken = (body?.token ?? '').trim()

  // Re-attach by token: if the caller already holds a valid member token for
  // this pool, return their existing slot. This covers the "rejoining on a new
  // device" case without exposing other members' credentials.
  if (callerToken) {
    const existing = pool.members.find((m) => m.token === callerToken)
    if (existing) {
      return {
        pool: toPublicPool(pool),
        memberId: existing.id,
        token: existing.token,
        isOwner: existing.isOwner,
      }
    }
    // Token supplied but not found — fall through and create a new member slot.
    // (Don't 403 here: the token may be stale from a deleted/recreated pool.)
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
