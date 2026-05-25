<script setup lang="ts">
  import { useStandings } from '../composables/useStandings'

  const { groups, pending } = useStandings()

  const emit = defineEmits<{ (e: 'select-group', letter: string): void }>()
</script>

<template>
  <section class="groups-section">
    <h2 class="groups-section__title">Group Stage</h2>

    <div v-if="pending" class="groups-section__loading">
      <div class="groups-section__spinner" />
    </div>

    <div v-else class="groups-section__grid">
      <div
        v-for="group in groups"
        :key="group.letter"
        class="group-card"
        @click="emit('select-group', group.letter)"
      >
        <div class="group-card__header">
          <span class="group-card__letter">{{ group.letter }}</span>
          <span class="group-card__label">Group {{ group.letter }}</span>
        </div>

        <table class="group-card__table">
          <thead>
            <tr>
              <th class="group-card__th group-card__th--team">Team</th>
              <th class="group-card__th">P</th>
              <th class="group-card__th">W</th>
              <th class="group-card__th">D</th>
              <th class="group-card__th">L</th>
              <th class="group-card__th">GD</th>
              <th class="group-card__th group-card__th--pts">Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(entry, idx) in group.entries"
              :key="entry.teamName"
              class="group-card__row"
              :class="{ 'group-card__row--qualify': idx < 2 }"
            >
              <td class="group-card__td group-card__td--team">
                <CountryFlag :iso2="entry.iso2" :size="20" class="shrink-0" />
                <span class="group-card__team-name">{{ entry.abbrev }}</span>
              </td>
              <td class="group-card__td">{{ entry.played }}</td>
              <td class="group-card__td">{{ entry.wins }}</td>
              <td class="group-card__td">{{ entry.draws }}</td>
              <td class="group-card__td">{{ entry.losses }}</td>
              <td class="group-card__td">
                {{ entry.goalDiff > 0 ? '+' : '' }}{{ entry.goalDiff }}
              </td>
              <td class="group-card__td group-card__td--pts">
                {{ entry.points }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .groups-section {
    @apply space-y-4;
  }

  .groups-section__title {
    @apply text-lg font-bold text-white/80;
  }

  .groups-section__loading {
    @apply flex justify-center py-8;
  }

  .groups-section__spinner {
    @apply h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70;
  }

  .groups-section__grid {
    @apply grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
  }

  .group-card {
    @apply cursor-pointer rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10;
  }

  .group-card__header {
    @apply mb-2 flex items-center gap-2;
  }

  .group-card__letter {
    @apply flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm font-black text-white;
  }

  .group-card__label {
    @apply text-xs font-bold tracking-wider text-white/50 uppercase;
  }

  .group-card__table {
    @apply w-full text-xs;
  }

  .group-card__th {
    @apply pb-1 text-right font-semibold text-white/30;
  }

  .group-card__th--team {
    @apply text-left;
  }

  .group-card__th--pts {
    @apply font-black text-white/50;
  }

  .group-card__row {
    @apply border-t border-white/5;
  }

  .group-card__row--qualify {
    @apply bg-emerald-950/20;
  }

  .group-card__td {
    @apply py-1 text-right text-white/70;
  }

  .group-card__td--team {
    @apply flex items-center gap-1.5 text-left;
  }

  .group-card__td--pts {
    @apply font-black text-white;
  }

  .group-card__team-name {
    @apply font-semibold text-white;
  }
</style>
