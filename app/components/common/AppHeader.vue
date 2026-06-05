<script setup lang="ts">
  import { useMyNation } from '~/composables/useMyNation'
  import { useTimezone } from '~/composables/useTimezone'
  import { useScores, WC_TABS } from '~/composables/useScores'
  import type { Stage } from '~/composables/useScores'
  import { usePicks } from '~/composables/usePicks'

  const { myTeamData, openModal } = useMyNation()

  const { selectedTz, setTz } = useTimezone()
  const { activeTab } = useScores()
  // pickCount kept available for future urgency-nudge badge repurposing
  const { pickCount } = usePicks()

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

  // Publish the header's rendered height as a CSS variable (--app-header-h) so
  // page-level sticky sub-navs (e.g. the Picks "My Picks / Group Pools" bar) can
  // pin themselves flush beneath the header without hard-coding a pixel offset
  // that would break across breakpoints (the logo shrinks on small screens).
  const headerEl = ref<HTMLElement | null>(null)

  onMounted(() => {
    if (!import.meta.client || !headerEl.value) return
    const publish = () => {
      const h = headerEl.value?.offsetHeight ?? 0
      document.documentElement.style.setProperty('--app-header-h', `${h}px`)
    }
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(headerEl.value)
    onBeforeUnmount(() => ro.disconnect())
  })
</script>

<template>
  <header ref="headerEl" class="app-header">
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
          to="/picks"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          Picks
          <!-- pick-badge intentionally hidden — pickCount kept for future urgency nudge -->
        </NuxtLink>
      </nav>

      <!-- Right controls: utility buttons (TZ + My Flag, combined in TzPicker) -->
      <div class="app-header__controls">
        <TzPicker class="app-header__utility" />
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

  /* ═══════════════════════════════════════════════════════════════════════════
     VISUAL HIERARCHY SYSTEM
     ─────────────────────────────────────────────────────────────────────────
     L1 — Primary nav (MATCHES / GROUPS / PICKS)
          Font: wdth 100, wght 900 · Size: 1.1rem desktop / 0.9rem mobile
          Shape: 8px radius chips · Color: white active, white/55 inactive

     L2 — Stage tabs (GROUP STAGE / KNOCKOUT STAGE · MY PICKS / GROUP POOLS)
          Font: wdth 100, wght 700 · Size: 0.72rem · Letter-spacing: 0.14em
          Shape: flat (no radius) · Color: white/90 active, white/38 inactive

     L3 — Week tabs (WEEK 1 / WEEK 2 …)
          Label: wdth 100, wght 800 · Size: 0.78rem
          Dates: wdth 87.5, wght 300 · Size: 0.65rem
          Shape: 6px radius chips · Color: white active, white/42 inactive
     ═══════════════════════════════════════════════════════════════════════════ */

  /* ── Header shell ─────────────────────────────────────────────────────────── */
  .app-header {
    @apply sticky top-0 z-40;
    background: var(--nation-bg, #0c0a09);
    margin-bottom: 0.5rem;
    padding-bottom: 0.25rem;
  }

  /* ── Wide layout (> 600px): single flex row ─────────────────────────────── */
  .app-header__inner {
    @apply mx-auto flex max-w-7xl items-center px-4;
    gap: 0.5rem;
    min-height: 4.5rem;
  }

  /* Logo */
  .app-header__brand {
    @apply flex shrink-0 items-center no-underline;
    margin-right: 0.5rem;
  }

  .app-header__logo {
    height: 2.65rem;
    width: calc(2.65rem * 3.365);
    flex: none;
    object-fit: contain;
  }

  /* Nav */
  .app-header__nav {
    @apply flex shrink-0 items-stretch justify-center;
    gap: 0.5rem;
  }

  /* ── L1: Primary nav chips ───────────────────────────────────────────────── */
  .app-header__nav-link {
    @apply relative flex items-center justify-center gap-2 no-underline;
    padding: 0.7rem 1.1rem;
    border-radius: 8px;

    font-family: 'Anybody', sans-serif;
    font-size: 1.25rem;
    line-height: 1;
    text-transform: uppercase;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.07em;

    /* Inactive: clearly readable but visually recessed */
    color: hsl(0deg 0% 100% / 40%);
    background: rgb(255 255 255 / 0.07);
    transition:
      color 0.15s ease,
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .app-header__nav-link:hover {
    color: rgb(255 255 255 / 0.85);
    background: rgb(255 255 255 / 0.11);
    border-color: rgb(255 255 255 / 0.14);
  }

  /* Active: bright white, clearly elevated */
  .app-header__nav-link--active {
    color: #ffffff;
    background: linear-gradient(
      180deg,
      hsl(0deg 0% 27.22%),
      hsl(0deg 0% 9.27%)
    );
    border-color: rgb(255 255 255 / 0.22);
    text-shadow: 0 2px 2px hsl(0deg 0% 0% / 100%);
  }

  .app-header__nav-link--soon {
    @apply cursor-not-allowed;
    pointer-events: none;
    opacity: 0.3;
  }

  /* Picks count badge */
  .app-header__pick-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.2rem;
    height: 1.2rem;
    padding: 0 0.3rem;
    border-radius: 9999px;
    background: #16a34a;
    color: #ffffff;
    font-family: 'Anybody', sans-serif;
    font-size: 0.75rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    letter-spacing: 0;
    line-height: 1;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
  }

  .pick-badge-enter-active {
    transition:
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 0.2s ease;
  }
  .pick-badge-leave-active {
    transition:
      transform 0.15s ease,
      opacity 0.15s ease;
  }
  .pick-badge-enter-from,
  .pick-badge-leave-to {
    opacity: 0;
    transform: scale(0.3);
  }

  /* Right controls group */
  .app-header__controls {
    @apply flex items-center justify-end gap-2;
    flex: 1;
  }

  /* ── L2: Stage / sub-tab row ─────────────────────────────────────────────── */
  .app-header__tabs {
    @apply mx-auto max-w-7xl;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* Slightly darker than the page so the tab block reads as a contained unit */
    background: rgb(0 0 0 / 0.28);
    border-radius: 8px;
    /* box-shadow: 0px 1px 3px -1px hsl(0deg 0% 100% / 75%); */
    width: calc(100% - 1.5rem);
  }

  .app-header__stage-row {
    display: flex;
    /* Hairline divider between stage buttons */
    background: transparent;
  }

  /* L2 buttons: clearly smaller + lighter than L1 */
  .app-header__stage-btn {
    flex: 1;
    padding: 0.4rem 0.75rem 0.25rem;
    border-radius: 0;
    cursor: pointer;
    font-family: 'Anybody', sans-serif;
    font-size: 1rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: nowrap;

    /* Inactive: clearly dimmer than L1 inactive */
    color: hsl(0deg 0% 100% / 40%);
    background: hsl(0deg 0% 10.44%);
    border: none;
    transition:
      color 0.15s ease,
      background 0.15s ease;
  }

  /* Divider between stage buttons */
  .app-header__stage-btn + .app-header__stage-btn {
    border-left: 1px solid rgb(255 255 255 / 0.07);
  }

  .app-header__stage-btn:hover:not(.app-header__stage-btn--active) {
    color: rgb(255 255 255 / 0.65);
    background: rgb(255 255 255 / 0.04);
  }

  /* Active L2 */
  .app-header__stage-btn--active {
    color: rgb(255 255 255 / 0.92);
    background: linear-gradient(0deg, hsl(0deg 0% 27.22%), hsl(0deg 0% 9.27%));
    border-top: 1px solid hsl(0deg 0% 21.72%);
    border-bottom: none;
    text-shadow: 0 1px 2px hsl(0deg 0% 0% / 100%);
  }

  /* ── Picks sub-tabs ──────────────────────────────────────────────────────── */
  .app-header__tabs--picks {
    border-radius: 8px;
  }

  .app-header__tabs--picks .app-header__stage-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    /* No week-tabs below, so remove the bottom border */
    border-bottom: none;
  }

  /* Green count pill */
  .app-header__picks-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.05rem;
    height: 1.05rem;
    padding: 0 0.28rem;
    border-radius: 9999px;
    background: #16a34a;
    color: #ffffff;
    font-size: 0.65rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    letter-spacing: 0;
  }

  /* ── L3: Week tabs ───────────────────────────────────────────────────────── */
  .app-header__week-tabs {
    display: flex;
    padding: 0.3rem 0.35rem 0.3rem;
    gap: 0.2rem;
    background: linear-gradient(
      180deg,
      hsl(0deg 0% 27.22%),
      hsl(0deg 0% 9.27%)
    );
  }

  .app-header__week-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.08rem;
    border-radius: 6px;
    padding: 0.45rem 0.4rem 0.35rem;
    text-align: center;
    transition:
      color 0.15s ease,
      background 0.15s ease;
    color: rgb(255 255 255 / 0.4);
    background: linear-gradient(
      0deg,
      hsl(0deg 0% 0% / 70%),
      hsl(0deg 0% 15.96%)
    );
    box-shadow: 0px 1px 3px -2px hsl(0deg 0% 70%);
    border: none;
    cursor: pointer;
    min-width: 0;
  }

  .app-header__week-tab:hover:not(.app-header__week-tab--active) {
    color: rgb(255 255 255 / 0.72);
    background: rgb(0 0 0 / 20%);
  }

  /* Active L3 */
  .app-header__week-tab--active {
    background: linear-gradient(180deg, hsl(0deg 0% 39.85%), hsl(0deg 0% 6.9%));
    color: #ffffff;
    box-shadow: 0px 0px 2px 0px hsl(0deg 0% 80% / 50%);
  }

  .app-header__week-tab--active .app-header__week-label {
    color: #ffffff;
  }

  .app-header__week-tab--active .app-header__week-dates {
    color: rgb(255 255 255 / 0.65);
    opacity: 1;
  }

  /* L3 label */
  .app-header__week-label {
    line-height: 1.1;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    text-shadow: 0 1px 0px hsl(0deg 0% 0% / 100%);
  }

  /* L3 dates */
  .app-header__week-dates {
    font-size: 0.75rem;
    line-height: 1.2;
    opacity: 0.85;
    letter-spacing: 0.06em;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 400;
    text-shadow: 0 1px 0px hsl(0deg 0% 0% / 100%);
  }

  /* ── Narrow layout (≤ 800px): stacked rows, full-bleed (100vw) ──────────── */
  @media (max-width: 800px) {
    .app-header__inner {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      grid-template-areas:
        'brand controls'
        'nav nav';
      align-items: center;
      column-gap: 0.5rem;
      row-gap: 0.5rem;
      padding-top: 0.5rem;
      padding-bottom: 0;
      min-height: unset;
    }

    .app-header__brand {
      grid-area: brand;
      justify-self: start;
      margin-right: 0;
    }

    /* Full-bleed nav */
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

    /* Mobile L1: slightly smaller, no radius (full-bleed) */
    .app-header__nav-link {
      flex: 1;
      padding: 0.55rem 0.25rem;
      font-size: 1rem;
      border-radius: 0;
      border: none;
      border-right: 1px solid rgb(255 255 255 / 0.08);
      min-height: unset;
      align-self: stretch;
      background: rgb(255 255 255 / 0.06);
    }

    .app-header__nav-link:last-child {
      border-right: none;
    }

    .app-header__nav-link--active {
      background: linear-gradient(
        180deg,
        hsl(0deg 0% 27.22%),
        hsl(0deg 0% 9.27%)
      );
    }

    /* Mobile L2: scale down from desktop 1rem */
    .app-header__stage-btn {
      font-size: 0.85rem;
      padding: 0.5rem 0.5rem 0.3rem;
      letter-spacing: 0.08rem;
    }

    /* Controls: utility wrap sits in the right column on mobile */
    .app-header__controls {
      grid-area: controls;
      justify-self: end;
      flex: unset;
    }

    /* Full-bleed tabs */
    .app-header__tabs {
      width: 100vw;
      max-width: 100vw;
      margin-left: calc(50% - 50vw);
      margin-right: calc(50% - 50vw);
      margin-top: 0;
      margin-bottom: 0;
      border-radius: 0;
      border-left: none;
      border-right: none;
      box-shadow: none;
    }

    .app-header__week-tabs {
      background: linear-gradient(
        180deg,
        hsl(0deg 0% 27.22%),
        hsl(0deg 0% 9.27%)
      );
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

    /* Mobile L3: tighten week tabs further */
    .app-header__week-tab {
      padding: 0.4rem 0.25rem 0.3rem;
    }

    .app-header__week-label {
      font-size: 0.72rem;
    }

    .app-header__week-dates {
      font-size: 0.6rem;
    }
  }

  /* ── Very narrow (≤ 360px) ───────────────────────────────────────────────── */
  @media (max-width: 360px) {
    .app-header__nav-link {
      font-size: 0.78rem;
      padding: 0.45rem 0.15rem;
      letter-spacing: 0.04em;
    }
  }
</style>
