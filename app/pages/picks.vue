<script setup lang="ts">
  useHead({
    title: 'Picks — World Cup Fire 🔥',
  })
</script>

<template>
  <div class="picks-page">
    <div class="picks-page__inner">
      <h1 class="picks-page__title">Picks</h1>

      <div class="picks-page__coming-soon">
        <div class="picks-page__icon">🎯</div>
        <h2 class="picks-page__heading">Coming Soon</h2>
        <p class="picks-page__text">
          Make your match picks and compete with other fans during the
          <strong>2026 FIFA World Cup</strong>.
        </p>
        <NuxtLink to="/" class="picks-page__cta">
          🔥 View This Week's Fire Matches
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .picks-page {
    flex: 1;
  }

  .picks-page__inner {
    @apply mx-auto max-w-2xl space-y-8 px-4 py-12;
  }

  .picks-page__title {
    @apply text-2xl font-black text-white;
  }

  .picks-page__coming-soon {
    @apply flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-8 py-12 text-center;
  }

  .picks-page__icon {
    @apply text-6xl;
  }

  .picks-page__heading {
    @apply text-xl font-bold text-white;
  }

  .picks-page__text {
    @apply text-sm text-white/60;
  }

  .picks-page__cta {
    @apply mt-4 rounded-xl bg-orange-500/20 px-6 py-3 text-sm font-bold text-orange-300 no-underline transition-all hover:bg-orange-500/30;
  }
</style>
