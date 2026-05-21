<script setup lang="ts">
  import { useScores, transformMatches } from '~/composables/useScores'
  import { useStandings } from '~/composables/useStandings'
  import { useStats } from '~/composables/useStats'
  import type { Match } from '~/composables/useScores'

  // ── Main tab ──────────────────────────────────────────────────────────────────
  type MainTab = 'scores' | 'standings' | 'stats'
  const VALID_TABS: MainTab[] = ['scores', 'standings', 'stats']

  function tabFromHash(): MainTab {
    if (import.meta.server) return 'scores'
    const hash = window.location.hash.replace('#', '') as MainTab
    return VALID_TABS.includes(hash) ? hash : 'scores'
  }

  const mainTab = ref<MainTab>('scores')

  // ── Scores composable ─────────────────────────────────────────────────────────
  const { weeks, activeTab, lastUpdated, fetchWeek, selectTab } = useScores()

  // ── SSR pre-fetch: seed "this week" data before first paint ──────────────────Lineup not yet available
  // Runs on the server (and once on the client for hydration). Populates the
  // shared useState so ScoresSection renders immediately without a loading gap.
  await useAsyncData('scores-this', async () => {
    if (weeks.this.loaded) return null // already seeded (client re-run)
    try {
      const data = await $fetch<Record<string, unknown>>(
        '/api/scores?week=this'
      )
      if (!data._error) {
        weeks.this.matches = transformMatches(data)
        weeks.this.label = (data._weekLabel as string) || weeks.this.label
        weeks.this.hiatus = (data._hiatus as string) ?? null
        weeks.this.loaded = true
      }
    } catch {
      // silently ignore — client-side initialLoad will retry
    }
    return null
  })

  // ── Standings composable ──────────────────────────────────────────────────────
  const {
    conferences,
    loading: standingsLoading,
    error: standingsError,
    loaded: standingsLoaded,
    fetchStandings,
  } = useStandings()

  // ── Stats composable ──────────────────────────────────────────────────────────
  const { loaded: statsLoaded, fetchStats } = useStats()

  // ── Game detail modal state ───────────────────────────────────────────────────
  const gameDetailOpen = ref(false)
  const gameDetailMatch = ref<Match | null>(null)

  function openGameDetail(match: Match) {
    gameDetailMatch.value = match
    gameDetailOpen.value = true
    pushModalHash('game', match.id)
  }

  function closeGameDetail() {
    // If the current history entry is this modal, pop it so back/forward stays in sync.
    // onPopState will handle the actual state update.
    const state = window.history.state as { modal?: string } | null
    if (state?.modal === 'game') {
      window.history.back()
    } else {
      gameDetailOpen.value = false
      gameDetailMatch.value = null
    }
  }

  // Silent close — used when transitioning directly to another modal so we
  // replace the current history entry rather than popping it asynchronously.
  function closeGameDetailSilent() {
    gameDetailOpen.value = false
    gameDetailMatch.value = null
  }

  // ── Team modal state ──────────────────────────────────────────────────────────
  const teamModalOpen = ref(false)
  const viewTeam = ref<string | null>(null)

  function openTeamModal() {
    teamModalOpen.value = true
    pushModalHash('team', '__myteam__')
  }

  function openTeamModalFor(teamName: string) {
    viewTeam.value = teamName
    teamModalOpen.value = true
    pushModalHash('team', teamName)
  }

  function closeTeamModal() {
    // If the current history entry is this modal, pop it so back/forward stays in sync.
    // onPopState will handle the actual state update.
    const state = window.history.state as { modal?: string } | null
    if (state?.modal === 'team') {
      window.history.back()
    } else {
      teamModalOpen.value = false
      viewTeam.value = null
    }
  }

  // Silent close — used internally when we're about to push a new history entry
  // (e.g. switching from team modal → standings tab) so we don't double-pop.
  function closeTeamModalSilent() {
    teamModalOpen.value = false
    viewTeam.value = null
  }

  async function goToStandings(conferenceName: string) {
    closeTeamModalSilent()
    await switchMainTab('standings')
    await nextTick()
    const headings = document.querySelectorAll('.conf-title')
    for (const el of headings) {
      if (
        el.textContent
          ?.trim()
          .toLowerCase()
          .includes(conferenceName.toLowerCase().split(' ')[0] ?? '')
      ) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      }
    }
  }

  // ── Modal history helpers ─────────────────────────────────────────────────────
  // Push a history entry for an open modal so the back button closes it.
  // State shape: { tab, modal: 'game' | 'team', modalId: string }
  function pushModalHash(kind: 'game' | 'team', id: string) {
    const tab = mainTab.value
    const tabHash = tab === 'scores' ? '' : `#${tab}`
    const url = window.location.pathname + window.location.search + tabHash
    window.history.pushState({ tab, modal: kind, modalId: id }, '', url)
  }

  // ── Hash-based navigation (back/forward support) ──────────────────────────────
  function pushHash(tab: MainTab) {
    const hash = tab === 'scores' ? '' : `#${tab}`
    const url = window.location.pathname + window.location.search + hash
    window.history.pushState({ tab }, '', url)
  }

  function onPopState(e: PopStateEvent) {
    const state = e.state as {
      tab?: MainTab
      modal?: 'game' | 'team'
      modalId?: string
    } | null

    // ── Forward into a modal state ────────────────────────────────────────────
    if (state?.modal === 'game' && state.modalId) {
      // Re-open the game detail modal if we have the match cached
      const allMatches = [
        ...weeks.this.matches,
        ...weeks.last.matches,
        ...weeks.next.matches,
      ]
      const match = allMatches.find((m) => m.id === state.modalId)
      if (match) {
        gameDetailOpen.value = true
        gameDetailMatch.value = match
      }
      applyTab(state.tab ?? 'scores')
      return
    }

    if (state?.modal === 'team' && state.modalId) {
      // Re-open the team modal
      if (state.modalId === '__myteam__') {
        viewTeam.value = null
      } else {
        viewTeam.value = state.modalId
      }
      teamModalOpen.value = true
      applyTab(state.tab ?? 'scores')
      return
    }

    // ── Back from a modal — close whichever is open ───────────────────────────
    if (gameDetailOpen.value) {
      gameDetailOpen.value = false
      gameDetailMatch.value = null
    }
    if (teamModalOpen.value) {
      teamModalOpen.value = false
      viewTeam.value = null
    }

    const tab = state?.tab ?? tabFromHash()
    applyTab(tab)
  }

  // Apply a tab without pushing history (used for popstate / initial load)
  async function applyTab(tab: MainTab) {
    mainTab.value = tab
    if (tab === 'standings' && !standingsLoaded.value) {
      await fetchStandings()
    }
    if (tab === 'stats' && !statsLoaded.value) {
      await fetchStats()
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────────
  function goHome() {
    mainTab.value = 'scores'
    selectTab('this')
    pushHash('scores')
  }

  async function switchMainTab(tab: MainTab) {
    await applyTab(tab)
    pushHash(tab)
  }

  // ── Auto-poll every 30 s when live matches are on screen ──────────────────────
  watch(lastUpdated, (val) => {
    if (val) console.log(`[MLS Scores] Updated ${val}`)
  })

  const hasLiveMatches = computed(() =>
    weeks[activeTab.value].matches.some(
      (m) => m.status.code === 'live' || m.status.code === 'ht'
    )
  )

  let pollTimer: ReturnType<typeof setInterval> | null = null

  function startPoll() {
    if (pollTimer) return
    pollTimer = setInterval(() => {
      if (hasLiveMatches.value && mainTab.value === 'scores') {
        fetchWeek(activeTab.value)
      }
    }, 30_000)
  }

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  // ── Initial load (client-side) ────────────────────────────────────────────────
  // SSR already seeded "this week" via useAsyncData above. This runs on mount
  // to apply the tab-selection logic (redirect to last/next if needed) and
  // to refresh stale data.
  async function initialLoad() {
    await fetchWeek('this')

    const thisMatches = weeks.this.matches
    if (thisMatches.length === 0) {
      // No games at all this week — show last week
      activeTab.value = 'last'
      await fetchWeek('last')
    } else {
      const hasUpcoming = thisMatches.some((m) => m.status.code === 'ns')
      const hasLive = thisMatches.some(
        (m) => m.status.code === 'live' || m.status.code === 'ht'
      )
      // NOTE: .every() returns true on empty arrays — guard with length check
      const allDone =
        thisMatches.length > 0 &&
        thisMatches.every((m) => m.status.code === 'ft')
      if (allDone && !hasUpcoming && !hasLive) {
        // Every game this week is finished and nothing is pending — show next week
        activeTab.value = 'next'
        await fetchWeek('next')
      }
      // Otherwise stay on "this week" — upcoming/live games are still to show
    }
  }

  onMounted(async () => {
    // Seed the initial history state so popstate works from the very first entry
    const initialTab = tabFromHash()
    window.history.replaceState({ tab: initialTab }, '', window.location.href)
    await applyTab(initialTab)

    window.addEventListener('popstate', onPopState)

    await initialLoad()
    startPoll()
  })

  onUnmounted(() => {
    stopPoll()
    window.removeEventListener('popstate', onPopState)
  })
</script>

<template>
  <main class="page">
    <!-- ── Header (client-only: timezone detection) ──────────────────────── -->
    <ClientOnly>
      <AppHeader @go-home="goHome" @open-team-modal="openTeamModal" />
    </ClientOnly>

    <!-- ── Main tabs: Scores / Standings ────────────────────────────────── -->
    <div class="main-tabs">
      <button
        class="main-tab"
        :class="{ active: mainTab === 'scores' }"
        @click="switchMainTab('scores')"
      >
        Scores
      </button>
      <button
        class="main-tab"
        :class="{ active: mainTab === 'standings' }"
        @click="switchMainTab('standings')"
      >
        Standings
      </button>
      <button
        class="main-tab"
        :class="{ active: mainTab === 'stats' }"
        @click="switchMainTab('stats')"
      >
        Stats
      </button>
      <div class="tabs-spacer" />
      <!-- TeamPicker is client-only: reads localStorage for saved team -->
      <ClientOnly>
        <TeamPicker class="team-picker-in-tabs" @open-modal="openTeamModal" />
      </ClientOnly>
    </div>

    <!-- ── Content area (grows to fill viewport, keeps footer at bottom) ── -->
    <div class="content-area">
      <!-- ── Scores tab ────────────────────────────────────────────────── -->
      <section v-if="mainTab === 'scores'" class="tab-section">
        <ScoresSection
          @select-team="openTeamModalFor"
          @open-game-detail="openGameDetail"
        />
      </section>

      <!-- ── Stats tab ─────────────────────────────────────────────────── -->
      <section
        v-else-if="mainTab === 'stats'"
        class="tab-section stats-tab-section"
      >
        <StatsSection />
      </section>

      <!-- ── Standings tab ─────────────────────────────────────────────── -->
      <section
        v-else-if="mainTab === 'standings'"
        class="tab-section standings-section"
      >
        <div v-if="standingsLoading" class="skeleton-list">
          <div
            v-for="i in 4"
            :key="i"
            class="skeleton-row"
            style="height: 2rem"
          />
        </div>

        <div v-else-if="standingsError" class="error-box">
          {{ standingsError }}
        </div>

        <div v-else-if="conferences.length" class="conferences-grid">
          <StandingsTable
            v-for="conf in conferences"
            :key="conf.name"
            :conference="conf"
            @select-team="openTeamModalFor"
          />
        </div>
      </section>

      <!-- ── Footer ───────────────────────────────────────────────────── -->
      <AppFooter :show-score-legend="mainTab === 'scores'" />
    </div>

    <!-- ── My Team Modal (client-only) ──────────────────────────────────── -->
    <ClientOnly>
      <MyTeamModal
        :open="teamModalOpen"
        :view-team="viewTeam"
        @close="closeTeamModal"
        @select-team="openTeamModalFor"
        @view-standings="goToStandings"
        @open-game-detail="
          (match) => {
            closeTeamModalSilent()
            openGameDetail(match)
          }
        "
      />
    </ClientOnly>

    <!-- ── Game Detail Modal (client-only) ──────────────────────────────── -->
    <ClientOnly>
      <GameDetailModal
        :open="gameDetailOpen"
        :match="gameDetailMatch"
        @close="closeGameDetail"
        @select-team="
          (team) => {
            closeGameDetailSilent()
            openTeamModalFor(team)
          }
        "
      />
    </ClientOnly>
  </main>
</template>

<style scoped>
  .page {
    max-width: 56rem;
    margin: 0 auto;
    padding: 0.5rem 1rem 0.5rem;
  }

  @media (max-width: 420px) {
    .page {
      padding: 0.3rem 0.625rem 0.5rem;
    }
  }

  /* ── Content area ───────────────────────────────────────────────────────── */
  .content-area {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 8rem);
  }

  @media (max-width: 768px) {
    .content-area {
      min-height: calc(100vh - 8rem);
    }
  }

  .tab-section {
    flex: 1;
  }

  /* ── Main tabs ──────────────────────────────────────────────────────────── */
  .main-tabs {
    display: flex;
    align-items: stretch;
    gap: 0.25rem;
    border-bottom: 1px solid oklab(100% 0 0 / 0.08);
  }

  .tabs-spacer {
    flex: 1;
  }

  .team-picker-in-tabs {
    align-self: flex-end;
  }

  .main-tab {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.4rem 0.625rem;
    border-radius: 0.375rem 0.375rem 0 0;
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition:
      color 0.15s,
      background 0.15s;
    position: relative;
    bottom: -1px;
  }

  .main-tab:hover:not(.active) {
    color: var(--color-text-secondary);
  }

  .main-tab.active {
    color: var(--color-theme-300);
    border: 1px solid oklab(100% 0 0 / 0.1);
    border-bottom-color: var(--app-bg, oklch(12.9% 0.042 264.3));
    background: var(--color-theme-900);
  }

  /* ── Standings ──────────────────────────────────────────────────────────── */
  .standings-section {
    margin-top: 1rem;
  }

  .conferences-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 768px) {
    .conferences-grid {
      grid-template-columns: 1fr 1fr;
      gap: 2.5rem;
    }
  }

  /* ── Skeleton / error ───────────────────────────────────────────────────── */
  .initial-skeleton {
    padding-top: 0.5rem;
  }

  .skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .skeleton-row {
    height: 2.75rem;
    border-radius: 0.5rem;
    background: oklab(100% 0 0 / 0.05);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  .error-box {
    margin-bottom: 1rem;
    border-radius: 0.5rem;
    background: oklab(30.8% 0.072 0.028 / 0.3);
    border: 1px solid oklab(68.5% 0.13 0.048 / 0.2);
    padding: 0.625rem 1rem;
    font-size: 0.75rem;
    color: oklab(75.8% 0.107 0.04);
  }
</style>
