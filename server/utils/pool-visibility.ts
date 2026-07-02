import type { PickOutcome, PublicPool, StoredPool } from './pools'

/**
 * Hide unstarted outcomes from everyone except the authenticated member.
 * Unknown kickoff IDs are treated as unstarted so privacy fails closed.
 */
export function filterPoolForViewer(
  pool: StoredPool,
  selfMemberId: string | undefined,
  kickoffByMatchId: ReadonlyMap<string, number>,
  now: number
): PublicPool {
  return {
    id: pool.id,
    name: pool.name,
    ownerName: pool.ownerName,
    createdAt: pool.createdAt,
    members: pool.members.map((member) => {
      const allPicks = member.picks ?? {}
      const visiblePicks: Record<string, PickOutcome> = {}

      if (member.id === selfMemberId) {
        Object.assign(visiblePicks, allPicks)
      } else {
        for (const [matchId, outcome] of Object.entries(allPicks)) {
          const kickoff = kickoffByMatchId.get(matchId)
          if (kickoff !== undefined && kickoff <= now) {
            visiblePicks[matchId] = outcome
          }
        }
      }

      return {
        id: member.id,
        name: member.name,
        isOwner: member.isOwner,
        picks: visiblePicks,
        picksMade: Object.keys(allPicks).length,
      }
    }),
  }
}
