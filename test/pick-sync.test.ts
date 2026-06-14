import assert from 'node:assert/strict'
import test from 'node:test'

import { mergePicksForSync } from '../server/utils/pick-sync.ts'

const NOW = Date.parse('2026-06-20T12:00:00Z')
const kickoffs = new Map([
  ['finished', NOW - 1],
  ['upcoming', NOW + 1],
  ['new-upcoming', NOW + 60_000],
  ['new-started', NOW],
])

test('preserves a started pick when a full sync omits it', () => {
  const result = mergePicksForSync(
    { finished: 'home', upcoming: 'away' },
    {},
    kickoffs,
    NOW
  )

  assert.deepEqual(result, { finished: 'home' })
})

test('rejects changes to a started pick', () => {
  const result = mergePicksForSync(
    { finished: 'home' },
    { finished: 'away' },
    kickoffs,
    NOW
  )

  assert.deepEqual(result, { finished: 'home' })
})

test('replaces upcoming picks and accepts new future picks', () => {
  const result = mergePicksForSync(
    { upcoming: 'home' },
    { upcoming: 'draw', 'new-upcoming': 'away' },
    kickoffs,
    NOW
  )

  assert.deepEqual(result, { upcoming: 'draw', 'new-upcoming': 'away' })
})

test('retains unknown existing picks but rejects unknown or started new picks', () => {
  const result = mergePicksForSync(
    { legacy: 'draw' },
    { unknown: 'home', 'new-started': 'away' },
    kickoffs,
    NOW
  )

  assert.deepEqual(result, { legacy: 'draw' })
})
