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
  const canvasEl = ref<HTMLCanvasElement | null>(null)

  // Canvas-based fire particles — avoids CSS compositing/GPU smear artifacts
  interface Particle {
    x: number
    y: number
    vy: number
    radius: number
    opacity: number
    maxOpacity: number
    life: number // 0..1 progress through lifetime
    lifeSpeed: number // how fast life advances per frame
  }

  function makeParticle(w: number, h: number): Particle {
    return {
      x: Math.random() * w,
      y: h + Math.random() * 20,
      vy: 0.4 + Math.random() * 0.6, // px/frame upward speed
      radius: 54 + Math.random() * 66, // blob radius in px
      opacity: 0,
      maxOpacity: 0.35 + Math.random() * 0.3,
      life: Math.random(), // start at random phase
      lifeSpeed: 0.004 + Math.random() * 0.004,
    }
  }

  onMounted(() => {
    if (!import.meta.client || !headerEl.value) return

    // Publish header height CSS var
    const publish = () => {
      const h = headerEl.value?.offsetHeight ?? 0
      document.documentElement.style.setProperty('--app-header-h', `${h}px`)
    }
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(headerEl.value)

    // Canvas fire
    const canvas = canvasEl.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    let particles: Particle[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      // Re-seed particles on resize
      particles = Array.from({ length: 55 }, () =>
        makeParticle(canvas.width, canvas.height)
      )
    }
    resize()
    const resizeObs = new ResizeObserver(resize)
    resizeObs.observe(canvas)

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        // Advance life
        p.life += p.lifeSpeed
        if (p.life >= 1) {
          // Reset particle
          p.x = Math.random() * w
          p.y = h + Math.random() * 20
          p.vy = 0.4 + Math.random() * 0.6
          p.radius = 54 + Math.random() * 66
          p.maxOpacity = 0.35 + Math.random() * 0.3
          p.life = 0
          p.lifeSpeed = 0.004 + Math.random() * 0.004
        }

        // Move upward
        p.y -= p.vy

        // Opacity envelope: fade in 0..15%, hold 15..75%, fade out 75..100%
        if (p.life < 0.15) {
          p.opacity = (p.life / 0.15) * p.maxOpacity
        } else if (p.life < 0.75) {
          p.opacity = p.maxOpacity
        } else {
          p.opacity = ((1 - p.life) / 0.25) * p.maxOpacity
        }

        // Draw radial gradient blob
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius)
        grad.addColorStop(0, `hsla(45,100%,78%,${p.opacity})`)
        grad.addColorStop(0.3, `hsla(35,100%,60%,${p.opacity * 0.75})`)
        grad.addColorStop(0.6, `hsla(20,100%,45%,${p.opacity * 0.45})`)
        grad.addColorStop(1, `hsla(15,100%,35%,0)`)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      rafId = requestAnimationFrame(draw)
    }
    draw()

    onBeforeUnmount(() => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      resizeObs.disconnect()
    })
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
          to="/stats"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          Stats
        </NuxtLink>
        <NuxtLink
          to="/pools"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          Pools
          <!-- pick-badge intentionally hidden — pickCount kept for future urgency nudge -->
        </NuxtLink>
      </nav>

      <!-- Right controls: utility buttons (TZ + My Flag, combined in TzPicker) -->
      <div class="app-header__controls">
        <TzPicker class="app-header__utility" />
      </div>
    </div>

    <!-- Fire particle canvas -->
    <canvas ref="canvasEl" class="fire-canvas" aria-hidden="true" />

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
          Font: wdth 100, wght 700 · Size: 1.125rem desktop / 0.9rem mobile
          Shape: flat (no radius) · Color: white active, warm white/65 inactive

     L2 — Stage tabs (GROUP STAGE / KNOCKOUT STAGE)
          Font: wdth 100, wght 700 · Size: 1rem · Letter-spacing: 0.14em
          Shape: flat (no radius) · Color: white active, warm white/45 inactive

     L3 — Week tabs (WEEK 1 / WEEK 2 …)
          Label: wdth 100, wght 600 · Size: 0.8rem
          Dates: wdth 87.5, wght 400 · Size: 0.75rem
          Shape: flat (no radius) · Color: white active, warm white/42 inactive
     ═══════════════════════════════════════════════════════════════════════════ */

  /* ── Header shell ─────────────────────────────────────────────────────────── */
  .app-header {
    position: sticky;
    top: 0;
    z-index: 40;
    background: oklab(0.53 0.11 0.12);
    margin-bottom: 1rem;
    padding-top: 0.3rem;
    overflow: hidden;
  }

  /* ── Fire canvas — always behind all header content ─────────────────────── */
  .fire-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  /* All direct children of the header sit above the fire canvas */
  .app-header > *:not(.fire-canvas) {
    position: relative;
    z-index: 2;
  }

  /* ── Wide layout (> 600px): single flex row ─────────────────────────────── */
  .app-header__inner {
    @apply mx-auto flex max-w-7xl items-center px-3;
    gap: 1px;
    min-height: 3.3rem;
  }

  /* Logo */
  .app-header__brand {
    @apply flex shrink-0 items-center no-underline;
    margin-right: 0.25rem;
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
    gap: 1px;
  }

  /* ── L1: Primary nav — flat rectangles ──────────────────────────────────── */
  .app-header__nav-link {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    text-decoration: none;
    padding: 0.75rem 1.1rem;
    border-radius: 0;

    font-family: 'Anybody', sans-serif;
    font-size: 1.125rem;
    line-height: 1;
    text-transform: uppercase;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.07em;

    /* Inactive: warm white on the orange bg, no bg fill */
    color: hsl(30deg 100% 95% / 1);
    background: transparent;
    text-shadow: 0px 1px 0px hsl(0deg 0% 0% / 50%);
    transition:
      color 0.15s ease,
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .app-header__nav-link:hover {
    color: hsl(30deg 100% 98% / 0.95);
    background: oklab(0.62 0.13 0.14);
  }

  /* Active: semi-transparent fill — lets fire show through */
  .app-header__nav-link--active {
    color: #ffffff;
    background: oklab(0.62 0.13 0.14 / 0.6);
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

  /* Right controls group — needs higher z-index so the TZ dropdown
     (position: absolute inside .utility-btn-wrap) paints above the
     stage/week tab rows that follow in the DOM */
  .app-header__controls {
    @apply flex items-center justify-end gap-2;
    flex: 1;
    position: relative;
    z-index: 10;
  }

  /* ── L2: Stage / sub-tab row ─────────────────────────────────────────────── */
  .app-header__tabs {
    @apply mx-auto max-w-7xl;
    display: flex;
    flex-direction: column;
    background: transparent;
    width: calc(100% - 1.5rem);
    position: relative;
    z-index: 2;
  }

  .app-header__stage-row {
    display: flex;
    background: transparent;
  }

  /* L2 buttons: clearly smaller + lighter than L1 */
  .app-header__stage-btn {
    flex: 1;
    padding: 0.65rem 0.75rem 0.25rem;
    border-radius: 0;
    cursor: pointer;
    font-family: 'Anybody', sans-serif;
    font-size: 1rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    white-space: nowrap;

    /* Inactive: warm dim on the orange bg */
    color: hsl(30deg 100% 95% / 0.85);
    background: transparent;
    border: none;
    text-shadow: 0px 1px 0px hsl(0deg 0% 0% / 50%);
    transition:
      color 0.15s ease,
      background 0.15s ease;
  }

  /* Divider between stage buttons */
  .app-header__stage-btn + .app-header__stage-btn {
    border-left: 1px solid rgb(255 255 255 / 0.07);
  }

  .app-header__stage-btn:hover:not(.app-header__stage-btn--active) {
    color: oklab(1 0 0 / 1);
    background: oklab(1 0 0 / 0.15);
  }

  /* Active L2 — semi-transparent orange, no gradient, no shadow */
  .app-header__stage-btn--active {
    color: #ffffff;
    background: oklab(0.62 0.13 0.14 / 0.6);
    border: none;
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
    gap: 0;
    background: oklab(0.62 0.13 0.14 / 0.7);
  }

  .app-header__week-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    border-radius: 0;
    padding: 0.65rem 0.4rem 0.35rem;
    text-align: center;
    transition:
      color 0.15s ease,
      background 0.15s ease;
    color: hsl(29deg 100% 95% / 85%);
    background: transparent;
    border: none;
    text-shadow: 0px 1px 0px hsl(0deg 0% 0% / 50%);
    /* Right-side divider via box-shadow — zero layout impact, never jumps */
    box-shadow: 2px 0 0 0 oklab(1 0 0 / 0.15);
    cursor: pointer;
    min-width: 0;
  }

  .app-header__week-tab:last-child:not(.app-header__week-tab--active) {
    box-shadow: none;
  }

  .app-header__week-tab:hover:not(.app-header__week-tab--active) {
    color: hsl(30deg 100% 95% / 1);
    background: oklab(1 0 0 / 0.15);
  }

  /* Active L3 — inset ring only, zero layout impact, no jump, no doubling */
  .app-header__week-tab--active {
    background: oklab(0.62 0.13 0.14 / 0.5);
    color: #ffffff;
    border: none;
    box-shadow: inset 0 0 0 2px oklab(1 0 0 / 0.4);
    z-index: 1;
  }

  /* Remove the right divider from the tab just before the active one */
  .app-header__week-tab:has(+ .app-header__week-tab--active) {
    box-shadow: none;
  }

  .app-header__week-tab--active .app-header__week-label {
    color: #ffffff;
  }

  .app-header__week-tab--active .app-header__week-dates {
    color: rgb(255 255 255 / 1);
    opacity: 1;
  }

  /* L3 label */
  .app-header__week-label {
    line-height: 1.1;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
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
      padding: 0.75rem 0.25rem;
      font-size: 0.9rem;
      border-radius: 0;
      border: none;
      border-right: 1px solid rgb(255 255 255 / 0.08);
      min-height: unset;
      align-self: stretch;
      /* background: rgb(255 255 255 / 0.06); */
    }

    .app-header__nav-link:last-child {
      border-right: none;
    }

    .app-header__nav-link--active {
      background: oklab(0.62 0.13 0.14 / 0.75);
    }

    /* Mobile L2: scale down from desktop 1rem */
    .app-header__stage-btn {
      font-size: 0.85rem;
      padding: 0.65rem 0.5rem 0.3rem;
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
      background: oklab(0.62 0.13 0.14 / 0.7);
    }
  }

  /* ── Small mobile (≤ 425px): smaller logo, tighter top row ──────────────── */
  @media (max-width: 425px) {
    .app-header__logo {
      height: 2.35rem;
      width: calc(2.35rem * 3.365);
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
      padding: 0.75rem 0.15rem;
      letter-spacing: 0.04em;
    }
  }
</style>
