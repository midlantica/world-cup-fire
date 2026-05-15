// ── Types ─────────────────────────────────────────────────────────────────────
export interface MatchStatus {
  code: 'ns' | 'live' | 'ht' | 'ft'
  clock?: string
}

export interface Match {
  id: string
  date: string
  home: string
  homeRec: string
  homeScore: string | null
  away: string
  awayRec: string
  awayScore: string | null
  status: MatchStatus
  kickoffCT: string   // e.g. "7:30 PM CT"
  kickoffKey: string  // rounded to nearest 30min for grouping
  qualityScore: number
}

export type WeekTab = 'last' | 'this' | 'next'

// ── Game quality score ────────────────────────────────────────────────────────
// Uses MLS points logic: W=3pts, D=1pt, L=0pts
// We sum both teams' implied points totals.
// Ties indicate competitive teams that play close games — worth watching.
// We also penalise heavy loss records slightly.
//
// Formula: (homePoints + awayPoints) where points = W*3 + D*1
// Bonus: if both teams have similar points (close matchup), add 2
function parseRec(summary: string): { w: number; l: number; d: number } {
  const parts = summary.split('-').map(Number)
  return { w: parts[0] ?? 0, l: parts[1] ?? 0, d: parts[2] ?? 0 }
}

export function calcQuality(homeRec: string, awayRec: string): number {
  if (homeRec === '–' || awayRec === '–') return 0
  const h = parseRec(homeRec)
  const a = parseRec(awayRec)
  const hPts = h.w * 3 + h.d
  const aPts = a.w * 3 + a.d
  const total = hPts + aPts
  // Bonus for close matchup (within 4 pts of each other)
  const closeness = Math.abs(hPts - aPts) <= 4 ? 3 : 0
  return total + closeness
}

// ── Team name normalization ───────────────────────────────────────────────────
// ESPN occasionally returns incorrect casing for some team names
const TEAM_NAME_MAP: Record<string, string> = {
  'St. Louis CITY SC': 'St. Louis City SC',
}

function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] ?? name
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toCT(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Chicago',
  }) + ' CT'
}

// Round to nearest 30-min slot for grouping simultaneous kickoffs
function toKickoffKey(iso: string): string {
  const d = new Date(iso)
  const mins = d.getUTCMinutes()
  const rounded = mins < 15 ? 0 : mins < 45 ? 30 : 60
  const h = rounded === 60 ? d.getUTCHours() + 1 : d.getUTCHours()
  const m = rounded === 60 ? 0 : rounded
  const slot = new Date(d)
  slot.setUTCHours(h, m, 0, 0)
  return slot.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Chicago',
  }) + ' CT'
}

function parseRecord(competitor: Record<string, unknown>): string {
  const records = competitor.records as Array<Record<string, unknown>> | undefined
  const rec = records?.find(r => r.type === 'total' || r.abbreviation === 'Total')
  return rec ? (rec.summary as string) : '–'
}

function parseStatus(evt: Record<string, unknown>): MatchStatus {
  const status = evt.status as Record<string, unknown> | undefined
  const type = status?.type as Record<string, unknown> | undefined
  const name = (type?.name as string) || ''
  const state = (type?.state as string) || ''
  const completed = type?.completed as boolean | undefined
  const clock = (status?.displayClock as string) || ''
  if (completed === true || state === 'post') return { code: 'ft' }
  if (name === 'STATUS_HALFTIME') return { code: 'ht' }
  if (state === 'in') return { code: 'live', clock }
  return { code: 'ns' }
}

export function transformMatches(data: Record<string, unknown>): Match[] {
  const events = (data.events as Array<Record<string, unknown>>) || []
  return events.map(evt => {
    const comp = (evt.competitions as Array<Record<string, unknown>>)?.[0] || {}
    const competitors = (comp.competitors as Array<Record<string, unknown>>) || []
    const home = competitors.find(c => c.homeAway === 'home') || {}
    const away = competitors.find(c => c.homeAway === 'away') || {}
    const homeTeam = home.team as Record<string, unknown> | undefined
    const awayTeam = away.team as Record<string, unknown> | undefined
    const homeRec = parseRecord(home)
    const awayRec = parseRecord(away)
    return {
      id: evt.id as string,
      date: evt.date as string,
      home: normalizeTeamName((homeTeam?.displayName as string) || '?'),
      homeRec,
      homeScore: (home.score as string) ?? null,
      away: normalizeTeamName((awayTeam?.displayName as string) || '?'),
      awayRec,
      awayScore: (away.score as string) ?? null,
      status: parseStatus(evt),
      kickoffCT: toCT(evt.date as string),
      kickoffKey: toKickoffKey(evt.date as string),
      qualityScore: calcQuality(homeRec, awayRec),
    }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// ── Composable ────────────────────────────────────────────────────────────────
export interface WeekData {
  matches: Match[]
  label: string
  loading: boolean
  error: string | null
  loaded: boolean
}

export function useScores() {
  const weeks = reactive<Record<WeekTab, WeekData>>({
    last: { matches: [], label: 'Last Week', loading: false, error: null, loaded: false },
    this: { matches: [], label: 'This Week', loading: false, error: null, loaded: false },
    next: { matches: [], label: 'Next Week', loading: false, error: null, loaded: false },
  })

  const activeTab = ref<WeekTab>('this')
  const lastUpdated = ref<string | null>(null)

  async function fetchWeek(tab: WeekTab) {
    const w = weeks[tab]
    if (w.loading) return
    w.loading = true
    w.error = null
    try {
      const data = await $fetch<Record<string, unknown>>(`/api/scores?week=${tab}`)
      w.matches = transformMatches(data)
      w.label = (data._weekLabel as string) || w.label
      w.loaded = true
      lastUpdated.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e: unknown) {
      w.error = e instanceof Error ? e.message : 'Failed to load scores'
    } finally {
      w.loading = false
    }
  }

  async function selectTab(tab: WeekTab) {
    activeTab.value = tab
    if (!weeks[tab].loaded) await fetchWeek(tab)
  }

  return { weeks, activeTab, lastUpdated, fetchWeek, selectTab }
}
