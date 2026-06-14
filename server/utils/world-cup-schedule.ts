const SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200'

const CACHE_TTL_MS = 60_000
const MAX_STALE_MS = 6 * 60 * 60_000

interface KickoffCache {
  kickoffByMatchId: Map<string, number>
  fetchedAt: number
}

interface EspnEvent {
  id?: string
  date?: string
}

let cache: KickoffCache | null = null
let pendingFetch: Promise<KickoffCache> | null = null

async function fetchKickoffs(): Promise<KickoffCache> {
  const raw = await $fetch<{ events?: EspnEvent[] }>(SCOREBOARD_URL)
  const kickoffByMatchId = new Map<string, number>()

  for (const event of raw.events ?? []) {
    if (!event.id || !event.date) continue
    const kickoff = new Date(event.date).getTime()
    if (Number.isNaN(kickoff)) continue
    kickoffByMatchId.set(event.id, kickoff)
  }

  if (kickoffByMatchId.size === 0) {
    throw new Error('World Cup schedule returned no matches')
  }

  return { kickoffByMatchId, fetchedAt: Date.now() }
}

/**
 * Return server-authoritative kickoff times for the full tournament.
 * A short cache avoids fetching ESPN for every pool write; a recent stale
 * value keeps writes working through brief upstream failures.
 */
export async function getWorldCupKickoffs(): Promise<
  ReadonlyMap<string, number>
> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.kickoffByMatchId
  }

  pendingFetch ??= fetchKickoffs()

  try {
    cache = await pendingFetch
    return cache.kickoffByMatchId
  } catch (error) {
    if (cache && now - cache.fetchedAt < MAX_STALE_MS) {
      return cache.kickoffByMatchId
    }
    throw error
  } finally {
    pendingFetch = null
  }
}
