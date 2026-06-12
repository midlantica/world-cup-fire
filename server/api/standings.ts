// Server-side API route: computes FIFA World Cup group standings from match results.
//
// WHY: ESPN's dedicated standings endpoint (/apis/v2/.../standings) has proven
// unreliable — it can lag hours behind actual results (e.g. Korea vs Czechia
// showed 0 games played long after the match finished). Instead we derive
// standings ourselves from the scoreboard API, which updates promptly.

const CACHE_TTL_MS = 60_000 // 1 min (short so standings update quickly after FT)
const CACHE_TTL_LIVE_MS = 30_000 // 30 s during live matches

interface CacheEntry {
  data: unknown
  fetchedAt: number
  hasLive: boolean
}

let cache: CacheEntry | null = null

const SCOREBOARD_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'

// Group stage runs Jun 11 – Jun 27 (all 3 weeks)
const GROUP_STAGE_DATES = '20260611-20260627'

// All 12 groups A–L with their 4 teams each (ESPN display names)
const GROUP_TEAMS: Record<string, string[]> = {
  A: ['Mexico', 'South Korea', 'Czechia', 'South Africa'],
  B: ['Canada', 'Bosnia-Herzegovina', 'Switzerland', 'Qatar'],
  C: ['Brazil', 'Scotland', 'Haiti', 'Morocco'],
  D: ['Paraguay', 'Türkiye', 'Australia', 'United States'],
  E: ['Ecuador', 'Germany', 'Ivory Coast', 'Curaçao'],
  F: ['Netherlands', 'Sweden', 'Japan', 'Tunisia'],
  G: ['Belgium', 'Iran', 'Egypt', 'New Zealand'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'],
  I: ['Norway', 'France', 'Senegal', 'Iraq'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Colombia', 'Portugal', 'Uzbekistan', 'Congo DR'],
  L: ['England', 'Croatia', 'Panama', 'Ghana'],
}

interface TeamStats {
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

function emptyStats(): TeamStats {
  return {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeStandings(events: any[]): unknown[] {
  // Build a stats map keyed by team name
  const stats = new Map<string, TeamStats>()

  // Pre-populate all known group teams with zeroed stats
  for (const teams of Object.values(GROUP_TEAMS)) {
    for (const t of teams) {
      if (!stats.has(t)) stats.set(t, emptyStats())
    }
  }

  // Process each completed match
  for (const ev of events) {
    const comp = ev.competitions?.[0]
    if (!comp) continue

    const statusType = ev.status?.type
    const statusName: string = statusType?.name ?? ''
    const statusState: string = statusType?.state ?? ''
    const completed: boolean = statusType?.completed ?? false

    // Only count finished matches
    const isFinished =
      statusName === 'STATUS_FINAL' ||
      statusName === 'STATUS_FULL_TIME' ||
      statusName === 'STATUS_FULL_PEN' ||
      (statusState === 'post' && completed)

    if (!isFinished) continue

    const competitors: unknown[] = comp.competitors ?? []
    if (competitors.length < 2) continue

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c0 = competitors[0] as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c1 = competitors[1] as any

    const name0: string = c0.team?.displayName ?? ''
    const name1: string = c1.team?.displayName ?? ''
    const score0 = parseInt(c0.score ?? '0', 10)
    const score1 = parseInt(c1.score ?? '0', 10)

    if (!name0 || !name1 || isNaN(score0) || isNaN(score1)) continue

    // Ensure both teams have entries (handles any team not pre-populated)
    if (!stats.has(name0)) stats.set(name0, emptyStats())
    if (!stats.has(name1)) stats.set(name1, emptyStats())

    const s0 = stats.get(name0)!
    const s1 = stats.get(name1)!

    s0.played++
    s1.played++
    s0.goalsFor += score0
    s0.goalsAgainst += score1
    s1.goalsFor += score1
    s1.goalsAgainst += score0
    s0.goalDiff = s0.goalsFor - s0.goalsAgainst
    s1.goalDiff = s1.goalsFor - s1.goalsAgainst

    if (score0 > score1) {
      s0.wins++
      s0.points += 3
      s1.losses++
    } else if (score1 > score0) {
      s1.wins++
      s1.points += 3
      s0.losses++
    } else {
      s0.draws++
      s0.points++
      s1.draws++
      s1.points++
    }
  }

  // Build the output in the same shape the client's useStandings composable expects:
  // an array of group objects, each with { name, standings: { entries: [...] } }
  return Object.entries(GROUP_TEAMS).map(([letter, teams]) => {
    const entries = teams.map((teamName) => {
      const s = stats.get(teamName) ?? emptyStats()
      return {
        team: { displayName: teamName },
        stats: [
          { name: 'gamesPlayed', value: s.played },
          { name: 'wins', value: s.wins },
          { name: 'ties', value: s.draws },
          { name: 'losses', value: s.losses },
          { name: 'pointsFor', value: s.goalsFor },
          { name: 'pointsAgainst', value: s.goalsAgainst },
          { name: 'pointDifferential', value: s.goalDiff },
          { name: 'points', value: s.points },
        ],
      }
    })

    return {
      name: `Group ${letter}`,
      standings: { entries },
    }
  })
}

export default defineEventHandler(async () => {
  const now = Date.now()

  if (cache) {
    const ttl = cache.hasLive ? CACHE_TTL_LIVE_MS : CACHE_TTL_MS
    if (now - cache.fetchedAt < ttl) return cache.data
  }

  const url = `${SCOREBOARD_BASE}/scoreboard?dates=${GROUP_STAGE_DATES}&limit=200`
  const raw = await $fetch<Record<string, unknown>>(url)
  const events = (raw.events as unknown[]) ?? []

  // Check if any match is currently live (to use shorter TTL)
  const hasLive = events.some((e: unknown) => {
    const ev = e as Record<string, unknown>
    const status = ev.status as Record<string, unknown> | undefined
    const type = status?.type as Record<string, unknown> | undefined
    return (
      type?.state === 'in' ||
      type?.name === 'STATUS_IN_PROGRESS' ||
      type?.name === 'STATUS_HALFTIME' ||
      type?.name === 'STATUS_FIRST_HALF' ||
      type?.name === 'STATUS_SECOND_HALF'
    )
  })

  const data = computeStandings(events)
  cache = { data, fetchedAt: now, hasLive }
  return data
})
