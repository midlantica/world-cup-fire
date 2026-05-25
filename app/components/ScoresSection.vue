<script setup lang="ts">
  import { useScores, type WeekTab } from '../composables/useScores'
  import { useMatchDetail } from '../composables/useMatchDetail'
  const { activeTab, matches, matchesByDay, pending, error } = useScores()
  const { openMatch } = useMatchDetail()

  const tabs: { key: WeekTab; label: string }[] = [
    { key: 'last', label: 'Last Week' },
    { key: 'this', label: 'This Week' },
    { key: 'next', label: 'Next Week' },
  ]

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
        v-for="tab in tabs"
        :key="tab.key"
        class="scores-section__tab"
        :class="{ 'scores-section__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
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
      <p>No matches scheduled for this week.</p>
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

  .scores-section__tabs {
    @apply flex gap-1 rounded-xl bg-white/5 p-1;
  }

  .scores-section__tab {
    @apply flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white/60 transition-all hover:text-white;
  }

  .scores-section__tab--active {
    @apply bg-white/15 text-white shadow;
  }

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

  .scores-section__fire-banner {
    @apply flex flex-wrap items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-950/30 px-4 py-3 text-sm text-white;
  }

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
