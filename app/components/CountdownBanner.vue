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
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

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

  function pct(box: typeof narrowBox) {
    return {
      left: `${(box.x / box.svgW) * 100}%`,
      top: `${(box.y / box.svgH) * 100}%`,
      width: `${(box.w / box.svgW) * 100}%`,
      height: `${(box.h / box.svgH) * 100}%`,
    }
  }

  const clockStyle = pct(narrowBox)
</script>

<template>
  <div class="cb-wrap">
    <div class="cb-banner">
      <div class="cb-inner">
        <!-- Left column: narrow SVG (FIFA logo + heading + clock) -->
        <div class="cb-svg-wrap">
          <img
            src="/countdown-block-narrow.svg"
            class="cb-svg"
            alt=""
            aria-hidden="true"
          />
          <!-- Clock overlay positioned over the white rect in the SVG -->
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

        <!-- Right column: body copy -->
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
    width: 42%;
    width: clamp(200px, 42cqw, 328px);
  }

  .cb-svg {
    display: block;
    width: 100%;
    height: auto;
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
  /* The SVG is ~42% of the container, clock rect is ~75% of SVG width,
     so clock area ≈ 31.5% of container. Numbers fill ~25% of that → ~7.9cqw.
     We use 6.8cqw as a comfortable fit. */
  .cb-num {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 900;
    font-size: clamp(1.1rem, 6.8cqw, 3.2rem);
    line-height: 1;
    letter-spacing: 0em;
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
    font-size: clamp(0.5rem, 1.8cqw, 0.75rem);
    line-height: 1;
    letter-spacing: 0.17em;
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
    font-size: clamp(1.1rem, 6.8cqw, 3.2rem);
    line-height: 1;
    color: #000000;
    flex: 0 0 auto;
    padding-bottom: 0.1em;
    text-align: center;
    align-self: flex-start;
  }

  /* ── Body copy ───────────────────────────────────────────────────────────── */
  .cb-copy-wrap {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
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
  @container (max-width: 480px) {
    .cb-inner {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .cb-svg-wrap {
      width: 100%;
    }

    .cb-banner {
      border-radius: 10px;
    }

    .cb-copy {
      font-size: clamp(0.75rem, 3.5cqw, 0.875rem);
    }
  }
</style>
