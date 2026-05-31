<script setup lang="ts">
  import { useMyNation } from '../composables/useMyNation'
  import { useTimezone } from '../composables/useTimezone'
  import { useScores, WC_TABS } from '../composables/useScores'
  import type { Stage } from '../composables/useScores'

  const { myTeamData, openModal } = useMyNation()
  const { selectedTz, setTz } = useTimezone()
  const { activeTab } = useScores()
  const route = useRoute()

  const showTabs = computed(() => route.path === '/')

  const activeStage = computed<Stage>(() => {
    const tab = WC_TABS.find((t) => t.key === activeTab.value)
    return tab?.stage ?? 'group'
  })

  function selectStage(stage: Stage) {
    const first = WC_TABS.find((t) => t.stage === stage)
    if (first) activeTab.value = first.key
  }

  const visibleTabs = computed(() =>
    WC_TABS.filter((t) => t.stage === activeStage.value)
  )
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <!-- Logo / Brand -->
      <NuxtLink to="/" class="app-header__brand">
        <img
          src="/world-cup-fire-logo.svg"
          alt="World Cup Fire"
          class="app-header__logo"
        />
      </NuxtLink>

      <!-- Nav -->
      <nav class="app-header__nav">
        <NuxtLink
          to="/"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          Matches
        </NuxtLink>
        <NuxtLink
          to="/groups"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          Groups
        </NuxtLink>
        <NuxtLink
          to="/predictor"
          class="app-header__nav-link app-header__nav-link--soon"
        >
          Predictor
        </NuxtLink>
      </nav>

      <!-- Right controls: TZ picker + My Nation -->
      <div class="app-header__controls">
        <TzPicker class="app-header__tz" />

        <button class="app-header__nation-btn" @click="openModal">
          <template v-if="myTeamData">
            <CountryFlag :iso2="myTeamData.iso2" :size="18" />
            <span class="app-header__nation-name">{{ myTeamData.abbrev }}</span>
          </template>
          <template v-else>
            <span class="app-header__nation-placeholder">My Flag</span>
          </template>
          <span class="app-header__chevron">▼</span>
        </button>
      </div>
    </div>

    <!-- Stage + week tabs (only on matches page) -->
    <div v-if="showTabs" class="app-header__tabs">
      <div class="app-header__stage-row">
        <button
          class="app-header__stage-btn"
          :class="{ 'app-header__stage-btn--active': activeStage === 'group' }"
          @click="selectStage('group')"
        >
          Group Stage
        </button>
        <button
          class="app-header__stage-btn"
          :class="{
            'app-header__stage-btn--active': activeStage === 'knockout',
          }"
          @click="selectStage('knockout')"
        >
          Knockout Stage
        </button>
      </div>
      <div class="app-header__week-tabs">
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          class="app-header__week-tab"
          :class="{ 'app-header__week-tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span class="app-header__week-label">{{ tab.label }}</span>
          <span class="app-header__week-dates">{{ tab.dateRange }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── Header shell ─────────────────────────────────────────────────────────── */
  .app-header {
    @apply sticky top-0 z-40;
    background: #0c0a09;
  }

  /* ── Wide layout (> 600px): single flex row ─────────────────────────────── */
  .app-header__inner {
    @apply mx-auto flex max-w-7xl items-center px-3;
    gap: 0.5rem;
    min-height: 4.5rem;
  }

  /* Logo */
  .app-header__brand {
    @apply flex shrink-0 items-center no-underline;
    margin-right: 1rem;
  }

  .app-header__logo {
    /* Fixed, aspect-correct size (SVG is 323×96 ≈ 3.365:1).
       Explicit width + flex:none so the flex layout can never squeeze
       or scale the logo. */
    height: 2.65rem;
    width: calc(2.65rem * 3.365);
    flex: none;
    object-fit: contain;
  }

  /* Nav */
  .app-header__nav {
    @apply flex shrink-0 items-stretch justify-center;
    gap: 0.75rem;
  }

  /* LEVEL 1 (top of hierarchy): largest size, fattest weight */
  .app-header__nav-link {
    @apply flex items-center justify-center no-underline transition-all;
    padding: 0.95rem 1.25rem;
    border-radius: 10px;
    font-family: 'Anybody', sans-serif;
    font-size: 1.2rem;
    line-height: 1;
    text-transform: uppercase;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    letter-spacing: 0.08rem;
    /* Unselected = light / dull */
    color: rgb(255 255 255 / 0.5);

    background: linear-gradient(
      180deg,
      rgba(60, 56, 52, 0.55) 0%,
      rgba(40, 36, 33, 0.55) 100%
    );
  }

  .app-header__nav-link:hover {
    color: rgb(255 255 255 / 0.8);
    background: linear-gradient(
      180deg,
      rgba(70, 66, 62, 0.7) 0%,
      rgba(48, 44, 40, 0.7) 100%
    );
  }

  /* Selected = dark / clear (solid, full opacity, attached to tabs below) */
  .app-header__nav-link--active {
    text-shadow: 0 1px 3px #00000082;
    background: linear-gradient(
      180deg,
      rgba(60, 56, 52, 1) 0%,
      rgb(36 33 30) 100%
    );
    color: #ffffff;
  }

  .app-header__nav-link--soon {
    @apply cursor-not-allowed;
    pointer-events: none;
    opacity: 0.35;
  }

  /* Right controls group */
  .app-header__controls {
    @apply flex items-center justify-end gap-3;
    flex: 1;
  }

  /* My Nation button — identical bar to the TZ picker, only text differs */
  .app-header__nation-btn {
    @apply flex items-center justify-between transition-all;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 4px;
    font-family: 'Anybody', sans-serif;
    font-weight: 500;
    font-size: 1.009rem;
    line-height: 22.54px;
    letter-spacing: 0.05em;
    color: #f3f3f3;
    background: hsl(0deg 0% 100% / 10%);
    border: none;
    cursor: pointer;
  }

  .app-header__nation-btn:hover {
    background: hsl(0deg 0% 100% / 16%);
    color: #ffffff;
  }

  .app-header__nation-name {
    font-family: 'Anybody', sans-serif;
    font-weight: 900;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .app-header__nation-placeholder {
    font-family: 'Anybody', sans-serif;
    font-weight: 500;
    font-size: 1.009rem;
    line-height: 22.54px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .app-header__chevron {
    font-size: 0.5rem;
    opacity: 0.7;
    margin-left: 0.1rem;
  }

  /* ── Stage + week tabs ───────────────────────────────────────────────────── */
  .app-header__tabs {
    @apply mx-auto max-w-7xl;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #1a1817;
    border-radius: 0.75rem;
    /* Pad off the sides on desktop so the bar isn't edge-to-edge.
       Keep it centered (auto left/right) within the max-width container. */
    margin-bottom: 0.75rem;
    width: calc(100% - 1.5rem);
  }

  .app-header__stage-row {
    display: flex;
    gap: 2px;
    background: #0c0a09;
  }

  /* LEVEL 2 (sub to MGP): smaller size, less fat weight */
  .app-header__stage-btn {
    flex: 1;
    border-top: 1px solid hsl(0deg 0% 100% / 10%);
    border-right: 1px solid hsl(0deg 0% 100% / 10%);
    padding: 0.45rem 0.75rem;
    border-radius: 0;
    cursor: pointer;
    font-size: 0.95rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    @apply font-anybody-bold;
    white-space: nowrap;

    /* Unselected = light / dull */
    color: rgb(255 255 255 / 0.45);
    background: hsl(12 7% 10% / 1);
    transition: all 0.15s ease;
  }

  .app-header__stage-btn:hover:not(.app-header__stage-btn--active) {
    color: rgb(255 255 255 / 0.75);
    background: hsl(12 7% 14% / 1);
  }

  /* Selected = dark / clear */
  .app-header__stage-btn--active {
    color: #ffffff;
    background: #252120;
  }

  .app-header__week-tabs {
    display: flex;
    padding: 0.3rem 0.4rem;
    gap: 0.25rem;
    background: #252120;
    border-right: 1px solid hsl(0deg 0% 100% / 10%);
  }

  .app-header__week-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    border-radius: 0.5rem;
    padding: 0.7rem 0.5rem 0.4rem;
    text-align: center;
    transition: all 0.15s ease;
    /* Unselected = light / dull */
    color: rgb(255 255 255 / 0.5);
    background: none;
    border: none;
    cursor: pointer;
    min-width: 0;
  }

  .app-header__week-tab:hover:not(.app-header__week-tab--active) {
    color: rgb(255 255 255 / 0.85);
    background: rgba(255, 255, 255, 0.06);
  }

  /* Selected = dark / clear */
  .app-header__week-tab--active {
    background: linear-gradient(180deg, rgb(85 80 74) 0%, rgb(46 42 38) 100%);
    color: #ffffff;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
  }

  .app-header__week-tab--active .app-header__week-label {
    color: #ffffff;
  }

  .app-header__week-tab--active .app-header__week-dates {
    color: rgb(255 255 255 / 0.7);
    opacity: 1;
  }

  /* LEVEL 3 (smallest, least fat): bottom of the hierarchy */
  .app-header__week-label {
    line-height: 1;
    font-size: 1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
  }

  .app-header__week-dates {
    font-size: 0.85rem;
    line-height: 1.2;
    opacity: 0.7;
    letter-spacing: 0.05rem;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 90,
      'wght' 300;
  }

  /* ── Narrow layout (≤ 800px): stacked rows, full-bleed (100vw) ──────────── */
  @media (max-width: 800px) {
    .app-header__inner {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      grid-template-rows: auto auto;
      grid-template-areas:
        'ctrls-left brand ctrls-right'
        'nav nav nav';
      align-items: center;
      column-gap: 0.5rem;
      /* No vertical gap so the MGP bar reads as one unit with the tabs below */
      row-gap: 0.5rem;
      padding-top: 0.5rem;
      padding-bottom: 0;
      min-height: unset;
    }

    .app-header__brand {
      grid-area: brand;
      justify-self: center;
      margin-right: 0;
    }

    /* Full-bleed nav: span the entire viewport width (100vw), flush to tabs */
    .app-header__nav {
      grid-area: nav;
      justify-content: stretch;
      flex: unset;
      gap: 0;
      align-self: auto;
      padding: 0;
      width: 100vw;
      margin-left: calc(50% - 50vw);
      margin-right: calc(50% - 50vw);
      margin-bottom: 0;
    }

    /* Keep the hierarchy on mobile: MGP stays the largest of the three rows */
    .app-header__nav-link {
      flex: 1;
      padding: 0.6rem 0.25rem;
      font-size: 1rem;
      border-radius: 0;
      min-height: unset;
      align-self: stretch;
    }

    .app-header__stage-btn {
      font-size: 0.85rem;
    }

    .app-header__controls {
      display: contents;
      margin-left: 0;
    }

    /* TZ + Flag buttons: identical fixed width, mirrored to each edge */
    .app-header__tz {
      grid-area: ctrls-left;
      justify-self: start;
      width: 6.25rem;
    }

    .app-header__nation-btn {
      grid-area: ctrls-right;
      justify-self: end;
      width: 6.25rem;
    }

    /* Full-bleed tabs: 100vw, flush to the nav above (one continuous unit) */
    .app-header__tabs {
      width: 100vw;
      max-width: 100vw;
      margin-left: calc(50% - 50vw);
      margin-right: calc(50% - 50vw);
      margin-top: 0;
      margin-bottom: 0;
      border-radius: 0;
    }
  }

  /* ── Small mobile (≤ 425px): smaller logo, tighter top row ──────────────── */
  @media (max-width: 425px) {
    .app-header__logo {
      height: 2.35rem;
      width: calc(2.35rem * 3.365);
    }

    .app-header__inner {
      column-gap: 0.25rem;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
  }

  /* ── Very narrow (≤ 360px) ───────────────────────────────────────────────── */
  @media (max-width: 360px) {
    .app-header__nav-link {
      font-size: 0.82rem;
      padding: 0.45rem 0.15rem;
      letter-spacing: 0.03em;
    }
  }
</style>
