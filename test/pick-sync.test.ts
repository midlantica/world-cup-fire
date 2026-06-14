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

test('never drops existing picks when isFullReplacement is false (default)', () => {
  // Without the full-replacement flag, omission is treated as "no change" —
  // a slow or partial sync can never lose honestly-made selections.
  const result = mergePicksForSync(
    { finished: 'home', upcoming: 'away' },
    {},
    kickoffs,
    NOW
    // isFullReplacement defaults to false
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

// ── isFullReplacement = true (client sends complete picks snapshot) ──────────

test('full replacement: removes a future pick absent from incoming (clear)', () => {
  // The user cleared their pick for `upcoming`. The client sends a full snapshot
  // without it. The server should remove it.
  const result = mergePicksForSync(
    { upcoming: 'home', finished: 'away' },
    { finished: 'away' }, // `upcoming` intentionally absent
    kickoffs,
    NOW,
    true // isFullReplacement
  )

  // `upcoming` (future) is removed; `finished` (started) is kept
  assert.deepEqual(result, { finished: 'away' })
})

test('full replacement: retains started picks even when absent from incoming', () => {
  // Started picks are locked — they cannot be cleared even in full-replacement mode.
  const result = mergePicksForSync(
    { finished: 'home', upcoming: 'away' },
    {}, // both absent from incoming
    kickoffs,
    NOW,
    true // isFullReplacement
  )

  // `finished` (started) is kept; `upcoming` (future) is removed
  assert.deepEqual(result, { finished: 'home' })
})

test('full replacement: retains unknown-kickoff picks when absent from incoming', () => {
  // Unknown-kickoff picks are treated like started picks — kept to avoid
  // irreversible data loss when the schedule doesn't have the match.
  const result = mergePicksForSync(
    { mystery: 'draw', upcoming: 'home' },
    {}, // both absent
    kickoffs,
    NOW,
    true // isFullReplacement
  )

  // `mystery` (unknown kickoff) is kept; `upcoming` (future) is removed
  assert.deepEqual(result, { mystery: 'draw' })
})
