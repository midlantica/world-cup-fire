<script setup lang="ts">
  useHead({
    title: 'Predictor — World Cup Fire 🔥',
  })
</script>

<template>
  <div class="predictor-page">
    <div class="predictor-page__inner">
      <h1 class="predictor-page__title">Predictor</h1>

      <div class="predictor-page__coming-soon">
        <div class="predictor-page__icon">🔮</div>
        <h2 class="predictor-page__heading">Coming Soon</h2>
        <p class="predictor-page__text">
          Predict match results and compete with other fans during the
          <strong>2026 FIFA World Cup</strong>.
        </p>
        <NuxtLink to="/" class="predictor-page__cta">
          🔥 View This Week's Fire Matches
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .predictor-page {
    flex: 1;
  }

  .predictor-page__inner {
    @apply mx-auto max-w-2xl space-y-8 px-4 py-12;
  }

  .predictor-page__title {
    @apply text-2xl font-black text-white;
  }

  .predictor-page__coming-soon {
    @apply flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-8 py-12 text-center;
  }

  .predictor-page__icon {
    @apply text-6xl;
  }

  .predictor-page__heading {
    @apply text-xl font-bold text-white;
  }

  .predictor-page__text {
    @apply text-sm text-white/60;
  }

  .predictor-page__cta {
    @apply mt-4 rounded-xl bg-orange-500/20 px-6 py-3 text-sm font-bold text-orange-300 no-underline transition-all hover:bg-orange-500/30;
  }
</style>
