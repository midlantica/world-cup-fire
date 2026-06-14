import type { Pick as UserPick, PickOutcome } from '../composables/usePicks'

const LOCAL_WRITE_GRACE_MS = 5_000

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
 */
export function reconcileServerPicks(
  serverPicks: Record<string, PickOutcome>,
  localPicks: Record<string, UserPick>,
  now = Date.now()
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
