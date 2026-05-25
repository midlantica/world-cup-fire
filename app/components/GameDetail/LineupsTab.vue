<script setup lang="ts">
  import type { Match } from '../../composables/useScores'

  const props = defineProps<{
    detail: Record<string, unknown>
    match: Match
  }>()

  interface Player {
    name: string
    position: string
    jersey: string
    starter: boolean
  }

  function extractRoster(teamData: unknown): Player[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const athletes = (teamData as any)?.athletes ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return athletes.map((a: any) => ({
      name: a.athlete?.displayName ?? a.athlete?.shortName ?? '—',
      position: a.position?.abbreviation ?? '',
      jersey: a.athlete?.jersey ?? '',
      starter: a.starter ?? false,
    }))
  }

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
</script>

<template>
  <div class="lineups-tab">
    <div v-if="!hasData" class="lineups-tab__empty">
      <p>Lineups will be available closer to kick-off.</p>
    </div>

    <div v-else class="lineups-tab__cols">
      <!-- Home -->
      <div class="lineups-tab__col">
        <div class="lineups-tab__col-header">
          <CountryFlag :iso2="match.homeIso2" :size="20" />
          <span>{{ match.home }}</span>
        </div>
        <div
          v-for="player in homeRoster"
          :key="player.name"
          class="player-row"
          :class="{ 'player-row--starter': player.starter }"
        >
          <span class="player-row__jersey">{{ player.jersey }}</span>
          <span class="player-row__name">{{ player.name }}</span>
          <span class="player-row__pos">{{ player.position }}</span>
        </div>
      </div>

      <!-- Away -->
      <div class="lineups-tab__col">
        <div class="lineups-tab__col-header">
          <CountryFlag :iso2="match.awayIso2" :size="20" />
          <span>{{ match.away }}</span>
        </div>
        <div
          v-for="player in awayRoster"
          :key="player.name"
          class="player-row"
          :class="{ 'player-row--starter': player.starter }"
        >
          <span class="player-row__jersey">{{ player.jersey }}</span>
          <span class="player-row__name">{{ player.name }}</span>
          <span class="player-row__pos">{{ player.position }}</span>
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

  .lineups-tab__col-header {
    @apply mb-2 flex items-center gap-2 text-sm font-bold text-white;
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
