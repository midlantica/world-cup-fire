<script setup lang="ts">
  useHead({
    title: 'Knockout Stage — World Cup Fire 🔥',
  })
</script>

<template>
  <div class="knockout-page">
    <div class="knockout-page__inner">
      <h1 class="knockout-page__title">Knockout Stage</h1>

      <div class="knockout-page__coming-soon">
        <div class="knockout-page__icon">🏆</div>
        <h2 class="knockout-page__heading">Coming Soon</h2>
        <p class="knockout-page__text">
          The knockout bracket will be available after the group stage concludes
          on <strong>July 2, 2026</strong>.
        </p>
        <p class="knockout-page__text">
          The Round of 32 begins <strong>July 4, 2026</strong>, with the Final
          on <strong>July 19, 2026</strong>.
        </p>
        <NuxtLink to="/" class="knockout-page__cta">
          🔥 View This Week's Fire Matches
        </NuxtLink>
      </div>
    </div>

    <MyNationModal />
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .knockout-page {
    @apply min-h-screen;
  }

  .knockout-page__inner {
    @apply mx-auto max-w-2xl space-y-8 px-4 py-12;
  }

  .knockout-page__title {
    @apply text-2xl font-black text-white;
  }

  .knockout-page__coming-soon {
    @apply flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-8 py-12 text-center;
  }

  .knockout-page__icon {
    @apply text-6xl;
  }

  .knockout-page__heading {
    @apply text-xl font-bold text-white;
  }

  .knockout-page__text {
    @apply text-sm text-white/60;
  }

  .knockout-page__cta {
    @apply mt-4 rounded-xl bg-orange-500/20 px-6 py-3 text-sm font-bold text-orange-300 no-underline transition-all hover:bg-orange-500/30;
  }
</style>
