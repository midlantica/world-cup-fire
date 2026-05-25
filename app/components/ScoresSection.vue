<script setup lang="ts">
  import { useScores, WC_TABS } from '../composables/useScores'
  import { useMatchDetail } from '../composables/useMatchDetail'
  const { activeTab, matches, matchesByDay, pending, error } = useScores()
  const { openMatch } = useMatchDetail()

  // Fire matches (not yet finished)
  const fireMatches = computed(() =>
    matches.value.filter((m) => m.badge === 'fire' && m.status.code !== 'ft')
  )
</script>

<template>
  <section class="scores-section">
    <!-- Tab bar -->
    <div class="scores-section__tabs">
      <button
        v-for="tab in WC_TABS"
        :key="tab.key"
        class="scores-section__tab"
        :class="{ 'scores-section__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="scores-section__tab-label">{{ tab.label }}</span>
        <span class="scores-section__tab-dates">{{ tab.dateRange }}</span>
      </button>
    </div>

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
      <!-- 🔥 Fire games callout -->
      <div v-if="fireMatches.length > 0" class="scores-section__fire-banner">
        <span class="text-xl">🔥</span>
        <span class="font-bold">Fire games this week:</span>
        <span class="text-white/70">
          {{ fireMatches.map((m) => `${m.home} vs ${m.away}`).join(' · ') }}
        </span>
      </div>

      <!-- Matches by day -->
      <div
        v-for="[day, dayMatches] in matchesByDay"
        :key="day"
        class="scores-section__day"
      >
        <h3 class="scores-section__day-label">
          {{
            new Date(day + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })
          }}
          <span class="scores-section__day-count"
            >{{ dayMatches.length }} match{{
              dayMatches.length !== 1 ? 'es' : ''
            }}</span
          >
        </h3>

        <div class="scores-section__grid">
          <MatchCard
            v-for="match in dayMatches"
            :key="match.id"
            :match="match"
            @click="openMatch(match)"
          />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .scores-section {
    @apply space-y-6;
  }

  /* ── Tab bar ─────────────────────────────────────────────────────────────── */
  .scores-section__tabs {
    @apply flex gap-1 overflow-x-auto rounded-xl bg-white/5 p-1;
    scrollbar-width: none;
  }

  .scores-section__tabs::-webkit-scrollbar {
    display: none;
  }

  .scores-section__tab {
    @apply flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-center transition-all;
    @apply text-white/50 hover:text-white/80;
    /* prevent tabs from getting too narrow on mobile */
    min-width: 5rem;
  }

  .scores-section__tab--active {
    @apply bg-white/15 text-white shadow;
  }

  .scores-section__tab-label {
    @apply text-sm leading-tight font-semibold;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
  }

  .scores-section__tab-dates {
    @apply text-xs leading-tight opacity-70;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    white-space: nowrap;
  }

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

  /* ── Fire banner ─────────────────────────────────────────────────────────── */
  .scores-section__fire-banner {
    @apply flex flex-wrap items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-950/30 px-4 py-3 text-sm text-white;
  }

  /* ── Day groups ──────────────────────────────────────────────────────────── */
  .scores-section__day {
    @apply space-y-3;
  }

  .scores-section__day-label {
    @apply flex items-baseline gap-3 text-base font-bold text-white/80;
  }

  .scores-section__day-count {
    @apply text-xs font-normal text-white/40;
  }

  .scores-section__grid {
    @apply grid gap-3 sm:grid-cols-2 lg:grid-cols-3;
  }
</style>
