<script setup lang="ts">
  import { normaliseEvent, WC_TABS } from '~/composables/useScores'
  import { nowDate } from '~/composables/useMockTime'

  const { picks, picksReady } = usePicks()
  const router = useRouter()
  const route = useRoute()

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

  // ── Only show when picks are loaded and there are unpicked games
  const show = computed(() => picksReady.value && unpickedCount.value > 0)

  function goToPicks() {
    // Set the scores tab to the week containing tomorrow's games
    const activeTab = useState('scores-tab')
    activeTab.value = tomorrowWeekTab.value

    if (route.path === '/') {
      // Already on home — the tab may have just changed, triggering a new
      // data fetch. Wait for the target day element to appear in the DOM
      // before scrolling (poll up to ~2s, then give up).
      waitForDayAndScroll()
    } else {
      // Navigate home, then scroll after the page settles.
      // Reset scroll to top first (instant) so getBoundingClientRect()
      // returns correct offsets before we smooth-scroll to the target.
      router.push('/').then(() => {
        nextTick(() => {
          window.scrollTo({ top: 0, behavior: 'instant' })
          waitForDayAndScroll()
        })
      })
    }
  }

  /**
   * Poll the DOM until [data-day="<tomorrowDate>"] exists, then scroll to it.
   * Gives up after ~2 seconds to avoid infinite loops.
   */
  function waitForDayAndScroll(attempts = 0) {
    const el = document.querySelector(`[data-day="${tomorrowDate.value}"]`)
    if (el) {
      scrollToDay()
      return
    }
    if (attempts >= 20) return // ~2s at 100ms intervals
    setTimeout(() => waitForDayAndScroll(attempts + 1), 100)
  }

  function scrollToDay() {
    // Scroll to the day header for tomorrow so the user sees the full day
    // context with all unpicked games visible below it.
    const target = document.querySelector(`[data-day="${tomorrowDate.value}"]`)
    if (!target) return

    const headerH =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--app-header-h'
        )
      ) || 80

    const top =
      (target as HTMLElement).getBoundingClientRect().top +
      window.scrollY -
      headerH -
      12
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }
</script>

<template>
  <Transition name="banner">
    <div v-if="show" class="deadline-banner" role="alert">
      <div class="deadline-banner__inner">
        <div class="deadline-banner__body">
          <div class="deadline-banner__text">
            <strong class="deadline-banner__headline">
              <span class="deadline-banner__alarm">🚨</span>
              {{ unpickedCount === 1 ? "Don't miss it!" : "Don't miss out!" }}
              {{ unpickedCount }}
              {{ unpickedCount === 1 ? 'game' : 'games' }} tomorrow without a
              pick
            </strong>
            <span class="deadline-banner__sub">
              <template v-if="hoursUntilFirst !== null">
                First kick-off in {{ hoursUntilFirst }}
                {{ hoursUntilFirst === 1 ? 'hour' : 'hours' }} — lock in your
                picks now
              </template>
              <template v-else> Lock in your picks before kick-off </template>
            </span>
          </div>
          <div class="deadline-banner__actions">
            <button class="deadline-banner__cta" @click="goToPicks">
              Make Picks
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .deadline-banner {
    @apply mx-auto max-w-7xl;
  }

  .deadline-banner__inner {
    @apply flex flex-col gap-3 rounded-xl px-5 py-4;
    background: linear-gradient(135deg, oklab(0.7049 0.1259 0.1379) 0%, oklab(0.518 0.1006 0.1048) 100%);
    box-shadow:
      0 4px 16px oklab(0.7049 0.1259 0.1379 / 0.5),
      0 2px 6px oklab(0 0 0 / 0.35);
  }

  @media (min-width: 640px) {
    .deadline-banner__inner {
      @apply flex-row items-center justify-between gap-4;
    }
  }

  /* Body: text + button stacked on mobile, side-by-side on sm+ */
  .deadline-banner__body {
    @apply flex w-full flex-col gap-3;
  }

  @media (min-width: 640px) {
    .deadline-banner__body {
      @apply flex-row items-center justify-between gap-4;
    }
  }

  .deadline-banner__text {
    @apply flex flex-col gap-1;
  }

  .deadline-banner__alarm {
    display: inline;
    margin-right: 0.2em;
    font-style: normal;
  }

  .deadline-banner__headline {
    @apply font-bold text-white;
    font-size: 1rem;
    line-height: 1.3;
    text-shadow: 0 1px 2px oklab(0 0 0 / 0.3);
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.07rem;
  }

  @media (min-width: 640px) {
    .deadline-banner__headline {
      font-size: 1.125rem;
    }
  }

  .deadline-banner__sub {
    @apply font-medium text-orange-100;
    font-size: 0.9rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    letter-spacing: 0.05rem;
  }

  .deadline-banner__actions {
    @apply flex shrink-0 items-center;
  }

  .deadline-banner__cta {
    @apply w-full px-5 py-2 transition-all;
    font-size: 0.9375rem;
    border-radius: 0;
    font-weight: 800;
    color: oklab(1 0 0);
    background: oklab(0.7455 0.0778 0.1515);
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.07rem;
    text-shadow: 0px 1px 0px oklab(0 0 0 / 0.2);
    white-space: nowrap;
  }

  @media (min-width: 640px) {
    .deadline-banner__cta {
      @apply w-auto;
    }
  }

  .deadline-banner__cta:hover {
    @apply scale-105;
    background: oklab(0.7847 0.0668 0.1528);
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
