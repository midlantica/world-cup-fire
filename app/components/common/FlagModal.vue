<script setup lang="ts">
  import { useMyNation } from '~/composables/useMyNation'
  import { WC_GROUPS } from '~/constants/worldcup'

  const { myNation, myTeamData, setNation, modalOpen, closeModal, allTeams } =
    useMyNation()

  useModalKeyboard(
    () => modalOpen.value,
    () => closeModal()
  )

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
            <h2 class="modal-title">🏳️ Select your Flag</h2>
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

  /* Backdrop: mobile = centered, tablet = center-top, desktop = near top */
  .modal-backdrop {
    @apply fixed inset-0 z-50 bg-black/70 backdrop-blur-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-panel {
    @apply flex w-full max-w-2xl flex-col bg-zinc-900;
    max-height: min(92vh, 92dvh);
  }

  /* Tablet (640px+): keep centered, just tighten max-height */
  @media (min-width: 640px) {
    .modal-panel {
      max-height: min(88vh, 88dvh);
    }
  }

  /* Large desktop (1280px+): tighten further */
  @media (min-width: 1280px) {
    .modal-panel {
      max-height: min(82vh, 82dvh);
    }
  }

  .modal-header {
    @apply flex items-center justify-between border-b border-white/10;
    padding: 0.6rem 0.6rem 0.3rem 1.3rem;
  }

  .modal-title {
    @apply text-lg font-bold text-white;
  }

  .modal-close {
    @apply rounded-lg p-1.5 text-white/50 transition-colors hover:text-white;
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
    margin-bottom: 0.2rem;
    font-size: 0.9rem;
    line-height: 1rem;
    font-variation-settings:
      'wdth' 90,
      'wght' 400;
    letter-spacing: 0.08em;
    color: color-mix(in oklab, oklab(1 0 0) 60%, transparent);
    text-transform: uppercase;
  }

  .modal-team-btn {
    @apply flex w-full items-center gap-2 rounded-lg text-left text-sm transition-all hover:bg-white/10;
    padding: 0.2rem 0.4rem;
  }

  .modal-team-btn--selected {
    background: color-mix(
      in oklab,
      var(--nation-accent, oklab(0.7049 0.1259 0.1379)) 20%,
      transparent
    );
    box-shadow: 0 0 0 1px
      color-mix(
        in oklab,
        var(--nation-accent, oklab(0.7576 0.0891 0.1317)) 55%,
        transparent
      );
  }

  .modal-team-btn__name {
    @apply truncate font-medium text-white;
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
