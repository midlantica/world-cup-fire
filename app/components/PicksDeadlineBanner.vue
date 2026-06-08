<script setup lang="ts">
  import { normaliseEvent, WC_TABS } from '~/composables/useScores'
  import { nowDate } from '~/composables/useMockTime'

  const { picks, picksReady } = usePicks()
  const router = useRouter()
  const route = useRoute()

  const dismissed = ref(false)

  // ── Compute tomorrow's date (YYYY-MM-DD and YYYYMMDD) ─────────────────────
  const tomorrowDate = computed(() => {
    const d = nowDate()
    d.setUTCDate(d.getUTCDate() + 1)
    return d.toISOString().slice(0, 10) // YYYY-MM-DD
  })

  const tomorrowStr = computed(() => tomorrowDate.value.replace(/-/g, ''))

  // ── Fetch tomorrow's schedule ──────────────────────────────────────────────
  const { data: rawEvents } = useFetch<unknown[]>('/api/schedule', {
    query: computed(() => ({ dates: tomorrowStr.value })),
    watch: [tomorrowStr],
  })

  // ── Scheduled matches tomorrow that haven't been picked ───────────────────
  const unpickedTomorrow = computed(() => {
    if (!rawEvents.value) return []
    return rawEvents.value
      .map(normaliseEvent)
      .filter((m) => m.status.code === 'ns' && !picks.value[m.id])
  })

  const unpickedCount = computed(() => unpickedTomorrow.value.length)

  // ── Hours until first tomorrow game ───────────────────────────────────────
  const hoursUntilFirst = computed(() => {
    if (!unpickedTomorrow.value.length) return null
    const first = unpickedTomorrow.value[0]!
    const ms = new Date(first.date).getTime() - nowDate().getTime()
    return Math.max(0, Math.round(ms / 3_600_000))
  })

  // ── Which week tab contains tomorrow ──────────────────────────────────────
  const tomorrowWeekTab = computed(() => {
    const d = new Date(tomorrowDate.value + 'T12:00:00Z')
    for (const tab of WC_TABS) {
      if (d >= tab.start && d <= tab.end) return tab.key
    }
    return 'week2' as const
  })

  // ── Only show when picks are loaded, there are unpicked games, not dismissed
  const show = computed(
    () => picksReady.value && unpickedCount.value > 0 && !dismissed.value
  )

  function goToPicks() {
    // Set the scores tab to the week containing tomorrow's games
    const activeTab = useState('scores-tab')
    activeTab.value = tomorrowWeekTab.value

    if (route.path === '/') {
      // Already on home — just scroll to tomorrow's day section
      scrollToDay()
    } else {
      // Navigate home, then scroll after the page settles
      router.push('/').then(() => {
        nextTick(() => setTimeout(scrollToDay, 300))
      })
    }
  }

  function scrollToDay() {
    const el = document.querySelector(`[data-day="${tomorrowDate.value}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
</script>

<template>
  <Transition name="banner">
    <div v-if="show" class="deadline-banner" role="alert">
      <div class="deadline-banner__inner">
        <div class="deadline-banner__content">
          <span class="deadline-banner__icon">⚠️</span>
          <div class="deadline-banner__text">
            <strong class="deadline-banner__headline">
              Get your picks in before tomorrow's games!
            </strong>
            <span class="deadline-banner__sub">
              {{ unpickedCount }}
              {{ unpickedCount === 1 ? 'game' : 'games' }} unpicked
              <template v-if="hoursUntilFirst !== null">
                · first game in {{ hoursUntilFirst }}h
              </template>
            </span>
          </div>
        </div>
        <div class="deadline-banner__actions">
          <button class="deadline-banner__cta" @click="goToPicks">
            Make Picks
          </button>
          <button
            class="deadline-banner__dismiss"
            aria-label="Dismiss"
            @click="dismissed = true"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .deadline-banner {
    @apply mx-auto mb-4 max-w-7xl;
  }

  .deadline-banner__inner {
    @apply flex items-center justify-between gap-3 rounded-xl px-4 py-3;
    background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
    box-shadow:
      0 4px 20px rgba(249, 115, 22, 0.45),
      0 1px 4px rgba(0, 0, 0, 0.3);
  }

  .deadline-banner__content {
    @apply flex items-center gap-3;
  }

  .deadline-banner__icon {
    @apply text-2xl leading-none;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
  }

  .deadline-banner__text {
    @apply flex flex-col gap-0.5;
  }

  .deadline-banner__headline {
    @apply text-sm font-bold text-white sm:text-base;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .deadline-banner__sub {
    @apply text-xs font-medium text-orange-100;
  }

  .deadline-banner__actions {
    @apply flex shrink-0 items-center gap-2;
  }

  .deadline-banner__cta {
    @apply rounded-lg px-4 py-1.5 text-sm font-bold text-orange-600 transition-all;
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  .deadline-banner__cta:hover {
    @apply scale-105;
    background: #fff7ed;
  }

  .deadline-banner__dismiss {
    @apply flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white/80 transition-all;
    background: rgba(255, 255, 255, 0.15);
  }

  .deadline-banner__dismiss:hover {
    @apply text-white;
    background: rgba(255, 255, 255, 0.25);
  }

  /* Slide-down transition */
  .banner-enter-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }
  .banner-leave-active {
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }
  .banner-enter-from,
  .banner-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }
</style>
