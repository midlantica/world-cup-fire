import assert from 'node:assert/strict'
import test from 'node:test'

import { filterPoolForViewer } from '../server/utils/pool-visibility.ts'
import type { StoredPool } from '../server/utils/pools.ts'

const NOW = Date.parse('2026-06-20T12:00:00Z')
const kickoffs = new Map([
  ['started', NOW],
  ['future', NOW + 60_000],
])

const pool: StoredPool = {
  id: 'pool',
  name: 'Pool',
  ownerName: 'Owner',
  createdAt: '2026-06-01T00:00:00Z',
  members: [
    {
      id: 'self',
      name: 'Self',
      isOwner: true,
      token: 'self-token',
      picks: { started: 'home', future: 'away', unknown: 'draw' },
    },
    {
      id: 'other',
      name: 'Other',
      isOwner: false,
      token: 'other-token',
      picks: { started: 'away', future: 'home', unknown: 'draw' },
    },
  ],
}

test('reveals all self picks but only started opponent outcomes', () => {
  const result = filterPoolForViewer(pool, 'self', kickoffs, NOW)

  assert.deepEqual(result.members[0]?.picks, {
    started: 'home',
    future: 'away',
    unknown: 'draw',
  })
  assert.deepEqual(result.members[1]?.picks, { started: 'away' })
  assert.equal(result.members[1]?.picksMade, 3)
})

test('public viewers receive only started outcomes and total counts', () => {
  const result = filterPoolForViewer(pool, undefined, kickoffs, NOW)

  assert.deepEqual(result.members[0]?.picks, { started: 'home' })
  assert.deepEqual(result.members[1]?.picks, { started: 'away' })
  assert.equal(result.members[0]?.picksMade, 3)
  assert.equal(result.members[1]?.picksMade, 3)
})

test('an unavailable schedule hides every non-self outcome', () => {
  const result = filterPoolForViewer(pool, 'self', new Map(), NOW)

  assert.deepEqual(result.members[0]?.picks, pool.members[0]?.picks)
  assert.deepEqual(result.members[1]?.picks, {})
})
