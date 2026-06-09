<script setup lang="ts">
  const year = new Date().getFullYear()
  const contactOpen = ref(false)
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span class="app-footer__text">
        World Cup Fire 🔥 &bull; {{ year }} &bull; Vibe coded by Drew Harper
        &bull;
        <button class="app-footer__contact-link" @click="contactOpen = true">
          Contact
        </button>
      </span>
      <span class="app-footer__disclaimer">
        Data via ESPN &bull; Not affiliated with FIFA or ESPN
      </span>
    </div>
  </footer>

  <ContactModal :open="contactOpen" @close="contactOpen = false" />
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

  .app-footer__contact-link {
    color: oklab(1 0 0 / 0.65);
    text-decoration: underline;
    text-underline-offset: 2px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font: inherit;
    transition: color 0.15s ease;

    &:hover {
      color: oklab(1 0 0 / 0.9);
    }
  }
</style>
