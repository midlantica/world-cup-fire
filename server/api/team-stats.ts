import { ABBREV_TO_ISO2 } from '../utils/iso2'

type TeamStats = {
  teamName: string
  teamAbbrev: string
  iso2: string
  matches: number
  totalPasses: number
  totalShots: number
  shotsOnTarget: number
  totalTackles: number
  interceptions: number
  saves: number
  yellowCards: number
  wonCorners: number
  foulsCommitted: number
  possessionPct: number
  possessionMatches: number
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await $fetch<any>(url, { signal: controller.signal as any })
  } finally {
    clearTimeout(timer)
  }
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<(T | null)[]> {
  const results: (T | null)[] = new Array(tasks.length).fill(null)
  let idx = 0

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++
      try {
        results[i] = await tasks[i]()
      } catch {
        results[i] = null
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()))
  return results
}

export default defineCachedEventHandler(
  async () => {
    // 1. Fetch all completed match IDs from the scoreboard
    const scoreboard = await fetchWithTimeout(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260601-20260720'
    )

    const events: any[] = scoreboard?.events ?? []
    const completedIds: string[] = events
      .filter((e: any) => e?.status?.type?.completed === true)
      .map((e: any) => e.id)
      .filter(Boolean)

    if (completedIds.length === 0) {
      return {
        topPasses: [],
        topShots: [],
        topShotsOnTarget: [],
        topTackles: [],
        topInterceptions: [],
        topSaves: [],
        topCorners: [],
        topFouls: [],
      }
    }

    // 2. Fan out to fetch each match summary (concurrency = 10)
    const teamMap = new Map<string, TeamStats>()

    const tasks = completedIds.map((id) => async () => {
      const summary = await fetchWithTimeout(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${id}`
      )
      const teams: any[] = summary?.boxscore?.teams ?? []
      for (const t of teams) {
        const abbrev = (t.team?.abbreviation ?? '').toUpperCase()
        const teamName = t.team?.displayName ?? abbrev
        const iso2 = ABBREV_TO_ISO2[abbrev] ?? ''

        if (!teamMap.has(abbrev)) {
          teamMap.set(abbrev, {
            teamName,
            teamAbbrev: abbrev,
            iso2,
            matches: 0,
            totalPasses: 0,
            totalShots: 0,
            shotsOnTarget: 0,
            totalTackles: 0,
            interceptions: 0,
            saves: 0,
            yellowCards: 0,
            wonCorners: 0,
            foulsCommitted: 0,
            possessionPct: 0,
            possessionMatches: 0,
          })
        }

        const entry = teamMap.get(abbrev)!
        entry.matches++

        const stats: any[] = t.statistics ?? []
        const get = (name: string): number => {
          const s = stats.find((x: any) => x.name === name)
          return s ? parseFloat(s.displayValue ?? s.value ?? '0') || 0 : 0
        }

        entry.totalPasses += get('totalPasses')
        entry.totalShots += get('totalShots')
        entry.shotsOnTarget += get('shotsOnTarget')
        entry.totalTackles += get('totalTackles')
        entry.interceptions += get('interceptions')
        entry.saves += get('saves')
        entry.yellowCards += get('yellowCards')
        entry.wonCorners += get('wonCorners')
        entry.foulsCommitted += get('foulsCommitted')

        const poss = get('possessionPct')
        if (poss > 0) {
          entry.possessionPct += poss
          entry.possessionMatches++
        }
      }
    })

    await runWithConcurrency(tasks, 10)

    const teams = Array.from(teamMap.values()).filter((t) => t.matches > 0)

    const top8 = (key: keyof TeamStats) =>
      [...teams]
        .sort((a, b) => (b[key] as number) - (a[key] as number))
        .slice(0, 8)
        .map((t) => ({
          teamName: t.teamName,
          teamAbbrev: t.teamAbbrev,
          iso2: t.iso2,
          matches: t.matches,
          value: t[key] as number,
        }))

    return {
      topPasses: top8('totalPasses'),
      topShots: top8('totalShots'),
      topShotsOnTarget: top8('shotsOnTarget'),
      topTackles: top8('totalTackles'),
      topInterceptions: top8('interceptions'),
      topSaves: top8('saves'),
      topCorners: top8('wonCorners'),
      topFouls: top8('foulsCommitted'),
    }
  },
  {
    maxAge: 600,
    name: 'team-stats',
    getKey: () => 'all',
  }
)
