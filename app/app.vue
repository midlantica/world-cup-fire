<script setup lang="ts">
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
  <div class="app-root">
    <AppHeader />
    <NuxtPage />
    <AppFooter />
  </div>
</template>

<style>
  @reference "~/assets/css/main.css";
  .app-root {
    @apply min-h-screen bg-zinc-950 text-white;
    background-image:
      radial-gradient(
        ellipse at 20% 0%,
        rgba(234, 88, 12, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        ellipse at 80% 100%,
        rgba(16, 185, 129, 0.06) 0%,
        transparent 50%
      );
  }
</style>
