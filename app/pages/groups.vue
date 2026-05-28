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

  const router = useRouter()

  function onSelectGroup(letter: string) {
    router.push(`/group/${letter.toLowerCase()}`)
  }
</script>

<template>
  <div class="groups-page">
    <div class="groups-page__inner">
      <GroupsSection @select-group="onSelectGroup" />
    </div>

    <MyNationModal />
    <CountryDetailModal />
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .groups-page {
    @apply min-h-screen;
  }

  .groups-page__inner {
    @apply mx-auto max-w-7xl;
    padding: 1rem 1rem 2rem;
  }

  .groups-page__title {
    @apply flex flex-col gap-1;
  }

  .groups-page__title > span:first-child {
    @apply text-2xl font-black text-white;
  }

  .groups-page__subtitle {
    @apply text-sm font-medium text-white/40;
  }
</style>
