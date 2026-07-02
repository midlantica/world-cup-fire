<script setup lang="ts">
  import { useScores } from '../composables/useScores'
  import { useMatchDetail } from '../composables/useMatchDetail'
  import { useCountryDetail } from '../composables/useCountryDetail'
  import { useGroupDetail } from '../composables/useGroupDetail'
  import { useTimezone } from '../composables/useTimezone'
  import { nowDate } from '../composables/useMockTime'

  const { matches, matchesByDay, pending, error, activeTab } = useScores()
  const { openMatch } = useMatchDetail()
  const { openCountry } = useCountryDetail()
  const { openGroupSilent: openGroup } = useGroupDetail()
  const { iana } = useTimezone()

  function formatDayHeader(day: string): string {
    // day is already YYYY-MM-DD in the selected timezone — parse at noon UTC
    // to avoid any date-boundary issues when converting to display string
    return new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  // Track collapsed state per day key; all start expanded
  const collapsed = ref<Set<string>>(new Set())

  function toggleDay(day: string) {
    const next = new Set(collapsed.value)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    collapsed.value = next
  }

  // ── Mobile active-day detection ───────────────────────────────────────────
  // On mobile, whichever day section is most visible in the viewport gets its
  // header highlighted in yellow (same colour as the desktop hover state).
  const activeDay = ref<string | null>(null)
  const dayRefs = ref<Map<string, HTMLElement>>(new Map())
  let observer: IntersectionObserver | null = null

  function setDayRef(day: string, el: HTMLElement | null) {
    if (el) dayRefs.value.set(day, el)
    else dayRefs.value.delete(day)
  }

  // ── Scroll to today's day section after matches load ─────────────────────
  // Computes today's date key (YYYY-MM-DD) in the user's timezone, then
  // scrolls to the first live or upcoming match card within that day.
  // Falls back to the day header, then to the top of the page.
  const scrolledToToday = ref(false)

  // Tournament start date (first match day)
  const WC_START_KEY = '2026-06-11'

  // Match card refs keyed by match id — set by MatchCard via data-match-id
  const matchCardRefs = ref<Map<string, HTMLElement>>(new Map())

  function setMatchCardRef(
    matchId: string,
    el: Element | ComponentPublicInstance | null
  ) {
    // MatchCard is a Vue component — el is the component instance, not a DOM node.
    // Extract the root DOM element via $el.
    const domEl =
      el == null
        ? null
        : '$el' in (el as ComponentPublicInstance)
          ? ((el as ComponentPublicInstance).$el as HTMLElement)
          : (el as HTMLElement)
    if (domEl) matchCardRefs.value.set(matchId, domEl)
    else matchCardRefs.value.delete(matchId)
  }

  async function scrollToToday() {
    if (scrolledToToday.value) return
    if (!matchesByDay.value.size) return

    // Today's date key in the user's selected timezone
    const todayKey = nowDate().toLocaleDateString('en-CA', {
      timeZone: iana.value,
    })

    // Before the tournament starts: scroll to the very top (Week 1 header)
    if (todayKey < WC_START_KEY) {
      await nextTick()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      scrolledToToday.value = true
      return
    }

    // Find the closest day: today if present, otherwise the nearest future day,
    // otherwise the last day in the week (tournament is over / past this week).
    const days = [...matchesByDay.value.keys()]
    let targetDay = days.find((d) => d === todayKey)
    if (!targetDay) {
      // Pick the first day that is >= today (upcoming), or fall back to last day
      targetDay = days.find((d) => d >= todayKey) ?? days[days.length - 1]
    }

    if (!targetDay) return

    // Wait two ticks: one for Vue to render the DOM, one for refs to populate
    await nextTick()
    await nextTick()

    const headerH =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--app-header-h'
        )
      ) || 80

    // Try to find the first live or upcoming match card in the target day
    const dayMatches = matchesByDay.value.get(targetDay) ?? []
    const targetMatch =
      dayMatches.find(
        (m) => m.status.code === 'live' || m.status.code === 'ht'
      ) ?? dayMatches.find((m) => m.status.code === 'ns')

    if (targetMatch) {
      const cardEl = matchCardRefs.value.get(targetMatch.id)
      if (cardEl) {
        const top =
          cardEl.getBoundingClientRect().top + window.scrollY - headerH - 12
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
        scrolledToToday.value = true
        return
      }
    }

    // Fallback: scroll to the day header
    const el = dayRefs.value.get(targetDay)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 12
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    scrolledToToday.value = true
  }

  // Reset scroll flag when the user manually switches week tabs so the new
  // week's "today" section is found and scrolled to after data loads.
  watch(activeTab, () => {
    scrolledToToday.value = false
  })

  // Watch for matches to load (pending → data available) then scroll once
  watch(
    () => matchesByDay.value.size,
    async (size) => {
      if (size > 0) {
        await scrollToToday()
      }
    }
  )

  onMounted(() => {
    // If data is already available (cached), scroll immediately
    if (matchesByDay.value.size > 0) {
      scrollToToday()
    }

    // ── Mobile active-day detection ─────────────────────────────────────────
    // On mobile, whichever day section is most visible in the viewport gets its
    // header highlighted in yellow (same colour as the desktop hover state).
    const mq = window.matchMedia('(max-width: 640px)')
    if (!mq.matches) return

    const ratios = new Map<string, number>()

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const day = (entry.target as HTMLElement).dataset.day!
          ratios.set(day, entry.intersectionRatio)
        }
        // Pick the day with the highest visible ratio
        let best = ''
        let bestRatio = 0
        for (const [day, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            best = day
          }
        }
        activeDay.value = bestRatio > 0 ? best : null
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    )

    for (const [day, el] of dayRefs.value) {
      el.dataset.day = day
      observer.observe(el)
    }
  })

  onUnmounted(() => {
    observer?.disconnect()
  })
</script>

<template>
  <section class="scores-section">
    <!-- Loading — only show spinner on initial load (no data yet) -->
    <div v-if="pending && matches.length === 0" class="scores-section__loading">
      <div class="scores-section__spinner" />
      <span>Loading matches…</span>
    </div>

    <!-- Error (only when no data to fall back on) -->
    <div
      v-else-if="error && matches.length === 0"
      class="scores-section__error"
    >
      Failed to load matches. Please try again.
    </div>

    <!-- No matches -->
    <div
      v-else-if="!pending && matches.length === 0"
      class="scores-section__empty"
    >
      <p>No matches scheduled for this period.</p>
    </div>

    <template v-else>
      <!-- Matches by day -->
      <div class="scores-section__days">
        <div
          v-for="[day, dayMatches] in matchesByDay"
          :key="day"
          :ref="
            (el: Element | ComponentPublicInstance | null) =>
              setDayRef(day, el as HTMLElement | null)
          "
          :data-day="day"
          class="scores-section__day"
          :class="{ 'scores-section__day--active': activeDay === day }"
        >
          <div class="scores-section__day-header" @click="toggleDay(day)">
            <button
              type="button"
              class="scores-section__day-toggle"
              :aria-expanded="!collapsed.has(day)"
              @click.stop="toggleDay(day)"
            >
              <IconsChevron
                class="scores-section__day-caret"
                :class="{
                  'scores-section__day-caret--collapsed': collapsed.has(day),
                }"
              />
              <span class="scores-section__day-title">{{
                formatDayHeader(day)
              }}</span>
            </button>
          </div>

          <div v-if="!collapsed.has(day)" class="scores-section__grid">
            <MatchCard
              v-for="match in dayMatches"
              :key="match.id"
              :ref="
                (el: Element | ComponentPublicInstance | null) =>
                  setMatchCardRef(match.id, el)
              "
              :data-match-id="match.id"
              :match="match"
              @click="openMatch(match)"
              @click-country="openCountry"
              @click-group="openGroup"
            />
          </div>
        </div>
      </div>
      <!-- /.scores-section__days -->
    </template>
  </section>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── States ──────────────────────────────────────────────────────────────── */
  .scores-section__loading {
    @apply flex items-center gap-3 py-12 text-white/50;
  }

  .scores-section__spinner {
    @apply h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70;
  }

  .scores-section__error {
    @apply rounded-xl bg-red-900/20 p-6 text-center text-red-300;
  }

  .scores-section__empty {
    @apply py-16 text-center text-white/40;
  }

  /* ── Day groups ──────────────────────────────────────────────────────────── */
  .scores-section__days {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .scores-section__day {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* The header row is now the hover target — full width, cursor pointer. */
  .scores-section__day-header {
    display: flex;
    align-items: center;
    cursor: pointer;
    /* Extend the hit area slightly so the yellow activates before the cursor
       reaches the text itself. */
    padding: 0.1rem 0;
    margin: -0.1rem 0;
  }

  /* The button itself is still the semantic click target but visually fills
     the full header width so the hover zone matches. */
  .scores-section__day-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: none;
    border: none;
    padding: 0.25rem 0.5rem 0;
    margin: -0.25rem -0.5rem;

    border-radius: 0.5rem;
    cursor: pointer;
    text-align: left;
    /* Stretch to fill the header so hovering anywhere on the row triggers the
       yellow highlight. */
    width: 100%;
    transition:
      background-color 0.12s ease,
      color 0.12s ease;
  }

  .scores-section__day-toggle:focus-visible {
    outline: none;
  }

  /* Light up the date text + caret in pale yellow whenever the cursor is
     anywhere inside the day section (header OR any match card), on
     active/focus-visible of the toggle button, or on mobile when this day
     is the currently-visible one. */
  .scores-section__day:hover .scores-section__day-title,
  .scores-section__day-toggle:active .scores-section__day-title,
  .scores-section__day-toggle:focus-visible .scores-section__day-title,
  .scores-section__day:hover .scores-section__day-caret,
  .scores-section__day-toggle:active .scores-section__day-caret,
  .scores-section__day-toggle:focus-visible .scores-section__day-caret,
  /* Mobile: currently-visible day stays yellow */
  .scores-section__day--active .scores-section__day-title,
  .scores-section__day--active .scores-section__day-caret {
    color: oklab(0.9553 -0.0199 0.102);
  }

  .scores-section__day-caret {
    width: 1rem;
    height: 1rem;
    color: oklab(0.77 0.12 0.14);
    display: inline-block;
    transform: rotate(0deg);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .scores-section__day-caret--collapsed {
    transform: rotate(-90deg);
  }

  .scores-section__day-title {
    font-size: 1rem;
    color: oklab(0.77 0.12 0.14);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
  }

  .scores-section__grid {
    @apply grid gap-3 sm:grid-cols-2 lg:grid-cols-3;
  }
</style>
