<script setup lang="ts">
  const year = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span class="app-footer__text">
        World Cup Fire 🔥 · {{ year }} · Data via ESPN
      </span>
      <span class="app-footer__disclaimer">
        Not affiliated with FIFA or ESPN
      </span>
    </div>
  </footer>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .app-footer {
    @apply mt-12 border-t border-white/5 py-6;
  }

  .app-footer__inner {
    @apply mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 text-center;
  }

  .app-footer__text {
    @apply text-sm text-white/30;
  }

  .app-footer__disclaimer {
    @apply text-xs text-white/20;
  }
</style>
