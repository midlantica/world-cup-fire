import type { PickOutcome } from './pools'

/**
 * Apply a full picks sync without allowing a LOCKED pick to be changed.
 *
 * The only thing kickoff actually protects is mutation: a pick that was already
 * stored for a started match cannot be altered. Everything else is allowed so a
 * member's honestly-made selections are never lost to a slow or partial sync:
 *
 *   • Existing picks are always retained (started or not, known kickoff or not).
 *   • An incoming pick for a FUTURE match is accepted (normal case).
 *   • An incoming pick for a started/unknown match is accepted ONLY when there
 *     is no existing pick for it yet — i.e. first-time persistence / recovery of
 *     a pick that simply never reached the server before kickoff. If a pick
 *     already exists for a started match, the incoming value is ignored so the
 *     locked selection can't be changed after the fact.
 */
export function mergePicksForSync(
  existing: Record<string, PickOutcome>,
  incoming: Record<string, PickOutcome>,
  kickoffByMatchId: ReadonlyMap<string, number>,
  now: number
): Record<string, PickOutcome> {
  // Start from every existing pick — we never drop a stored selection.
  const next: Record<string, PickOutcome> = { ...existing }

  for (const [matchId, outcome] of Object.entries(incoming)) {
    const kickoff = kickoffByMatchId.get(matchId)
    const isFuture = kickoff !== undefined && kickoff > now

    if (isFuture) {
      // Future match: accept additions and changes freely.
      next[matchId] = outcome
      continue
    }

    // Started or unknown-kickoff match: only accept it as a FIRST-TIME save.
    // If a pick already exists for it, keep the locked value (no post-kickoff
    // edits). If none exists, persist the incoming pick (recovery of a pick
    // made before kickoff that never synced).
    if (!(matchId in existing)) {
      next[matchId] = outcome
    }
  }

  return next
}
