// POST /api/analytics/pageview
// Records a single pageview. Called by useAnalytics.trackPageview().
// Fire-and-forget from the client — always returns 204.

import { recordPageview, hashFingerprint } from '../../utils/analytics'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ path?: string; sessionId?: string }>(event)
    const path = (body?.path ?? '/').slice(0, 200)
    const sessionId = (body?.sessionId ?? 'unknown').slice(0, 64)

    // Build a privacy-safe visitor fingerprint: hash of IP + User-Agent.
    // We never store the raw IP or UA.
    const ip =
      getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ??
      getHeader(event, 'x-real-ip') ??
      'unknown'
    const ua = getHeader(event, 'user-agent') ?? ''
    const visitorHash = await hashFingerprint(ip, ua)

    await recordPageview(path, visitorHash, sessionId)
  } catch (e) {
    // Never let analytics errors surface to the client
    console.error('[analytics] pageview error:', e)
  }

  setResponseStatus(event, 204)
  return null
})
