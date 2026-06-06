<script setup lang="ts">
  import { useScores } from '../composables/useScores'
  import { useMatchDetail } from '../composables/useMatchDetail'
  import { useCountryDetail } from '../composables/useCountryDetail'
  import { useGroupDetail } from '../composables/useGroupDetail'
  import { usePicks } from '../composables/usePicks'
  import { useTimezone } from '../composables/useTimezone'

  const { matches, matchesByDay, pending, error } = useScores()
  const { openMatch } = useMatchDetail()
  const { openCountry } = useCountryDetail()
  const { openGroupSilent: openGroup } = useGroupDetail()
  const { picks, picksReady } = usePicks()
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

  onMounted(() => {
    // Only run on narrow viewports (≤ 640 px, i.e. Tailwind's "sm" breakpoint)
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

  // ── Picks status bar ──────────────────────────────────────────────────────
  // Permanent status showing how many group-stage matches the user has picked
  // out of the 72 total group-stage games (48 teams, 12 groups of 4, 6 matches
  // per group). Derived from the stored picks map — each pick snapshot carries
  // the match's group field so we can filter without re-fetching the schedule.
  const GROUP_STAGE_TOTAL = 72

  const groupStagePickCount = computed(() => {
    if (!picksReady.value) return 0
    return Object.values(picks.value).filter((p) => p.match.group !== null)
      .length
  })
</script>

<template>
  <section class="scores-section">
    <!-- Loading -->
    <div v-if="pending" class="scores-section__loading">
      <div class="scores-section__spinner" />
      <span>Loading matches…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="scores-section__error">
      Failed to load matches. Please try again.
    </div>

    <!-- No matches -->
    <div v-else-if="matches.length === 0" class="scores-section__empty">
      <p>No matches scheduled for this period.</p>
    </div>

    <template v-else>
      <!-- ── Permanent picks status bar ────────────────────────────────── -->
      <div class="scores-status">
        <span class="scores-status__icon">🎯</span>
        <span class="scores-status__text">
          <strong>{{ groupStagePickCount }} of {{ GROUP_STAGE_TOTAL }}</strong>
          Group Stage matches picked.
          <NuxtLink to="/pools" class="scores-status__link"
            >Make your picks</NuxtLink
          >
          before they kick off!
        </span>
      </div>

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

  /* ── Permanent picks status bar ──────────────────────────────────────────── */
  .scores-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    background: rgb(5 105 0 / 0.1);
    border: 1px solid rgb(74 222 128 / 0.2);
  }

  .scores-status__icon {
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  .scores-status__text {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.7);
    line-height: 1.4;
  }

  .scores-status__text strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: #ffffff;
  }

  .scores-status__link {
    color: #86efac;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .scores-status__link:hover {
    color: #bbf7d0;
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
    color: #fff3a0;
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
