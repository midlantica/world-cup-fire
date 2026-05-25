<script setup lang="ts">
  import type { Match } from '../../composables/useScores'

  const props = defineProps<{
    detail: Record<string, unknown>
    match: Match
  }>()

  interface StatRow {
    label: string
    home: string | number
    away: string | number
    homeVal: number
    awayVal: number
  }

  const stats = computed<StatRow[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boxscore = props.detail?.boxscore as any
    const teams = boxscore?.teams as unknown[] | undefined
    if (!teams || teams.length < 2) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const homeStats = (teams[0] as any)?.statistics ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awayStats = (teams[1] as any)?.statistics ?? []

    const rows: StatRow[] = []
    for (let i = 0; i < homeStats.length; i++) {
      const h = homeStats[i]
      const a = awayStats[i]
      if (!h || !a) continue
      rows.push({
        label: h.label ?? h.name,
        home: h.displayValue ?? h.value,
        away: a.displayValue ?? a.value,
        homeVal: Number(h.value) || 0,
        awayVal: Number(a.value) || 0,
      })
    }
    return rows
  })

  function barWidth(val: number, other: number): string {
    const total = val + other
    if (total === 0) return '50%'
    return `${Math.round((val / total) * 100)}%`
  }
</script>

<template>
  <div class="stats-tab">
    <div v-if="stats.length === 0" class="stats-tab__empty">
      <p>Stats will be available once the match begins.</p>
    </div>

    <div v-else class="stats-tab__rows">
      <div v-for="stat in stats" :key="stat.label" class="stat-row">
        <div class="stat-row__labels">
          <span class="stat-row__val stat-row__val--home">{{ stat.home }}</span>
          <span class="stat-row__label">{{ stat.label }}</span>
          <span class="stat-row__val stat-row__val--away">{{ stat.away }}</span>
        </div>
        <div class="stat-row__bar-track">
          <div
            class="stat-row__bar stat-row__bar--home"
            :style="{ width: barWidth(stat.homeVal, stat.awayVal) }"
          />
          <div
            class="stat-row__bar stat-row__bar--away"
            :style="{ width: barWidth(stat.awayVal, stat.homeVal) }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .stats-tab__empty {
    @apply py-12 text-center text-white/40;
  }

  .stats-tab__rows {
    @apply space-y-4;
  }

  .stat-row__labels {
    @apply flex items-center justify-between text-sm;
  }

  .stat-row__val {
    @apply w-12 font-bold text-white;
  }

  .stat-row__val--home {
    @apply text-left;
  }

  .stat-row__val--away {
    @apply text-right;
  }

  .stat-row__label {
    @apply text-xs text-white/50;
  }

  .stat-row__bar-track {
    @apply mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/10;
  }

  .stat-row__bar--home {
    @apply h-full rounded-l-full bg-orange-400 transition-all duration-500;
  }

  .stat-row__bar--away {
    @apply h-full rounded-r-full bg-sky-400 transition-all duration-500;
  }
</style>
