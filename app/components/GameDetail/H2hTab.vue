<script setup lang="ts">
  import type { Match } from '../../composables/useScores'

  const props = defineProps<{
    detail: Record<string, unknown>
    match: Match
  }>()

  interface H2HGame {
    date: string
    homeTeam: string
    awayTeam: string
    homeScore: string
    awayScore: string
    competition: string
  }

  const h2hGames = computed<H2HGame[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h2h = props.detail?.h2h as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = (h2h?.events ?? h2h?.previousEvents ?? []) as any[]
    return events.slice(0, 10).map((ev) => {
      const comp = ev.competitions?.[0] ?? {}
      const competitors = comp.competitors ?? []
      const home =
        competitors.find(
          (competitor: { homeAway?: string }) => competitor.homeAway === 'home'
        ) ??
        competitors[0] ??
        {}
      const away =
        competitors.find(
          (competitor: { homeAway?: string }) => competitor.homeAway === 'away'
        ) ??
        competitors[1] ??
        {}
      return {
        date: ev.date ?? '',
        homeTeam: home.team?.displayName ?? '',
        awayTeam: away.team?.displayName ?? '',
        homeScore: home.score ?? '—',
        awayScore: away.score ?? '—',
        competition: ev.season?.displayName ?? ev.name ?? '',
      }
    })
  })
</script>

<template>
  <div class="h2h-tab">
    <div v-if="h2hGames.length === 0" class="h2h-tab__empty">
      <p>No head-to-head history available.</p>
    </div>

    <div v-else class="h2h-tab__list">
      <div v-for="(game, idx) in h2hGames" :key="idx" class="h2h-row">
        <span class="h2h-row__date">
          {{
            new Date(game.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          }}
        </span>
        <div class="h2h-row__match">
          <span class="h2h-row__team">{{ game.homeTeam }}</span>
          <span class="h2h-row__score"
            >{{ game.homeScore }} – {{ game.awayScore }}</span
          >
          <span class="h2h-row__team h2h-row__team--away">{{
            game.awayTeam
          }}</span>
        </div>
        <span class="h2h-row__comp">{{ game.competition }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .h2h-tab__empty {
    @apply py-12 text-center text-white/40;
  }

  .h2h-tab__list {
    @apply space-y-2;
  }

  .h2h-row {
    @apply rounded-lg bg-white/5 px-3 py-2;
  }

  .h2h-row__date {
    @apply block text-xs text-white/30;
  }

  .h2h-row__match {
    @apply flex items-center gap-2 py-1;
  }

  .h2h-row__team {
    @apply flex-1 text-sm font-semibold text-white;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
  }

  .h2h-row__team--away {
    @apply text-right;
  }

  .h2h-row__score {
    @apply shrink-0 text-sm font-black text-white tabular-nums;
  }

  .h2h-row__comp {
    @apply block text-xs text-white/30;
  }
</style>
