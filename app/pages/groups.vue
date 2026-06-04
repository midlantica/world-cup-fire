<script setup lang="ts">
  useHead({
    title: 'Groups — World Cup Fire 🔥',
    meta: [
      {
        name: 'description',
        content: '2026 FIFA World Cup group stage standings — all 12 groups.',
      },
    ],
  })
</script>

<template>
  <div class="groups-page">
    <div class="groups-page__inner">
      <GroupsSection />
    </div>

    <GroupDetailModal />
    <GameDetailModal />
    <MyFlagModal />
    <CountryDetailModal />
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .groups-page {
    flex: 1;
  }

  .groups-page__inner {
    @apply mx-auto max-w-7xl;
    padding: 0rem 1rem 1rem;
  }
</style>
