<script setup lang="ts">
  import {
    useTimezone,
    TZ_OPTIONS,
    gmtOffsetLabel,
  } from '~/composables/useTimezone'
  import { useMyNation } from '~/composables/useMyNation'

  const { selectedTz, setTz } = useTimezone()
  const { myTeamData, openModal } = useMyNation()

  const tzModalOpen = ref(false)

  // Group TZ options by region
  const tzByRegion = computed(() => {
    const map = new Map<string, typeof TZ_OPTIONS>()
    for (const tz of TZ_OPTIONS) {
      if (!map.has(tz.region)) map.set(tz.region, [])
      map.get(tz.region)!.push(tz)
    }
    return map
  })

  // Explicit column ordering
  // Left: North America, South America
  // Right: Europe, Europe & Africa, Middle East, Asia, Oceania
  const leftColumnRegions = ['North America', 'South America', 'Europe']
  const rightColumnRegions = [
    'Europe & Africa',
    'Middle East',
    'Asia',
    'Oceania',
  ]

  // Current selected TZ option with offset label
  const selectedTzOption = computed(
    () => TZ_OPTIONS.find((t) => t.code === selectedTz.value) ?? TZ_OPTIONS[3]!
  )

  const selectedTzOffset = computed(() =>
    gmtOffsetLabel(selectedTzOption.value.iana)
  )

  function openTzModal() {
    tzModalOpen.value = true
  }

  function closeTzModal() {
    tzModalOpen.value = false
  }

  function choose(code: (typeof TZ_OPTIONS)[number]['code']) {
    setTz(code)
    closeTzModal()
  }

  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('tz-modal-backdrop')) {
      closeTzModal()
    }
  }
</script>

<template>
  <div class="utility-btn-wrap">
    <!-- TZ picker button -->
    <button
      class="utility-btn timezone-btn"
      aria-label="Select time zone"
      @click="openTzModal"
    >
      <span class="utility-btn__label">{{ selectedTzOffset }}</span>
    </button>

    <!-- My Flag button -->
    <button class="utility-btn nation-flag-btn" @click="openModal">
      <template v-if="myTeamData">
        <CountryFlag :iso2="myTeamData.iso2" :size="16" />
        <span class="utility-btn__nation-name">{{ myTeamData.abbrev }}</span>
      </template>
      <template v-else>
        <span class="utility-btn__label">My Flag</span>
      </template>
    </button>

    <!-- TZ Modal — teleported to body -->
    <Teleport to="body">
      <Transition name="tz-modal">
        <div
          v-if="tzModalOpen"
          class="tz-modal-backdrop modal-backdrop-base"
          @click="onBackdrop"
        >
          <div class="tz-modal-panel">
            <div class="tz-modal-header">
              <h2 class="tz-modal-title">🕐 Select Time Zone</h2>
              <button class="tz-modal-close" @click="closeTzModal">✕</button>
            </div>

            <div class="tz-modal-body">
              <div class="tz-columns">
                <!-- Left column: North America, South America -->
                <div class="tz-col">
                  <div
                    v-for="region in leftColumnRegions"
                    :key="region"
                    class="tz-region"
                  >
                    <template v-if="tzByRegion.get(region)">
                      <div class="tz-region__header">{{ region }}</div>
                      <button
                        v-for="tz in tzByRegion.get(region)"
                        :key="tz.code"
                        class="tz-option-btn"
                        :class="{
                          'tz-option-btn--selected': selectedTz === tz.code,
                        }"
                        @click="choose(tz.code)"
                      >
                        <span class="tz-option-btn__offset">{{
                          gmtOffsetLabel(tz.iana)
                        }}</span>
                        <span class="tz-option-btn__label">{{ tz.label }}</span>
                      </button>
                    </template>
                  </div>
                </div>
                <!-- Right column: Europe, Europe & Africa, Middle East, Asia, Oceania -->
                <div class="tz-col">
                  <div
                    v-for="region in rightColumnRegions"
                    :key="region"
                    class="tz-region"
                  >
                    <template v-if="tzByRegion.get(region)">
                      <div class="tz-region__header">{{ region }}</div>
                      <button
                        v-for="tz in tzByRegion.get(region)"
                        :key="tz.code"
                        class="tz-option-btn"
                        :class="{
                          'tz-option-btn--selected': selectedTz === tz.code,
                        }"
                        @click="choose(tz.code)"
                      >
                        <span class="tz-option-btn__offset">{{
                          gmtOffsetLabel(tz.iana)
                        }}</span>
                        <span class="tz-option-btn__label">{{ tz.label }}</span>
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* Outer wrapper: both utility buttons side by side */
  .utility-btn-wrap {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 8px;
    flex-shrink: 0;
  }

  /* Shared utility button style (TZ + My Flag) */
  .utility-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
    padding: 12px 15px 9px 15px;
    border-radius: 0;
    border: none;
    background: oklab(1 0 0 / 0.1);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;
    white-space: nowrap;
    color: oklab(1 0 0 / 0.85);
    font-family: 'Anybody', sans-serif;
  }

  .utility-btn:hover {
    background: oklab(1 0 0 / 0.14);
    color: oklab(1 0 0);
  }

  .utility-btn__label {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.9rem;
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .utility-btn__nation-name {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    font-size: 0.82rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .utility-btn__caret {
    font-size: 0.55rem;
    opacity: 0.6;
    margin-left: 0.1rem;
  }

  /* ── Mobile overrides ────────────────────────────────────────────────────── */
  @media (max-width: 800px) {
    .utility-btn {
      padding: 10px 7px 9px 10px;
      border-radius: 0;
    }

    .utility-btn__label {
      font-variation-settings:
        'wdth' 90,
        'wght' 400;
    }
  }

  /* ── TZ Modal ────────────────────────────────────────────────────────────── */

  /* Backdrop: mobile = centered, tablet = center-top, desktop = near top */
  .tz-modal-backdrop {
    /* position/inset/display/justify-content/padding come from modal-backdrop-base */
    z-index: 50;
    background: oklab(0 0 0 / 0.7);
    backdrop-filter: blur(4px);
    align-items: center;
  }

  .tz-modal-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 44rem;
    border-radius: 1rem;
    background: oklab(0.2103 0.0016 -0.0056);
    max-height: min(92vh, 92dvh);
  }

  /* Tablet (640px+): align toward top */
  @media (min-width: 640px) {
    .tz-modal-backdrop {
      align-items: flex-start !important;
      padding-top: 4rem !important;
    }
    .tz-modal-panel {
      max-height: min(88vh, 88dvh);
    }
  }

  /* Large desktop (1280px+): push closer to top */
  @media (min-width: 1280px) {
    .tz-modal-backdrop {
      padding-top: 5rem !important;
    }
    .tz-modal-panel {
      max-height: min(82vh, 82dvh);
    }
  }

  .tz-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid oklab(1 0 0 / 0.1);
    padding: 0.6rem 0.6rem 0.3rem 1.3rem;
    flex-shrink: 0;
  }

  .tz-modal-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: oklab(1 0 0);
  }

  .tz-modal-close {
    border-radius: 0.5rem;
    padding: 0.375rem;
    color: oklab(1 0 0 / 0.5);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.15s;
    font-size: 1rem;
  }

  .tz-modal-close:hover {
    color: oklab(1 0 0);
  }

  .tz-modal-body {
    overflow-y: auto;
    padding: 0.75rem 0.5rem;
    flex: 1 1 auto;
    min-height: 0;
  }

  /* Single column on mobile, two explicit columns on tablet+ */
  .tz-columns {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .tz-col {
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 480px) {
    .tz-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 0.5rem;
      align-items: start;
    }
  }

  .tz-region {
    margin-bottom: 0.5rem;
  }

  .tz-region__header {
    padding: 0.25rem 0.75rem 0.2rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: oklab(0.72 0.17 0.16 / 0.8);
    border-bottom: 1px solid oklab(1 0 0 / 0.08);
    margin-bottom: 0.15rem;
  }

  .tz-option-btn {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    width: 100%;
    text-align: left;
    padding: 0.4rem 0.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition:
      background 0.1s,
      color 0.1s;
    border-radius: 0.4rem;
  }

  .tz-option-btn:hover {
    background: oklab(1 0 0 / 0.08);
  }

  .tz-option-btn--selected {
    background: oklab(1 0 0 / 0.12);
  }

  .tz-option-btn__offset {
    flex-shrink: 0;
    min-width: 4.5rem;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    color: oklab(1 0 0 / 0.9);
  }

  .tz-option-btn--selected .tz-option-btn__offset {
    color: oklab(1 0 0);
  }

  .tz-option-btn__label {
    font-size: 0.85rem;
    color: oklab(1 0 0 / 0.5);
  }

  .tz-option-btn:hover .tz-option-btn__label,
  .tz-option-btn--selected .tz-option-btn__label {
    color: oklab(1 0 0 / 0.8);
  }

  /* Transition */
  .tz-modal-enter-active,
  .tz-modal-leave-active {
    transition: all 0.2s;
  }

  .tz-modal-enter-from,
  .tz-modal-leave-to {
    opacity: 0;
  }

  .tz-modal-enter-from .tz-modal-panel,
  .tz-modal-leave-to .tz-modal-panel {
    transform: translateY(1rem) scale(0.95);
  }
</style>
