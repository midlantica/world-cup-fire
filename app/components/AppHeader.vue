<script setup lang="ts">
  import { useMyTeam } from '~/composables/useMyTeam'

  const emit = defineEmits<{
    'go-home': []
    'open-team-modal': []
  }>()

  const { selectedTeam } = useMyTeam()
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
    width: 1.9rem;
    height: auto;
    flex-shrink: 0;
    color: var(--color-theme-300);
    transition: color 0.3s;
  }

  .site-title {
    font-size: 2rem;
    font-weight: 300;
    letter-spacing: 0.05em;
    color: var(--color-theme-300);
    cursor: pointer;
    user-select: none;
    transition: color 0.15s;
    line-height: normal;
    position: relative;
    top: -0.2rem;
  }

  .header-left:hover .site-title {
    color: var(--color-theme-200);
  }

  @media (max-width: 420px) {
    .mls-logo {
      width: 1.5rem;
    }
    .site-title {
      font-size: 1.25rem;
    }
  }

  /* ── Header right ───────────────────────────────────────────────────────── */
  .header-right {
    display: flex;
    align-items: flex-start;
    padding-top: 0.2rem;
  }
</style>
