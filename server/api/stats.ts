/**
 * GET /api/stats
 *
 * Returns top-10 MLS season leaders for Goals and Assists.
 * Fetches ESPN Core API, resolves athlete $ref links in parallel,
 * and caches the result for 1 hour.
 */

interface LeaderEntry {
  rank: number
  athleteId: string
  displayName: string
  team: string
  headshot: string
  value: number
}

interface StatsResponse {
  goals: LeaderEntry[]
  assists: LeaderEntry[]
  yellowCards: LeaderEntry[]
  redCards: LeaderEntry[]
}

// ── In-memory cache ───────────────────────────────────────────────────────────
let cache: StatsResponse | null = null
let cacheTime = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

// ── ESPN team ID → display name (reverse lookup) ──────────────────────────────
// We'll resolve team names from the athlete ref's team data
const ESPN_TEAM_ID_TO_NAME: Record<string, string> = {
  '18418': 'Atlanta United FC',
  '20906': 'Austin FC',
  '9720': 'CF Montréal',
  '21300': 'Charlotte FC',
  '182': 'Chicago Fire FC',
  '184': 'Colorado Rapids',
  '183': 'Columbus Crew',
  '193': 'D.C. United',
  '18267': 'FC Cincinnati',
  '185': 'FC Dallas',
  '6077': 'Houston Dynamo FC',
  '20232': 'Inter Miami CF',
  '187': 'LA Galaxy',
  '18966': 'LAFC',
  '17362': 'Minnesota United FC',
  '18986': 'Nashville SC',
  '189': 'New England Revolution',
  '17606': 'New York City FC',
  '12011': 'Orlando City SC',
  '10739': 'Philadelphia Union',
  '9723': 'Portland Timbers',
  '4771': 'Real Salt Lake',
  '190': 'Red Bull New York',
  '22529': 'San Diego FC',
  '191': 'San Jose Earthquakes',
  '9726': 'Seattle Sounders FC',
  '186': 'Sporting Kansas City',
  '21812': 'St. Louis City SC',
  '7318': 'Toronto FC',
  '9727': 'Vancouver Whitecaps',
}

function extractId(refUrl: string, segment: string): string | null {
  const match = new RegExp(`${segment}\\/(\\d+)`).exec(refUrl)
  return match?.[1] ?? null
}

export default defineEventHandler(async () => {
  // Serve from cache if fresh
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return cache
  }

  // ── 1. Fetch season leaders ───────────────────────────────────────────────
  const leadersUrl =
    'https://sports.core.api.espn.com/v2/sports/soccer/leagues/usa.1/seasons/2026/types/1/leaders'

  const leadersRaw = await $fetch<Record<string, unknown>>(leadersUrl).catch(
    () => null
  )
  if (!leadersRaw) {
    throw createError({ statusCode: 502, message: 'Failed to fetch leaders' })
  }

  const categories =
    (leadersRaw.categories as Array<Record<string, unknown>>) ?? []

  // ── 2. Extract top-10 for goals and assists ───────────────────────────────
  type RawLeader = {
    value: number
    athleteRef: string
    teamRef: string
  }

  function extractCategory(name: string): RawLeader[] {
    const cat = categories.find(
      (c) => (c.name as string)?.toLowerCase() === name
    )
    if (!cat) return []
    const leaders = (cat.leaders as Array<Record<string, unknown>>) ?? []
    return leaders.slice(0, 10).map((l) => ({
      value: l.value as number,
      athleteRef: (l.athlete as Record<string, unknown>)?.['$ref'] as string,
      teamRef: (l.team as Record<string, unknown>)?.['$ref'] as string,
    }))
  }

  const rawGoals = extractCategory('goals')
  const rawAssists = extractCategory('assists')
  const rawYellowCards = extractCategory('yellowcards')
  const rawRedCards = extractCategory('redcards')

  // ── 3. Collect unique athlete refs to fetch ───────────────────────────────
  const allRefs = new Set<string>()
  for (const l of [
    ...rawGoals,
    ...rawAssists,
    ...rawYellowCards,
    ...rawRedCards,
  ]) {
    if (l.athleteRef) allRefs.add(l.athleteRef)
  }

  // ── 4. Fetch all athlete refs in parallel ─────────────────────────────────
  const athleteCache = new Map<
    string,
    { displayName: string; team: string; headshot: string }
  >()

  await Promise.all(
    Array.from(allRefs).map(async (ref) => {
      try {
        const data = await $fetch<Record<string, unknown>>(ref)
        const displayName = (data.displayName as string) ?? 'Unknown'

        // Read headshot directly from the API response (null if ESPN has no photo)
        const headshotObj = data.headshot as
          | Record<string, unknown>
          | null
          | undefined
        const headshot = (headshotObj?.href as string) ?? ''

        // Try to get team from the athlete's team ref
        let team = 'MLS'
        const teamLinks = (data.teams as Array<Record<string, unknown>>) ?? []
        if (teamLinks.length > 0) {
          const teamRef = teamLinks[0]?.['$ref'] as string | undefined
          if (teamRef) {
            const teamId = extractId(teamRef, 'teams')
            if (teamId && ESPN_TEAM_ID_TO_NAME[teamId]) {
              team = ESPN_TEAM_ID_TO_NAME[teamId]
            }
          }
        }

        athleteCache.set(ref, { displayName, team, headshot })
      } catch {
        athleteCache.set(ref, {
          displayName: 'Unknown',
          team: 'MLS',
          headshot: '',
        })
      }
    })
  )

  // ── 5. Build resolved leader lists ────────────────────────────────────────
  function resolveLeaders(raw: RawLeader[]): LeaderEntry[] {
    return raw.map((l, i) => {
      const athleteId = extractId(l.athleteRef, 'athletes') ?? ''
      const teamId = extractId(l.teamRef, 'teams') ?? ''
      const resolved = athleteCache.get(l.athleteRef)

      // Prefer team from teamRef (season-specific) over athlete profile
      const team =
        (teamId && ESPN_TEAM_ID_TO_NAME[teamId]) || resolved?.team || 'MLS'

      return {
        rank: i + 1,
        athleteId,
        displayName: resolved?.displayName ?? 'Unknown',
        team,
        headshot: resolved?.headshot ?? '',
        value: Math.round(l.value),
      }
    })
  }

  const result: StatsResponse = {
    goals: resolveLeaders(rawGoals),
    assists: resolveLeaders(rawAssists),
    yellowCards: resolveLeaders(rawYellowCards),
    redCards: resolveLeaders(rawRedCards),
  }

  cache = result
  cacheTime = Date.now()

  return result
})
