<script setup lang="ts">
  import type { Match } from '../../composables/useScores'

  const props = defineProps<{
    detail: Record<string, unknown>
    match: Match
  }>()

  interface Leader {
    name: string
    stat: string
    value: string
    team: string
    iso2: string
  }

  const leaders = computed<Leader[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leadersData = props.detail?.leaders as any[]
    if (!leadersData) return []

    const result: Leader[] = []
    for (const category of leadersData) {
      const catName: string = category.displayName ?? category.name ?? ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leaders = (category.leaders ?? []) as any[]
      for (const leader of leaders.slice(0, 3)) {
        const athlete = leader.athlete ?? {}
        const teamName: string = leader.team?.displayName ?? ''
        const iso2 =
          teamName === props.match.home
            ? props.match.homeIso2
            : props.match.awayIso2
        result.push({
          name: athlete.displayName ?? athlete.shortName ?? '—',
          stat: catName,
          value: leader.displayValue ?? String(leader.value ?? ''),
          team: teamName,
          iso2,
        })
      }
    }
    return result
  })
</script>

<template>
  <div class="leaders-tab">
    <div v-if="leaders.length === 0" class="leaders-tab__empty">
      <p>Leaders will be available once the match begins.</p>
    </div>

    <div v-else class="leaders-tab__list">
      <div v-for="(leader, idx) in leaders" :key="idx" class="leader-row">
        <CountryFlag :iso2="leader.iso2" :size="20" class="shrink-0" />
        <div class="leader-row__info">
          <span class="leader-row__name">{{ leader.name }}</span>
          <span class="leader-row__stat">{{ leader.stat }}</span>
        </div>
        <span class="leader-row__value">{{ leader.value }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .leaders-tab__empty {
    @apply py-12 text-center text-white/40;
  }

  .leaders-tab__list {
    @apply space-y-2;
  }

  .leader-row {
    @apply flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2;
  }

  .leader-row__info {
    @apply flex flex-1 flex-col;
  }

  .leader-row__name {
    @apply text-sm font-semibold text-white;
  }

  .leader-row__stat {
    @apply text-xs text-white/40;
  }

  .leader-row__value {
    @apply text-sm font-black text-white;
  }
</style>
