<script setup lang="ts">
  import type { Match } from '../composables/useScores'
  import { useTimezone } from '../composables/useTimezone'

  const props = defineProps<{
    match: Match
    showDate?: boolean
  }>()

  const emit = defineEmits<{ (e: 'click', match: Match): void }>()

  const { formatTimeHtml } = useTimezone()

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

  const dayDateLabel = computed(() => {
    if (!props.match.date) return ''
    return new Date(props.match.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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
</script>

<template>
  <article
    class="match-card"
    :class="[`q-${qClass}`, { live: isLive || isHT }]"
    @click="emit('click', match)"
  >
    <!-- Top bar: darker row, group pill flush-left, venue flush-right -->
    <div class="match-card__top">
      <span v-if="match.group" class="match-card__group">
        Group {{ match.group }}
      </span>
      <span v-else class="match-card__group match-card__group--ko">KO</span>
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
      <!-- Left: two team rows -->
      <div class="match-card__teams">
        <!-- Home -->
        <div class="match-card__team">
          <CountryFlag
            :iso2="match.homeIso2"
            :size="22"
            class="match-card__flag"
          />
          <span class="match-card__name">{{ match.home }}</span>
          <span v-if="!isNS" class="match-card__score">{{
            match.homeScore
          }}</span>
        </div>
        <!-- Away -->
        <div class="match-card__team">
          <CountryFlag
            :iso2="match.awayIso2"
            :size="22"
            class="match-card__flag"
          />
          <span class="match-card__name">{{ match.away }}</span>
          <span v-if="!isNS" class="match-card__score">{{
            match.awayScore
          }}</span>
        </div>
      </div>

      <!-- Right: time/status -->
      <div class="match-card__time-block">
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
  </article>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── Card shell ──────────────────────────────────────────────────────────── */
  .match-card {
    @apply relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-200 hover:bg-white/10 hover:shadow-lg;
  }

  .match-card.live {
    @apply border-green-400/40 bg-green-950/20;
  }

  .match-card.q-high {
    @apply border-white/15;
  }

  /* ── Top bar — darker strip across full width ────────────────────────────── */
  .match-card__top {
    @apply flex items-stretch justify-between bg-black/30;
  }

  /* Group pill: flush to left edge, only top-left corner rounded (card clips the rest) */
  .match-card__group {
    @apply text-xs font-bold uppercase;
    padding-inline: 0.6rem 0.5rem;
    padding-block: 0.3rem 0.2rem;
    letter-spacing: 0.1em;
    color: color-mix(in oklab, #fff 50%, transparent);
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    /* only round the top-left — card's overflow:hidden handles top-right */
    border-radius: 0.75rem 0 0 0;
    background: oklch(0.18 0 0);
  }

  .match-card__group--ko {
    color: color-mix(in oklab, theme(colors.orange.400) 60%, transparent);
    background: oklch(0.18 0 0);
  }

  .match-card__venue {
    @apply flex-1 self-center truncate px-3 text-right text-xs;
    color: color-mix(in oklab, #fff 25%, transparent);
  }

  /* Fire/wild badge — absolute top-right corner of the whole card */
  .match-card__badge {
    @apply absolute right-2 text-lg leading-none;
    top: -0.6rem;
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

  .match-card__flag {
    @apply shrink-0;
  }

  .match-card__name {
    @apply min-w-0 flex-1 truncate text-sm font-semibold text-white;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
  }

  .match-card__score {
    @apply shrink-0 text-sm font-bold text-white/80 tabular-nums;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
  }

  /* ── Time / status block ─────────────────────────────────────────────────── */
  .match-card__time-block {
    @apply flex shrink-0 flex-col items-center gap-0.5;
  }

  .match-card__kickoff {
    @apply text-sm font-semibold tabular-nums;
    color: color-mix(in oklab, #fff 80%, transparent);
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
  }

  .match-card__date-label {
    @apply text-xs;
    color: color-mix(in oklab, #fff 40%, transparent);
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
  }

  .match-card__status {
    @apply rounded px-2 py-0.5 text-xs font-bold text-white/50 uppercase tabular-nums;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
  }

  .match-card__status--live {
    @apply animate-pulse bg-green-500/20 text-green-400;
  }

  .match-card__status--ft {
    @apply text-white/30;
  }
</style>
