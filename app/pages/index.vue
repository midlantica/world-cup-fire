<script setup lang="ts">
  import { nowDate } from '~/composables/useMockTime'
  import { useScores, WC_TABS } from '~/composables/useScores'

  useHead({
    title: 'World Cup Fire 🔥 — 2026 FIFA World Cup Match Tracker',
    meta: [
      {
        name: 'description',
        content:
          'Find the 🔥 fire matches at the 2026 FIFA World Cup. Live scores, group standings, and match quality ratings.',
      },
    ],
  })

  const TOURNAMENT_START = new Date('2026-06-11T19:00:00Z')
  const wcStarted = ref(nowDate() >= TOURNAMENT_START)

  // Keep in sync with mock-time changes (polls every 5s like TournamentBanner)
  let _timer: ReturnType<typeof setInterval> | null = null
  onMounted(() => {
    if (!wcStarted.value) {
      _timer = setInterval(() => {
        wcStarted.value = nowDate() >= TOURNAMENT_START
        if (wcStarted.value && _timer) {
          clearInterval(_timer)
          _timer = null
        }
      }, 5_000)
    }
  })
  onUnmounted(() => {
    if (_timer) clearInterval(_timer)
  })

  // ── Reset to current week on every visit ─────────────────────────────────
  // When navigating to the Matches page (e.g. from Pools), always jump to the
  // week that contains today's matches so the user lands on live/upcoming games.
  const { activeTab } = useScores()

  function defaultTab() {
    const now = nowDate()
    const DAY_MS = 24 * 60 * 60 * 1000
    for (const tab of WC_TABS) {
      // tab.end is midnight (start of that day); add 1 day to include the full
      // final day of each week (same fix as useScores.ts defaultTab).
      if (now >= tab.start && now < new Date(tab.end.getTime() + DAY_MS))
        return tab.key
    }
    if (now < WC_TABS[0]!.start) return 'week1'
    return 'week6'
  }

  onMounted(() => {
    activeTab.value = defaultTab()
  })
</script>

<template>
  <div class="home-page">
    <div class="home-page__inner">
      <!-- Main: Scores wall -->
      <main class="home-page__main">
        <!-- Pre-WC: yellow countdown banner only -->
        <CountdownBanner v-if="!wcStarted" />
        <!-- Post-WC start: dark "48 nations · Join a Pool" banner only -->
        <TournamentBanner v-else />
        <ScoresSection />
      </main>
    </div>

    <!-- Modals -->
    <CountryDetailModal />
    <GroupDetailModal />
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .home-page {
    margin-top: 0;
  }

  .home-page__inner {
    @apply mx-auto max-w-7xl px-3;
    padding-top: 0;
    /* Extra bottom padding so the sticky picks banner doesn't obscure the last match cards */
    padding-bottom: 6rem;
  }

  .home-page__main {
    @apply w-full;
  }
</style>
