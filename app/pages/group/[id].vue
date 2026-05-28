<script setup lang="ts">
  const route = useRoute()
  const groupLetter = computed(() => String(route.params.id).toUpperCase())

  useHead(
    computed(() => ({
      title: `Group ${groupLetter.value} — World Cup Fire 🔥`,
    }))
  )
</script>

<template>
  <div class="group-route">
    <!-- GroupDetailModal opens automatically via useGroupDetail route watcher -->
    <GroupDetailModal />
    <GameDetailModal />
    <MyNationModal />
    <CountryDetailModal />
  </div>
</template>

<style scoped>
  .group-route {
    flex: 1;
  }
</style>
