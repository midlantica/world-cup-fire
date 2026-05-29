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
            <span class="app-header__nation-placeholder">Flag</span>
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
    flex: 1;
    margin-right: 0.5rem;
  }

  .app-header__logo {
    height: 2.75rem;
    width: auto;
  }

  /* Nav */
  .app-header__nav {
    @apply flex shrink-0 items-center justify-center gap-2;
  }

  .app-header__nav-link {
    @apply flex items-center justify-center no-underline transition-all;
    padding: 0.5rem 0.75rem;
    border-radius: 10px;
    font-family: 'Anybody', sans-serif;
    font-size: 1.26rem;
    line-height: 22.54px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    @apply font-anybody-nav;
    color: #d1cdcb;
    background: linear-gradient(
      180deg,
      rgba(60, 56, 52, 1) 0%,
      rgba(139, 124, 120, 0) 94%
    );
    align-self: center;
    /* min-height: 2.3rem; */
  }

  .app-header__nav-link:hover {
    background: linear-gradient(
      180deg,
      rgba(70, 66, 62, 1) 0%,
      rgba(139, 124, 120, 0.3) 94%
    );
    color: #ffffff;
  }

  .app-header__nav-link--active {
    text-shadow: 0 1px 3px #00000082;
    background: linear-gradient(
      180deg,
      rgba(60, 56, 52, 1) 0%,
      rgb(36 33 30) 100%
    );
    color: #ffffff;
    line-height: 1;
    padding-top: 10px;
  }

  .app-header__nav-link--soon {
    @apply cursor-not-allowed;
    pointer-events: none;
    opacity: 0.35;
  }

  /* Right controls group */
  .app-header__controls {
    @apply flex items-center justify-end gap-2;
    flex: 1;
  }

  /* My Nation button */
  .app-header__nation-btn {
    @apply flex items-center transition-all;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 10px;
    font-family: 'Anybody', sans-serif;
    font-weight: 500;
    font-size: 0.947rem;
    line-height: 22.54px;
    letter-spacing: 0.05em;
    color: #f3f3f3;
    background: linear-gradient(
      180deg,
      rgba(62, 58, 54, 1) 0%,
      rgba(40, 35, 34, 1) 100%
    );
    border: none;
    cursor: pointer;
  }

  .app-header__nation-btn:hover {
    background: linear-gradient(
      180deg,
      rgba(72, 68, 64, 1) 0%,
      rgba(50, 45, 44, 1) 100%
    );
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
    font-size: 0.947rem;
    line-height: 22.54px;
    letter-spacing: 0.05em;
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

  .app-header__stage-btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 0;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    @apply font-anybody-semi;
    white-space: nowrap;
    color: rgb(255 255 255 / 0.45);
    background: hsl(12 7% 10% / 1);
    transition: all 0.15s ease;
  }

  .app-header__stage-btn:hover:not(.app-header__stage-btn--active) {
    color: rgb(255 255 255 / 0.75);
    background: hsl(12 7% 14% / 1);
  }

  .app-header__stage-btn--active {
    color: #e1e1e1;
    background: #252120;
  }

  .app-header__week-tabs {
    display: flex;
    padding: 0.3rem 0.4rem;
    gap: 0.25rem;
    background: #252120;
  }

  .app-header__week-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    border-radius: 0.5rem;
    padding: 0.45rem 0.5rem;
    text-align: center;
    transition: all 0.15s ease;
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

  .app-header__week-label {
    line-height: 1.2;
    font-size: 1rem;
    text-transform: uppercase;
    @apply font-anybody-black;
  }

  .app-header__week-dates {
    font-size: 0.85rem;
    line-height: 1.2;
    opacity: 0.7;
    @apply font-anybody-narrow;
  }

  /* ── Narrow layout (≤ 600px): stacked rows ─────────────────────────────── */
  @media (max-width: 600px) {
    .app-header__inner {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      grid-template-rows: auto auto;
      grid-template-areas:
        'ctrls-left  brand  ctrls-right'
        'nav         nav    nav';
      align-items: center;
      gap: 0.4rem 0.5rem;
      padding-top: 0.5rem;
      padding-bottom: 0;
      min-height: unset;
    }

    .app-header__brand {
      grid-area: brand;
      justify-self: center;
      margin-right: 0;
    }

    .app-header__nav {
      grid-area: nav;
      justify-content: stretch;
      flex: unset;
      gap: 0;
      align-self: auto;
      padding: 0;
      margin: 0 -0.75rem;
      width: calc(100% + 1.5rem);
    }

    .app-header__nav-link {
      flex: 1;
      padding: 0.5rem 0.25rem;
      font-size: 0.95rem;
      border-radius: 0;
      min-height: unset;
      align-self: auto;
    }

    .app-header__controls {
      display: contents;
      margin-left: 0;
    }

    .app-header__tz {
      grid-area: ctrls-left;
      justify-self: start;
    }

    .app-header__nation-btn {
      grid-area: ctrls-right;
      justify-self: end;
    }

    .app-header__tabs {
      margin: 0;
      border-radius: 0;
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
