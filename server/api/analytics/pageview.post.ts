// POST /api/analytics/pageview
// Records a single pageview. Called by useAnalytics.trackPageview().
// Fire-and-forget from the client — always returns 204.
//
// IP exclusion: set ANALYTICS_EXCLUDE_IPS in your Netlify env vars as a
// comma-separated list of IPs to ignore (e.g. your home/office IP).

import { recordPageview, hashFingerprint } from '../../utils/analytics'
import { isRateLimited } from '../../utils/rate-limit'

function getExcludedIps(): Set<string> {
  const env =
    (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process?.env ?? {}
  const ips = (env.ANALYTICS_EXCLUDE_IPS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return new Set(ips)
}

export default defineEventHandler(async (event) => {
  // Fire-and-forget endpoint: drop over-limit hits silently (still 204)
  // rather than surfacing a 429 to the client.
  if (isRateLimited(event, 'pageview', 60)) {
    setResponseStatus(event, 204)
    return null
  }

  try {
    const body = await readBody<{ path?: string; sessionId?: string }>(event)
    const path = (body?.path ?? '/').slice(0, 200)
    const sessionId = (body?.sessionId ?? 'unknown').slice(0, 64)

    // Resolve the real client IP
    const ip =
      getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ??
      getHeader(event, 'x-real-ip') ??
      'unknown'

    // Drop hits from excluded IPs (owner, office, etc.)
    if (getExcludedIps().has(ip)) {
      setResponseStatus(event, 204)
      return null
    }

    // Build a privacy-safe visitor fingerprint: hash of IP + User-Agent.
    // We never store the raw IP or UA.
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
