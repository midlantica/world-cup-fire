import assert from 'node:assert/strict'
import test from 'node:test'

import {
  updateWithOptimisticRetry,
  type VersionedValue,
} from '../server/utils/optimistic-update.ts'

interface TestPool {
  version: number
  picks: Record<string, string>
}

function clone(pool: TestPool): TestPool {
  return structuredClone(pool)
}

function makeTestStore(initial: TestPool): {
  read: () => Promise<VersionedValue<TestPool>>
  write: (pool: TestPool, revision: string) => Promise<boolean>
  readCurrent: () => TestPool
  conflicts: () => number
} {
  let current = clone(initial)
  let revision = 1
  let conflictCount = 0

  return {
    async read() {
      return { value: clone(current), revision: String(revision) }
    },
    async write(pool, expectedRevision) {
      if (expectedRevision !== String(revision)) {
        conflictCount++
        return false
      }
      current = clone(pool)
      revision++
      return true
    },
    readCurrent: () => clone(current),
    conflicts: () => conflictCount,
  }
}

const initialPool: TestPool = {
  version: 1,
  picks: {},
}

test('reapplies a losing concurrent mutation to the winning revision', async () => {
  const { read, write, readCurrent, conflicts } = makeTestStore(initialPool)
  let mutationsReady = 0
  let releaseMutations!: () => void
  const bothMutationsReady = new Promise<void>((resolve) => {
    releaseMutations = resolve
  })

  async function waitForFirstCollision() {
    mutationsReady++
    if (mutationsReady === 2) releaseMutations()
    await bothMutationsReady
  }

  await Promise.all([
    updateWithOptimisticRetry({
      read,
      write,
      retryDelay: async () => {},
      onMissing: () => {
        throw new Error('missing')
      },
      onConflict: () => {
        throw new Error('conflict')
      },
      mutate: async (pool) => {
        await waitForFirstCollision()
        pool.picks.match1 = 'home'
        pool.version++
        return pool
      },
    }),
    updateWithOptimisticRetry({
      read,
      write,
      retryDelay: async () => {},
      onMissing: () => {
        throw new Error('missing')
      },
      onConflict: () => {
        throw new Error('conflict')
      },
      mutate: async (pool) => {
        await waitForFirstCollision()
        pool.picks.match2 = 'away'
        pool.version++
        return pool
      },
    }),
  ])

  const saved = readCurrent()
  assert.deepEqual(saved.picks, { match1: 'home', match2: 'away' })
  assert.equal(saved.version, 3)
  assert.equal(conflicts(), 1)
})
