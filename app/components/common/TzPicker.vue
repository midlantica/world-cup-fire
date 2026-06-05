<script setup lang="ts">
  import { useTimezone, TZ_OPTIONS } from '~/composables/useTimezone'
  import { useMyNation } from '~/composables/useMyNation'

  const { selectedTz, setTz } = useTimezone()
  const { myTeamData, openModal } = useMyNation()

  const open = ref(false)
  const wrapRef = ref<HTMLElement | null>(null)

  function choose(code: (typeof TZ_OPTIONS)[number]['code']) {
    setTz(code)
    open.value = false
  }

  onMounted(() => {
    document.addEventListener('click', (e) => {
      if (
        open.value &&
        wrapRef.value &&
        !wrapRef.value.contains(e.target as Node)
      ) {
        open.value = false
      }
    })
  })
</script>

<template>
  <div ref="wrapRef" class="utility-btn-wrap">
    <!-- TZ picker button -->
    <button
      class="utility-btn timezone-btn"
      aria-label="Select time zone"
      @click.stop="open = !open"
    >
      <span class="utility-btn__label">TZ: {{ selectedTz }}</span>
      <span class="utility-btn__caret">▼</span>
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
      <span class="utility-btn__caret">▼</span>
    </button>

    <!-- TZ dropdown (direct child of wrap for positioning) -->
    <div v-if="open" class="tz-dropdown">
      <div class="tz-dropdown__header">Select Time Zone</div>
      <button
        v-for="tz in TZ_OPTIONS"
        :key="tz.code"
        class="tz-option"
        :class="{ selected: selectedTz === tz.code }"
        @click="choose(tz.code)"
      >
        <span class="tz-option-code">{{ tz.code }}</span>
        <span class="tz-option-label">{{ tz.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
  /* Outer wrapper: both utility buttons side by side */
  .utility-btn-wrap {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0.8rem;
    flex-shrink: 0;
  }

  /* Shared utility button style (TZ + My Flag) */
  .utility-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    padding: 10px 10px 9px 14px;
    border-radius: 6px;
    border: none;
    background: rgb(255 255 255 / 0.09);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;
    white-space: nowrap;
    color: rgb(255 255 255 / 0.75);
    font-family: 'Anybody', sans-serif;
  }

  .utility-btn:hover {
    background: rgb(255 255 255 / 0.14);
    color: #ffffff;
  }

  .utility-btn__label {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.82rem;
    line-height: 1;
    letter-spacing: 0.06em;
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

  /* TZ dropdown */
  .tz-dropdown {
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    z-index: 200;
    background: #1a1817;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
    overflow-y: auto;
    max-height: 18rem;
    min-width: 13rem;
  }

  /* ── Mobile overrides ────────────────────────────────────────────────────── */
  @media (max-width: 800px) {
    .utility-btn {
      padding: 10px 7px 9px 10px;
      border-radius: 4px;
    }

    .utility-btn__label {
      font-variation-settings:
        'wdth' 90,
        'wght' 400;
    }
  }

  .tz-dropdown__header {
    padding: 0.5rem 0.75rem 0.35rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.35);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .tz-option {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    width: 100%;
    text-align: left;
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
    background: transparent;
    border: none;
    cursor: pointer;
    transition:
      background 0.1s,
      color 0.1s;
    white-space: nowrap;
  }

  .tz-option-code {
    flex-shrink: 0;
    min-width: 2.5rem;
    font-weight: 700;
  }

  .tz-option-label {
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
  }

  .tz-option:hover .tz-option-label,
  .tz-option.selected .tz-option-label {
    color: rgba(255, 255, 255, 0.8);
  }

  .tz-option + .tz-option {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .tz-option:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  .tz-option.selected {
    color: #f3f3f3;
    background: rgba(255, 255, 255, 0.12);
  }
</style>
