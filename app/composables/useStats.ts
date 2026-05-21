/**
 * useStats — fetch and cache season leaders
 * (Goals / Assists / Accurate Passes / Saves / Yellow Cards / Red Cards)
 */

export interface LeaderEntry {
  rank: number
  athleteId: string
  displayName: string
  team: string
  headshot: string
  value: number
}

export interface StatsData {
  goals: LeaderEntry[]
  assists: LeaderEntry[]
  accuratePasses: LeaderEntry[]
  saves: LeaderEntry[]
  yellowCards: LeaderEntry[]
  redCards: LeaderEntry[]
}

export function useStats() {
  const data = useState<StatsData | null>('stats-data', () => null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)

  async function fetchStats() {
    if (loaded.value) return
    loading.value = true
    error.value = null
    try {
      const result = await $fetch<StatsData>('/api/stats')
      data.value = result
      loaded.value = true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load stats'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, loaded, fetchStats }
}
