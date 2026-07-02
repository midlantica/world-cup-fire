<script setup lang="ts">
  import type { BracketMatch } from '~/composables/usePredictions'
  import type { PredictOutcome } from '~/composables/usePredictions'
  import { useTimezone } from '~/composables/useTimezone'

  const props = defineProps<{
    bracket: BracketMatch[]
    getPrediction: (id: string) => PredictOutcome | null
  }>()

  const emit = defineEmits<{
    pick: [slotId: string, side: 'home' | 'away']
  }>()

  const ROUND_ORDER_ALL: BracketMatch['round'][] = [
    'R32',
    'R16',
    'QF',
    'SF',
    'F',
    '3rd',
  ]

  const rounds = computed(() => {
    const map = new Map<BracketMatch['round'], BracketMatch[]>()
    for (const r of ROUND_ORDER_ALL) map.set(r, [])
    for (const m of props.bracket) map.get(m.round)?.push(m)
    return ROUND_ORDER_ALL.filter((r) => r !== '3rd').map((r) => ({
      round: r,
      matches: map.get(r) ?? [],
    }))
  })

  const thirdPlaceMatches = computed(() =>
    props.bracket.filter((m) => m.round === '3rd')
  )

  const roundLabels: Record<BracketMatch['round'], string> = {
    R32: 'Round of 32',
    R16: 'Round of 16',
    QF: 'Quarter-Finals',
    SF: 'Semi-Finals',
    F: 'Final',
    '3rd': '3rd Place',
  }

  function onPick(slotId: string, side: 'home' | 'away') {
    emit('pick', slotId, side)
  }

  const ROUNDS_WITH_COUNTER: BracketMatch['round'][] = [
    'R32',
    'R16',
    'QF',
    'SF',
  ]

  const roundPickCounts = computed(() => {
    const map = new Map<
      BracketMatch['round'],
      { picked: number; total: number }
    >()
    for (const { round, matches } of rounds.value) {
      const total = matches.length
      const picked = matches.filter(
        (m) => props.getPrediction(m.slotId) !== null
      ).length
      map.set(round, { picked, total })
    }
    return map
  })

  const roundOrder: BracketMatch['round'][] = ['R32', 'R16', 'QF', 'SF', 'F']
  const focusedRoundIdx = ref(0)

  const canGoPrev = computed(() => focusedRoundIdx.value > 0)
  const canGoNext = computed(
    () => focusedRoundIdx.value < roundOrder.length - 1 && !scrolledToEnd.value
  )

  const scrolledToEnd = ref(false)
  const focusedRound = computed(() => roundOrder[focusedRoundIdx.value])

  function smoothScroll(
    scroll: HTMLElement,
    targetLeft: number,
    duration = 300
  ) {
    const start = scroll.scrollLeft
    const delta = targetLeft - start
    if (Math.abs(delta) < 1) return
    const startTime = performance.now()
    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2
      scroll.scrollLeft = start + delta * ease
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  const scrollEl = ref<HTMLElement | null>(null)
  const labelScrollEl = ref<HTMLElement | null>(null)
  const roundEls = ref<Record<string, HTMLElement | null>>({})

  function scrollToRound(idx: number) {
    focusedRoundIdx.value = idx
    const round = roundOrder[idx]
    if (!round) return
    const scroll = scrollEl.value
    const el = roundEls.value[round]
    if (el && scroll) {
      let targetScrollLeft: number
      if (idx === 0) {
        targetScrollLeft = 0
      } else {
        const scrollRect = scroll.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        targetScrollLeft = scroll.scrollLeft + (elRect.left - scrollRect.left)
      }
      smoothScroll(scroll, targetScrollLeft)
      // Sync label scroll immediately for button-triggered scrolls
      if (labelScrollEl.value) {
        smoothScroll(labelScrollEl.value, targetScrollLeft)
      }
    }
  }

  function goPrev() {
    if (canGoPrev.value) scrollToRound(focusedRoundIdx.value - 1)
  }

  function goNext() {
    if (canGoNext.value) scrollToRound(focusedRoundIdx.value + 1)
  }

  function updateFocusedFromScroll() {
    const scroll = scrollEl.value
    if (!scroll) return
    const scrollLeft = scroll.getBoundingClientRect().left
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < roundOrder.length; i++) {
      const round = roundOrder[i]
      if (!round) continue
      const el = roundEls.value[round]
      if (!el) continue
      const elLeft = el.getBoundingClientRect().left
      const dist = Math.abs(elLeft - scrollLeft)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    focusedRoundIdx.value = bestIdx
  }

  const { iana, formatTime } = useTimezone()

  function bracketDateLabel(date: string | undefined): string {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: iana.value,
    })
  }

  function bracketTimeLabel(date: string | undefined): string {
    if (!date) return ''
    return formatTime(date)
  }

  let onBracketScroll: (() => void) | null = null

  onMounted(() => {
    const scroll = scrollEl.value
    const labelScroll = labelScrollEl.value
    if (!scroll) return

    function updateScrollEnd(el: HTMLElement) {
      scrolledToEnd.value = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2
    }

    // Sync label scroll with card scroll on manual drag
    onBracketScroll = () => {
      updateFocusedFromScroll()
      updateScrollEnd(scroll)
      if (labelScroll) {
        labelScroll.scrollLeft = scroll.scrollLeft
      }
    }
    scroll.addEventListener('scroll', onBracketScroll)

    updateScrollEnd(scroll)
  })

  onUnmounted(() => {
    if (onBracketScroll && scrollEl.value) {
      scrollEl.value.removeEventListener('scroll', onBracketScroll)
    }
  })
</script>

<template>
  <div class="bracket-outer">
    <!-- Sticky header: nav carets + label row — outside the scroll container -->
    <div class="bracket-sticky-header">
      <!-- Floating caret buttons -->
      <div class="bracket-nav-bar">
        <button
          v-if="canGoPrev"
          class="bracket-nav-btn bracket-nav-btn--prev"
          aria-label="Previous round"
          @click="goPrev"
        >
          &#8249;
        </button>
        <div v-else class="bracket-nav-spacer" />
        <div class="bracket-nav-flex" />
        <button
          v-if="canGoNext"
          class="bracket-nav-btn bracket-nav-btn--next"
          aria-label="Next round"
          @click="goNext"
        >
          &#8250;
        </button>
        <div v-else class="bracket-nav-spacer" />
      </div>

      <!-- Label row — scrolls horizontally in sync with cards -->
      <div ref="labelScrollEl" class="bracket-labels-scroll">
        <div class="bracket-labels-row">
          <div class="bracket-spacer-left" />
          <div
            v-for="{ round } in rounds"
            :key="round"
            class="bracket-label-cell"
            :class="[
              'bracket-label-cell--' + round.toLowerCase(),
              { 'bracket-label-cell--focused': round === focusedRound },
            ]"
            @click="scrollToRound(roundOrder.indexOf(round))"
          >
            <span class="bracket-label-cell__name">{{
              roundLabels[round]
            }}</span
            ><template v-if="ROUNDS_WITH_COUNTER.includes(round)">
              <span class="bracket-label-cell__sep"> &ndash; </span>
              <span class="bracket-label-cell__count"
                ><span class="bracket-label-cell__count-picked">{{
                  roundPickCounts.get(round)?.picked ?? 0
                }}</span
                ><span class="bracket-label-cell__count-total"
                  >/{{ roundPickCounts.get(round)?.total ?? 0 }}</span
                ></span
              >
            </template>
          </div>
          <div class="bracket-spacer-right" />
        </div>
      </div>
    </div>

    <!-- Cards scroll container -->
    <div ref="scrollEl" class="bracket-scroll">
      <div class="bracket-content">
        <!-- Round columns -->
        <div class="bracket-rounds">
          <div class="bracket-spacer-left" />
          <div
            v-for="{ round, matches } in rounds"
            :key="round"
            :ref="
              (el: Element | ComponentPublicInstance | null) => {
                roundEls[round] = el as HTMLElement | null
              }
            "
            class="bracket-round"
            :class="'bracket-round--' + round.toLowerCase()"
          >
            <div class="bracket-round__matches">
              <div
                v-for="match in matches"
                :key="match.slotId"
                class="bracket-match"
                :class="{
                  'bracket-match--ready': match.ready,
                  'bracket-match--picked': match.pick !== null,
                  'bracket-match--locked': match.locked,
                }"
              >
                <div class="bracket-match__num">
                  <template v-if="match.date">
                    <span class="bracket-match__date">{{
                      bracketDateLabel(match.date)
                    }}</span>
                    <span class="bracket-match__date-sep">·</span>
                    <span
                      v-if="match.locked"
                      class="bracket-match__ft-badge bracket-match__ft-badge--inline"
                      >FT</span
                    >
                    <span v-else class="bracket-match__kickoff">{{
                      bracketTimeLabel(match.date)
                    }}</span>
                  </template>
                  <template v-else>
                    M{{ match.matchNumber
                    }}<span v-if="match.locked" class="bracket-match__ft-badge"
                      >FT</span
                    >
                  </template>
                </div>
                <button
                  class="bracket-match__team bracket-match__team--home"
                  :class="{
                    'bracket-match__team--picked': match.pick === 'home',
                    'bracket-match__team--unpicked':
                      match.pick !== null && match.pick !== 'home',
                    'bracket-match__team--tbd': !match.home,
                  }"
                  :style="
                    match.home ? { '--team-color': '#' + match.homeColor } : {}
                  "
                  :disabled="!match.ready || match.locked"
                  @click="onPick(match.slotId, 'home')"
                >
                  <template v-if="match.home">
                    <CountryFlag :iso2="match.homeIso2" :size="20" />
                    <span class="bracket-match__team-name">{{
                      match.homeShort
                    }}</span>
                  </template>
                  <template v-else
                    ><span class="bracket-match__tbd">TBD</span></template
                  >
                </button>
                <div class="bracket-match__vs">vs</div>
                <button
                  class="bracket-match__team bracket-match__team--away"
                  :class="{
                    'bracket-match__team--picked': match.pick === 'away',
                    'bracket-match__team--unpicked':
                      match.pick !== null && match.pick !== 'away',
                    'bracket-match__team--tbd': !match.away,
                  }"
                  :style="
                    match.away ? { '--team-color': '#' + match.awayColor } : {}
                  "
                  :disabled="!match.ready || match.locked"
                  @click="onPick(match.slotId, 'away')"
                >
                  <template v-if="match.away">
                    <CountryFlag :iso2="match.awayIso2" :size="20" />
                    <span class="bracket-match__team-name">{{
                      match.awayShort
                    }}</span>
                  </template>
                  <template v-else
                    ><span class="bracket-match__tbd">TBD</span></template
                  >
                </button>
              </div>
            </div>

            <!-- 3rd Place rendered below Final in the same column -->
            <template v-if="round === 'F' && thirdPlaceMatches.length > 0">
              <div class="bracket-3rd-label">3rd Place</div>
              <div
                v-for="match in thirdPlaceMatches"
                :key="match.slotId"
                class="bracket-match"
                :class="{
                  'bracket-match--ready': match.ready,
                  'bracket-match--picked': match.pick !== null,
                }"
              >
                <div class="bracket-match__num">
                  <template v-if="match.date">
                    <span class="bracket-match__date">{{
                      bracketDateLabel(match.date)
                    }}</span>
                    <span class="bracket-match__date-sep">·</span>
                    <span
                      v-if="match.locked"
                      class="bracket-match__ft-badge bracket-match__ft-badge--inline"
                      >FT</span
                    >
                    <span v-else class="bracket-match__kickoff">{{
                      bracketTimeLabel(match.date)
                    }}</span>
                  </template>
                  <template v-else>M{{ match.matchNumber }}</template>
                </div>
                <button
                  class="bracket-match__team bracket-match__team--home"
                  :class="{
                    'bracket-match__team--picked': match.pick === 'home',
                    'bracket-match__team--unpicked':
                      match.pick !== null && match.pick !== 'home',
                    'bracket-match__team--tbd': !match.home,
                  }"
                  :style="
                    match.home ? { '--team-color': '#' + match.homeColor } : {}
                  "
                  :disabled="!match.ready"
                  @click="onPick(match.slotId, 'home')"
                >
                  <template v-if="match.home">
                    <CountryFlag :iso2="match.homeIso2" :size="20" />
                    <span class="bracket-match__team-name">{{
                      match.homeShort
                    }}</span>
                  </template>
                  <template v-else
                    ><span class="bracket-match__tbd">TBD</span></template
                  >
                </button>
                <div class="bracket-match__vs">vs</div>
                <button
                  class="bracket-match__team bracket-match__team--away"
                  :class="{
                    'bracket-match__team--picked': match.pick === 'away',
                    'bracket-match__team--unpicked':
                      match.pick !== null && match.pick !== 'away',
                    'bracket-match__team--tbd': !match.away,
                  }"
                  :style="
                    match.away ? { '--team-color': '#' + match.awayColor } : {}
                  "
                  :disabled="!match.ready"
                  @click="onPick(match.slotId, 'away')"
                >
                  <template v-if="match.away">
                    <CountryFlag :iso2="match.awayIso2" :size="20" />
                    <span class="bracket-match__team-name">{{
                      match.awayShort
                    }}</span>
                  </template>
                  <template v-else
                    ><span class="bracket-match__tbd">TBD</span></template
                  >
                </button>
              </div>
            </template>
          </div>
          <div class="bracket-spacer-right" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .bracket-outer {
    display: flex;
    flex-direction: column;
    position: relative;
    /* Center on wide viewports when all columns fit */
    max-width: 62rem;
    margin: 0 auto;
    width: 100%;
  }

  /* ── Sticky header — sticks to top of viewport while page scrolls ────────── */
  .bracket-sticky-header {
    position: sticky;
    top: calc(var(--app-header-h, 0px) + var(--predictor-header-h, 0px));
    z-index: 20;
    background: oklab(0.1776 0 0);
    border-bottom: 1px solid oklab(1 0 0 / 0.08);
  }

  /* ── Floating caret bar — zero-height, overlays the label row ───────────── */
  .bracket-nav-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 21;
    pointer-events: none;
    display: flex;
    align-items: flex-start;
    height: 0;
  }

  .bracket-nav-btn {
    pointer-events: all;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 2.7rem;
    background: oklab(0.1776 0 0 / 0.85);
    border: none;
    color: oklab(1 0 0);
    font-size: 1.6rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    transition:
      color 0.15s ease,
      background 0.15s ease;
  }

  .bracket-nav-btn:hover {
    color: oklab(0.7049 0.1259 0.1379);
    background: oklab(0.1776 0 0 / 0.95);
  }

  .bracket-nav-spacer {
    flex-shrink: 0;
    width: 1.5rem;
    pointer-events: none;
  }

  .bracket-nav-flex {
    flex: 1;
  }

  /* ── Label scroll — hidden scrollbar, synced with card scroll ───────────── */
  .bracket-labels-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .bracket-labels-scroll::-webkit-scrollbar {
    display: none;
  }

  /* ── Scroll container ────────────────────────────────────────────────────── */
  .bracket-scroll {
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
  }

  /* ── Content wrapper — min-width so columns don't wrap ──────────────────── */
  .bracket-content {
    display: flex;
    flex-direction: column;
    min-width: max-content;
    padding-bottom: 1.5rem;
    padding-top: 0.6rem;
  }

  /* ── Label row — inside the synced label scroll container ───────────────── */
  .bracket-labels-row {
    display: flex;
    gap: 0.75rem;
    min-width: max-content;
  }

  /* ── Spacer — persistent left/right gap in scrollable content ───────────── */
  .bracket-spacer-left {
    flex-shrink: 0;
    width: 0.75rem;
  }

  .bracket-spacer-right {
    flex-shrink: 0;
    width: 1rem;
  }

  .bracket-label-cell {
    width: 11rem;
    flex-shrink: 0;
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: center;
    gap: 0.35rem;
    text-align: center;
    padding: 1rem 0;
    white-space: nowrap;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 80,
      'wght' 500;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    line-height: 1;
    cursor: pointer;
  }

  .bracket-label-cell__name {
    color: oklab(0.7049 0.1259 0.1379);
  }

  .bracket-label-cell__sep {
    color: oklab(0.869 -0.0058 -0.019);
  }

  .bracket-label-cell__count {
    font-variant-numeric: tabular-nums;
    color: oklab(0.869 -0.0058 -0.019);
  }

  .bracket-label-cell__count-total {
    color: oklab(0.869 -0.0058 -0.019);
  }

  /* ── Rounds row ──────────────────────────────────────────────────────────── */
  .bracket-rounds {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding-top: 0.6rem;
  }

  /* ── Single round column ─────────────────────────────────────────────────── */
  .bracket-round {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 11rem;
    flex-shrink: 0;
  }

  /* ── Match card ──────────────────────────────────────────────────────────── */
  .bracket-match {
    overflow: hidden;
    border-radius: 4px;
    background: oklab(0.235 0 0);
    border: 1px solid oklab(1 0 0 / 0.12);
    display: flex;
    flex-direction: column;
    margin-bottom: 0.5rem;
  }

  .bracket-match__num {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 400;
    font-size: 0.75rem;
    color: oklab(1 0 0);
    text-align: center;
    padding: 0.25rem 0.5rem 0.1rem;
    letter-spacing: 0.08em;
    background: linear-gradient(
      180deg,
      oklab(0 0 0 / 0.45) 0%,
      oklab(0 0 0 / 0.1) 100%
    );
    border-bottom: 1px solid oklab(1 0 0 / 0.1);
  }

  .bracket-match__team {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0 0.3rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    color: oklab(0.9288 -0.0032 -0.0122);
    width: 100%;
    text-align: center;
  }

  .bracket-match__team:disabled {
    cursor: default;
  }

  .bracket-match__team:not(:disabled):hover {
    background: oklab(0.1591 0 0);
    color: oklab(1 0 0);
  }

  .bracket-match__team--picked {
    background: oklab(0.1591 0 0) !important;
    color: oklab(1 0 0) !important;
  }

  .bracket-match__team--unpicked {
    opacity: 0.3;
  }

  .bracket-match__team--tbd {
    cursor: default;
  }

  .bracket-match__team-name {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0.3rem 0;
  }

  .bracket-match__tbd {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 500;
    font-size: 0.85rem;
    color: oklab(0.6167 0 0);
    letter-spacing: 0.08em;
    padding: 0.3rem 0;
  }

  .bracket-match__vs {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 500;
    font-size: 0.65rem;
    color: oklab(1 0 0 / 0.7);
    text-align: center;
    padding: 0.05rem 0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-top: 1px solid oklab(1 0 0 / 0.05);
    border-bottom: 1px solid oklab(1 0 0 / 0.05);
  }

  /* ── Locked match (real FT result) ──────────────────────────────────────── */
  .bracket-match--locked {
    border-color: oklab(0.7227 -0.1656 0.0972 / 0.3);
  }

  /* ── Date/time in bracket card header ───────────────────────────────────── */
  .bracket-match__num {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    flex-wrap: nowrap;
    white-space: nowrap;
    overflow: hidden;
  }

  .bracket-match__date {
    font-variation-settings:
      'wdth' 87.5,
      'wght' 500;
    color: oklab(0.7107 -0.008 -0.0342);
    letter-spacing: 0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bracket-match__date-sep {
    color: oklab(0.4455 -0.0082 -0.0365);
    flex-shrink: 0;
  }

  .bracket-match__kickoff {
    font-variation-settings:
      'wdth' 87.5,
      'wght' 600;
    color: oklab(0.869 -0.0058 -0.019);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .bracket-match__ft-badge {
    display: inline-block;
    margin-left: 0.35rem;
    font-size: 0.6rem;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 700;
    letter-spacing: 0.1em;
    color: oklab(0.7227 -0.1656 0.0972);
    vertical-align: middle;
    line-height: 1;
  }

  .bracket-match__ft-badge--inline {
    margin-left: 0;
    font-size: 0.7rem;
    flex-shrink: 0;
  }

  /* ── 3rd Place inline label ──────────────────────────────────────────────── */
  .bracket-3rd-label {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 80,
      'wght' 500;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: oklab(0.7049 0.1259 0.1379);
    text-align: center;
    padding: 0.75rem 0 0.25rem;
    line-height: 1;
  }
</style>
