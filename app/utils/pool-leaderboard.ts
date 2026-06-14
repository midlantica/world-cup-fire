import type { PickOutcome } from '../composables/usePicks'

export interface LeaderboardMember {
  id: string
  name: string
  isOwner?: boolean
  isSelf?: boolean
  picks: Record<string, PickOutcome>
  picksMade?: number
}

export interface RankedLeaderRow {
  memberId: string
  name: string
  isOwner: boolean
  isSelf: boolean
  score: number
  decided: number
  picksMade: number
  accuracy: number
  rank: number
}

/** Score every member from the same server-provided pool snapshot. */
export function rankPoolMembers(
  members: LeaderboardMember[],
  resolveResult: (matchId: string) => PickOutcome | null
): RankedLeaderRow[] {
  const rows = members.map((member) => {
    let score = 0
    let decided = 0
    const picksMade = member.picksMade ?? Object.keys(member.picks).length

    for (const [matchId, outcome] of Object.entries(member.picks)) {
      const result = resolveResult(matchId)
      if (result === null) continue
      decided++
      if (result === outcome) score++
    }

    return {
      memberId: member.id,
      name: member.name,
      isOwner: !!member.isOwner,
      isSelf: !!member.isSelf,
      score,
      decided,
      picksMade,
      accuracy: decided > 0 ? score / decided : 0,
      rank: 0,
    }
  })

  rows.sort(
    (a, b) =>
      b.score - a.score ||
      b.accuracy - a.accuracy ||
      b.picksMade - a.picksMade ||
      a.name.localeCompare(b.name)
  )

  let lastScore = -1
  let lastRank = 0
  rows.forEach((row, index) => {
    if (row.score !== lastScore) {
      lastRank = index + 1
      lastScore = row.score
    }
    row.rank = lastRank
  })

  return rows
}
