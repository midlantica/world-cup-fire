<script setup lang="ts">
  import type { Match } from '../composables/useScores'
  import { useTimezone } from '../composables/useTimezone'

  const props = defineProps<{
    match: Match
    showDate?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'click', match: Match): void
    (e: 'click-country', name: string): void
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
      <!-- Left: two team rows -->
      <div class="match-card__teams">
        <!-- Home -->
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
          <span class="match-card__name">{{ match.homeShort }}</span>
          <span v-if="!isNS" class="match-card__score">{{
            match.homeScore
          }}</span>
        </div>
        <!-- Away -->
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
          <span class="match-card__name">{{ match.awayShort }}</span>
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
    @apply relative cursor-pointer rounded-xl transition-all duration-200 hover:shadow-lg;
    background-color: #1d1d1d;
    border: 1px solid rgb(255 255 255 / 0.08);
  }

  .match-card:hover {
    background-color: #252525;
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
  }

  .match-card__score {
    @apply shrink-0 text-sm font-bold text-white/80 tabular-nums;
    @apply font-anybody-bold;
  }

  /* ── Time / status block ─────────────────────────────────────────────────── */
  .match-card__time-block {
    @apply flex shrink-0 flex-col items-center;
    gap: 0;
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
