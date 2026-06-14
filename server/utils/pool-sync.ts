import type { StoredPool } from './pools'

export interface StoredSyncCode {
  digest: string
  expiresAt: string
}

export const SYNC_CODE_TTL_MS = 10 * 60 * 1000
export const MAX_ACTIVE_SYNC_CODES = 5

export async function hashSyncCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function addSyncCode(
  pool: StoredPool,
  code: StoredSyncCode,
  now: number
): void {
  const live = (pool.syncCodes ?? []).filter(
    (entry) => Date.parse(entry.expiresAt) > now
  )
  pool.syncCodes = [...live, code].slice(-MAX_ACTIVE_SYNC_CODES)
}

export function consumeSyncCode(
  pool: StoredPool,
  digest: string,
  now: number
): boolean {
  let matched = false
  pool.syncCodes = (pool.syncCodes ?? []).filter((entry) => {
    const live = Date.parse(entry.expiresAt) > now
    if (live && entry.digest === digest && !matched) {
      matched = true
      return false
    }
    return live
  })
  return matched
}
