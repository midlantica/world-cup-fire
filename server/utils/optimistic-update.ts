export interface VersionedValue<T, Revision = string> {
  value: T
  revision: Revision
}

interface OptimisticUpdateOptions<T, Revision> {
  read: () => Promise<VersionedValue<T, Revision> | null>
  mutate: (value: T) => T | Promise<T>
  write: (value: T, revision: Revision) => Promise<boolean>
  onMissing: () => never
  onConflict: () => never
  maxRetries?: number
  retryDelay?: () => Promise<void>
}

function defaultRetryDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 60))
}

/**
 * Reapply a read-modify-write mutation until its conditional write succeeds.
 * The store must atomically reject `write` when `revision` is no longer current.
 */
export async function updateWithOptimisticRetry<T, Revision = string>({
  read,
  mutate,
  write,
  onMissing,
  onConflict,
  maxRetries = 3,
  retryDelay = defaultRetryDelay,
}: OptimisticUpdateOptions<T, Revision>): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const snapshot = await read()
    if (!snapshot) return onMissing()

    const updated = await mutate(snapshot.value)
    if (await write(updated, snapshot.revision)) return updated

    if (attempt < maxRetries) await retryDelay()
  }

  return onConflict()
}
