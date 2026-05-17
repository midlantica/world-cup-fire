<script setup lang="ts">
  import { useScores } from '~/composables/useScores'
  import { useMatchView } from '~/composables/useMatchView'

  const emit = defineEmits<{ 'select-team': [team: string] }>()

  const { weeks, activeTab, selectTab } = useScores()

  const allWeekMatches = computed(() => weeks[activeTab.value].matches)

  // ── Off-season / hiatus message ───────────────────────────────────────────
  const WC_START = new Date('2026-06-11')
  const WC_END = new Date('2026-07-19')
  const SEASON_END = new Date('2026-11-30')
  const NEXT_SEASON_START = new Date('2027-02-27')

  function fmtDate(d: Date) {
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const offseasonMsg = computed<string | null>(() => {
    const now = new Date()
    if (now >= WC_START && now <= WC_END) {
      return `The MLS Season is on hiatus until the end of the World Cup. The continued MLS season will restart on ${fmtDate(WC_END)}.`
    }
    if (now > SEASON_END) {
      return `The MLS Season is finished. The new MLS season will begin on ${fmtDate(NEXT_SEASON_START)}.`
    }
    return null
  })

  const { weekByDayGroups } = useMatchView(allWeekMatches, activeTab)

  // ── Collapse state ────────────────────────────────────────────────────────
  // Track open/closed state for each day and each time slot.
  // Keys: day key (e.g. "2026-05-13") and slot label (e.g. "6:30PM").
  // Past days and past time slots are auto-collapsed.
  const collapsedDays = ref<Set<string>>(new Set())
  const collapsedSlots = ref<Set<string>>(new Set())

  function toggleDay(key: string) {
    if (collapsedDays.value.has(key)) {
      collapsedDays.value.delete(key)
    } else {
      collapsedDays.value.add(key)
    }
    // trigger reactivity
    collapsedDays.value = new Set(collapsedDays.value)
  }

  function toggleSlot(key: string) {
    if (collapsedSlots.value.has(key)) {
      collapsedSlots.value.delete(key)
    } else {
      collapsedSlots.value.add(key)
    }
    collapsedSlots.value = new Set(collapsedSlots.value)
  }

  // ── Auto-collapse past days/slots ─────────────────────────────────────────
  // Only applies to "This Week" — last/next week show everything open.
  function buildInitialCollapse() {
    if (activeTab.value !== 'this') {
      collapsedDays.value = new Set()
      collapsedSlots.value = new Set()
      return
    }

    const now = Date.now()
    const todayKey = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Chicago',
    })
    const days = new Set<string>()
    const slots = new Set<string>()

    for (const { day, slots: daySlots } of weekByDayGroups.value) {
      if (day.key < todayKey) {
        // Entire past day — collapse it
        days.add(day.key)
      } else if (day.key === todayKey) {
        // Today — collapse only slots where kickoff was more than 2h ago
        for (const [slotLabel, slotMatches] of daySlots) {
          const slotTime = slotMatches[0]?.kickoffSlot ?? 0
          if (slotTime > 0 && slotTime + 2 * 60 * 60 * 1000 < now) {
            slots.add(day.key + slotLabel)
          }
        }
      }
    }

    collapsedDays.value = days
    collapsedSlots.value = slots
  }

  // Run when data first arrives, and whenever the week tab changes
  watch(
    [weekByDayGroups, activeTab],
    ([groups]) => {
      if (groups.length > 0) buildInitialCollapse()
    },
    { immediate: true }
  )
</script>

<template>
  <!-- Week sub-tabs -->
  <div class="week-tabs">
    <button
      v-for="tab in ['last', 'this', 'next'] as const"
      :key="tab"
      class="week-tab"
      :class="{ active: activeTab === tab }"
      @click="selectTab(tab)"
    >
      <span v-if="tab === 'last'">← Last</span>
      <span v-else-if="tab === 'this'">This Week</span>
      <span v-else>Next →</span>
      <span class="week-label">{{ weeks[tab].label }}</span>
    </button>
  </div>

  <!-- No matches (only after load completes) -->
  <div
    v-if="!allWeekMatches.length && !weeks[activeTab].loading"
    class="empty-state"
  >
    <h3 v-if="offseasonMsg" class="offseason-msg">{{ offseasonMsg }}</h3>
    <p v-else class="empty-msg">No MLS matches found for this period.</p>
  </div>

  <!-- All week's games: grouped by day → time slot, quality-sorted within each slot -->
  <div v-else-if="allWeekMatches.length" class="match-list">
    <section
      v-for="{ day, slots } in weekByDayGroups"
      :key="day.key"
      class="day-section"
    >
      <!-- Day heading (collapsible) -->
      <button
        class="day-heading"
        :class="{ collapsed: collapsedDays.has(day.key) }"
        @click="toggleDay(day.key)"
      >
        <span
          class="chevron"
          :class="{ 'chevron-closed': collapsedDays.has(day.key) }"
          >›</span
        >
        {{ day.label }}, {{ day.shortDate }}
      </button>

      <!-- Day content -->
      <template v-if="!collapsedDays.has(day.key)">
        <div
          v-for="[slot, slotMatches] in slots"
          :key="slot"
          class="slot-section"
        >
          <!-- Slot heading (collapsible) -->
          <button
            class="slot-heading"
            :class="{ collapsed: collapsedSlots.has(day.key + slot) }"
            @click="toggleSlot(day.key + slot)"
          >
            <span
              class="chevron chevron-sm"
              :class="{ 'chevron-closed': collapsedSlots.has(day.key + slot) }"
              >›</span
            >
            <span v-html="slot" />
          </button>

          <!-- Slot content -->
          <div v-if="!collapsedSlots.has(day.key + slot)" class="cards-grid">
            <GameBlock
              v-for="m in slotMatches"
              :key="m.id"
              :match="m"
              @select-team="emit('select-team', $event)"
            />
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
  /* ── Week sub-tabs ──────────────────────────────────────────────────────── */
  .week-tabs {
    display: flex;
    width: 100%;
    border-left: 1px solid oklab(100% 0 0 / 0.1);
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    border-right: 1px solid oklab(100% 0 0 / 0.1);
    border-radius: 0 0 0.5rem 0.5rem;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .week-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition:
      color 0.15s,
      background 0.15s;
  }

  .week-tab + .week-tab {
    border-left: 1px solid oklab(100% 0 0 / 0.08);
  }

  .week-tab:hover:not(.active) {
    color: var(--color-text-secondary);
    background: oklab(100% 0 0 / 0.04);
  }

  .week-tab.active {
    color: var(--color-theme-300);
    background: var(--color-theme-900);
  }

  .week-label {
    font-size: 0.625rem;
    font-weight: 400;
    opacity: 0.6;
    margin-top: 0.025rem;
  }

  /* ── Empty state ────────────────────────────────────────────────────────── */
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 1rem;
  }

  .offseason-msg {
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    text-align: center;
    max-width: 36rem;
    line-height: 1.6;
  }

  .empty-msg {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    text-align: center;
    padding: 3rem 0;
  }

  /* ── Match list ─────────────────────────────────────────────────────────── */
  .match-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ── Day section ────────────────────────────────────────────────────────── */
  .day-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* ── Day heading (collapsible button) ───────────────────────────────────── */
  .day-heading {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
    background: none;
    border: none;
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    padding: 0 0 0.375rem 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-theme-300);
    font-family: inherit;
    letter-spacing: inherit;
    cursor: pointer;
    text-align: left;
  }

  .day-heading:hover {
    color: var(--color-theme-100);
  }

  /* ── Slot section ───────────────────────────────────────────────────────── */
  .slot-section {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  /* ── Slot heading (collapsible button) ──────────────────────────────────── */
  .slot-heading {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: white;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
  }

  .slot-heading:hover {
    color: var(--color-theme-100);
  }

  .slot-heading :deep(.ampm) {
    font-size: 0.8em;
  }

  /* ── Chevron ────────────────────────────────────────────────────────────── */
  .chevron {
    display: inline-block;
    font-size: 1.4rem;
    line-height: 1;
    font-style: normal;
    font-weight: 300;
    /* Start pointing down (rotated 90°) */
    transform: rotate(90deg);
    transition: transform 0.2s ease;
    flex-shrink: 0;
    /* Optical alignment */
    margin-top: -0.05em;
  }

  .chevron-sm {
    font-size: 1.1rem;
  }

  /* When closed, point right (0°) */
  .chevron-closed {
    transform: rotate(0deg);
  }

  /* ── Cards grid ─────────────────────────────────────────────────────────── */
  .cards-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  @media (min-width: 560px) {
    .cards-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 820px) {
    .cards-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
