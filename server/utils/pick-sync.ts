import type { PickOutcome } from './pools'

/**
 * Apply a full picks sync without allowing started-match history to be changed.
 *
 * Existing picks with an unknown kickoff are retained because deleting them
 * would be irreversible. New picks are accepted only for known future matches.
 */
export function mergePicksForSync(
  existing: Record<string, PickOutcome>,
  incoming: Record<string, PickOutcome>,
  kickoffByMatchId: ReadonlyMap<string, number>,
  now: number
): Record<string, PickOutcome> {
  const next: Record<string, PickOutcome> = {}

  for (const [matchId, outcome] of Object.entries(existing)) {
    const kickoff = kickoffByMatchId.get(matchId)
    if (kickoff === undefined || kickoff <= now) {
      next[matchId] = outcome
    }
  }

  for (const [matchId, outcome] of Object.entries(incoming)) {
    const kickoff = kickoffByMatchId.get(matchId)
    if (kickoff !== undefined && kickoff > now) {
      next[matchId] = outcome
    }
  }

  return next
}
