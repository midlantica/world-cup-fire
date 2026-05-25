<script setup lang="ts">
  import type { Match } from '../composables/useScores'
  import { useTimezone } from '../composables/useTimezone'

  const props = defineProps<{
    match: Match
    showDate?: boolean
  }>()

  const emit = defineEmits<{ (e: 'click', match: Match): void }>()

  const { formatTimeHtml } = useTimezone()

  const isHot = computed(() => props.match.qualityScore >= 50)
  const showFire = computed(
    () => props.match.status.code !== 'ft' && isHot.value
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
    <!-- Date header (optional) -->
    <div v-if="showDate" class="match-card__date">{{ dayDateLabel }}</div>

    <!-- Group badge -->
    <div v-if="match.group" class="match-card__group">
      Group {{ match.group }}
    </div>

    <!-- Teams row -->
    <div class="match-card__teams">
      <!-- Home -->
      <div class="match-card__team match-card__team--home">
        <CountryFlag
          :iso2="match.homeIso2"
          :size="36"
          class="match-card__flag"
        />
        <span class="match-card__name">{{ match.home }}</span>
      </div>

      <!-- Score / time -->
      <div class="match-card__centre">
        <template v-if="!isNS">
          <span class="match-card__score">
            {{ match.homeScore }} – {{ match.awayScore }}
          </span>
          <span
            v-if="statusLabel"
            class="match-card__status"
            :class="{ 'match-card__status--live': isLive || isHT }"
          >
            {{ statusLabel }}
          </span>
        </template>
        <template v-else>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span class="match-card__time" v-html="kickoffLabel" />
        </template>
      </div>

      <!-- Away -->
      <div class="match-card__team match-card__team--away">
        <span class="match-card__name">{{ match.away }}</span>
        <CountryFlag
          :iso2="match.awayIso2"
          :size="36"
          class="match-card__flag"
        />
      </div>
    </div>

    <!-- Badges -->
    <div class="match-card__badges">
      <span
        v-if="showFire"
        class="match-card__badge match-card__badge--fire"
        title="Fire match!"
        >🔥</span
      >
      <span
        v-else-if="showWild"
        class="match-card__badge match-card__badge--wild"
        title="Could be good"
        >🎲</span
      >
      <span v-if="match.venue" class="match-card__venue">{{
        match.venue
      }}</span>
    </div>
  </article>
</template>

<style scoped>
  @reference "~/assets/css/main.css";
  .match-card {
    @apply relative cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:bg-white/10 hover:shadow-lg;
  }

  .match-card.live {
    @apply border-green-400/40 bg-green-950/20;
  }

  .match-card.q-high {
    @apply border-orange-400/30;
  }

  .match-card__date {
    @apply mb-2 text-xs font-semibold tracking-wider text-white/40 uppercase;
  }

  .match-card__group {
    @apply mb-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold tracking-wider text-white/60 uppercase;
  }

  .match-card__teams {
    @apply flex items-center gap-3;
  }

  .match-card__team {
    @apply flex min-w-0 flex-1 items-center gap-2;
  }

  .match-card__team--home {
    @apply justify-start;
  }

  .match-card__team--away {
    @apply justify-end;
  }

  .match-card__flag {
    @apply shrink-0;
  }

  .match-card__name {
    @apply truncate text-sm font-semibold text-white;
  }

  .match-card__centre {
    @apply flex shrink-0 flex-col items-center gap-0.5;
  }

  .match-card__score {
    @apply text-xl font-bold text-white tabular-nums;
  }

  .match-card__time {
    @apply text-sm font-medium text-white/70;
  }

  .match-card__status {
    @apply rounded px-1.5 py-0.5 text-xs font-bold text-white/60 uppercase;
  }

  .match-card__status--live {
    @apply animate-pulse bg-green-500/20 text-green-400;
  }

  .match-card__badges {
    @apply mt-2 flex items-center gap-2;
  }

  .match-card__badge {
    @apply text-lg leading-none;
  }

  .match-card__venue {
    @apply ml-auto truncate text-xs text-white/30;
  }
</style>
