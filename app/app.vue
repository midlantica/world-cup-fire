<script setup lang="ts">
  import { useMatchDetail } from '~/composables/useMatchDetail'
  const { modalOpen } = useMatchDetail()

  useHead({
    titleTemplate: (title) =>
      title ? title : 'World Cup Fire 🔥 — 2026 FIFA World Cup',
    htmlAttrs: { lang: 'en' },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#0a0a0a' },
    ],
    link: [
      {
        rel: 'preconnect',
        href: 'https://purecatamphetamine.github.io',
      },
    ],
  })
</script>

<template>
  <div class="app-root" :class="{ 'modal-blurred': modalOpen }">
    <AppHeader />
    <NuxtPage />
    <AppFooter />
  </div>
</template>

<style>
  @reference "~/assets/css/main.css";
  .app-root {
    @apply min-h-screen text-white;
    background-color: #0c0a09; /* stone-950 */
    transition: filter 0.2s ease;
  }

  .app-root.modal-blurred {
    filter: blur(2px);
  }
</style>
