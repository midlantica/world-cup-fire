<script setup lang="ts">
  // ── Countdown state ────────────────────────────────────────────────────────
  import { nowDate } from '../composables/useMockTime'

  function pad(n: number) {
    return String(n).padStart(2, '0')
  }

  const TOURNAMENT_START = new Date('2026-06-11T19:00:00Z')

  /** Compute the current countdown values from real/mock time. */
  function computeValues() {
    const diff = TOURNAMENT_START.getTime() - nowDate().getTime()
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 }
    const totalSecs = Math.floor(diff / 1000)
    const days = Math.floor(totalSecs / 86400)
    const remainSecs = totalSecs % 86400
    return {
      days,
      hours: Math.floor(remainSecs / 3600),
      mins: Math.floor((remainSecs % 3600) / 60),
      secs: remainSecs % 60,
    }
  }

  // Initialize refs with the correct values immediately (avoids 00:00:00:00 flash on SSR)
  const _init = computeValues()
  const daysToGo = ref(_init.days)
  const hoursToGo = ref(_init.hours)
  const minutesToGo = ref(_init.mins)
  const secondsToGo = ref(_init.secs)
  let timer: ReturnType<typeof setInterval> | null = null

  /** Hide the banner once the tournament has kicked off. */
  const started = ref(nowDate() >= TOURNAMENT_START)

  function updateCountdown() {
    const { days, hours, mins, secs } = computeValues()
    if (days === 0 && hours === 0 && mins === 0 && secs === 0) {
      started.value = true
      daysToGo.value = 0
      hoursToGo.value = 0
      minutesToGo.value = 0
      secondsToGo.value = 0
      return
    }
    daysToGo.value = days
    hoursToGo.value = hours
    minutesToGo.value = mins
    secondsToGo.value = secs
  }

  function startTimer() {
    if (started.value) return
    updateCountdown()
    // Poll every second for the countdown; also re-check mock time
    timer = setInterval(updateCountdown, 1000)
  }

  onMounted(() => {
    // Clear any stale localStorage keys from previous versions that had a dismiss button
    const staleKeys = [
      'wcf-countdown-dismissed',
      'wcf-banner-dismissed',
      'countdown-dismissed',
      'countdown-closed',
      'banner-closed',
      'banner-dismissed',
      'countdownBannerClosed',
      'countdownDismissed',
    ]
    staleKeys.forEach((key) => localStorage.removeItem(key))
    startTimer()
    // Auto-collapse the mobile copy on the first scroll (passive, one-shot).
    window.addEventListener('scroll', handleFirstScroll, { passive: true })
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
    window.removeEventListener('scroll', handleFirstScroll)
  })

  // ── SVG / clock-rect geometry ──────────────────────────────────────────────
  // Narrow SVG viewBox: 328 × 105 (public/countdown-narrow.svg).
  // The white "fake container" rect is the final <rect> in that SVG:
  //   x=81.0381  y=54.085  w=246.813  h=50.331
  // We position the clock overlay exactly over that rect (as a percentage of
  // the SVG), then drive ALL interior type off the rect's own HEIGHT via cqh.
  const narrowBox = {
    svgW: 328,
    svgH: 105,
    x: 81.0381,
    y: 54.085,
    w: 246.813,
    h: 50.331,
  }

  const clockStyle = {
    left: `${(narrowBox.x / narrowBox.svgW) * 100}%`,
    top: `${(narrowBox.y / narrowBox.svgH) * 100}%`,
    width: `${(narrowBox.w / narrowBox.svgW) * 100}%`,
    height: `${(narrowBox.h / narrowBox.svgH) * 100}%`,
  }

  // ── Mobile copy collapse ───────────────────────────────────────────────────
  // On mobile the banner eats a lot of vertical space. The body copy starts
  // EXPANDED so first-time visitors see it, then auto-collapses to a single
  // line (ellipsis + caret) the first time the user scrolls the page. It stays
  // toggleable via the caret at any time. On desktop the copy is always shown.
  const copyExpanded = ref(true)
  // Once the user manually toggles, stop auto-collapsing on scroll so we don't
  // fight their intent.
  const userToggled = ref(false)

  function toggleCopy() {
    copyExpanded.value = !copyExpanded.value
    userToggled.value = true
  }

  // The first line acts as a toggle: clicking it expands when collapsed and
  // collapses when expanded. (The caret button does the same via toggleCopy.)
  function onCopyLineClick() {
    copyExpanded.value = !copyExpanded.value
    userToggled.value = true
  }

  function handleFirstScroll() {
    // Ignore spurious scroll events fired during hydration / scroll-restoration
    // (they report scrollY 0). Only react once the user has actually scrolled
    // a meaningful amount down the page.
    if (window.scrollY < 24) return
    if (!userToggled.value) {
      copyExpanded.value = false
    }
    window.removeEventListener('scroll', handleFirstScroll)
  }
</script>

<template>
  <div class="cb-wrap">
    <div class="cb-banner">
      <div class="cb-inner">
        <!-- Left column: narrow SVG (FIFA logo + heading + clock) -->
        <div class="cb-svg-wrap">
          <img
            src="/countdown-narrow.svg"
            class="cb-svg"
            alt=""
            aria-hidden="true"
          />
          <!--
            Clock overlay sits exactly on top of the white rect in the SVG.
            It is `container-type: size`, so every piece of interior type is
            sized in `cqh` (a % of the rect HEIGHT). Because the rect always
            scales proportionally with the SVG, the numbers keep the SAME
            visual proportion — and the SAME equal space around — at every
            viewport width, including across the mobile/desktop switch.
          -->
          <div class="cb-clock-overlay" :style="clockStyle">
            <div class="cb-clock">
              <div class="cb-unit">
                <span class="cb-num">{{ pad(daysToGo) }}</span>
                <span class="cb-lbl">Days</span>
              </div>
              <span class="cb-sep">:</span>
              <div class="cb-unit">
                <span class="cb-num">{{ pad(hoursToGo) }}</span>
                <span class="cb-lbl">Hours</span>
              </div>
              <span class="cb-sep">:</span>
              <div class="cb-unit">
                <span class="cb-num">{{ pad(minutesToGo) }}</span>
                <span class="cb-lbl">Mins</span>
              </div>
              <span class="cb-sep">:</span>
              <div class="cb-unit">
                <span class="cb-num">{{ pad(secondsToGo) }}</span>
                <span class="cb-lbl">Secs</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right column: body copy (collapsible on mobile) -->
        <div
          class="cb-copy-wrap"
          :class="{ 'cb-copy-wrap--collapsed': !copyExpanded }"
          @click="onCopyLineClick"
        >
          <p class="cb-copy">
            <strong>48 nations</strong>, <strong>104 matches</strong>,
            <strong>16 cities</strong> across the USA, Canada &amp; Mexico —
            <strong>39 days</strong> of the world's biggest sporting event (June
            11 – July 19). Every team plays at least three group games before
            the knockout rounds crown one champion. World Cup Fire uses
            🔥&nbsp;fire ratings and 🎲&nbsp;dice scores so you never miss a
            classic.
          </p>
          <!-- Big ellipsis shown only on the collapsed mobile line, as a clearer
               “there's more” affordance than the tiny native text-overflow one. -->
          <span class="cb-copy-more" aria-hidden="true">…</span>
          <!-- Caret toggle: only visible on mobile (see scoped styles). Sits on
               the first line of copy when collapsed; flips open/closed. -->
          <button
            type="button"
            class="cb-copy-toggle"
            :aria-expanded="copyExpanded"
            :aria-label="copyExpanded ? 'Collapse details' : 'Read more'"
            @click.stop="toggleCopy"
          >
            <IconsChevron class="cb-copy-caret" :stroke-width="2.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── Outer wrapper ────────────────────────────────────────────────────────── */
  .cb-wrap {
    /* No max-width / horizontal padding here: the page wrapper
       (.home-page__inner = mx-auto max-w-7xl px-3) already provides them, so
       the banner should fill its parent exactly like ScoresSection does. */
    width: 100%;
    /* No top spacing here. The gap above the page content is owned by the
       header (its margin-bottom), so it persists even if this banner is
       removed — the ScoresSection below will still clear the tab bar. */
    padding-bottom: 0.75rem;
    container-type: inline-size;
  }

  /* ── Banner shell ─────────────────────────────────────────────────────────── */
  .cb-banner {
    border-radius: 10px;
    background: linear-gradient(
      180deg,
      rgba(255, 235, 156, 1) 0%,
      rgba(255, 203, 0, 1) 100%
    );
    overflow: hidden;
  }

  /* ── Inner: two columns side by side ─────────────────────────────────────── */
  .cb-inner {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 14px 17px;
  }

  /* ── SVG wrapper: relative so overlay can be absolute ───────────────────── */
  .cb-svg-wrap {
    position: relative;
    flex-shrink: 0;
    /* SVG is 328×105 — let it scale with the container, capped at native size */
    width: clamp(200px, 42cqw, 328px);
  }

  .cb-svg {
    display: block;
    width: 100%;
    height: auto;
  }

  /* ── Clock overlay: sits on top of the white rect in the SVG ────────────── */
  /* `container-type: size` turns this into a query container so the children
     can be sized via `cqh` (% of THIS element's height = the rect height). */
  .cb-clock-overlay {
    position: absolute;
    container-type: size;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding-inline: 4cqh;
  }

  /* ── Clock row ────────────────────────────────────────────────────────────── */
  .cb-clock {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    gap: 0.8rem;
  }

  /* ── Individual unit (number + label stacked, vertically centred) ────────── */
  .cb-unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2cqh;
    flex: 1 1 0;
    min-width: 0;
  }

  /* ── Number — fills ~44% of the rect HEIGHT so there is equal space above
     and below it inside the white container, at every screen size. ───────── */
  .cb-num {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 800;
    font-size: 50cqh;
    line-height: 1;
    letter-spacing: -0.04em;
    color: #000000;
    text-align: center;
    display: block;
    font-variant-numeric: tabular-nums;
  }

  /* ── Label under each number (also height-driven) ────────────────────────── */
  .cb-lbl {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 700;
    font-size: 19cqh;
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
    color: #000000;
    display: block;
    white-space: nowrap;
  }

  /* ── Colon separator ──────────────────────────────────────────────────────
     The numbers are stacked above their labels, so the DIGIT block is vertically
     centred on the row's upper portion (the label sits below). The ':' glyph in
     Anybody also carries its two dots high in the em-box. We therefore align the
     colon to the top of the row and push it DOWN with a margin so its dots
     straddle the digit's optical mid-line rather than floating above it. */
  .cb-sep {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 800;
    font-size: 50cqh;
    line-height: 1;
    color: #000000;
    flex: 0 0 auto;
    text-align: center;
    /* JetBrains Mono's colon is vertically centred in the em-box, so we centre
       the glyph on the digit row rather than top-aligning it like Anybody. */
    align-self: center;
    /* nudge up slightly so the dots straddle the digit optical mid-line */
    margin-top: -25cqh;
  }

  /* ── Body copy ───────────────────────────────────────────────────────────── */
  .cb-copy-wrap {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    position: relative;
  }

  /* Caret toggle + big ellipsis are desktop-hidden; only appear on mobile */
  .cb-copy-toggle {
    display: none;
  }

  .cb-copy-more {
    display: none;
  }

  .cb-copy {
    margin: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 480;
    font-size: clamp(0.75rem, 1.6cqw, 0.875rem);
    line-height: 1.55;
    letter-spacing: 0.03em;
    color: #000000;
  }

  .cb-copy strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
  }

  /* ── Mobile: stack SVG above copy ───────────────────────────────────────── */
  /* Note: the clock overlay still sizes off the rect height (cqh), so the
     numbers stay perfectly proportioned even when the SVG goes full-width. */
  @container (max-width: 640px) {
    .cb-inner {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .cb-svg-wrap {
      /* Full-width when stacked, but capped so the clock numbers don't blow
         up on very narrow/tall phones. */
      width: 100%;
      max-width: 460px;
      margin-inline: auto;
    }

    .cb-banner {
      border-radius: 14px;
    }

    .cb-copy {
      font-size: clamp(0.8125rem, 3.5cqw, 0.9375rem);
      /* Indent the first line so the left-hand caret has room and never
         overlaps the text (applies whether collapsed or expanded). */
      text-indent: 1.8em;
    }

    /* ── Collapsible copy on mobile ───────────────────────────────────────── */
    /* The caret toggle becomes a visible control floated to the trailing edge
       of the copy. */
    .cb-copy-wrap {
      align-items: flex-start;
    }

    .cb-copy-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: -4px;
      left: -7px;
      width: 2em;
      height: 2em;
      padding: 0;
      border: none;
      background: none;
      color: #000000;
      cursor: pointer;
      /* line-height of the first line so the caret centres on line 1 */
      line-height: 1.55;
      font-size: clamp(0.8125rem, 3.5cqw, 0.9375rem);
    }

    .cb-copy-caret {
      width: 1.4em;
      height: 1.4em;
      transition: transform 0.2s ease;
    }

    /* Collapsed: the whole single-line teaser is one big tap target. */
    .cb-copy-wrap--collapsed {
      cursor: pointer;
    }

    /* Clamp the copy to one line. We suppress the tiny native ellipsis (clip)
       and reserve room on the right for our own larger “…” affordance. */
    .cb-copy-wrap--collapsed .cb-copy {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: clip;
      padding-right: 1.3em;
    }

    /* Big, obvious ellipsis pinned to the right edge of the collapsed line. */
    .cb-copy-wrap--collapsed .cb-copy-more {
      display: block;
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      font-family: 'Anybody', sans-serif;
      font-variation-settings:
        'wdth' 100,
        'wght' 400;
      font-size: 1.25em;
      line-height: 1;
      color: #000000;
      pointer-events: none;
      /* soft fade so the clipped text tucks under the ellipsis cleanly */
      padding-left: 0.5em;
      background: linear-gradient(
        to right,
        rgba(255, 217, 64, 0) 0%,
        rgba(255, 217, 64, 0.95) 40%,
        rgba(255, 217, 64, 1) 100%
      );
    }

    /* Expanded: point the caret up */
    .cb-copy-wrap:not(.cb-copy-wrap--collapsed) .cb-copy-caret {
      transform: rotate(180deg);
    }
  }
</style>
