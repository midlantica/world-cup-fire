<script setup lang="ts">
  import { usePredictions } from '~/composables/usePredictions'
  import type { GroupMatch } from '~/composables/usePredictions'
  import { WC_GROUPS, matchNumberByEventId } from '~/constants/worldcup'

  useHead({ title: 'Predictor — World Cup Fire 🔥' })

  // ── Tab state — persisted in URL hash ─────────────────────────────────────
  type PredictorTab = 'groups' | 'bracket'

  function hashToTab(hash: string): PredictorTab {
    return hash === '#bracket' ? 'bracket' : 'groups'
  }

  const activeTab = ref<PredictorTab>('groups')

  function setTab(tab: PredictorTab) {
    activeTab.value = tab
    if (import.meta.client) {
      history.replaceState(null, '', tab === 'groups' ? '#groups' : '#bracket')
    }
  }

  onMounted(() => {
    // Read hash after hydration to avoid SSR mismatch
    activeTab.value = hashToTab(window.location.hash)
    window.addEventListener('hashchange', () => {
      activeTab.value = hashToTab(window.location.hash)
    })
  })

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
        <button
          class="predictor-page__tab"
          :class="{ 'predictor-page__tab--active': activeTab === 'groups' }"
          @click="setTab('groups')"
        >
          Group Stage
        </button>
        <button
          class="predictor-page__tab"
          :class="{ 'predictor-page__tab--active': activeTab === 'bracket' }"
          @click="setTab('bracket')"
        >
          My Bracket
        </button>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="pending" class="predictor-page__loading">
      <div class="predictor-page__spinner" />
      <span>Loading matches…</span>
    </div>

    <!-- ── Group Stage Tab ── -->
    <div v-else-if="activeTab === 'groups'" class="predictor-page__content">
      <div class="predictor-groups-grid">
        <div
          v-for="groupLetter in WC_GROUPS"
          :key="groupLetter"
          class="predictor-group"
        >
          <!-- Group header + mini standings -->
          <div class="predictor-group__header">
            <h2 class="predictor-group__title">
              <NuxtLink
                :to="`/group/${groupLetter.toLowerCase()}`"
                class="predictor-group__title-link"
              >
                Group {{ groupLetter }}
                <svg
                  class="predictor-group__link-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                    clip-rule="evenodd"
                  />
                  <path
                    fill-rule="evenodd"
                    d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </NuxtLink>
            </h2>
            <!-- Mini predicted standings -->
            <div class="predictor-group__standings">
              <div
                v-for="entry in standingsByGroup.get(groupLetter)"
                :key="entry.teamName"
                class="predictor-group__standing-row"
                :class="{
                  'predictor-group__standing-row--advances': entry.rank <= 2,
                }"
              >
                <span class="predictor-group__standing-rank">{{
                  entry.rank
                }}</span>
                <CountryFlag :iso2="entry.iso2" :size="16" />
                <span class="predictor-group__standing-name">{{
                  entry.shortName
                }}</span>
                <span class="predictor-group__standing-pts"
                  >{{ entry.points }}pt</span
                >
              </div>
            </div>
          </div>

          <!-- Match pick cards -->
          <div class="predictor-group__matches">
            <div
              v-for="match in matchesByGroup.get(groupLetter)"
              :key="match.id"
              class="predictor-match"
              :class="{ 'predictor-match--final': match.statusCode === 'ft' }"
            >
              <!--
              Unified row layout:
              [home half: name + flag, flush-right] | [center col] | [away half: flag + name, flush-left]
            -->
              <div class="predictor-match__row">
                <!-- ── Home half ── -->
                <template v-if="match.statusCode === 'ft'">
                  <!-- FT: static div, winner highlighted -->
                  <div
                    class="predictor-match__half predictor-match__half--home"
                    :class="{
                      'predictor-match__half--winner':
                        Number(match.homeScore) > Number(match.awayScore),
                      'predictor-match__half--loser':
                        Number(match.homeScore) < Number(match.awayScore),
                    }"
                    :style="{ '--team-color': `#${match.homeColor}` }"
                  >
                    <span class="predictor-match__name">
                      <span class="predictor-match__name--full">{{
                        match.homeShort
                      }}</span>
                      <span class="predictor-match__name--abbr">{{
                        match.homeAbbrev
                      }}</span>
                    </span>
                    <CountryFlag :iso2="match.homeIso2" :size="22" />
                  </div>
                </template>
                <template v-else>
                  <!-- Pickable button -->
                  <button
                    class="predictor-match__half predictor-match__half--home"
                    :class="{
                      'predictor-match__half--picked':
                        getPrediction(match.id) === 'home',
                      'predictor-match__half--unpicked':
                        getPrediction(match.id) !== null &&
                        getPrediction(match.id) !== 'home',
                    }"
                    :style="{ '--team-color': `#${match.homeColor}` }"
                    @click="onGroupPick(match.id, 'home')"
                  >
                    <span class="predictor-match__name">
                      <span class="predictor-match__name--full">{{
                        match.homeShort
                      }}</span>
                      <span class="predictor-match__name--abbr">{{
                        match.homeAbbrev
                      }}</span>
                    </span>
                    <CountryFlag :iso2="match.homeIso2" :size="22" />
                  </button>
                </template>

                <!-- ── Center column ── -->
                <div class="predictor-match__center">
                  <!-- FT: score row -->
                  <template v-if="match.statusCode === 'ft'">
                    <div class="predictor-match__score-row">
                      <span class="predictor-match__score-num">{{
                        match.homeScore
                      }}</span>
                      <span class="predictor-match__score-sep">–</span>
                      <span class="predictor-match__score-num">{{
                        match.awayScore
                      }}</span>
                    </div>
                  </template>
                  <!-- Live: pulsing score row -->
                  <template
                    v-else-if="
                      match.statusCode === 'live' || match.statusCode === 'ht'
                    "
                  >
                    <div
                      class="predictor-match__score-row predictor-match__score-row--live"
                    >
                      <span class="predictor-match__live-dot" />
                      <span class="predictor-match__score-num">{{
                        match.homeScore
                      }}</span>
                      <span class="predictor-match__score-sep">–</span>
                      <span class="predictor-match__score-num">{{
                        match.awayScore
                      }}</span>
                    </div>
                  </template>
                  <!-- NS: Draw button -->
                  <template v-else>
                    <button
                      class="predictor-match__draw"
                      :class="{
                        'predictor-match__draw--picked':
                          getPrediction(match.id) === 'draw',
                      }"
                      @click="onGroupPick(match.id, 'draw')"
                    >
                      D
                    </button>
                  </template>
                </div>

                <!-- ── Away half ── -->
                <template v-if="match.statusCode === 'ft'">
                  <div
                    class="predictor-match__half predictor-match__half--away"
                    :class="{
                      'predictor-match__half--winner':
                        Number(match.awayScore) > Number(match.homeScore),
                      'predictor-match__half--loser':
                        Number(match.awayScore) < Number(match.homeScore),
                    }"
                    :style="{ '--team-color': `#${match.awayColor}` }"
                  >
                    <CountryFlag :iso2="match.awayIso2" :size="22" />
                    <span class="predictor-match__name">
                      <span class="predictor-match__name--full">{{
                        match.awayShort
                      }}</span>
                      <span class="predictor-match__name--abbr">{{
                        match.awayAbbrev
                      }}</span>
                    </span>
                  </div>
                </template>
                <template v-else>
                  <button
                    class="predictor-match__half predictor-match__half--away"
                    :class="{
                      'predictor-match__half--picked':
                        getPrediction(match.id) === 'away',
                      'predictor-match__half--unpicked':
                        getPrediction(match.id) !== null &&
                        getPrediction(match.id) !== 'away',
                    }"
                    :style="{ '--team-color': `#${match.awayColor}` }"
                    @click="onGroupPick(match.id, 'away')"
                  >
                    <CountryFlag :iso2="match.awayIso2" :size="22" />
                    <span class="predictor-match__name">
                      <span class="predictor-match__name--full">{{
                        match.awayShort
                      }}</span>
                      <span class="predictor-match__name--abbr">{{
                        match.awayAbbrev
                      }}</span>
                    </span>
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Bracket Tab ── -->
    <div
      v-else
      class="predictor-page__content predictor-page__content--bracket"
    >
      <PredictorBracket
        :bracket="bracket"
        :get-prediction="getPrediction"
        @pick="onBracketPick"
      />
    </div>

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

  /* ── Content area ────────────────────────────────────────────────────────── */
  .predictor-page__content {
    @apply mx-auto max-w-5xl px-4 py-4;
  }

  .predictor-page__content--bracket {
    @apply max-w-full px-0 py-0;
  }

  /* ── Groups grid: 1-col by default, 2-col at ≥640px ─────────────────────── */
  .predictor-groups-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    align-items: start;
  }

  @media (min-width: 640px) {
    .predictor-groups-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* ── Group section ───────────────────────────────────────────────────────── */
  .predictor-group {
    @apply overflow-hidden rounded-xl;
    background: #1a1a1a;
    border: 1px solid rgb(255 255 255 / 0.08);
  }

  .predictor-group__header {
    @apply flex items-center justify-between gap-4 px-4 py-3;
    background: rgb(0 0 0 / 0.25);
    border-bottom: 1px solid rgb(255 255 255 / 0.07);
  }

  .predictor-group__title {
    @apply font-bold tracking-widest uppercase;
    font-size: 1.3rem;
    color: #94a3b8;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .predictor-group__title-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: inherit;
    text-decoration: none;
    transition: color 0.15s ease;
    line-height: 1;
  }

  .predictor-group__title-link:hover {
    color: #e2e8f0;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .predictor-group__link-icon {
    width: 1.3rem;
    height: 1.3rem;
    flex-shrink: 0;
    opacity: 0.6;
    position: relative;
    top: -3px;
  }

  .predictor-group__title-link:hover .predictor-group__link-icon {
    opacity: 1;
  }

  /* Mini standings */
  .predictor-group__standings {
    @apply flex flex-col gap-0.5;
    min-width: 0;
  }

  .predictor-group__standing-row {
    @apply flex items-center gap-1.5;
    opacity: 0.45;
  }

  .predictor-group__standing-row--advances {
    opacity: 1;
  }

  .predictor-group__standing-rank {
    @apply w-3 text-right text-xs tabular-nums;
    color: #64748b;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 500;
  }

  .predictor-group__standing-name {
    @apply min-w-0 flex-1 truncate text-xs;
    color: #cbd5e1;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 500;
  }

  .predictor-group__standing-pts {
    @apply text-xs tabular-nums;
    color: #64748b;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 400;
  }

  .predictor-group__standing-row--advances .predictor-group__standing-pts {
    color: #94a3b8;
  }

  /* ── Match rows ──────────────────────────────────────────────────────────── */
  .predictor-group__matches {
    display: flex;
    flex-direction: column;
  }

  /* Faint divider between rows only (not after last) */
  .predictor-match + .predictor-match {
    border-top: 1px solid rgb(255 255 255 / 0.07);
  }

  .predictor-match {
    padding: 0;
  }

  /* Unified 3-column row: [home half] [center] [away half] */
  .predictor-match__row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: stretch;
    min-height: 2.75rem;
  }

  /* ── Half buttons / divs ─────────────────────────────────────────────────── */
  .predictor-match__half {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    background: transparent;
    border: none;
    color: #cbd5e1;
    transition:
      background 0.15s ease,
      color 0.15s ease;
    min-width: 0;
  }

  /* Home: name flush-right, flag on right edge */
  .predictor-match__half--home {
    justify-content: flex-end;
    text-align: right;
    cursor: pointer;
    border-radius: 0;
  }

  /* Away: flag on left edge, name flush-left */
  .predictor-match__half--away {
    justify-content: flex-start;
    text-align: left;
    cursor: pointer;
    border-radius: 0;
  }

  /* FT static halves: not clickable */
  div.predictor-match__half {
    cursor: default;
  }

  /* Hover (pickable only) */
  button.predictor-match__half:hover {
    background: #0d0d0d;
    color: #ffffff;
  }

  /* Picked */
  .predictor-match__half--picked {
    background: #0d0d0d !important;
    color: #ffffff !important;
  }

  /* Unpicked (other side was chosen) */
  .predictor-match__half--unpicked {
    opacity: 0.35;
  }

  /* FT winner */
  .predictor-match__half--winner {
    background: rgb(0 0 0 / 50%);
    color: #e2e8f0;
  }

  /* FT loser */
  .predictor-match__half--loser {
    color: #475569;
  }

  /* Team name spans */
  .predictor-match__name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 90,
      'wght' 400;
    font-size: 0.9rem;
    color: inherit;
  }

  /* Full name: shown by default, hidden on mobile */
  .predictor-match__name--full {
    display: inline;
  }

  /* Abbrev: hidden by default, shown on mobile */
  .predictor-match__name--abbr {
    display: none;
  }

  /* ── Center column ───────────────────────────────────────────────────────── */
  .predictor-match__center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    padding: 0 0.25rem;
    flex-shrink: 0;
    min-width: 3.25rem;
  }

  /* Draw button */
  .predictor-match__draw {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 2px;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(255 255 255 / 0.1);
    color: hsl(0deg 0% 100% / 75%);
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .predictor-match__draw:hover {
    background: rgb(255 255 255 / 0.1);
    color: #cbd5e1;
  }

  .predictor-match__draw--picked {
    background: #000000;
    border-color: #ffffff;
    color: #ffffff;
  }

  /* Score row (horizontal: num – num) */
  .predictor-match__score-row {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  /* Live: add dot before score */
  .predictor-match__score-row--live {
    gap: 0.25rem;
  }

  .predictor-match__score-num {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    font-size: 1rem;
    color: #e2e8f0;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .predictor-match__score-sep {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 0.85rem;
    color: #ffffff;
    line-height: 1;
  }

  /* Live dot */
  .predictor-match__live-dot {
    display: block;
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 5px #22c55e;
    animation: pulse-dot 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes pulse-dot {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  /* ── Mobile ≤425px: abbreviations ───────────────────────────────────────── */
  @media (max-width: 425px) {
    .predictor-match__name--full {
      display: none;
    }

    .predictor-match__name--abbr {
      display: inline;
    }

    .predictor-match__name {
      font-size: 0.85rem;
    }

    .predictor-match__half {
      padding: 0.4rem 0.5rem;
      gap: 0.35rem;
    }

    .predictor-match__center {
      min-width: 2.75rem;
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
