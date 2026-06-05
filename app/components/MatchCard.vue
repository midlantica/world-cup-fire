<script setup lang="ts">
  import type { Match } from '../composables/useScores'
  import { useTimezone } from '../composables/useTimezone'
  import { useMyNation } from '../composables/useMyNation'
  import { usePicks } from '../composables/usePicks'

  const props = defineProps<{
    match: Match
    showDate?: boolean
    /**
     * Read-only context (e.g. inside a pool card): show the chosen win icon
     * but don't allow re-picking or revealing the transient controls.
     */
    readonly?: boolean
  }>()

  const { myNation } = useMyNation()

  // ── Picks ────────────────────────────────────────────────────────────────
  const { wtlOutcome, canPick, canPickDraw, pickWtl, clearPick } = usePicks()

  /** The current Win·Tie·Lose pick for this match (anchored to home), or null. */
  const wtl = computed(() => wtlOutcome(props.match.id))

  /** A pick already exists for this match. */
  const hasPick = computed(() => wtl.value !== null)

  /** Picking is allowed for this (not-yet-started) match. */
  const pickable = computed(() => !props.readonly && canPick(props.match))

  /** A draw (Tie) may be picked here (group-stage). */
  const allowTie = computed(() => canPickDraw(props.match))

  /** Show the WTL control at all: pickable, or a pick already exists. */
  const showWtl = computed(() => pickable.value || hasPick.value)

  /**
   * Armed state: clicking a pick icon (placeholder/chip) on either team row
   * reveals the WD picker for that row. Only one row can be armed at a time.
   * null = closed, 'home' | 'away' = that row's picker is open.
   */
  const armedRow = ref(null as 'home' | 'away' | null)

  const homeRevealed = computed(
    () => pickable.value && armedRow.value === 'home'
  )
  const awayRevealed = computed(
    () => pickable.value && armedRow.value === 'away'
  )

  /**
   * Clicking the pick icon on a team row arms that row's picker.
   * Clicking the same row again closes it.
   * The WtlToggle itself handles the actual pick/cancel via its own click.stop.
   */
  function onPickIconClick(row: 'home' | 'away', e: Event) {
    e.stopPropagation()
    armedRow.value = armedRow.value === row ? null : row
  }

  /** Clicking the time/date block always opens GameDetail. */
  function onCardClick() {
    emit('click', props.match)
  }

  function onPick(choice: 'win' | 'tie' | 'lose') {
    if (!pickable.value) return
    pickWtl(props.match, choice)
    setTimeout(() => {
      armedRow.value = null
    }, 260)
  }

  function cancel() {
    clearPick(props.match.id)
    armedRow.value = null
  }

  /** True when the selected nation is playing in this match. */
  const isMyNation = computed(
    () =>
      !!myNation.value &&
      (props.match.home === myNation.value ||
        props.match.away === myNation.value)
  )

  const emit = defineEmits<{
    (e: 'click', match: Match): void
    (e: 'click-country', name: string): void
    (e: 'click-group', group: string): void
  }>()

  const { formatTimeHtml, iana } = useTimezone()

  const showFire = computed(
    () => props.match.status.code !== 'ft' && props.match.badge === 'fire'
  )
  const showWild = computed(
    () => props.match.status.code !== 'ft' && props.match.badge === 'wild'
  )

  const qClass = computed(() => {
    const q = props.match.qualityScore
    if (q >= 50) return 'high'
    if (q >= 35) return 'mid'
    return 'low'
  })

  const kickoffLabel = computed(() => formatTimeHtml(props.match.date))

  /**
   * Abbreviate placeholder team names for narrow mobile screens.
   * e.g. "Group C Winner"          → "Grp C Winner"
   *      "Group F 2nd Place"        → "Grp F 2nd Plc"
   *      "Third Place Group A/B/C"  → "3rd Plc Grp A/B/C"
   * Only used at ≤ 400px via CSS container/media query toggling.
   */
  function abbreviateName(name: string): string {
    return name
      .replace(/\bThird Place\b/gi, '3rd Plc')
      .replace(/\bThird\b/gi, '3rd')
      .replace(/\bGroup\b/gi, 'Grp')
      .replace(/\b2nd Place\b/gi, '2nd Plc')
      .replace(/\b1st Place\b/gi, '1st Plc')
      .replace(/\bWinner\b/gi, 'Win')
      .replace(/\bPlace\b/gi, 'Plc')
  }

  const homeShortMobile = computed(() => abbreviateName(props.match.homeShort))
  const awayShortMobile = computed(() => abbreviateName(props.match.awayShort))

  const dayDateLabel = computed(() => {
    if (!props.match.date) return ''
    return new Date(props.match.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: iana.value,
    })
  })

  const isLive = computed(() => props.match.status.code === 'live')
  const isHT = computed(() => props.match.status.code === 'ht')
  const isFT = computed(() => props.match.status.code === 'ft')
  const isNS = computed(() => props.match.status.code === 'ns')

  const statusLabel = computed(() => {
    if (isHT.value) return 'HT'
    if (isFT.value) return 'FT'
    if (isLive.value) return props.match.status.clock ?? 'LIVE'
    return null
  })

  // ── Finished-match winner (for the green pick-result triangle) ─────────────
  /** Which side won a finished match: 'home' | 'away' | null (draw/not done). */
  const winner = computed<'home' | 'away' | null>(() => {
    if (props.match.status.code !== 'ft') return null
    const h = Number(props.match.homeScore)
    const a = Number(props.match.awayScore)
    if (Number.isNaN(h) || Number.isNaN(a) || h === a) return null
    return h > a ? 'home' : 'away'
  })
</script>

<template>
  <article
    class="match-card"
    :class="[
      `q-${qClass}`,
      {
        live: isLive || isHT,
        'match-card--mine': isMyNation,
        'match-card--pickable': pickable,
        'match-card--armed': armedRow !== null,
        'match-card--has-pick': hasPick,
      },
    ]"
    @click="onCardClick"
  >
    <!-- Top bar: darker row, group pill flush-left, venue flush-right.
         Clicking the group pill navigates to that group's page. -->
    <div
      class="match-card__top"
      @click.stop="
        match.group ? emit('click-group', match.group) : emit('click', match)
      "
    >
      <span
        v-if="match.group"
        class="match-card__group match-card__group--link"
        :title="`View Group ${match.group}`"
      >
        Group {{ match.group }}
      </span>
      <span v-else class="match-card__group">Knockout Stage</span>
      <span v-if="match.venue" class="match-card__venue">{{
        match.venue
      }}</span>
    </div>

    <!-- Fire / wild badge — absolute top-right of card -->
    <span v-if="showFire" class="match-card__badge" title="Fire match!"
      >🔥</span
    >
    <span v-else-if="showWild" class="match-card__badge" title="Could be good"
      >🎲</span
    >

    <!-- Teams + score/time -->
    <div class="match-card__body">
      <!-- Left: two team rows.
           Each row: [flag] [name] [score?] [pick icon]
           Clicking the team name area opens GameDetail.
           Clicking the pick icon (W/D/placeholder) arms that row's WD picker. -->
      <div class="match-card__teams" @click.stop="onCardClick">
        <!-- Home row -->
        <div class="match-card__team">
          <button
            class="match-card__flag-btn"
            :title="`View ${match.home}`"
            @click.stop="emit('click-country', match.home)"
          >
            <CountryFlag
              :iso2="match.homeIso2"
              :size="22"
              class="match-card__flag"
            />
          </button>
          <span class="match-card__name match-card__name--hoverable">
            <span class="match-card__name-full">{{ match.homeShort }}</span>
            <span class="match-card__name-short">{{ homeShortMobile }}</span>
          </span>

          <!-- Score (live/FT) + winner triangle -->
          <span v-if="!isNS" class="match-card__result">
            <span
              v-if="winner === 'home'"
              class="match-card__tri"
              aria-hidden="true"
            />
            <span class="match-card__score">{{ match.homeScore }}</span>
          </span>

          <!-- Pick icon: placeholder / W chip / D chip — arms the picker on click.
               Only shown for not-started matches where picking is relevant. -->
          <span
            v-if="isNS && showWtl"
            class="match-card__pick-slot"
            @click.stop="onPickIconClick('home', $event)"
          >
            <PicksWtlToggle
              :outcome="wtl"
              :perspective="'home'"
              :popout="'left'"
              :allow-tie="allowTie"
              :revealed="homeRevealed"
              :readonly="readonly"
              @pick="onPick"
              @cancel="cancel"
            />
          </span>
          <!-- Read-only pick chip for finished/live matches -->
          <span v-else-if="!isNS && hasPick" class="match-card__pick-slot">
            <PicksWtlToggle
              :outcome="wtl"
              :perspective="'home'"
              :readonly="true"
            />
          </span>
        </div>

        <!-- Away row -->
        <div class="match-card__team">
          <button
            class="match-card__flag-btn"
            :title="`View ${match.away}`"
            @click.stop="emit('click-country', match.away)"
          >
            <CountryFlag
              :iso2="match.awayIso2"
              :size="22"
              class="match-card__flag"
            />
          </button>
          <span class="match-card__name match-card__name--hoverable">
            <span class="match-card__name-full">{{ match.awayShort }}</span>
            <span class="match-card__name-short">{{ awayShortMobile }}</span>
          </span>

          <!-- Score (live/FT) + winner triangle -->
          <span v-if="!isNS" class="match-card__result">
            <span
              v-if="winner === 'away'"
              class="match-card__tri"
              aria-hidden="true"
            />
            <span class="match-card__score">{{ match.awayScore }}</span>
          </span>

          <!-- Pick icon: placeholder / W chip / D chip — arms the picker on click. -->
          <span
            v-if="isNS && showWtl"
            class="match-card__pick-slot"
            @click.stop="onPickIconClick('away', $event)"
          >
            <PicksWtlToggle
              :outcome="wtl"
              :perspective="'away'"
              :popout="'left'"
              :allow-tie="allowTie"
              :revealed="awayRevealed"
              :readonly="readonly"
              @pick="onPick"
              @cancel="cancel"
            />
          </span>
          <!-- Read-only pick chip for finished/live matches -->
          <span v-else-if="!isNS && hasPick" class="match-card__pick-slot">
            <PicksWtlToggle
              :outcome="wtl"
              :perspective="'away'"
              :readonly="true"
            />
          </span>
        </div>
      </div>

      <!-- Right: time/status block.
           Clicking ALWAYS opens GameDetail — no WTL toggle here.
           The WD picker pops out to the LEFT from the pick icons on the team rows. -->
      <div class="match-card__time-block" @click.stop="onCardClick">
        <!-- Time / status text column -->
        <div class="match-card__time-col">
          <template v-if="!isNS">
            <span
              class="match-card__status"
              :class="{
                'match-card__status--live': isLive || isHT,
                'match-card__status--ft': isFT,
              }"
            >
              {{ statusLabel }}
            </span>
          </template>
          <template v-else>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span class="match-card__kickoff" v-html="kickoffLabel" />
            <span class="match-card__date-label">{{ dayDateLabel }}</span>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── Card shell ──────────────────────────────────────────────────────────── */
  .match-card {
    @apply relative cursor-pointer rounded-xl transition-all duration-200 hover:shadow-lg;
    /* Nation-tinted card surface (falls back to plain grey when no nation). */
    background-color: var(--nation-card, #1d1d1d);
    border: 1px solid rgb(255 255 255 / 0.08);
  }

  .match-card:hover {
    background-color: var(--nation-card-hover, #252525);
  }

  /* ── My nation: subtle accent ring ──────────────────────────────────────────
     Highlights the selected nation's matches inline in the day list. Uses the
     contrast-safe nation accent vars set by useNationTheme (on <html>), with a
     graceful fallback if no theme is active. */
  .match-card--mine {
    /* Stronger nation-tinted surface for the selected nation's own matches. */
    background-color: var(--nation-card-mine, #1d1d1d);
    border-color: var(--nation-accent-soft, rgb(255 255 255 / 0.08));
    box-shadow: 0 0 0 1px var(--nation-accent-soft, transparent);
  }

  .match-card--mine:hover {
    box-shadow: 0 0 0 1px var(--nation-accent, transparent);
  }

  .match-card.live {
    background-color: oklch(0.16 0.02 160);
  }

  .match-card.live:hover {
    background-color: oklch(0.2 0.02 160);
  }

  /* ── Top bar — semi-transparent darkening overlay ───────────────────────── */
  .match-card__top {
    @apply flex items-stretch justify-between overflow-hidden rounded-t-xl;
    background: linear-gradient(
      180deg,
      rgb(0 0 0 / 0.45) 0%,
      rgb(0 0 0 / 0.1) 100%
    );
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
  }

  /* Group pill */
  .match-card__group {
    @apply text-xs font-bold uppercase;
    padding-inline: 0.7rem 0.7rem;
    padding-block: 0.4rem 0.25rem;
    letter-spacing: 0.1em;
    color: color-mix(in oklab, #fff 60%, transparent);
    @apply font-anybody-bold;
  }

  .match-card__group--link {
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .match-card__group--link:hover {
    color: color-mix(in oklab, #fff 90%, transparent);
  }

  .match-card__venue {
    @apply flex-1 self-center truncate text-right text-xs;
    padding-inline: 0.7rem 0.7rem;
    padding-block: 0.4rem 0.25rem;
    color: color-mix(in oklab, #fff 60%, transparent);
  }

  /* Fire/wild badge — absolute top-right corner of the whole card */
  .match-card__badge {
    position: absolute;
    top: -1.7px;
    right: -5px;
    z-index: 10;
    font-size: 1.1rem;
    line-height: 1;
  }

  /* ── Body: teams + time ──────────────────────────────────────────────────── */
  .match-card__body {
    @apply flex items-center gap-3 px-4 py-3;
  }

  /* ── Teams column ────────────────────────────────────────────────────────── */
  .match-card__teams {
    @apply flex min-w-0 flex-1 flex-col gap-1.5;
  }

  .match-card__team {
    @apply flex items-center gap-2;
  }

  .match-card__flag-btn {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .match-card__flag {
    @apply shrink-0;
  }

  .match-card__name {
    @apply min-w-0 flex-1 truncate text-sm font-semibold text-white;
    @apply font-anybody-heading;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
  }

  /* Team names show underline when the teams area is hovered (signals
     the area is clickable to open GameDetail). */
  .match-card__teams:hover .match-card__name--hoverable {
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-color: color-mix(in oklab, #fff 40%, transparent);
  }

  /* Full name shown by default; short name hidden */
  /* Must explicitly set font-variation-settings to override the global span rule in main.css */
  .match-card__name-full,
  .match-card__name-short {
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    letter-spacing: inherit;
  }

  .match-card__name-full {
    display: inline;
  }

  .match-card__name-short {
    display: none;
  }

  /* ── Extreme-narrow mobile (≤ 400px): abbreviate + tighten font ─────────── */
  @media (max-width: 400px) {
    .match-card__name-full {
      display: none;
    }

    .match-card__name-short {
      display: inline;
    }

    /* Tighter variable font: narrower width + slightly lighter weight */
    .match-card__name {
      font-variation-settings:
        'wdth' 82,
        'wght' 450;
      letter-spacing: 0.02em;
    }

    /* Tighten the body padding a touch */
    .match-card__body {
      padding-inline: 0.65rem;
      gap: 0.5rem;
    }

    /* Slightly smaller kickoff time */
    .match-card__kickoff {
      font-size: 0.9rem;
    }

    /* Tighten date label */
    .match-card__date-label {
      font-size: 0.75rem;
    }
  }

  /* ── Very narrow (≤ 360px): tighten group pill padding ──────────────────── */
  @media (max-width: 360px) {
    .match-card__group {
      padding-inline: 0.7rem 0rem;
    }
  }

  /* ── Finished result: score + winner triangle ───────────────────────────── */

  .match-card__result {
    @apply flex shrink-0 items-center gap-1;
  }

  .match-card__tri {
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 7px solid #006f0d;
  }

  .match-card__score {
    @apply shrink-0 text-sm font-bold text-white/80 tabular-nums;
    @apply font-anybody-bold;
  }

  /* ── Pick icon slot — sits at the right end of each team row ─────────────
     The WtlToggle inside pops its picker out to the LEFT (absolutely positioned)
     so it overlaps the time block area without shifting the layout. */
  .match-card__pick-slot {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  /* ── Time / status block ─────────────────────────────────────────────────── */
  /* Clicking always opens GameDetail. No WTL toggle here. */
  .match-card__time-block {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 0.4rem;
    border-radius: 0.5rem;
    padding: 0.35rem 0.5rem;
  }

  /* Time text column: stacks kickoff time + date label */
  .match-card__time-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  .match-card__kickoff {
    @apply font-semibold tabular-nums;
    font-size: 1rem;
    color: color-mix(in oklab, #fff 80%, transparent);
    @apply font-anybody-medium;
  }

  .match-card__kickoff :deep(.ampm) {
    font-size: 85%;
  }

  .match-card__date-label {
    font-size: 0.9rem;
    color: color-mix(in oklab, #fff 75%, transparent);
    @apply font-anybody-copy;
  }

  .match-card__status {
    @apply rounded px-2 py-0.5 text-xs font-bold text-white/50 uppercase tabular-nums;
    @apply font-anybody-bold;
  }

  .match-card__status--live {
    @apply animate-pulse bg-green-500/20 text-green-400;
  }

  .match-card__status--ft {
    @apply text-white/30;
  }
</style>
