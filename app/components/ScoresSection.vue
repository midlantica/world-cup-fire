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

  // ── Picks nudge ───────────────────────────────────────────────────────────
  // Among the matches visible in the current week tab, count how many are
  // upcoming (not started) and how many the user has already picked. Show a
  // nudge banner when there are unpicked upcoming games.
  const nudge = computed(() => {
    if (!picksReady.value) return null
    const now = Date.now()

    // Only consider not-yet-started matches in the current visible week
    const upcoming = matches.value.filter((m) => m.status.code === 'ns')
    if (upcoming.length === 0) return null

    const picked = upcoming.filter((m) => picks.value[m.id])
    const unpicked = upcoming.length - picked.length
    if (unpicked === 0) return null

    // Find the soonest unpicked kickoff to gauge urgency
    let soonestMs = Infinity
    for (const m of upcoming) {
      if (picks.value[m.id]) continue
      const t = new Date(m.date).getTime()
      if (!Number.isNaN(t) && t > now && t < soonestMs) soonestMs = t
    }

    // Urgency: red if any unpicked game kicks off within 24h, amber within 48h
    const hoursUntil =
      soonestMs === Infinity ? Infinity : (soonestMs - now) / 3_600_000
    const urgency: 'red' | 'amber' | 'normal' =
      hoursUntil <= 24 ? 'red' : hoursUntil <= 48 ? 'amber' : 'normal'

    return {
      picked: picked.length,
      total: upcoming.length,
      unpicked,
      urgency,
    }
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
      <!-- ── Picks nudge banner ──────────────────────────────────────────── -->
      <div
        v-if="nudge"
        class="scores-nudge"
        :class="`scores-nudge--${nudge.urgency}`"
      >
        <span class="scores-nudge__icon">{{
          nudge.urgency === 'red'
            ? '🚨'
            : nudge.urgency === 'amber'
              ? '⚠️'
              : '🎯'
        }}</span>
        <span class="scores-nudge__text">
          <strong>{{ nudge.picked }} of {{ nudge.total }}</strong> upcoming
          {{ nudge.total === 1 ? 'match' : 'matches' }} picked this week —
          <NuxtLink to="/picks" class="scores-nudge__link"
            >make your picks</NuxtLink
          >
          before they kick off!
        </span>
      </div>

      <!-- Matches by day -->
      <div class="scores-section__days">
        <div
          v-for="[day, dayMatches] in matchesByDay"
          :key="day"
          class="scores-section__day"
        >
          <div class="scores-section__day-header">
            <button
              type="button"
              class="scores-section__day-toggle"
              :aria-expanded="!collapsed.has(day)"
              @click="toggleDay(day)"
            >
              <IconsChevron
                class="scores-section__day-caret"
                :class="{
                  'scores-section__day-caret--collapsed': collapsed.has(day),
                }"
                :stroke-width="3"
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

  /* ── Picks nudge banner ───────────────────────────────────────────────────── */
  .scores-nudge {
    @apply mb-3 flex items-center gap-2.5 rounded-xl px-4 py-3;
  }

  /* Normal: subtle green */
  .scores-nudge--normal {
    background: rgb(5 105 0 / 0.12);
    border: 1px solid rgb(74 222 128 / 0.3);
  }

  /* Amber: warm orange */
  .scores-nudge--amber {
    background: rgb(180 83 9 / 0.15);
    border: 1px solid rgb(251 191 36 / 0.4);
  }

  /* Red: urgent */
  .scores-nudge--red {
    background: rgb(185 28 28 / 0.15);
    border: 1px solid rgb(248 113 113 / 0.45);
  }

  .scores-nudge__icon {
    @apply text-base;
    flex-shrink: 0;
  }

  .scores-nudge__text {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 0.88rem;
    color: rgb(255 255 255 / 0.82);
    line-height: 1.45;
  }

  .scores-nudge__text strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: #ffffff;
  }

  .scores-nudge--normal .scores-nudge__link {
    color: #86efac;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    text-decoration: underline;
  }

  .scores-nudge--amber .scores-nudge__link {
    color: #fde68a;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    text-decoration: underline;
  }

  .scores-nudge--red .scores-nudge__link {
    color: #fca5a5;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    text-decoration: underline;
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

  .scores-section__day-header {
    display: flex;
    align-items: center;
  }

  /* Only the caret + date text is the click target — not the full row width. */
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
    width: fit-content;
    transition:
      background-color 0.12s ease,
      color 0.12s ease;
  }

  .scores-section__day-toggle:focus-visible {
    outline: none;
  }

  /* Light up the date text + caret in a pale yellow on hover/click/focus. */
  .scores-section__day-toggle:hover .scores-section__day-title,
  .scores-section__day-toggle:active .scores-section__day-title,
  .scores-section__day-toggle:focus-visible .scores-section__day-title,
  .scores-section__day-toggle:hover .scores-section__day-caret,
  .scores-section__day-toggle:active .scores-section__day-caret,
  .scores-section__day-toggle:focus-visible .scores-section__day-caret {
    color: #fff3a0;
  }

  .scores-section__day-caret {
    width: 0.85rem;
    height: 0.85rem;
    color: rgb(255 255 255 / 0.4);
    display: inline-block;
    transform: rotate(0deg);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .scores-section__day-caret--collapsed {
    transform: rotate(-90deg);
  }

  .scores-section__day-title {
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.55);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
  }

  .scores-section__grid {
    @apply grid gap-3 sm:grid-cols-2 lg:grid-cols-3;
  }
</style>
