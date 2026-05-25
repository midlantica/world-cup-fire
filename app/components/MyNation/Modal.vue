<script setup lang="ts">
  import { useMyNation } from '../../composables/useMyNation'
  import { WC_GROUPS } from '../../constants/worldcup'

  const { myNation, myTeamData, setNation, modalOpen, closeModal, allTeams } =
    useMyNation()

  // Group teams by group letter for display
  const teamsByGroup = computed(() => {
    const map = new Map<string, typeof allTeams>()
    for (const g of WC_GROUPS) map.set(g, [])
    for (const t of allTeams) {
      map.get(t.group)?.push(t)
    }
    return map
  })

  function select(name: string) {
    setNation(name)
    closeModal()
  }

  function clear() {
    setNation(null)
    closeModal()
  }

  // Close on backdrop click
  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      closeModal()
    }
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modalOpen" class="modal-backdrop" @click="onBackdrop">
        <div class="modal-panel">
          <div class="modal-header">
            <h2 class="modal-title">🌍 Choose Your Nation</h2>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <!-- Current selection -->
          <div v-if="myTeamData" class="modal-current">
            <CountryFlag :iso2="myTeamData.iso2" :size="32" />
            <span class="font-semibold text-white">{{ myTeamData.name }}</span>
            <span class="text-white/40">Group {{ myTeamData.group }}</span>
            <button class="modal-clear-btn" @click="clear">Clear</button>
          </div>

          <!-- Groups grid -->
          <div class="modal-groups">
            <div
              v-for="[letter, teams] in teamsByGroup"
              :key="letter"
              class="modal-group"
            >
              <div class="modal-group__header">Group {{ letter }}</div>
              <button
                v-for="team in teams"
                :key="team.name"
                class="modal-team-btn"
                :class="{ 'modal-team-btn--selected': myNation === team.name }"
                @click="select(team.name)"
              >
                <CountryFlag :iso2="team.iso2" :size="24" />
                <span class="modal-team-btn__name">{{ team.name }}</span>
                <span class="modal-team-btn__rank">#{{ team.fifaRank }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .modal-backdrop {
    @apply fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center;
  }

  .modal-panel {
    @apply flex w-full max-w-2xl flex-col rounded-t-2xl bg-zinc-900 sm:rounded-2xl;
    max-height: min(90vh, 90dvh);
  }

  .modal-header {
    @apply flex items-center justify-between border-b border-white/10 px-5 py-4;
  }

  .modal-title {
    @apply text-lg font-bold text-white;
  }

  .modal-close {
    @apply rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white;
  }

  .modal-current {
    @apply flex items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-3 text-sm;
  }

  .modal-clear-btn {
    @apply ml-auto rounded-lg px-3 py-1 text-xs font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white;
  }

  .modal-groups {
    @apply grid grid-cols-2 gap-4 overflow-y-auto p-5 sm:grid-cols-3;
    min-height: 0;
    flex: 1 1 auto;
  }

  .modal-group {
    @apply space-y-1;
  }

  .modal-group__header {
    @apply mb-2 text-xs font-black tracking-wider text-white/40 uppercase;
  }

  .modal-team-btn {
    @apply flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-all hover:bg-white/10;
  }

  .modal-team-btn--selected {
    @apply bg-orange-500/20 ring-1 ring-orange-400/50;
  }

  .modal-team-btn__name {
    @apply flex-1 truncate font-medium text-white;
  }

  .modal-team-btn__rank {
    @apply text-xs text-white/30;
  }

  /* Transition */
  .modal-enter-active,
  .modal-leave-active {
    @apply transition-all duration-200;
  }

  .modal-enter-from,
  .modal-leave-to {
    @apply opacity-0;
  }

  .modal-enter-from .modal-panel,
  .modal-leave-to .modal-panel {
    @apply translate-y-4 scale-95;
  }
</style>
