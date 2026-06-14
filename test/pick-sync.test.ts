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

test('never drops existing picks when a full sync omits them', () => {
  // An empty/partial incoming map must never delete a member's stored picks —
  // started OR future. Omission is treated as "no change", not "clear", so a
  // slow or partial sync can never lose honestly-made selections.
  const result = mergePicksForSync(
    { finished: 'home', upcoming: 'away' },
    {},
    kickoffs,
    NOW
  )

  assert.deepEqual(result, { finished: 'home', upcoming: 'away' })
})

test('rejects changes to an existing started pick', () => {
  const result = mergePicksForSync(
    { finished: 'home' },
    { finished: 'away' },
    kickoffs,
    NOW
  )

  assert.deepEqual(result, { finished: 'home' })
})

test('accepts a first-time pick for a started match (recovery of an unsynced pick)', () => {
  // No existing pick for `new-started` — a pick made before kickoff that never
  // reached the server should still be persisted, not silently dropped.
  const result = mergePicksForSync(
    { upcoming: 'home' },
    { 'new-started': 'away' },
    kickoffs,
    NOW
  )

  assert.deepEqual(result, { upcoming: 'home', 'new-started': 'away' })
})

test('accepts a first-time pick for an unknown-kickoff match', () => {
  const result = mergePicksForSync({}, { mystery: 'draw' }, kickoffs, NOW)

  assert.deepEqual(result, { mystery: 'draw' })
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

test('retains existing picks and persists first-time unknown/started picks', () => {
  // `legacy` (existing) is kept; `unknown` and `new-started` are first-time
  // saves with no existing value, so they are persisted (recovery), not dropped.
  const result = mergePicksForSync(
    { legacy: 'draw' },
    { unknown: 'home', 'new-started': 'away' },
    kickoffs,
    NOW
  )

  assert.deepEqual(result, {
    legacy: 'draw',
    unknown: 'home',
    'new-started': 'away',
  })
})
