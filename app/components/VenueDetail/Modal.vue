<script setup lang="ts">
  import { getVenueInfo } from '~/constants/venues'

  const props = defineProps<{
    venueName: string | null | undefined
    open: boolean
  }>()

  const emit = defineEmits<{
    close: []
  }>()

  const venue = computed(() => getVenueInfo(props.venueName))

  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('vnd-backdrop')) {
      emit('close')
    }
  }

  useModalKeyboard(
    () => props.open,
    () => emit('close')
  )
</script>

<template>
  <Teleport to="body">
    <Transition name="vnd-modal">
      <div
        v-if="open && venue"
        class="vnd-backdrop modal-backdrop-base"
        @click="onBackdrop"
      >
        <div class="vnd-panel modal-panel-base" role="dialog" aria-modal="true">
          <!-- Close -->
          <button
            class="vnd-close"
            aria-label="Close venue info"
            @click="emit('close')"
          >
            <IconsClose />
          </button>

          <!-- Stadium photo -->
          <div class="vnd-img-wrap">
            <img
              :src="venue.image"
              :alt="`${venue.venue} — ${venue.city}`"
              class="vnd-img"
              loading="lazy"
            />
            <div v-if="venue.isFinal" class="vnd-final-badge">
              🏆 Final Venue
            </div>
          </div>

          <!-- Content -->
          <div class="vnd-body">
            <!-- Venue name -->
            <h2 class="vnd-name">{{ venue.venue }}</h2>

            <!-- City / country / capacity row -->
            <div class="vnd-meta">
              <span class="vnd-flag">{{ venue.flag }}</span>
              <span class="vnd-city"
                >{{ venue.city }}, {{ venue.country }}</span
              >
              <span class="vnd-sep">·</span>
              <span class="vnd-capacity"
                >{{ venue.capacity.toLocaleString() }} cap.</span
              >
              <span class="vnd-sep">·</span>
              <span class="vnd-matches">{{ venue.matches }} matches</span>
            </div>

            <!-- Bio -->
            <p class="vnd-bio">{{ venue.bio }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  /* ── Backdrop ──────────────────────────────────────────────────────────── */
  .vnd-backdrop {
    /* position/inset/display/justify-content/padding come from modal-backdrop-base */
    z-index: 9200; /* above game modal (9100) and group modal (9050) */
    background: oklab(0% 0 0 / 0.6);
    align-items: center;
  }

  /* ── Panel ─────────────────────────────────────────────────────────────── */
  .vnd-panel {
    /* border/border-bottom come from modal-panel-base (opacity differs slightly
       here: 0.1/0.12 vs the base's 0.08/0.1 — kept as an explicit override) */
    position: relative;
    width: 100%;
    max-width: 26rem;
    border-radius: 0.875rem;
    background: oklch(14% 0.008 260);
    border: 1px solid oklab(100% 0 0 / 0.1);
    border-bottom: 3px solid oklab(100% 0 0 / 0.12);
    box-shadow: 0 20px 60px oklab(0% 0 0 / 0.9);
    overflow: hidden;
  }

  /* ── Close button ──────────────────────────────────────────────────────── */
  .vnd-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 2;
    background: oklab(0% 0 0 / 0.5) !important;
    border: none;
    border-radius: 50%;
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: oklab(100% 0 0 / 0.8);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .vnd-close:hover {
    background: oklab(0% 0 0 / 0.75) !important;
    color: oklab(100% 0 0);
  }

  .vnd-close :deep(svg) {
    width: 14px;
    height: 14px;
  }

  /* ── Image ─────────────────────────────────────────────────────────────── */
  .vnd-img-wrap {
    position: relative;
    width: 100%;
    height: 160px;
    overflow: hidden;
    background: oklab(0% 0 0 / 0.3);
    flex-shrink: 0;
  }

  .vnd-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  .vnd-final-badge {
    position: absolute;
    top: 0.6rem;
    left: 0.6rem;
    background: linear-gradient(
      135deg,
      oklab(0.7952 0.0111 0.1613 / 0.95),
      oklab(0.6806 0.0348 0.138 / 0.95)
    );
    color: oklab(0 0 0);
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.2rem 0.5rem;
    border-radius: 0.2rem;
    pointer-events: none;
  }

  /* ── Body ──────────────────────────────────────────────────────────────── */
  .vnd-body {
    padding: 0.9rem 1rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .vnd-name {
    margin: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    font-size: 1.1rem;
    color: oklab(100% 0 0);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1.15;
  }

  .vnd-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.3rem 0.4rem;
  }

  .vnd-flag {
    font-size: 1rem;
    line-height: 1;
  }

  .vnd-city {
    font-size: 0.8rem;
    font-variation-settings:
      'wdth' 90,
      'wght' 500;
    color: oklab(100% 0 0 / 0.75);
    letter-spacing: 0.04em;
  }

  .vnd-sep {
    color: oklab(100% 0 0 / 0.25);
    font-size: 0.75rem;
  }

  .vnd-capacity,
  .vnd-matches {
    font-size: 0.75rem;
    font-variation-settings:
      'wdth' 90,
      'wght' 300;
    color: oklab(100% 0 0 / 0.5);
    letter-spacing: 0.04em;
  }

  .vnd-bio {
    margin: 0;
    font-size: 0.82rem;
    font-variation-settings:
      'wdth' 90,
      'wght' 200;
    line-height: 1.65;
    letter-spacing: 0.05em;
    color: oklab(100% 0 0 / 0.8);
    border-top: 1px solid oklab(100% 0 0 / 0.07);
    padding-top: 0.5rem;
  }

  /* ── Transition ────────────────────────────────────────────────────────── */
  .vnd-modal-enter-active,
  .vnd-modal-leave-active {
    transition: opacity 0.18s ease;
  }

  .vnd-modal-enter-active .vnd-panel,
  .vnd-modal-leave-active .vnd-panel {
    transition:
      transform 0.18s ease,
      opacity 0.18s ease;
  }

  .vnd-modal-enter-from,
  .vnd-modal-leave-to {
    opacity: 0;
  }

  .vnd-modal-enter-from .vnd-panel,
  .vnd-modal-leave-to .vnd-panel {
    transform: scale(0.94) translateY(0.5rem);
    opacity: 0;
  }
</style>
