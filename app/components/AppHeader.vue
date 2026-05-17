<script setup lang="ts">
  import { useMyTeam } from '~/composables/useMyTeam'

  const emit = defineEmits<{
    'go-home': []
    'open-team-modal': []
  }>()

  const { selectedTeam } = useMyTeam()

  function todayLabel(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }
</script>

<template>
  <!-- ── Site header ──────────────────────────────────────────────────────── -->
  <header class="header">
    <div
      class="header-left"
      role="button"
      style="cursor: pointer"
      @click="emit('go-home')"
    >
      <MlsLogo
        class="mls-logo"
        :class="{ 'mls-logo--themed': !!selectedTeam }"
      />
      <div>
        <h1 class="site-title">MLS Scores</h1>
        <ClientOnly>
          <p class="site-date">{{ todayLabel() }}</p>
        </ClientOnly>
      </div>
    </div>

    <div class="header-right">
      <TzPicker />
    </div>
  </header>
</template>

<style scoped>
  /* ── Header ─────────────────────────────────────────────────────────────── */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    gap: 0.5rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    user-select: none;
    min-width: 0;
    flex-shrink: 1;
  }

  .mls-logo {
    width: 2.6rem;
    height: 2.6rem;
    flex-shrink: 0;
    color: var(--color-theme-300);
    transition: color 0.3s;
  }

  .site-title {
    font-size: 1.575rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--color-theme-300);
    cursor: pointer;
    user-select: none;
    transition: color 0.15s;
    line-height: 1.2;
  }

  .header-left:hover .site-title {
    color: var(--color-theme-200);
  }

  .site-date {
    font-size: 0.6875rem;
    color: var(--color-text-secondary);
    margin-top: 0.125rem;
    opacity: 0.5;
  }

  @media (max-width: 420px) {
    .mls-logo {
      width: 2rem;
      height: 2rem;
    }
    .site-title {
      font-size: 1.25rem;
    }
    .site-date {
      font-size: 0.625rem;
    }
  }

  /* ── Header right ───────────────────────────────────────────────────────── */
  .header-right {
    display: flex;
    align-items: flex-start;
    padding-top: 0.2rem;
  }
</style>
