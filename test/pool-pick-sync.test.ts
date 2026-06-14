import assert from 'node:assert/strict'
import test from 'node:test'

import type { Pick } from '../app/composables/usePicks.ts'
import { reconcileServerPicks } from '../app/utils/pool-pick-sync.ts'

const NOW = Date.parse('2026-06-20T12:00:00Z')

function makePick(
  matchId: string,
  date: string,
  pickedAt = '2026-06-19T12:00:00Z'
): Pick {
  return {
    matchId,
    team: 'Home Team',
    outcome: 'home',
    pickedAt,
    match: {
      id: matchId,
      home: 'Home Team',
      away: 'Away Team',
      date,
      status: { code: 'ns' },
      group: 'A',
      homeScore: null,
      awayScore: null,
      venue: '',
      round: '',
    },
  }
}

test('removes an upcoming local pick omitted by the server', () => {
  const local = {
    upcoming: makePick('upcoming', '2026-06-21T12:00:00Z'),
  }

  assert.deepEqual(reconcileServerPicks({}, local, NOW), {})
})

test('preserves historical and unknown-date local picks omitted by the server', () => {
  const local = {
    historical: makePick('historical', '2026-06-19T12:00:00Z'),
    unknown: makePick('unknown', ''),
  }

  assert.deepEqual(reconcileServerPicks({}, local, NOW), local)
})

test('preserves a recent local write while its server sync may be in flight', () => {
  const local = {
    recent: makePick(
      'recent',
      '2026-06-21T12:00:00Z',
      new Date(NOW - 1_000).toISOString()
    ),
  }

  assert.strictEqual(reconcileServerPicks({}, local, NOW), local)
})

test('applies server additions and outcome changes', () => {
  const local = {
    changed: makePick('changed', '2026-06-21T12:00:00Z'),
  }

  const result = reconcileServerPicks(
    { changed: 'away', added: 'draw' },
    local,
    NOW
  )

  assert.equal(result.changed?.outcome, 'away')
  assert.equal(result.changed?.team, 'Away Team')
  assert.equal(result.added?.outcome, 'draw')
  assert.equal(result.added?.match.id, 'added')
})
