<script setup lang="ts">
  import type { Match } from '../../composables/useScores'

  const props = defineProps<{
    detail: Record<string, unknown>
    match: Match
    homeLastDetail?: Record<string, unknown>
    awayLastDetail?: Record<string, unknown>
    homeLastPending?: boolean
    awayLastPending?: boolean
  }>()

  interface Player {
    name: string
    position: string
    jersey: string
    starter: boolean
  }

  function extractRoster(teamData: unknown): Player[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = teamData as any
    // ESPN WC summary uses rosters[n].roster[] (not .athletes[])
    const list: unknown[] = entry?.roster ?? entry?.athletes ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return list.map((a: any) => ({
      name: a.athlete?.displayName ?? a.athlete?.shortName ?? '—',
      position: a.position?.abbreviation ?? '',
      jersey: a.athlete?.jersey ?? a.jersey ?? '',
      starter: a.starter ?? false,
    }))
  }

  // Extract roster for a specific team from a match detail object
  // Matches by team display name, falls back to index
  function extractRosterForTeam(
    detail: Record<string, unknown> | undefined,
    teamName: string,
    fallbackIndex: number
  ): Player[] {
    if (!detail) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (detail.rosters as any[]) ?? []
    if (!rosters.length) return []
    // Try to find by team name
    const byName = rosters.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) =>
        (r?.team?.displayName as string)
          ?.toLowerCase()
          .includes(teamName.toLowerCase()) ||
        teamName
          .toLowerCase()
          .includes((r?.team?.displayName as string)?.toLowerCase())
    )
    const entry = byName ?? rosters[fallbackIndex]
    return entry ? extractRoster(entry) : []
  }

  // ── WC match rosters ────────────────────────────────────────────────────────
  const homeRoster = computed<Player[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (props.detail?.rosters as any[]) ?? []
    return extractRoster(rosters[0])
  })

  const awayRoster = computed<Player[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (props.detail?.rosters as any[]) ?? []
    return extractRoster(rosters[1])
  })

  const hasData = computed(
    () => homeRoster.value.length > 0 || awayRoster.value.length > 0
  )

  // ── Fallback: last game rosters ─────────────────────────────────────────────
  const homeFallbackRoster = computed<Player[]>(() =>
    extractRosterForTeam(props.homeLastDetail, props.match.home, 0)
  )

  const awayFallbackRoster = computed<Player[]>(() =>
    extractRosterForTeam(props.awayLastDetail, props.match.away, 1)
  )

  const hasFallbackData = computed(
    () =>
      homeFallbackRoster.value.length > 0 || awayFallbackRoster.value.length > 0
  )

  // ── Last match context labels ───────────────────────────────────────────────
  function getLastMatchLabel(
    detail: Record<string, unknown> | undefined,
    teamName: string
  ): string {
    if (!detail) return ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (detail.rosters as any[]) ?? []
    // Find the opponent team name
    const opponent = rosters.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) =>
        !(r?.team?.displayName as string)
          ?.toLowerCase()
          .includes(teamName.toLowerCase()) &&
        !teamName
          .toLowerCase()
          .includes((r?.team?.displayName as string)?.toLowerCase())
    )
    const opponentName = (opponent?.team?.displayName as string) ?? 'last match'
    return `vs ${opponentName}`
  }

  const homeLastMatchLabel = computed(() =>
    getLastMatchLabel(props.homeLastDetail, props.match.home)
  )
  const awayLastMatchLabel = computed(() =>
    getLastMatchLabel(props.awayLastDetail, props.match.away)
  )

  // ── Display rosters (WC data takes priority) ────────────────────────────────
  const displayHomeRoster = computed(() =>
    hasData.value ? homeRoster.value : homeFallbackRoster.value
  )
  const displayAwayRoster = computed(() =>
    hasData.value ? awayRoster.value : awayFallbackRoster.value
  )
  const isFallback = computed(() => !hasData.value && hasFallbackData.value)
  const isLoading = computed(
    () =>
      !hasData.value &&
      !hasFallbackData.value &&
      (props.homeLastPending || props.awayLastPending)
  )
</script>

<template>
  <div class="lineups-tab">
    <!-- No data at all -->
    <div
      v-if="!hasData && !hasFallbackData && !isLoading"
      class="lineups-tab__empty"
    >
      <p>Lineups will be available closer to kick-off.</p>
    </div>

    <!-- Loading fallback data -->
    <div v-else-if="isLoading" class="lineups-tab__empty">
      <p>Loading last match lineups…</p>
    </div>

    <!-- Roster columns -->
    <div v-else class="lineups-tab__cols">
      <!-- Fallback context banner -->
      <div v-if="isFallback" class="lineups-tab__fallback-banner">
        <span>Last match lineups</span>
      </div>

      <!-- Home -->
      <div class="lineups-tab__col">
        <div class="lineups-tab__col-header">
          <CountryFlag :iso2="match.homeIso2" :size="20" />
          <span class="lineups-tab__col-team">{{ match.homeShort }}</span>
          <span
            v-if="isFallback && homeLastMatchLabel"
            class="lineups-tab__last-label"
          >
            {{ homeLastMatchLabel }}
          </span>
        </div>
        <div
          v-for="player in displayHomeRoster"
          :key="player.name"
          class="player-row"
          :class="{ 'player-row--starter': player.starter }"
        >
          <span class="player-row__jersey">{{ player.jersey }}</span>
          <span class="player-row__name">{{ player.name }}</span>
          <span class="player-row__pos">{{ player.position }}</span>
        </div>
        <div
          v-if="displayHomeRoster.length === 0"
          class="lineups-tab__col-empty"
        >
          No lineup data
        </div>
      </div>

      <!-- Away -->
      <div class="lineups-tab__col">
        <div class="lineups-tab__col-header">
          <CountryFlag :iso2="match.awayIso2" :size="20" />
          <span class="lineups-tab__col-team">{{ match.awayShort }}</span>
          <span
            v-if="isFallback && awayLastMatchLabel"
            class="lineups-tab__last-label"
          >
            {{ awayLastMatchLabel }}
          </span>
        </div>
        <div
          v-for="player in displayAwayRoster"
          :key="player.name"
          class="player-row"
          :class="{ 'player-row--starter': player.starter }"
        >
          <span class="player-row__jersey">{{ player.jersey }}</span>
          <span class="player-row__name">{{ player.name }}</span>
          <span class="player-row__pos">{{ player.position }}</span>
        </div>
        <div
          v-if="displayAwayRoster.length === 0"
          class="lineups-tab__col-empty"
        >
          No lineup data
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .lineups-tab__empty {
    @apply py-12 text-center text-white/40;
  }

  .lineups-tab__cols {
    @apply grid grid-cols-2 gap-4;
  }

  .lineups-tab__fallback-banner {
    @apply col-span-2 mb-1 rounded bg-white/5 px-3 py-1.5 text-center text-xs font-semibold tracking-widest text-white/40 uppercase;
  }

  .lineups-tab__col-header {
    @apply mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-white;
  }

  /* Must explicitly override the global span rule in main.css */
  .lineups-tab__col-team {
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
  }

  .lineups-tab__last-label {
    @apply ml-auto text-xs font-normal text-white/35;
  }

  .lineups-tab__col-empty {
    @apply py-4 text-center text-xs text-white/30;
  }

  .player-row {
    @apply flex items-center gap-2 border-t border-white/5 py-1.5 text-xs text-white/60;
  }

  .player-row--starter {
    @apply text-white;
  }

  .player-row__jersey {
    @apply w-5 text-center font-bold text-white/30;
  }

  .player-row__name {
    @apply flex-1 truncate;
  }

  .player-row__pos {
    @apply rounded bg-white/10 px-1 py-0.5 text-xs font-bold text-white/40;
  }
</style>
