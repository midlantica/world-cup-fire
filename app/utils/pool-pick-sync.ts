import type { Pick as UserPick, PickOutcome } from '../composables/usePicks'

const LOCAL_WRITE_GRACE_MS = 5_000
/** How long a cleared pick is protected from being re-added by a server sync. */
const CLEAR_GRACE_MS = 30_000

const CLEARED_KEY = 'wc-picks-cleared-v1'

/** Record that a pick was intentionally cleared by the user right now. */
export function recordClearedPick(matchId: string, now = Date.now()): void {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(CLEARED_KEY)
    const map: Record<string, number> = raw ? JSON.parse(raw) : {}
    map[matchId] = now
    // Prune stale entries while we're here
    for (const [id, ts] of Object.entries(map)) {
      if (now - ts > CLEAR_GRACE_MS) delete map[id]
    }
    localStorage.setItem(CLEARED_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

/** Load the cleared-picks registry from localStorage. */
export function loadClearedPicks(now = Date.now()): Record<string, number> {
  if (!import.meta.client) return {}
  try {
    const raw = localStorage.getItem(CLEARED_KEY)
    if (!raw) return {}
    const map: Record<string, number> = JSON.parse(raw)
    // Return only entries still within the grace window
    const active: Record<string, number> = {}
    for (const [id, ts] of Object.entries(map)) {
      if (now - ts <= CLEAR_GRACE_MS) active[id] = ts
    }
    return active
  } catch {
    return {}
  }
}

function teamForOutcome(pick: UserPick, outcome: PickOutcome): string {
  if (outcome === 'draw') return ''
  if (outcome === 'home') return pick.match.home || '__home__'
  return pick.match.away || '__away__'
}

/**
 * Reconcile the server's complete pick map into local storage.
 *
 * Picks omitted by the server are removed only when their locally-known
 * kickoff is still in the future. Historical and unknown-date picks are kept
 * because deleting them would be irreversible. Very recent local writes are
 * also kept so an older in-flight refresh cannot erase a click before its
 * debounced server sync completes.
 *
 * Picks that were recently cleared by the user (tracked in `recentlyCleared`)
 * are never re-added from the server — this prevents the server's stale copy
 * from overwriting an intentional de-selection before the sync has propagated.
 */
export function reconcileServerPicks(
  serverPicks: Record<string, PickOutcome>,
  localPicks: Record<string, UserPick>,
  now = Date.now(),
  recentlyCleared: Record<string, number> = loadClearedPicks(now)
): Record<string, UserPick> {
  let changed = false
  const reconciled: Record<string, UserPick> = { ...localPicks }

  for (const [matchId, pick] of Object.entries(localPicks)) {
    if (matchId in serverPicks) continue

    const kickoff = new Date(pick.match.date).getTime()
    const pickedAt = new Date(pick.pickedAt).getTime()
    const isRecentLocalWrite =
      Number.isFinite(pickedAt) && now - pickedAt < LOCAL_WRITE_GRACE_MS

    if (Number.isFinite(kickoff) && kickoff > now && !isRecentLocalWrite) {
      delete reconciled[matchId]
      changed = true
    }
  }

  for (const [matchId, outcome] of Object.entries(serverPicks)) {
    const local = reconciled[matchId]
    if (local) {
      if (local.outcome !== outcome) {
        reconciled[matchId] = {
          ...local,
          outcome,
          team: teamForOutcome(local, outcome),
        }
        changed = true
      }
      continue
    }

    // Don't re-add a pick the user just intentionally cleared — the server
    // still has the old value because the deletion sync hasn't propagated yet.
    const clearedAt = recentlyCleared[matchId]
    if (clearedAt !== undefined && now - clearedAt <= CLEAR_GRACE_MS) {
      continue
    }

    changed = true
    reconciled[matchId] = {
      matchId,
      team:
        outcome === 'home' ? '__home__' : outcome === 'away' ? '__away__' : '',
      outcome,
      pickedAt: new Date(now).toISOString(),
      // The real match snapshot replaces this when its MatchCard renders.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      match: {
        id: matchId,
        home: '',
        away: '',
        date: '',
        status: { code: 'ns' as const },
        group: null,
        homeScore: null,
        awayScore: null,
        venue: '',
        round: '',
      } as any,
    }
  }

  return changed ? reconciled : localPicks
}
