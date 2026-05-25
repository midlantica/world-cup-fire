<script setup lang="ts">
  import { useMatchDetail } from '../../composables/useMatchDetail'

  const { selectedMatch, modalOpen, closeMatch, detail, pending } =
    useMatchDetail()

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
            <div class="gd-header__match">
              <!-- Home -->
              <div class="gd-header__team gd-header__team--home">
                <CountryFlag :iso2="selectedMatch.homeIso2" :size="40" />
                <span class="gd-header__team-name">{{
                  selectedMatch.home
                }}</span>
              </div>

              <!-- Score / time -->
              <div class="gd-header__centre">
                <template v-if="selectedMatch.status.code !== 'ns'">
                  <span class="gd-header__score">
                    {{ selectedMatch.homeScore }} –
                    {{ selectedMatch.awayScore }}
                  </span>
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
                </template>
                <template v-else>
                  <span class="gd-header__vs">vs</span>
                  <span class="gd-header__kickoff">
                    {{
                      new Date(selectedMatch.date).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    }}
                  </span>
                </template>
                <span v-if="selectedMatch.group" class="gd-header__group">
                  Group {{ selectedMatch.group }}
                </span>
              </div>

              <!-- Away -->
              <div class="gd-header__team gd-header__team--away">
                <span class="gd-header__team-name">{{
                  selectedMatch.away
                }}</span>
                <CountryFlag :iso2="selectedMatch.awayIso2" :size="40" />
              </div>
            </div>

            <div v-if="selectedMatch.venue" class="gd-header__venue">
              📍 {{ selectedMatch.venue }}
            </div>

            <button class="gd-close" @click="closeMatch">✕</button>
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
  .gd-backdrop {
    @apply fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center;
  }

  .gd-panel {
    @apply flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-zinc-900 sm:rounded-2xl;
  }

  .gd-header {
    @apply relative border-b border-white/10 px-5 py-4;
  }

  .gd-header__match {
    @apply flex items-center gap-4;
  }

  .gd-header__team {
    @apply flex min-w-0 flex-1 items-center gap-2;
  }

  .gd-header__team--home {
    @apply justify-start;
  }

  .gd-header__team--away {
    @apply justify-end;
  }

  .gd-header__team-name {
    @apply truncate text-sm font-bold text-white;
  }

  .gd-header__centre {
    @apply flex shrink-0 flex-col items-center gap-0.5;
  }

  .gd-header__score {
    @apply text-2xl font-black text-white tabular-nums;
  }

  .gd-header__vs {
    @apply text-lg font-bold text-white/40;
  }

  .gd-header__kickoff {
    @apply text-xs text-white/60;
  }

  .gd-header__status {
    @apply rounded px-2 py-0.5 text-xs font-bold text-white/60 uppercase;
  }

  .gd-header__status--live {
    @apply animate-pulse bg-green-500/20 text-green-400;
  }

  .gd-header__group {
    @apply mt-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/50;
  }

  .gd-header__venue {
    @apply mt-2 text-center text-xs text-white/40;
  }

  .gd-close {
    @apply absolute top-4 right-4 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white;
  }

  .gd-tabs {
    @apply flex border-b border-white/10;
  }

  .gd-tab {
    @apply flex-1 py-3 text-sm font-semibold text-white/50 transition-colors hover:text-white;
  }

  .gd-tab--active {
    @apply border-b-2 border-orange-400 text-white;
  }

  .gd-body {
    @apply flex-1 overflow-y-auto p-5;
  }

  .gd-loading {
    @apply flex items-center justify-center gap-3 py-12 text-white/50;
  }

  .gd-spinner {
    @apply h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70;
  }

  .gd-empty {
    @apply py-12 text-center text-white/40;
  }

  /* Transition */
  .gd-modal-enter-active,
  .gd-modal-leave-active {
    @apply transition-all duration-200;
  }

  .gd-modal-enter-from,
  .gd-modal-leave-to {
    @apply opacity-0;
  }
</style>
