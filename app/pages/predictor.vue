<script setup lang="ts">
  import { usePredictions } from '~/composables/usePredictions'
  import type { GroupMatch } from '~/composables/usePredictions'
  import { WC_GROUPS, matchNumberByEventId } from '~/constants/worldcup'
  import { useTimezone } from '~/composables/useTimezone'
  import { PREDICTOR_CONTEXT_KEY } from '~/composables/usePredictorContext'

  useHead({ title: 'Predictor — World Cup Fire 🔥' })

  const route = useRoute()

  // ── Fetch all tournament matches ───────────────────────────────────────────
  // Fetch all matches (Jun 11 – Jul 19) to compute predicted standings and
  // to use real FT knockout results to override user bracket picks.
  const { data: rawEvents, pending } = useFetch<unknown[]>('/api/schedule', {
    query: { dates: '20260611-20260719' },
  })

  // normaliseEvent is a plain exported function — import it statically
  const { normaliseEvent } = await import('~/composables/useScores')

  function toGroupMatch(
    m: ReturnType<typeof normaliseEvent>,
    rawEv?: unknown
  ): GroupMatch {
    // For knockout matches decided by penalties, derive the advancing team from
    // the raw ESPN event's competitor.winner flag. The scoreboard API returns
    // the 90-min score (which is a draw) but sets winner=true on the team that
    // advanced through the shootout.
    let penWinner: string | null = null
    if (m.status.isPen && rawEv) {
      const ev = rawEv as Record<string, unknown>
      const comp = (ev.competitions as Record<string, unknown>[])?.[0] ?? {}
      const competitors = (comp.competitors as Record<string, unknown>[]) ?? []
      for (const c of competitors) {
        if (c.winner === true) {
          const team = c.team as Record<string, unknown> | undefined
          penWinner = (team?.displayName as string) ?? null
          break
        }
      }
    }

    return {
      id: m.id,
      home: m.home,
      away: m.away,
      group: m.group,
      homeIso2: m.homeIso2,
      awayIso2: m.awayIso2,
      homeColor: m.homeColor,
      awayColor: m.awayColor,
      homeAbbrev: m.homeAbbrev,
      awayAbbrev: m.awayAbbrev,
      homeShort: m.homeShort,
      awayShort: m.awayShort,
      statusCode: m.status.code,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      date: m.date,
      penWinner,
      matchNumber: matchNumberByEventId(m.id),
    }
  }

  const allGroupMatches = computed<GroupMatch[]>(() => {
    if (!rawEvents.value) return []
    return rawEvents.value
      .map((ev) => ({ m: normaliseEvent(ev), ev }))
      .filter(({ m }) => m.group !== null)
      .map(({ m, ev }) => toGroupMatch(m, ev))
  })

  const allKnockoutMatches = computed<GroupMatch[]>(() => {
    if (!rawEvents.value) return []
    return rawEvents.value
      .map((ev) => ({ m: normaliseEvent(ev), ev }))
      .filter(({ m }) => m.group === null)
      .map(({ m, ev }) => toGroupMatch(m, ev))
  })

  // ── Predictions ────────────────────────────────────────────────────────────
  const {
    bracketPickCount,
    getPrediction,
    setPrediction,
    clearAll,
    predictedGroupStandings,
    predictedBracket,
  } = usePredictions()

  // Only count pickable (non-FT) group matches — FT matches are auto-resolved
  // from the real score and are not user-pickable.
  const pickableGroupMatches = computed(() =>
    allGroupMatches.value.filter((m) => m.statusCode !== 'ft')
  )

  const groupPickCount = computed(
    () =>
      pickableGroupMatches.value.filter((m) => getPrediction(m.id) !== null)
        .length
  )

  const totalGroupMatches = computed(() => pickableGroupMatches.value.length)

  // Group matches by group letter
  const matchesByGroup = computed(() => {
    const map = new Map<string, GroupMatch[]>()
    for (const g of WC_GROUPS) map.set(g, [])
    for (const m of allGroupMatches.value) {
      if (m.group) {
        const arr = map.get(m.group) ?? []
        arr.push(m)
        map.set(m.group, arr)
      }
    }
    return map
  })

  // Predicted standings per group (reactive — updates as picks change)
  const standingsByGroup = computed(() => {
    const map = new Map<string, ReturnType<typeof predictedGroupStandings>>()
    for (const g of WC_GROUPS) {
      const matches = matchesByGroup.value.get(g) ?? []
      map.set(g, predictedGroupStandings(g, matches))
    }
    return map
  })

  // Bracket (reactive) — knockout FT results override user picks automatically
  const bracket = computed(() =>
    predictedBracket(allGroupMatches.value, allKnockoutMatches.value)
  )

  // Progress
  const totalBracketMatches = 31 // 16 + 8 + 4 + 2 + 1 (3rd place)

  const groupProgress = computed(() =>
    totalGroupMatches.value > 0
      ? Math.round((groupPickCount.value / totalGroupMatches.value) * 100)
      : 0
  )
  const bracketProgress = computed(() =>
    Math.round((bracketPickCount.value / totalBracketMatches) * 100)
  )
  // Referenced by the progress pills below — keep both reactive so the
  // template can display precise percentages if ever needed.
  void groupProgress
  void bracketProgress

  // ── Pick handler ───────────────────────────────────────────────────────────
  function onGroupPick(matchId: string, outcome: 'home' | 'away' | 'draw') {
    const current = getPrediction(matchId)
    if (current === outcome) {
      // Toggle off
      const { clearPrediction } = usePredictions()
      clearPrediction(matchId)
    } else {
      setPrediction(matchId, outcome)
    }
  }

  function onBracketPick(slotId: string, side: 'home' | 'away') {
    const current = getPrediction(slotId)
    if (current === side) {
      const { clearPrediction } = usePredictions()
      clearPrediction(slotId)
    } else {
      setPrediction(slotId, side)
    }
  }

  // ── Publish predictor header height as CSS var for bracket sticky labels ──
  const predictorHeaderEl = ref<HTMLElement | null>(null)
  function updatePredictorHeaderH() {
    const h = predictorHeaderEl.value?.offsetHeight ?? 0
    document.documentElement.style.setProperty('--predictor-header-h', `${h}px`)
  }
  onMounted(() => {
    updatePredictorHeaderH()
    const ro = new ResizeObserver(updatePredictorHeaderH)
    if (predictorHeaderEl.value) ro.observe(predictorHeaderEl.value)
    onUnmounted(() => ro.disconnect())
  })

  // ── Timezone helpers for match date/time display ───────────────────────────
  const { iana, formatTime } = useTimezone()

  function matchKickoffLabel(date: string | undefined): string {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: iana.value,
    })
  }

  function matchTimeLabel(date: string | undefined): string {
    if (!date) return ''
    return formatTime(date)
  }

  // ── Share data + handlers with the nested /predictor/group and
  // /predictor/bracket route pages ───────────────────────────────────────────
  provide(PREDICTOR_CONTEXT_KEY, {
    matchesByGroup,
    standingsByGroup,
    bracket,
    getPrediction,
    onGroupPick,
    onBracketPick,
    matchKickoffLabel,
    matchTimeLabel,
  })

  // ── Confirm clear ──────────────────────────────────────────────────────────
  const showClearConfirm = ref(false)
  function confirmClear() {
    clearAll()
    showClearConfirm.value = false
  }
</script>

<template>
  <div class="predictor-page">
    <!-- ── Header ── -->
    <div ref="predictorHeaderEl" class="predictor-page__header">
      <div class="predictor-page__header-inner">
        <div class="predictor-page__title-row">
          <h1 class="predictor-page__title">🔮 Predictor</h1>
          <button
            v-if="groupPickCount > 0 || bracketPickCount > 0"
            class="predictor-page__clear-btn"
            @click="showClearConfirm = true"
          >
            Reset
          </button>
        </div>
        <p class="predictor-page__subtitle">
          Pick every match from the group stage all the way to the Final.
        </p>

        <!-- Progress pills -->
        <div class="predictor-page__progress-row">
          <div class="predictor-page__progress-pill">
            <span class="predictor-page__progress-label">Group Stage</span>
            <span class="predictor-page__progress-count">
              {{ groupPickCount
              }}<span class="predictor-page__progress-total"
                >/{{ totalGroupMatches }}</span
              >
            </span>
          </div>
          <div class="predictor-page__progress-divider" />
          <div class="predictor-page__progress-pill">
            <span class="predictor-page__progress-label">Bracket</span>
            <span class="predictor-page__progress-count">
              {{ bracketPickCount
              }}<span class="predictor-page__progress-total"
                >/{{ totalBracketMatches }}</span
              >
            </span>
          </div>
        </div>
      </div>

      <!-- Tab bar -->
      <div class="predictor-page__tabs">
        <NuxtLink
          to="/predictor/group"
          class="predictor-page__tab"
          :class="{
            'predictor-page__tab--active': route.path === '/predictor/group',
          }"
        >
          Group Stage
        </NuxtLink>
        <NuxtLink
          to="/predictor/bracket"
          class="predictor-page__tab"
          :class="{
            'predictor-page__tab--active': route.path === '/predictor/bracket',
          }"
        >
          My Bracket
        </NuxtLink>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="pending" class="predictor-page__loading">
      <div class="predictor-page__spinner" />
      <span>Loading matches…</span>
    </div>

    <!-- ── Nested route content (Group Stage / My Bracket) ── -->
    <NuxtPage v-else />

    <!-- ── Clear confirm modal ── -->
    <Teleport to="body">
      <div
        v-if="showClearConfirm"
        class="predictor-confirm-overlay"
        @click.self="showClearConfirm = false"
      >
        <div class="predictor-confirm">
          <h3 class="predictor-confirm__title">Reset all predictions?</h3>
          <p class="predictor-confirm__text">
            This will clear all {{ groupPickCount + bracketPickCount }} picks.
            This cannot be undone.
          </p>
          <div class="predictor-confirm__actions">
            <button
              class="predictor-confirm__btn predictor-confirm__btn--cancel"
              @click="showClearConfirm = false"
            >
              Cancel
            </button>
            <button
              class="predictor-confirm__btn predictor-confirm__btn--confirm"
              @click="confirmClear"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── Page shell ──────────────────────────────────────────────────────────── */
  .predictor-page {
    flex: 1;
    min-height: 0;
  }

  /* ── Header ──────────────────────────────────────────────────────────────── */
  .predictor-page__header {
    background: #111111;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    position: sticky;
    top: var(--app-header-h, 0px);
    z-index: 20;
  }

  .predictor-page__header-inner {
    @apply mx-auto max-w-5xl px-4 pb-2;
  }

  .predictor-page__title-row {
    @apply flex items-center justify-between;
  }

  .predictor-page__title {
    @apply text-2xl font-black text-white;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 900;
  }

  .predictor-page__subtitle {
    @apply mt-1 text-sm;
    color: #94a3b8;
  }

  .predictor-page__clear-btn {
    @apply rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider uppercase;
    background: rgb(255 255 255 / 0.06);
    color: #94a3b8;
    border: 1px solid rgb(255 255 255 / 0.1);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .predictor-page__clear-btn:hover {
    background: rgb(239 68 68 / 0.15);
    color: #fca5a5;
    border-color: rgb(239 68 68 / 0.3);
  }

  /* ── Progress pills ──────────────────────────────────────────────────────── */
  .predictor-page__progress-row {
    @apply mt-3 flex items-center gap-3;
  }

  .predictor-page__progress-pill {
    @apply flex items-center gap-2;
  }

  .predictor-page__progress-label {
    @apply text-xs tracking-wider uppercase;
    color: #64748b;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 500;
  }

  .predictor-page__progress-count {
    @apply text-sm font-bold tabular-nums;
    color: #e2e8f0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
  }

  .predictor-page__progress-total {
    color: #475569;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 400;
  }

  .predictor-page__progress-divider {
    width: 1px;
    height: 1rem;
    background: rgb(255 255 255 / 0.1);
  }

  /* ── Tab bar ─────────────────────────────────────────────────────────────── */
  .predictor-page__tabs {
    @apply mx-auto flex max-w-5xl;
    margin-top: 0.5rem;
    border-top: 1px solid hsl(0deg 0% 100% / 10%);
  }

  .predictor-page__tab {
    flex: 1;
    padding: 0.65rem 1rem;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 0.9rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgb(255 255 255 / 0.5);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
    text-decoration: none;
    display: block;
  }

  .predictor-page__tab:hover {
    color: rgb(255 255 255 / 0.8);
  }

  .predictor-page__tab--active {
    color: #ffffff;
    border-bottom-color: #f97316;
  }

  /* ── Loading ─────────────────────────────────────────────────────────────── */
  .predictor-page__loading {
    @apply mx-auto flex max-w-3xl flex-col items-center gap-4 py-20;
    color: #64748b;
  }

  .predictor-page__spinner {
    @apply h-8 w-8 rounded-full border-2 border-white/10;
    border-top-color: #f97316;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ── Confirm modal ───────────────────────────────────────────────────────── */
  .predictor-confirm-overlay {
    @apply fixed inset-0 z-50 flex items-center justify-center;
    background: rgb(0 0 0 / 0.7);
    backdrop-filter: blur(4px);
  }

  .predictor-confirm {
    @apply mx-4 w-full max-w-sm rounded-2xl p-6;
    background: #1e293b;
    border: 1px solid rgb(255 255 255 / 0.1);
  }

  .predictor-confirm__title {
    @apply text-lg font-bold text-white;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
  }

  .predictor-confirm__text {
    @apply mt-2 text-sm;
    color: #94a3b8;
  }

  .predictor-confirm__actions {
    @apply mt-5 flex gap-3;
  }

  .predictor-confirm__btn {
    @apply flex-1 rounded-xl py-2.5 text-sm font-bold;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
  }

  .predictor-confirm__btn--cancel {
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.1);
    color: #94a3b8;
  }

  .predictor-confirm__btn--cancel:hover {
    background: rgb(255 255 255 / 0.1);
    color: #e2e8f0;
  }

  .predictor-confirm__btn--confirm {
    background: rgb(239 68 68 / 0.2);
    border: 1px solid rgb(239 68 68 / 0.4);
    color: #fca5a5;
  }

  .predictor-confirm__btn--confirm:hover {
    background: rgb(239 68 68 / 0.3);
    color: #fecaca;
  }
</style>
