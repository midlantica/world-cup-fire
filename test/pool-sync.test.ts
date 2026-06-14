import assert from 'node:assert/strict'
import test from 'node:test'

import {
  addSyncCode,
  consumeSyncCode,
  hashSyncCode,
  MAX_ACTIVE_SYNC_CODES,
} from '../server/utils/pool-sync.ts'
import type { StoredPool } from '../server/utils/pools.ts'

const NOW = Date.parse('2026-06-20T12:00:00Z')

function makePool(): StoredPool {
  return {
    id: 'pool',
    name: 'Pool',
    ownerName: 'Owner',
    createdAt: '2026-06-01T00:00:00Z',
    members: [],
  }
}

test('stores only a digest and consumes a live code once', async () => {
  const pool = makePool()
  const code = 'a'.repeat(64)
  const digest = await hashSyncCode(code)

  addSyncCode(
    pool,
    { digest, expiresAt: new Date(NOW + 60_000).toISOString() },
    NOW
  )

  assert.notEqual(pool.syncCodes?.[0]?.digest, code)
  assert.equal(consumeSyncCode(pool, digest, NOW), true)
  assert.equal(consumeSyncCode(pool, digest, NOW), false)
})

test('rejects expired codes and prunes them', async () => {
  const pool = makePool()
  const digest = await hashSyncCode('b'.repeat(64))
  pool.syncCodes = [{ digest, expiresAt: new Date(NOW - 1).toISOString() }]

  assert.equal(consumeSyncCode(pool, digest, NOW), false)
  assert.deepEqual(pool.syncCodes, [])
})

test('keeps only the newest active sync codes', () => {
  const pool = makePool()
  for (let index = 0; index <= MAX_ACTIVE_SYNC_CODES; index++) {
    addSyncCode(
      pool,
      {
        digest: `digest-${index}`,
        expiresAt: new Date(NOW + 60_000).toISOString(),
      },
      NOW
    )
  }

  assert.equal(pool.syncCodes?.length, MAX_ACTIVE_SYNC_CODES)
  assert.equal(pool.syncCodes?.[0]?.digest, 'digest-1')
})
