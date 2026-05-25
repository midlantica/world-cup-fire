<script setup lang="ts">
  useHead({
    title: 'World Cup Fire 🔥 — 2026 FIFA World Cup Match Tracker',
    meta: [
      {
        name: 'description',
        content:
          'Find the 🔥 fire matches at the 2026 FIFA World Cup. Live scores, group standings, and match quality ratings.',
      },
    ],
  })
</script>

<template>
  <div class="home-page">
    <div class="home-page__inner">
      <!-- Main: Scores wall -->
      <main class="home-page__main">
        <ScoresSection />
      </main>
    </div>

    <!-- Modals -->
    <GameDetailModal />
    <MyNationModal />
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .home-page {
    @apply min-h-screen;
  }

  .home-page__inner {
    @apply mx-auto max-w-7xl px-4 py-6;
  }

  .home-page__main {
    @apply w-full;
  }
</style>
