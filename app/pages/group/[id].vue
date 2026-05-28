<script setup lang="ts">
  import { useStandings } from '../../composables/useStandings'
  import { useScores } from '../../composables/useScores'
  import { useMatchDetail } from '../../composables/useMatchDetail'
  import { useCountryDetail } from '../../composables/useCountryDetail'

  const route = useRoute()
  const groupLetter = computed(() => String(route.params.id).toUpperCase())

  const { groupByLetter, pending: standingsPending } = useStandings()
  const { matches, pending: matchesPending } = useScores()
  const { openMatch } = useMatchDetail()
  const { openCountry } = useCountryDetail()

  const group = computed(() => groupByLetter.value.get(groupLetter.value))

  // All matches for this group across all weeks
  const groupMatches = computed(() =>
    matches.value.filter((m) => m.group === groupLetter.value)
  )

  useHead(
    computed(() => ({
      title: `Group ${groupLetter.value} — World Cup Fire 🔥`,
    }))
  )
</script>

<template>
  <div class="group-page">
    <div class="group-page__inner">
      <!-- Breadcrumb heading -->
      <h1 class="group-page__title">
        <NuxtLink to="/groups" class="group-page__breadcrumb-link"
          >Groups</NuxtLink
        >
        <ArrowIcon class="group-page__breadcrumb-arrow" />
        <span class="group-page__breadcrumb-current"
          >Group {{ groupLetter }}</span
        >
      </h1>

      <div v-if="standingsPending" class="group-page__loading">
        <div class="group-page__spinner" />
      </div>

      <template v-else-if="group">
        <!-- Standings table -->
        <div class="group-page__standings">
          <table class="standings-table">
            <thead>
              <tr>
                <th class="standings-table__th standings-table__th--pos">#</th>
                <th class="standings-table__th standings-table__th--team">
                  Team
                </th>
                <th class="standings-table__th">P</th>
                <th class="standings-table__th">W</th>
                <th class="standings-table__th">D</th>
                <th class="standings-table__th">L</th>
                <th class="standings-table__th">GF</th>
                <th class="standings-table__th">GA</th>
                <th class="standings-table__th">GD</th>
                <th class="standings-table__th standings-table__th--pts">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(entry, idx) in group.entries"
                :key="entry.teamName"
                class="standings-table__row"
                :class="{ 'standings-table__row--qualify': idx < 2 }"
              >
                <td class="standings-table__td standings-table__td--pos">
                  {{ idx + 1 }}
                </td>
                <td class="standings-table__td standings-table__td--team">
                  <CountryFlag :iso2="entry.iso2" :size="24" />
                  <button
                    class="standings-table__team-name standings-table__team-name--btn"
                    @click="openCountry(entry.teamName)"
                  >
                    {{ entry.teamName }}
                  </button>
                </td>
                <td class="standings-table__td">{{ entry.played }}</td>
                <td class="standings-table__td">{{ entry.wins }}</td>
                <td class="standings-table__td">{{ entry.draws }}</td>
                <td class="standings-table__td">{{ entry.losses }}</td>
                <td class="standings-table__td">{{ entry.goalsFor }}</td>
                <td class="standings-table__td">{{ entry.goalsAgainst }}</td>
                <td class="standings-table__td">
                  {{ entry.goalDiff > 0 ? '+' : '' }}{{ entry.goalDiff }}
                </td>
                <td class="standings-table__td standings-table__td--pts">
                  {{ entry.points }}
                </td>
              </tr>
            </tbody>
          </table>
          <p class="group-page__qualify-note">
            <span class="group-page__qualify-dot" /> Top 2 advance to Round of
            32
          </p>
        </div>

        <!-- Group matches -->
        <div class="group-page__matches">
          <h2 class="group-page__section-title">Matches</h2>

          <div v-if="matchesPending" class="group-page__loading">
            <div class="group-page__spinner" />
          </div>

          <div v-else-if="groupMatches.length === 0" class="group-page__empty">
            No matches scheduled for this week. Use the
            <NuxtLink to="/" class="text-orange-400 underline"
              >Matches</NuxtLink
            >
            tab to browse other weeks.
          </div>

          <div v-else class="group-page__match-grid">
            <MatchCard
              v-for="match in groupMatches"
              :key="match.id"
              :match="match"
              show-date
              @click="openMatch(match)"
            />
          </div>
        </div>
      </template>

      <div v-else class="group-page__not-found">
        Group {{ groupLetter }} not found.
      </div>
    </div>

    <GameDetailModal />
    <MyNationModal />
    <CountryDetailModal />
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .group-page {
    @apply min-h-screen;
  }

  .group-page__inner {
    @apply mx-auto max-w-4xl space-y-6;
    padding: 1rem 1rem 2rem;
  }

  .group-page__title {
    @apply flex items-center text-lg font-bold text-white/80;
    @apply font-anybody-semi;
    gap: 0.3em;
    margin-bottom: 0.5rem;
  }

  .group-page__breadcrumb-link {
    @apply text-white/40 no-underline transition-colors hover:text-white/80;
    font-size: inherit;
    font-weight: inherit;
    font-family: inherit;
  }

  .group-page__breadcrumb-arrow {
    @apply text-white;
    width: 1.1em;
    height: 1.1em;
    flex-shrink: 0;
  }

  .group-page__breadcrumb-current {
    @apply text-white;
    @apply font-anybody-semi;
    font-size: inherit;
  }

  .group-page__qualify-inline {
    @apply flex items-center gap-1.5 text-xs text-white/40;
  }

  .group-page__qualify-dot-inline {
    @apply inline-block h-2 w-2 shrink-0 rounded-sm bg-emerald-500/60;
  }

  .group-page__loading {
    @apply flex justify-center py-12;
  }

  .group-page__spinner {
    @apply h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70;
  }

  .group-page__standings {
    @apply overflow-hidden rounded-xl border border-white/10 bg-white/5;
  }

  .standings-table {
    @apply w-full text-sm;
  }

  .standings-table__th {
    @apply px-3 py-2 text-right text-xs font-semibold text-white/40;
  }

  .standings-table__th--pos {
    @apply text-center;
  }

  .standings-table__th--team {
    @apply text-left;
  }

  .standings-table__th--pts {
    @apply font-black text-white/60;
  }

  .standings-table__row {
    @apply border-t border-white/5 transition-colors hover:bg-white/5;
  }

  .standings-table__row--qualify {
    @apply bg-emerald-900/25;
  }

  .standings-table__td {
    @apply px-3 py-2.5 text-right text-white/70;
  }

  .standings-table__td--pos {
    @apply text-center font-bold text-white/30;
  }

  .standings-table__td--team {
    @apply flex items-center gap-2 text-left;
  }

  .standings-table__td--pts {
    @apply font-black text-white;
  }

  .standings-table__team-name {
    @apply text-white;
    font-weight: 680;
    font-variation-settings:
      'wdth' 100,
      'wght' 680;
  }

  .standings-table__team-name--btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    font-size: inherit;
    font-family: inherit;
    @apply underline-offset-2 transition-all hover:underline;
  }

  .group-page__qualify-note {
    @apply flex items-center gap-2 border-t border-white/5 px-3 py-2 text-xs text-white/30;
  }

  .group-page__qualify-dot {
    @apply inline-block h-2 w-2 rounded-full bg-emerald-500/50;
  }

  .group-page__section-title {
    @apply text-lg font-bold text-white/80;
  }

  .group-page__empty {
    @apply rounded-xl bg-white/5 p-6 text-center text-sm text-white/40;
  }

  .group-page__match-grid {
    @apply grid gap-3 sm:grid-cols-2;
  }

  .group-page__not-found {
    @apply py-16 text-center text-white/40;
  }

  .group-page__matches {
    @apply space-y-4;
  }
</style>
