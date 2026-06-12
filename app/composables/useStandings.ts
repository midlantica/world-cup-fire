import { TEAM_BY_NAME } from '../constants/worldcup'

export interface StandingEntry {
  rank: number
  teamName: string
  shortName: string
  iso2: string
  abbrev: string
  color: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

export interface GroupStanding {
  group: string // "Group A"
  letter: string // "A"
  entries: StandingEntry[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function statVal(stats: any[], name: string): number {
  const s = stats?.find((x: Record<string, unknown>) => x.name === name)
  return s ? Number(s.value) : 0
}

/**
 * Sort entries by standard FIFA group-stage tiebreakers:
 *   1. Points (desc)
 *   2. Goal difference (desc)
 *   3. Goals for (desc)
 *   4. Goals against (asc — fewer conceded is better)
 *   5. Alphabetical by team name (stable fallback)
 *
 * Note: head-to-head tiebreakers (FIFA's actual rule 5+) are not implemented
 * here — alphabetical is used as a stable fallback for equal records.
 */
function fifaSort(entries: StandingEntry[]): StandingEntry[] {
  return [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    if (a.goalsAgainst !== b.goalsAgainst)
      return a.goalsAgainst - b.goalsAgainst
    return a.teamName.localeCompare(b.teamName)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseGroup(raw: any): GroupStanding {
  const groupName: string = raw.name ?? 'Group ?'
  const letter = groupName.replace('Group ', '')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const espnEntries: StandingEntry[] = (raw.standings?.entries ?? []).map(
    (entry: any, idx: number) => {
      const teamName: string = entry.team?.displayName ?? ''
      const stats: unknown[] = entry.stats ?? []
      const teamData = TEAM_BY_NAME.get(teamName)

      return {
        rank: idx + 1,
        teamName,
        shortName: teamData?.shortName ?? teamData?.name ?? teamName,
        iso2: teamData?.iso2 ?? '',
        abbrev: teamData?.abbrev ?? teamName.slice(0, 3).toUpperCase(),
        color: teamData?.color ?? '888888',
        played: statVal(stats as never[], 'gamesPlayed'),
        wins: statVal(stats as never[], 'wins'),
        draws: statVal(stats as never[], 'ties'),
        losses: statVal(stats as never[], 'losses'),
        goalsFor: statVal(stats as never[], 'pointsFor'),
        goalsAgainst: statVal(stats as never[], 'pointsAgainst'),
        goalDiff: statVal(stats as never[], 'pointDifferential'),
        points: statVal(stats as never[], 'points'),
      }
    }
  )

  // Sort by standard FIFA group-stage tiebreakers.
  // The server now computes standings from match results (not ESPN's standings
  // endpoint, which proved unreliable). Our fifaSort is the source of truth.
  const sorted = fifaSort(espnEntries)

  // Re-assign ranks based on the sorted order.
  const entries = sorted.map((e, idx) => ({ ...e, rank: idx + 1 }))

  return { group: groupName, letter, entries }
}

export function useStandings() {
  const {
    data: rawGroups,
    pending,
    error,
    refresh,
  } = useFetch<unknown[]>('/api/standings')

  const groups = computed<GroupStanding[]>(() => {
    if (!rawGroups.value) return []
    return rawGroups.value.map(normaliseGroup)
  })

  // Quick lookup: group letter → GroupStanding
  const groupByLetter = computed(() => {
    const map = new Map<string, GroupStanding>()
    for (const g of groups.value) map.set(g.letter, g)
    return map
  })

  return { groups, groupByLetter, pending, error, refresh }
}
