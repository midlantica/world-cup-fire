<script setup lang="ts">
  import { useStandings } from '../composables/useStandings'
  import { useCountryDetail } from '../composables/useCountryDetail'
  import { useGroupDetail } from '../composables/useGroupDetail'

  const { groups, pending } = useStandings()
  const { openCountry } = useCountryDetail()
  const { openGroup } = useGroupDetail()
</script>

<template>
  <section class="groups-section">
    <div class="groups-section__heading">
      <h2 class="groups-section__title">Groups</h2>
      <p class="groups-section__qualify-note">
        <span class="groups-section__qualify-dot" />
        Top 2 advance to Round of 32
      </p>
    </div>

    <div v-if="pending" class="groups-section__loading">
      <div class="groups-section__spinner" />
    </div>

    <div v-else class="groups-section__grid">
      <div
        v-for="group in groups"
        :key="group.letter"
        class="group-card"
        @click="openGroup(group.letter)"
      >
        <div class="group-card__header">
          <span class="group-card__label">Group {{ group.letter }}</span>
        </div>

        <table class="group-card__table">
          <colgroup>
            <col class="group-card__col--team" />
            <col class="group-card__col--stat" />
            <col class="group-card__col--stat" />
            <col class="group-card__col--stat" />
            <col class="group-card__col--stat" />
            <col class="group-card__col--gd" />
            <col class="group-card__col--pts" />
          </colgroup>
          <thead>
            <tr>
              <th class="group-card__th group-card__th--team">Team</th>
              <th class="group-card__th group-card__th--stat">P</th>
              <th class="group-card__th group-card__th--stat">W</th>
              <th class="group-card__th group-card__th--stat">D</th>
              <th class="group-card__th group-card__th--stat">L</th>
              <th class="group-card__th group-card__th--stat">GD</th>
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
                <span
                  class="group-card__team-name group-card__team-name--link"
                  @click.stop="openCountry(entry.teamName)"
                  >{{ entry.shortName }}</span
                >
              </td>
              <td class="group-card__td group-card__td--stat">
                {{ entry.played }}
              </td>
              <td class="group-card__td group-card__td--stat">
                {{ entry.wins }}
              </td>
              <td class="group-card__td group-card__td--stat">
                {{ entry.draws }}
              </td>
              <td class="group-card__td group-card__td--stat">
                {{ entry.losses }}
              </td>
              <td class="group-card__td group-card__td--stat">
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
    @apply space-y-2;
  }

  .groups-section__heading {
    @apply flex items-baseline gap-3;
  }

  .groups-section__title {
    @apply py-0 text-lg font-bold text-white/80;
    @apply font-anybody-semi;
  }

  .groups-section__qualify-note {
    @apply flex items-center gap-1.5 text-xs text-white/40;
  }

  .groups-section__qualify-dot {
    @apply inline-block h-2 w-2 flex-shrink-0 rounded-sm bg-emerald-500/60;
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
    padding-bottom: 0.5rem;
  }

  .group-card__header {
    @apply flex items-center gap-2 overflow-hidden rounded-t-xl;
    padding-inline: 0.7rem;
    padding-block: 0.4rem 0.25rem;
    background: linear-gradient(
      180deg,
      rgb(0 0 0 / 0.45) 0%,
      rgb(0 0 0 / 0.1) 100%
    );
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    margin: -0.75rem -0.75rem 0.5rem;
  }

  .group-card__letter {
    @apply flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-black text-white;
  }

  .group-card__label {
    @apply font-bold;
    font-size: 0.85rem;
    letter-spacing: 0.06em;
    color: color-mix(in oklab, #fff 90%, transparent);
    @apply font-anybody-bold;
  }

  .group-card__table {
    @apply w-full;
    table-layout: fixed;
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    letter-spacing: 0.08em !important;
  }

  /* Column widths — team col fills remaining space, stats are fixed narrow */
  .group-card__col--team {
    /* fills remaining width */
  }

  .group-card__col--stat {
    width: 1.5rem;
  }

  .group-card__col--gd {
    width: 2rem;
  }

  .group-card__col--pts {
    width: 1.75rem;
  }

  .group-card__th {
    padding-top: 0;
    padding-bottom: 0.3rem;
    text-align: center;
    color: rgb(255 255 255 / 0.7);
    @apply font-semibold;
    line-height: 1;
    vertical-align: bottom;
  }

  .group-card__th--team {
    @apply text-left;
    width: 99%;
    padding-right: 0.75rem;
  }

  .group-card__th--stat {
    text-align: center;
  }

  .group-card__th--pts {
    text-align: right;
    @apply font-black;
    color: rgb(255 255 255 / 0.65);
    @apply font-anybody-semi;
  }

  .group-card__row {
    @apply border-t border-white/5;
  }

  .group-card__row--qualify {
    @apply bg-emerald-900/25;
  }

  .group-card__td {
    @apply py-1 tabular-nums;
    text-align: center;
    color: rgb(255 255 255 / 0.7);
  }

  .group-card__td--team {
    @apply flex min-w-0 items-center gap-1.5 text-left;
    padding-right: 0.75rem;
  }

  .group-card__td--stat {
    text-align: center;
  }

  .group-card__td--pts {
    text-align: right;
    @apply font-black text-white;
    @apply font-anybody-semi;
  }

  .group-card__team-name {
    @apply min-w-0 truncate text-white;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    letter-spacing: 0.07em;
  }

  .group-card__team-name--link {
    cursor: pointer;
    border-radius: 0.15rem;
    transition: opacity 0.12s;
  }

  .group-card__team-name--link:hover {
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: rgb(255 255 255 / 0.4);
  }
</style>
