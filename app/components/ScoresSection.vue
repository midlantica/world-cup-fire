<script setup lang="ts">
  import { useScores } from '../composables/useScores'
  import { useMatchDetail } from '../composables/useMatchDetail'
  import { useCountryDetail } from '../composables/useCountryDetail'

  const { matches, matchesByDay, pending, error } = useScores()
  const { openMatch } = useMatchDetail()
  const { openCountry } = useCountryDetail()

  function formatDayHeader(day: string): string {
    // day is already YYYY-MM-DD in the selected timezone — parse at noon UTC
    // to avoid any date-boundary issues when converting to display string
    return new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  // Track collapsed state per day key; all start expanded
  const collapsed = ref<Set<string>>(new Set())

  function toggleDay(day: string) {
    const next = new Set(collapsed.value)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    collapsed.value = next
  }
</script>

<template>
  <section class="scores-section">
    <!-- Loading -->
    <div v-if="pending" class="scores-section__loading">
      <div class="scores-section__spinner" />
      <span>Loading matches…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="scores-section__error">
      Failed to load matches. Please try again.
    </div>

    <!-- No matches -->
    <div v-else-if="matches.length === 0" class="scores-section__empty">
      <p>No matches scheduled for this period.</p>
    </div>

    <template v-else>
      <!-- Matches by day -->
      <div class="scores-section__days">
        <div
          v-for="[day, dayMatches] in matchesByDay"
          :key="day"
          class="scores-section__day"
        >
          <button class="scores-section__day-header" @click="toggleDay(day)">
            <svg
              class="scores-section__day-caret"
              :class="{
                'scores-section__day-caret--collapsed': collapsed.has(day),
              }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span class="scores-section__day-title">{{
              formatDayHeader(day)
            }}</span>
            <span class="scores-section__day-count"
              >{{ dayMatches.length }} match{{
                dayMatches.length !== 1 ? 'es' : ''
              }}</span
            >
          </button>

          <div v-if="!collapsed.has(day)" class="scores-section__grid">
            <MatchCard
              v-for="match in dayMatches"
              :key="match.id"
              :match="match"
              @click="openMatch(match)"
              @click-country="openCountry"
            />
          </div>
        </div>
      </div>
      <!-- /.scores-section__days -->
    </template>
  </section>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── States ──────────────────────────────────────────────────────────────── */
  .scores-section__loading {
    @apply flex items-center gap-3 py-12 text-white/50;
  }

  .scores-section__spinner {
    @apply h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70;
  }

  .scores-section__error {
    @apply rounded-xl bg-red-900/20 p-6 text-center text-red-300;
  }

  .scores-section__empty {
    @apply py-16 text-center text-white/40;
  }

  /* ── Day groups ──────────────────────────────────────────────────────────── */
  .scores-section__days {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .scores-section__day {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .scores-section__day-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }

  .scores-section__day-caret {
    width: 1.25rem;
    height: 1.25rem;
    color: rgb(255 255 255 / 0.5);
    display: inline-block;
    transform: rotate(0deg);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .scores-section__day-caret--collapsed {
    transform: rotate(-90deg);
  }

  .scores-section__day-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: rgb(255 255 255 / 0.9);
    letter-spacing: 0.075em;
    text-transform: uppercase;
    @apply font-anybody-wide;
  }

  .scores-section__day-count {
    @apply text-xs font-normal text-white/40;
  }

  .scores-section__grid {
    @apply grid gap-3 sm:grid-cols-2 lg:grid-cols-3;
  }
</style>
