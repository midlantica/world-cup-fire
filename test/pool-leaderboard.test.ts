import assert from 'node:assert/strict'
import test from 'node:test'

import { rankPoolMembers } from '../app/utils/pool-leaderboard.ts'

test('scores self and other members from their server pick maps', () => {
  const rows = rankPoolMembers(
    [
      {
        id: 'self',
        name: 'Self',
        isSelf: true,
        picks: { match: 'away' },
      },
      {
        id: 'other',
        name: 'Other',
        picks: { match: 'home' },
        picksMade: 4,
      },
    ],
    () => 'home'
  )

  assert.deepEqual(
    rows.map((row) => ({
      id: row.memberId,
      score: row.score,
      picksMade: row.picksMade,
      rank: row.rank,
    })),
    [
      { id: 'other', score: 1, picksMade: 4, rank: 1 },
      { id: 'self', score: 0, picksMade: 1, rank: 2 },
    ]
  )
})

test('keeps existing score, accuracy, and picks-made tie breakers', () => {
  const results: Record<string, 'home' | 'away'> = {
    one: 'home',
    two: 'away',
  }
  const rows = rankPoolMembers(
    [
      {
        id: 'alpha',
        name: 'Alpha',
        picks: { one: 'home', two: 'home', upcoming: 'draw' },
      },
      {
        id: 'beta',
        name: 'Beta',
        picks: { one: 'home' },
      },
    ],
    (matchId) => results[matchId] ?? null
  )

  assert.equal(rows[0]?.memberId, 'beta')
  assert.equal(rows[0]?.accuracy, 1)
  assert.equal(rows[1]?.accuracy, 0.5)
})

test('uses the total pick count when future outcomes are hidden', () => {
  const rows = rankPoolMembers(
    [
      { id: 'more', name: 'More', picks: {}, picksMade: 4 },
      { id: 'fewer', name: 'Fewer', picks: {}, picksMade: 2 },
    ],
    () => null
  )

  assert.equal(rows[0]?.memberId, 'more')
  assert.equal(rows[0]?.picksMade, 4)
})
