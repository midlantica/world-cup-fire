import assert from 'node:assert/strict'
import test from 'node:test'

import { filterPoolForViewer } from '../server/utils/pool-visibility.ts'
import type { StoredPool } from '../server/utils/pools.ts'

const NOW = Date.parse('2026-06-20T12:00:00Z')

// Real group-stage ESPN match IDs (760414–760485) — picksMade only counts these.
const STARTED = '760414'
const FUTURE = '760415'
const UNKNOWN = '760416'
// A knockout-range ID: visible when started, but excluded from picksMade.
const KNOCKOUT = '760486'

const kickoffs = new Map([
  [STARTED, NOW],
  [FUTURE, NOW + 60_000],
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
      picks: { [STARTED]: 'home', [FUTURE]: 'away', [UNKNOWN]: 'draw' },
    },
    {
      id: 'other',
      name: 'Other',
      isOwner: false,
      token: 'other-token',
      picks: { [STARTED]: 'away', [FUTURE]: 'home', [UNKNOWN]: 'draw' },
    },
  ],
}

test('reveals all self picks but only started opponent outcomes', () => {
  const result = filterPoolForViewer(pool, 'self', kickoffs, NOW)

  assert.deepEqual(result.members[0]?.picks, {
    [STARTED]: 'home',
    [FUTURE]: 'away',
    [UNKNOWN]: 'draw',
  })
  assert.deepEqual(result.members[1]?.picks, { [STARTED]: 'away' })
  assert.equal(result.members[1]?.picksMade, 3)
})

test('public viewers receive only started outcomes and total counts', () => {
  const result = filterPoolForViewer(pool, undefined, kickoffs, NOW)

  assert.deepEqual(result.members[0]?.picks, { [STARTED]: 'home' })
  assert.deepEqual(result.members[1]?.picks, { [STARTED]: 'away' })
  assert.equal(result.members[0]?.picksMade, 3)
  assert.equal(result.members[1]?.picksMade, 3)
})

test('an unavailable schedule hides every non-self outcome', () => {
  const result = filterPoolForViewer(pool, 'self', new Map(), NOW)

  assert.deepEqual(result.members[0]?.picks, pool.members[0]?.picks)
  assert.deepEqual(result.members[1]?.picks, {})
})

test('knockout picks never count toward picksMade', () => {
  const knockoutPool: StoredPool = {
    ...pool,
    members: [
      {
        id: 'self',
        name: 'Self',
        isOwner: true,
        token: 'self-token',
        picks: { [STARTED]: 'home', [KNOCKOUT]: 'away' },
      },
    ],
  }
  const result = filterPoolForViewer(knockoutPool, 'self', kickoffs, NOW)

  assert.equal(result.members[0]?.picksMade, 1)
})
