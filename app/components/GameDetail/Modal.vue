<script setup lang="ts">
  import { useMatchDetail } from '../../composables/useMatchDetail'
  import { useCountryDetail } from '../../composables/useCountryDetail'
  import { useModalNav } from '../../composables/useModalNav'
  import { TEAM_BY_NAME } from '~/constants/worldcup'

  const { selectedMatch, modalOpen, closeMatch, detail, pending } =
    useMatchDetail()
  const { openCountry } = useCountryDetail()
  const { pushHistory, popHistory, clearHistory, canGoBack } = useModalNav()

  function goToCountry(name: string) {
    // Push current match onto history before navigating away
    if (selectedMatch.value) {
      pushHistory({ type: 'match', match: selectedMatch.value })
    }
    closeMatch()
    openCountry(name)
  }

  function goBack() {
    const prev = popHistory()
    if (!prev) return
    closeMatch()
    if (prev.type === 'country') {
      openCountry(prev.name)
    }
    // match → match back not needed currently
  }

  const activeTab = ref<'stats' | 'lineups' | 'h2h' | 'leaders'>('stats')

  // Reset tab when match changes
  watch(selectedMatch, () => {
    activeTab.value = 'stats'
  })

  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('gd-backdrop')) {
      closeMatch()
    }
  }

  const tabs = [
    { key: 'stats', label: 'Stats' },
    { key: 'lineups', label: 'Lineups' },
    { key: 'h2h', label: 'H2H' },
    { key: 'leaders', label: 'Leaders' },
  ] as const

  const kickoffLabel = computed(() => {
    if (!selectedMatch.value?.date) return ''
    return new Date(selectedMatch.value.date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  })

  // ── Fallback lineups ────────────────────────────────────────────────────────
  // When the WC match has no lineup data yet, fetch each team's last game lineup

  const homeTeamId = computed(
    () => TEAM_BY_NAME.get(selectedMatch.value?.home ?? '')?.id ?? null
  )
  const awayTeamId = computed(
    () => TEAM_BY_NAME.get(selectedMatch.value?.away ?? '')?.id ?? null
  )

  const hasLineupData = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (detail.value?.rosters as any[]) ?? []
    return rosters.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => (r?.roster ?? r?.athletes ?? []).length > 0
    )
  })

  // Step 1: fetch last completed match id for each team
  const { data: homeLastResults, execute: fetchHomeLastGame } = useLazyFetch(
    '/api/team-results',
    {
      query: computed(() => ({ teamId: homeTeamId.value ?? '', limit: 1 })),
      watch: false,
      immediate: false,
      server: false,
    }
  )
  const { data: awayLastResults, execute: fetchAwayLastGame } = useLazyFetch(
    '/api/team-results',
    {
      query: computed(() => ({ teamId: awayTeamId.value ?? '', limit: 1 })),
      watch: false,
      immediate: false,
      server: false,
    }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeLastEventId = computed(
    () => (homeLastResults.value as any)?.[0]?.id ?? null
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayLastEventId = computed(
    () => (awayLastResults.value as any)?.[0]?.id ?? null
  )

  // Step 2: fetch match detail for each team's last game
  const { data: homeLastDetail, execute: fetchHomeLastDetail } = useLazyFetch(
    '/api/match-detail',
    {
      query: computed(() => ({ eventId: homeLastEventId.value ?? '' })),
      watch: false,
      immediate: false,
      server: false,
    }
  )
  const { data: awayLastDetail, execute: fetchAwayLastDetail } = useLazyFetch(
    '/api/match-detail',
    {
      query: computed(() => ({ eventId: awayLastEventId.value ?? '' })),
      watch: false,
      immediate: false,
      server: false,
    }
  )

  // Trigger fetches when lineups tab is active and no WC lineup data exists
  watch(
    [activeTab, homeTeamId, awayTeamId],
    ([tab]) => {
      if (tab === 'lineups' && !hasLineupData.value) {
        if (homeTeamId.value && !homeLastResults.value) fetchHomeLastGame()
        if (awayTeamId.value && !awayLastResults.value) fetchAwayLastGame()
      }
    },
    { immediate: true }
  )

  watch(homeLastEventId, (id) => {
    if (id && activeTab.value === 'lineups' && !hasLineupData.value) {
      fetchHomeLastDetail()
    }
  })

  watch(awayLastEventId, (id) => {
    if (id && activeTab.value === 'lineups' && !hasLineupData.value) {
      fetchAwayLastDetail()
    }
  })
</script>

<template>
  <Teleport to="body">
    <Transition name="gd-modal">
      <div
        v-if="modalOpen && selectedMatch"
        class="gd-backdrop"
        @click="onBackdrop"
      >
        <div class="gd-panel">
          <!-- Header -->
          <div class="gd-header">
            <!-- Group link -->
            <button
              v-if="selectedMatch.group"
              class="gd-header__group-link"
              @click="
                () => {
                  closeMatch()
                  $router.push(`/group/${selectedMatch!.group!.toLowerCase()}`)
                }
              "
            >
              Group {{ selectedMatch.group }}
            </button>

            <!-- Teams row: Name Flag | vs/score | Flag Name -->
            <div class="gd-header__teams-row">
              <!-- Home side -->
              <button
                class="gd-header__side gd-header__side--home gd-header__team-btn"
                :title="`View ${selectedMatch.home}`"
                @click="goToCountry(selectedMatch.home)"
              >
                <span class="gd-header__team-name">{{
                  selectedMatch.home
                }}</span>
                <CountryFlag :iso2="selectedMatch.homeIso2" :size="32" />
              </button>

              <!-- Centre: vs or score -->
              <div class="gd-header__centre">
                <template v-if="selectedMatch.status.code !== 'ns'">
                  <span class="gd-header__score">{{
                    selectedMatch.homeScore
                  }}</span>
                  <span
                    class="gd-header__status"
                    :class="{
                      'gd-header__status--live':
                        selectedMatch.status.code === 'live' ||
                        selectedMatch.status.code === 'ht',
                    }"
                  >
                    {{
                      selectedMatch.status.code === 'ht'
                        ? 'HT'
                        : selectedMatch.status.code === 'ft'
                          ? 'FT'
                          : (selectedMatch.status.clock ?? 'LIVE')
                    }}
                  </span>
                  <span class="gd-header__score">{{
                    selectedMatch.awayScore
                  }}</span>
                </template>
                <template v-else>
                  <span class="gd-header__vs">vs</span>
                </template>
              </div>

              <!-- Away side -->
              <button
                class="gd-header__side gd-header__side--away gd-header__team-btn"
                :title="`View ${selectedMatch.away}`"
                @click="goToCountry(selectedMatch.away)"
              >
                <CountryFlag :iso2="selectedMatch.awayIso2" :size="32" />
                <span class="gd-header__team-name">{{
                  selectedMatch.away
                }}</span>
              </button>
            </div>

            <!-- Date + Venue -->
            <div class="gd-header__meta">
              <span class="gd-header__kickoff">{{ kickoffLabel }}</span>
              <span v-if="selectedMatch.venue" class="gd-header__venue">
                {{ selectedMatch.venue }}
              </span>
            </div>

            <!-- Close button -->
            <button class="gd-close" aria-label="Close" @click="closeMatch">
              <CloseIcon />
            </button>
          </div>

          <!-- Tabs -->
          <div class="gd-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="gd-tab"
              :class="{ 'gd-tab--active': activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab content -->
          <div class="gd-body">
            <div v-if="pending" class="gd-loading">
              <div class="gd-spinner" />
              <span>Loading match data…</span>
            </div>
            <template v-else-if="detail">
              <GameDetailStatsTab
                v-if="activeTab === 'stats'"
                :detail="detail"
                :match="selectedMatch"
              />
              <GameDetailLineupsTab
                v-else-if="activeTab === 'lineups'"
                :detail="detail"
                :match="selectedMatch"
                :home-last-detail="homeLastDetail ?? undefined"
                :away-last-detail="awayLastDetail ?? undefined"
              />
              <GameDetailH2hTab
                v-else-if="activeTab === 'h2h'"
                :detail="detail"
                :match="selectedMatch"
              />
              <GameDetailLeadersTab
                v-else-if="activeTab === 'leaders'"
                :detail="detail"
                :match="selectedMatch"
              />
            </template>
            <div v-else class="gd-empty">
              <p>Match data will be available closer to kick-off.</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── Backdrop ──────────────────────────────────────────────────────────────── */
  .gd-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9000;
    background: oklab(0% 0 0 / 0.82);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 1rem;
    overflow-y: auto;
  }

  /* ── Panel ─────────────────────────────────────────────────────────────────── */
  .gd-panel {
    margin-top: 1rem;
    width: 100%;
    max-width: 44rem;
    max-height: 88dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 0.75rem;
    background: oklch(14% 0.008 260);
    border: 1px solid oklab(100% 0 0 / 0.08);
    border-bottom: 3px solid oklab(100% 0 0 / 0.1);
    box-shadow: 0 8px 32px oklab(0% 0 0 / 1);
  }

  @media (min-width: 640px) {
    .gd-panel {
      max-height: 80dvh;
    }
  }

  /* ── Header ────────────────────────────────────────────────────────────────── */
  .gd-header {
    position: relative;
    padding: 1rem 2.5rem 0.85rem;
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
  }

  /* Group link */
  .gd-header__group-link {
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.6);
    text-decoration: none;
    margin-bottom: 0.15rem;
    transition: color 0.15s;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
  }

  .gd-header__group-link:hover {
    color: oklab(100% 0 0 / 0.95);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  /* Teams row — 3-column grid so centre is always truly centred */
  .gd-header__teams-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
    gap: 1.25rem;
  }

  .gd-header__side {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .gd-header__team-btn {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    border-radius: 0;
  }

  .gd-header__team-btn:hover .gd-header__team-name {
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-color: oklab(100% 0 0 / 0.5);
  }

  .gd-header__side--home {
    justify-content: flex-end;
  }

  .gd-header__side--away {
    justify-content: flex-start;
  }

  .gd-header__centre {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .gd-header__team-name {
    font-size: 1.25rem;
    font-variation-settings:
      'wdth' 90,
      'wght' 650;
    letter-spacing: 0.06rem;
    color: oklab(100% 0 0);
    white-space: nowrap;
  }

  .gd-header__vs {
    font-size: 1.25rem;
    font-variation-settings:
      'wdth' 75,
      'wght' 900;
    letter-spacing: 0.1em;
    color: oklab(100% 0 0 / 0.85);
    padding: 0 0.5rem;
  }

  .gd-header__score {
    font-size: 1.75rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: oklab(100% 0 0);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    padding: 0 0.1rem;
  }

  .gd-header__status {
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    color: oklab(100% 0 0 / 0.6);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
  }

  .gd-header__status--live {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    background: oklab(50% -0.1 0.1 / 0.2);
    color: #4ade80;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Date + venue below teams */
  .gd-header__meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    margin-top: 0.1rem;
  }

  .gd-header__kickoff {
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.75);
  }

  .gd-header__venue {
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.55);
  }

  /* Close button */
  .gd-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    color: oklab(100% 0 0 / 0.5);
    line-height: 1;
    padding: 0.35rem;
    border-radius: 0.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      color 0.15s,
      background 0.15s;
  }

  .gd-close :deep(svg) {
    width: 16px;
    height: 16px;
  }

  .gd-close:hover {
    color: oklab(100% 0 0);
    background: oklab(100% 0 0 / 0.08);
  }

  /* ── Tabs ──────────────────────────────────────────────────────────────────── */
  .gd-tabs {
    display: flex;
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    background: oklch(12% 0.006 260);
  }

  .gd-tab {
    flex: 1 1 0;
    min-width: 0;
    padding: 0.5rem 0rem;
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: center;
    color: oklab(100% 0 0 / 0.4);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition:
      color 0.15s,
      border-color 0.15s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gd-tab:hover:not(.gd-tab--active) {
    color: oklab(100% 0 0 / 0.75);
  }

  .gd-tab--active {
    color: oklab(100% 0 0);
    border-bottom-color: oklab(100% 0 0);
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
  }

  /* ── Body ──────────────────────────────────────────────────────────────────── */
  .gd-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem;
  }

  .gd-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 3rem 0;
    color: oklab(100% 0 0 / 0.5);
    font-size: 0.9rem;
  }

  .gd-spinner {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    border: 2px solid oklab(100% 0 0 / 0.2);
    border-top-color: oklab(100% 0 0 / 0.7);
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .gd-empty {
    padding: 3rem 0;
    text-align: center;
    color: oklab(100% 0 0 / 0.4);
    font-size: 0.9rem;
    font-weight: 200;
    letter-spacing: 0.05em;
  }

  /* ── Transition ────────────────────────────────────────────────────────────── */
  .gd-modal-enter-active,
  .gd-modal-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.22s ease;
  }

  .gd-modal-enter-from,
  .gd-modal-leave-to {
    opacity: 0;
    transform: translateY(1.5rem);
  }

  @media (min-width: 640px) {
    .gd-modal-enter-from,
    .gd-modal-leave-to {
      transform: scale(0.97) translateY(0.5rem);
    }
  }
</style>
