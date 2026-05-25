<script setup lang="ts">
  import { useMyNation } from '../composables/useMyNation'
  import { useTimezone } from '../composables/useTimezone'

  const { myNation, myTeamData, openModal } = useMyNation()
  const { selectedTz, setTz } = useTimezone()
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <!-- Logo / Brand -->
      <NuxtLink to="/" class="app-header__brand">
        <img
          src="/FIFA-WC-2026.svg"
          alt="FIFA World Cup 2026"
          class="app-header__logo"
        />
        <div class="app-header__title-block">
          <span class="app-header__title">World Cup Fire 🔥</span>
        </div>
      </NuxtLink>

      <!-- Nav -->
      <nav class="app-header__nav">
        <NuxtLink
          to="/"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          Matches
        </NuxtLink>
        <NuxtLink
          to="/groups"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          Groups
        </NuxtLink>
        <NuxtLink
          to="/knockout"
          class="app-header__nav-link"
          active-class="app-header__nav-link--active"
        >
          Knockout
        </NuxtLink>
      </nav>

      <!-- Right side: TZ + My Nation -->
      <div class="app-header__actions">
        <!-- Timezone picker -->
        <TzPicker />

        <!-- My Nation button -->
        <button class="app-header__nation-btn" @click="openModal">
          <template v-if="myTeamData">
            <CountryFlag :iso2="myTeamData.iso2" :size="22" />
            <span class="app-header__nation-name">{{ myTeamData.abbrev }}</span>
          </template>
          <template v-else>
            <span class="app-header__nation-placeholder">🌍 My Nation</span>
          </template>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .app-header {
    @apply sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl;
  }

  .app-header__inner {
    @apply mx-auto flex max-w-7xl items-center gap-4 px-4 py-3;
  }

  .app-header__brand {
    @apply flex items-center gap-3 no-underline;
  }

  .app-header__logo {
    @apply h-9 w-auto;
  }

  .app-header__title-block {
    @apply hidden items-baseline sm:flex;
  }

  .app-header__title {
    @apply leading-none text-white uppercase;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 91,
      'wght' 900;
    /* Match the height of the trophy SVG (h-9 = 2.25rem) */
    font-size: 1.35rem;
    line-height: 2.25rem;
  }

  .app-header__nav {
    @apply ml-4 hidden items-center gap-1 md:flex;
  }

  .app-header__nav-link {
    @apply rounded-lg px-3 py-1.5 text-sm font-semibold text-white/60 no-underline transition-colors hover:text-white;
  }

  .app-header__nav-link--active {
    @apply bg-white/10 text-white;
  }

  .app-header__actions {
    @apply ml-auto flex items-center gap-2;
  }

  .app-header__nation-btn {
    @apply flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-white/10;
  }

  .app-header__nation-name {
    @apply text-xs font-bold;
  }

  .app-header__nation-placeholder {
    @apply text-sm text-white/60;
  }
</style>
