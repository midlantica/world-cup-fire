import { TEAM_BY_NAME } from '../constants/worldcup'

export interface StandingEntry {
  rank: number
  teamName: string
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseGroup(raw: any): GroupStanding {
  const groupName: string = raw.name ?? 'Group ?'
  const letter = groupName.replace('Group ', '')
  const entries: StandingEntry[] = (raw.standings?.entries ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any, idx: number) => {
      const teamName: string = entry.team?.displayName ?? ''
      const stats: unknown[] = entry.stats ?? []
      const teamData = TEAM_BY_NAME.get(teamName)

      return {
        rank: idx + 1,
        teamName,
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
    })

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
