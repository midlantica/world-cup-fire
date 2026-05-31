<script setup lang="ts">
  // ── Countdown state ────────────────────────────────────────────────────────
  const daysToGo = ref(0)
  const hoursToGo = ref(0)
  const minutesToGo = ref(0)
  const secondsToGo = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  function pad(n: number) {
    return String(n).padStart(2, '0')
  }

  function updateCountdown() {
    const now = new Date()
    const start = new Date('2026-06-11T19:00:00Z')
    const diff = start.getTime() - now.getTime()
    if (diff <= 0) {
      daysToGo.value = 0
      hoursToGo.value = 0
      minutesToGo.value = 0
      secondsToGo.value = 0
      return
    }
    const totalSecs = Math.floor(diff / 1000)
    const days = Math.floor(totalSecs / 86400)
    const remainSecs = totalSecs % 86400
    daysToGo.value = days
    hoursToGo.value = Math.floor(remainSecs / 3600)
    minutesToGo.value = Math.floor((remainSecs % 3600) / 60)
    secondsToGo.value = remainSecs % 60
  }

  function startTimer() {
    updateCountdown()
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

    // Auto-collapse copy when banner scrolls out of view (mobile only)
    if (window.matchMedia('(max-width: 760px)').matches) {
      window.addEventListener('scroll', onScroll, { passive: true })
    }
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
    window.removeEventListener('scroll', onScroll)
  })

  // ── Collapsible copy state (narrow/mobile only) ────────────────────────────
  const bannerEl = ref<HTMLElement | null>(null)
  const copyOpen = ref(true)

  function onScroll() {
    if (!bannerEl.value) return
    const rect = bannerEl.value.getBoundingClientRect()
    // Banner is fully scrolled out of view when its bottom edge is above viewport top
    if (rect.bottom <= 0) {
      copyOpen.value = false
    }
  }

  function toggleCopy() {
    copyOpen.value = !copyOpen.value
  }

  // Wide SVG viewBox: 469 × 122
  // Clock rect: x=89.35, y=22.15, w=379.06, h=99.46
  const wideBox = {
    svgW: 469,
    svgH: 122,
    x: 89.35,
    y: 22.15,
    w: 379.06,
    h: 99.46,
  }

  // Narrow SVG viewBox: 328 × 105
  // Clock rect: x=81.04, y=54.09, w=246.81, h=50.33
  const narrowBox = {
    svgW: 328,
    svgH: 105,
    x: 81.04,
    y: 54.09,
    w: 246.81,
    h: 50.33,
  }

  function pct(box: typeof wideBox) {
    return {
      left: `${(box.x / box.svgW) * 100}%`,
      top: `${(box.y / box.svgH) * 100}%`,
      width: `${(box.w / box.svgW) * 100}%`,
      height: `${(box.h / box.svgH) * 100}%`,
    }
  }

  const wideStyle = pct(wideBox)
  const narrowStyle = pct(narrowBox)
</script>

<template>
  <div class="cb-wrap">
    <div class="cb-banner">
      <!-- ── WIDE layout (≥ 681px) ─────────────────────────────────────────── -->
      <div class="cb-wide">
        <div class="cb-svg-wrap">
          <img
            src="/countdown-clock-wide.svg"
            class="cb-svg"
            alt=""
            aria-hidden="true"
          />
          <!-- Clock overlay positioned over the white rect in the SVG -->
          <div class="cb-clock-overlay" :style="wideStyle">
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
        <!-- Body copy to the right — always visible on desktop -->
        <div class="cb-copy-wrap">
          <p class="cb-copy">
            <strong>48 nations</strong>, <strong>104 matches</strong>,
            <strong>16 cities</strong> across the USA, Canada &amp; Mexico —
            <strong>39 days</strong> of the world's biggest sporting event (June
            11 – July 19). Every team plays at least three group games before
            the knockout rounds crown one champion. World Cup Fire uses
            🔥&nbsp;fire ratings and 🎲&nbsp;dice scores so you never miss a
            classic.
          </p>
        </div>
      </div>

      <!-- ── NARROW layout (≤ 680px) ──────────────────────────────────────── -->
      <div ref="bannerEl" class="cb-narrow">
        <div class="cb-svg-wrap">
          <img
            src="/countdown-block-narrow.svg"
            class="cb-svg"
            alt=""
            aria-hidden="true"
          />
          <!-- Clock overlay positioned over the white rect in the narrow SVG -->
          <div class="cb-clock-overlay" :style="narrowStyle">
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
        <!-- Body copy below — first line always visible, rest collapsible -->
        <div class="cb-copy-row" @click="toggleCopy">
          <span class="cb-caret" :class="{ 'cb-caret-open': copyOpen }">▸</span>
          <div class="cb-copy-text">
            <!-- When open: one continuous paragraph -->
            <p v-if="copyOpen" class="cb-copy cb-copy-narrow cb-copy-open">
              <strong>48 nations</strong>, <strong>104 matches</strong>,
              <strong>16 cities</strong> across the USA, Canada &amp; Mexico —
              <strong>39 days</strong> of the world's biggest sporting event
              (June 11 – July 19). Every team plays at least three group games
              before the knockout rounds crown one champion. World Cup Fire uses
              🔥&nbsp;fire ratings and 🎲&nbsp;dice scores so you never miss a
              classic.
            </p>
            <!-- When collapsed: first line only, truncated -->
            <span v-else class="cb-copy cb-copy-narrow cb-copy-first"
              ><strong>48 nations</strong>, <strong>104 matches</strong>,
              <strong>16 cities</strong> across the USA, Canada &amp;
              Mexico</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── Outer wrapper ────────────────────────────────────────────────────────── */
  .cb-wrap {
    @apply mx-auto max-w-7xl px-3;
    padding-top: 0.5rem;
    padding-bottom: 0.75rem;
    container-type: inline-size;
    container-name: cb;
  }

  /* ── Banner shell ─────────────────────────────────────────────────────────── */
  .cb-banner {
    border-radius: 20px;
    background: linear-gradient(
      180deg,
      rgba(255, 235, 156, 1) 0%,
      rgba(255, 203, 0, 1) 100%
    );
    overflow: hidden;
  }

  /* ── Wide layout: SVG + copy side by side ────────────────────────────────── */
  .cb-wide {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    padding: 14px 17px;
  }

  /* ── Narrow layout: hidden by default ───────────────────────────────────── */
  .cb-narrow {
    display: none;
    padding: 14px 17px;
  }

  /* ── SVG wrapper: relative so overlay can be absolute ───────────────────── */
  .cb-svg-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .cb-svg {
    display: block;
    width: 100%;
    height: auto;
  }

  /* Wide SVG: scales with container, capped at native size */
  .cb-wide .cb-svg-wrap {
    width: 38%;
    width: clamp(260px, 38cqw, 469px);
    align-self: stretch;
  }

  /* Wide SVG img: fill the height of the flex row */
  .cb-wide .cb-svg-wrap .cb-svg {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: left center;
  }

  /* Narrow SVG: full width of banner */
  .cb-narrow .cb-svg-wrap {
    width: 100%;
  }

  /* ── Clock overlay: sits on top of the white rect in the SVG ────────────── */
  .cb-clock-overlay {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Clock row ────────────────────────────────────────────────────────────── */
  .cb-clock {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0.3em;
  }

  /* ── Individual unit (number + label stacked) ────────────────────────────── */
  .cb-unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    flex: 0 0 auto;
    min-width: 2em;
  }

  /* ── Number — sized using cqw from the outer .cb-wrap container ─────────── */
  .cb-num {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 900;
    font-size: clamp(1.1rem, 4.5cqw, 3.2rem);
    line-height: 1;
    letter-spacing: 0.04em;
    color: #000000;
    text-align: center;
    display: block;
  }

  /* ── Label under each number ─────────────────────────────────────────────── */
  .cb-lbl {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: clamp(0.5rem, 1.1cqw, 0.75rem);
    line-height: 1;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    text-align: center;
    color: #000000;
    width: 100%;
    display: block;
    white-space: nowrap;
  }

  /* ── Colon separator ─────────────────────────────────────────────────────── */
  .cb-sep {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 900;
    font-size: clamp(1.1rem, 4.5cqw, 3.2rem);
    line-height: 1;
    color: #000000;
    flex: 0 0 auto;
    padding-bottom: 0.1em;
    text-align: center;
    align-self: flex-start;
  }

  /* ── Collapsible copy row (narrow only) ─────────────────────────────────── */
  .cb-copy-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0.4em;
    padding-top: 0;
    cursor: pointer;
    user-select: none;
  }

  /* Caret — rotates when open */
  .cb-caret {
    flex-shrink: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: clamp(0.75rem, 3.5cqw, 0.875rem);
    color: rgba(0, 0, 0, 0.55);
    transition: transform 0.2s ease;
    line-height: 1.55;
    margin-top: 10px; /* align with cb-copy-narrow padding-top */
  }

  .cb-caret-open {
    transform: rotate(90deg);
  }

  /* Text container — takes remaining width */
  .cb-copy-text {
    flex: 1 1 0;
    min-width: 0;
  }

  /* Collapsed: first line only, truncated with ellipsis */
  .cb-copy-first {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Open: full paragraph, no truncation */
  .cb-copy-open {
    display: block;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  /* ── Body copy (wide) ────────────────────────────────────────────────────── */
  .cb-copy-wrap {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    padding-left: 18px;
  }

  .cb-copy {
    margin: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 480;
    font-size: clamp(0.75rem, 1.4cqw, 0.875rem);
    line-height: 1.55;
    letter-spacing: 0.03em;
    color: #000000;
  }

  .cb-copy strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
  }

  /* ── Body copy (narrow — below SVG) ─────────────────────────────────────── */
  .cb-copy-narrow {
    padding-top: 10px;
    font-size: clamp(0.75rem, 3.5cqw, 0.875rem);
  }

  /* ── Responsive: switch to narrow layout ────────────────────────────────── */
  @media (max-width: 760px) {
    .cb-wide {
      display: none;
    }

    .cb-narrow {
      display: block;
    }

    .cb-banner {
      border-radius: 10px;
    }
  }
</style>
