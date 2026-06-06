<script setup lang="ts">
  const year = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span class="app-footer__text">
        World Cup Fire 🔥 &#8226; {{ year }} &#8226; Data via ESPN
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
    @apply border-t border-white/5 py-2;
    margin-top: auto;
  }

  .app-footer__inner {
    @apply mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 text-center;
  }

  .app-footer__text {
    @apply text-sm;
    color: oklab(1 0 0 / 0.5);
  }

  .app-footer__disclaimer {
    @apply text-xs;
    color: oklab(1 0 0 / 0.5);
  }
</style>
