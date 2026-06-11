<script setup lang="ts">
  // Shows AFTER the tournament starts (Jun 11 19:00 UTC) — replaces the
  // countdown banner with a persistent explainer + Pools CTA.
  // Uses mock time so it responds correctly in dev/admin testing.
  import { nowDate } from '../composables/useMockTime'

  const TOURNAMENT_START = new Date('2026-06-11T19:00:00Z')

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
</script>

<template>
  <div class="tb-wrap">
    <div class="tb-banner">
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

        <!-- Right: CTA -->
        <div class="tb-cta-col">
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
    border-radius: 10px;
    background: linear-gradient(
      135deg,
      rgba(15, 23, 42, 0.95) 0%,
      rgba(30, 41, 59, 0.95) 100%
    );
    border: 1px solid rgb(255 255 255 / 0.1);
    overflow: hidden;
  }

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
