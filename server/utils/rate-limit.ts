// Per-IP sliding-window rate limiter for write endpoints.
//
// In-memory, so on serverless each instance gets its own window — this is a
// best-effort abuse brake, not a hard quota. That's fine: the goal is to stop
// a single client from scripting unlimited pool creates / counter inflation.

import type { H3Event } from 'h3'

interface Window {
  timestamps: number[]
}

const buckets = new Map<string, Window>()
const MAX_BUCKETS = 10_000

export function clientIp(event: H3Event): string {
  return (
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ??
    getHeader(event, 'x-real-ip') ??
    'unknown'
  )
}

export function isRateLimited(
  event: H3Event,
  key: string,
  limit: number,
  windowMs = 60_000
): boolean {
  const ip = clientIp(event)
  const bucketKey = `${key}:${ip}`
  const now = Date.now()

  if (buckets.size > MAX_BUCKETS && !buckets.has(bucketKey)) {
    for (const [k, w] of buckets) {
      if ((w.timestamps[w.timestamps.length - 1] ?? 0) < now - windowMs) {
        buckets.delete(k)
      }
    }
  }

  let bucket = buckets.get(bucketKey)
  if (!bucket) {
    bucket = { timestamps: [] }
    buckets.set(bucketKey, bucket)
  }

  bucket.timestamps = bucket.timestamps.filter((t) => t > now - windowMs)
  if (bucket.timestamps.length >= limit) return true

  bucket.timestamps.push(now)
  return false
}

export function assertRateLimit(
  event: H3Event,
  key: string,
  limit: number,
  windowMs = 60_000
): void {
  if (isRateLimited(event, key, limit, windowMs)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests — slow down',
    })
  }
}
