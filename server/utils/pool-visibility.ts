import type { PickOutcome, PublicPool, StoredPool } from './pools'

/**
 * Group-stage match IDs are 760414–760485 (matches 1–72).
 * Knockout match IDs are 760486–760517 (matches 73–104).
 * picksMade must only count group-stage picks so the "X / 72" summary is correct.
 */
function isGroupStageMatchId(matchId: string): boolean {
  const n = Number(matchId)
  return n >= 760414 && n <= 760485
}

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
        picksMade: Object.keys(allPicks).filter(isGroupStageMatchId).length,
      }
    }),
  }
}
