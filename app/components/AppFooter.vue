<script setup lang="ts">
  defineProps<{ showScoreLegend?: boolean }>()
</script>

<template>
  <footer class="footer">
    <span v-if="showScoreLegend"
      >🔥 both winning &amp; close · 🎲 derby or equal underdogs</span
    >
    <span>Live data via ESPN API</span>
  </footer>
</template>

<style scoped>
  .footer {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-text-secondary);
    font-size: 0.6875rem;
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.25rem;
  }
</style>
