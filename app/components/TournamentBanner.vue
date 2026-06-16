<script setup lang="ts">
  // Shows AFTER the tournament starts (Jun 11 19:00 UTC) — replaces the
  // countdown banner with a persistent explainer + Pools CTA.
  // Uses mock time so it responds correctly in dev/admin testing.
  //
  // Smart visibility:
  //   • "Join a Pool" button hidden once the user is already in a pool.
  //   • After 3+ visits the full banner collapses to a slim fire/dice hint.
  //   • Visit count is tracked in localStorage (wc-visit-count-v1).
  import { nowDate } from '../composables/useMockTime'
  import { usePools } from '../composables/usePools'

  const TOURNAMENT_START = new Date('2026-06-11T19:00:00Z')
  const VISIT_KEY = 'wc-visit-count-v1'
  const SLIM_THRESHOLD = 3

  // Reactive: re-evaluate every second so it flips at the right moment in dev.
  const started = ref(nowDate() >= TOURNAMENT_START)

  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    // Only poll until the tournament starts; after that it's always true.
    if (!started.value) {
      timer = setInterval(() => {
        started.value = nowDate() >= TOURNAMENT_START
        if (started.value && timer) {
          clearInterval(timer)
          timer = null
        }
      }, 5_000)
    }
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  // ── Visit counter ──────────────────────────────────────────────────────────
  // Read the CURRENT count synchronously so the correct variant renders on the
  // first paint — avoids the full→slim flash that happens when onMounted fires
  // after hydration. We increment (and persist) in onMounted as before.
  function readVisitCount(): number {
    if (!import.meta.client) return 0
    try {
      const stored = parseInt(localStorage.getItem(VISIT_KEY) ?? '0', 10)
      return isNaN(stored) ? 0 : stored
    } catch {
      return 0
    }
  }

  // Initialise with the stored value (not yet incremented) so isSlim is
  // correct before the first render tick.
  const visitCount = ref(readVisitCount())

  onMounted(() => {
    if (!import.meta.client) return
    try {
      const next = visitCount.value + 1
      localStorage.setItem(VISIT_KEY, String(next))
      visitCount.value = next
    } catch {
      visitCount.value = Math.max(visitCount.value, 1)
    }
  })

  // Show slim variant after SLIM_THRESHOLD visits
  const isSlim = computed(() => visitCount.value >= SLIM_THRESHOLD)

  // ── Pool membership ────────────────────────────────────────────────────────
  const { hasAnyCreds } = usePools()
</script>

<template>
  <div class="tb-wrap">
    <!-- Slim variant: shown after 3+ visits -->
    <div v-if="isSlim" class="tb-banner tb-banner--slim">
      <p class="tb-slim-copy">
        Check out the 🔥 fire &amp; 🎲 wild card games — curated picks for the
        best matches of the tournament.
      </p>
    </div>

    <!-- Full variant: shown on first 1–2 visits -->
    <div v-else class="tb-banner">
      <div class="tb-inner">
        <!-- Left group: FIFA logo + explainer copy together -->
        <div class="tb-content-group">
          <div class="tb-logo-col">
            <img
              src="/FIFA-WC-2026-white.svg"
              class="tb-logo"
              alt="FIFA World Cup 2026"
            />
          </div>
          <div class="tb-copy-col">
            <p class="tb-copy">
              <strong>48 nations · 104 matches · 16 cities</strong> across USA,
              Canada &amp; Mexico. Make your picks, challenge your friends in a
              Pool, and follow every match with 🔥 fire ratings. The world's
              biggest sporting event runs <strong>June 11 – July 19</strong> —
              don't miss a kick.
            </p>
          </div>
        </div>

        <!-- Right: CTA — hidden once the user is already in a pool -->
        <div v-if="!hasAnyCreds" class="tb-cta-col">
          <NuxtLink to="/pools" class="tb-cta-btn"> Join a Pool → </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .tb-wrap {
    width: 100%;
    padding-bottom: 0.75rem;
    container-type: inline-size;
  }

  .tb-banner {
    padding: 0.4rem 0 0.25rem;
    border-radius: 10px;
    background: linear-gradient(
      135deg,
      rgba(15, 23, 42, 0.95) 0%,
      rgba(30, 41, 59, 0.95) 100%
    );
    border: 1px solid rgb(255 255 255 / 0.1);
    overflow: hidden;
  }

  /* ── Slim variant ────────────────────────────────────────────────────────── */
  .tb-banner--slim {
    padding: 0.55rem 1.1rem;
  }

  .tb-slim-copy {
    margin: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 350;
    font-size: 1rem;
    line-height: 1.5;
    letter-spacing: 0.06rem;
    color: rgb(255 255 255);
    text-align: center;
    text-wrap: balance;
  }

  /* ── Full variant ────────────────────────────────────────────────────────── */

  /* Outer row: [logo+copy group] [cta] */
  .tb-inner {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.25rem;
    padding: 0.9rem 1.25rem;
  }

  /* Logo + copy grouped together, takes all remaining space */
  .tb-content-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.25rem;
    flex: 1 1 0;
    min-width: 0;
  }

  /* ── Logo column ─────────────────────────────────────────────────────────── */
  .tb-logo-col {
    flex-shrink: 0;
    align-self: flex-start;
  }

  .tb-logo {
    display: block;
    height: 6rem;
    width: auto;
    opacity: 0.9;
  }

  /* ── Copy column ─────────────────────────────────────────────────────────── */
  .tb-copy-col {
    flex: 1 1 0;
    min-width: 0;
  }

  .tb-copy {
    margin: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 350;
    font-size: 1rem;
    line-height: 1.55;
    letter-spacing: 0.08rem;
    color: rgb(255 255 255 / 0.85);
  }

  .tb-copy strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: #ffffff;
  }

  /* ── CTA column ──────────────────────────────────────────────────────────── */
  .tb-cta-col {
    flex-shrink: 0;
  }

  .tb-cta-btn {
    display: inline-block;
    background: oklab(0.62 0.13 0.14 / 0.9);
    color: #ffffff;
    border: none;
    border-radius: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.9rem;
    padding: 0.5rem 1.1rem 0.4rem;
    white-space: nowrap;
    text-decoration: none;
    transition: background 0.12s ease;
  }

  .tb-cta-btn:hover {
    background: oklab(0.68 0.14 0.15);
  }

  /* ── Mobile: button drops below the logo+copy group ─────────────────────── */
  @container (max-width: 560px) {
    .tb-inner {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
    }

    .tb-content-group {
      align-items: flex-start;
    }

    .tb-logo {
      height: 4rem;
    }

    .tb-copy {
      font-size: clamp(0.85rem, 3.5cqw, 1rem);
    }

    .tb-cta-btn {
      width: 100%;
      text-align: center;
    }
  }
</style>
