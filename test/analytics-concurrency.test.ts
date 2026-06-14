import assert from 'node:assert/strict'
import test from 'node:test'

import { updateWithOptimisticRetry } from '../server/utils/optimistic-update.ts'

interface Counter {
  total: number
}

test('keeps both analytics increments during a write collision', async () => {
  let current: Counter = { total: 0 }
  let revision = 1
  let mutationsReady = 0
  let releaseMutations!: () => void
  const bothMutationsReady = new Promise<void>((resolve) => {
    releaseMutations = resolve
  })

  const read = async () => ({
    value: structuredClone(current),
    revision: String(revision),
  })
  const write = async (counter: Counter, expectedRevision: string) => {
    if (expectedRevision !== String(revision)) return false
    current = structuredClone(counter)
    revision++
    return true
  }
  const increment = () =>
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
      mutate: async (counter) => {
        mutationsReady++
        if (mutationsReady === 2) releaseMutations()
        await bothMutationsReady
        counter.total++
        return counter
      },
    })

  await Promise.all([increment(), increment()])

  assert.equal(current.total, 2)
})
