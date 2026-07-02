<script setup lang="ts">
  import { TEAM_BY_NAME } from '~/constants/worldcup'
  import type { Match } from '../../composables/useScores'

  const props = defineProps<{
    detail: Record<string, unknown>
    match: Match
    homeLastDetail?: Record<string, unknown>
    awayLastDetail?: Record<string, unknown>
    homeLastPending?: boolean
    awayLastPending?: boolean
  }>()

  // If teams are not yet determined (knockout placeholders), suppress all lineup data
  const teamsKnown = computed(
    () =>
      TEAM_BY_NAME.has(props.match.home) && TEAM_BY_NAME.has(props.match.away)
  )

  interface Player {
    name: string
    shortName: string
    position: string
    jersey: string
    starter: boolean
  }

  interface SubEvent {
    type: 'on' | 'off'
    minute: string
  }

  /** Normalize a name for fuzzy matching: strip accents, lowercase, collapse spaces */
  function normName(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  function extractRoster(teamData: unknown): Player[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = teamData as any
    // ESPN WC summary uses rosters[n].roster[] (not .athletes[])
    const list: unknown[] = entry?.roster ?? entry?.athletes ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return list.map((a: any) => ({
      name: a.athlete?.displayName ?? a.athlete?.shortName ?? '—',
      shortName: a.athlete?.shortName ?? a.athlete?.displayName ?? '—',
      position: a.position?.abbreviation ?? '',
      jersey: a.athlete?.jersey ?? a.jersey ?? '',
      starter: a.starter ?? false,
    }))
  }

  // Extract roster for a specific team from a match detail object
  // Matches by team display name, falls back to index
  function extractRosterForTeam(
    detail: Record<string, unknown> | undefined,
    teamName: string,
    fallbackIndex: number
  ): Player[] {
    if (!detail) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (detail.rosters as any[]) ?? []
    if (!rosters.length) return []
    // Try to find by team name
    const byName = rosters.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) =>
        (r?.team?.displayName as string)
          ?.toLowerCase()
          .includes(teamName.toLowerCase()) ||
        teamName
          .toLowerCase()
          .includes((r?.team?.displayName as string)?.toLowerCase())
    )
    const entry = byName ?? rosters[fallbackIndex]
    return entry ? extractRoster(entry) : []
  }

  // ── WC match rosters ────────────────────────────────────────────────────────
  const homeRoster = computed<Player[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (props.detail?.rosters as any[]) ?? []
    return extractRoster(rosters[0])
  })

  const awayRoster = computed<Player[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (props.detail?.rosters as any[]) ?? []
    return extractRoster(rosters[1])
  })

  const hasData = computed(
    () => homeRoster.value.length > 0 || awayRoster.value.length > 0
  )

  // ── Fallback: last game rosters ─────────────────────────────────────────────
  const homeFallbackRoster = computed<Player[]>(() =>
    extractRosterForTeam(props.homeLastDetail, props.match.home, 0)
  )

  const awayFallbackRoster = computed<Player[]>(() =>
    extractRosterForTeam(props.awayLastDetail, props.match.away, 1)
  )

  const hasFallbackData = computed(
    () =>
      homeFallbackRoster.value.length > 0 || awayFallbackRoster.value.length > 0
  )

  // ── Last match context labels ───────────────────────────────────────────────
  function getLastMatchLabel(
    detail: Record<string, unknown> | undefined,
    teamName: string
  ): string {
    if (!detail) return ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (detail.rosters as any[]) ?? []
    // Find the opponent team name
    const opponent = rosters.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) =>
        !(r?.team?.displayName as string)
          ?.toLowerCase()
          .includes(teamName.toLowerCase()) &&
        !teamName
          .toLowerCase()
          .includes((r?.team?.displayName as string)?.toLowerCase())
    )
    const opponentName = (opponent?.team?.displayName as string) ?? 'last match'
    return `vs ${opponentName}`
  }

  const homeLastMatchLabel = computed(() =>
    getLastMatchLabel(props.homeLastDetail, props.match.home)
  )
  const awayLastMatchLabel = computed(() =>
    getLastMatchLabel(props.awayLastDetail, props.match.away)
  )

  // ── Substitution map: normalized playerName → { type, minute } ─────────────
  // Keys are accent-stripped lowercase so roster names with accents (e.g.
  // "Raúl Jiménez") match event text that may omit accents ("Raul Jimenez").
  // Only include subs that have already happened (minute ≤ current match clock).
  const subMap = computed<Map<string, SubEvent>>(() => {
    const map = new Map<string, SubEvent>()
    if (!props.detail) return map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = (props.detail.keyEvents as any[]) ?? []

    // Parse current match clock (e.g. "58'" → 58). For FT use Infinity.
    const statusCode = props.match.status.code
    let currentMinute = Infinity
    if (statusCode === 'live' || statusCode === 'ht') {
      const clockStr = props.match.status.clock ?? ''
      const parsed = parseInt(clockStr.replace(/[^0-9]/g, ''), 10)
      if (!isNaN(parsed)) currentMinute = parsed
    }

    for (const e of events) {
      if (e?.type?.text !== 'Substitution') continue
      const minute = (e?.clock?.displayValue as string) ?? ''

      // Only show this sub if it has already happened
      const subMinute = parseInt(minute.replace(/[^0-9]/g, ''), 10)
      if (!isNaN(subMinute) && subMinute > currentMinute) continue

      // ESPN WC format: participants[0] = player coming ON, participants[1] = player coming OFF
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const participants = (e?.participants as any[]) ?? []
      if (participants.length >= 2) {
        const playerOn = (participants[0]?.athlete?.displayName as string) ?? ''
        const playerOff =
          (participants[1]?.athlete?.displayName as string) ?? ''
        if (playerOn) map.set(normName(playerOn), { type: 'on', minute })
        if (playerOff) map.set(normName(playerOff), { type: 'off', minute })
      } else {
        // Fallback: parse "PlayerOn replaces PlayerOff" text format (mock data)
        const text = (e?.text as string) ?? ''
        const stripped = text.replace(/^Substitution:\s*/i, '')
        const m = stripped.match(
          /^(.+?)\s+replaces\s+(.+?)(?:\s+for\s|\s*\(|$)/i
        )
        if (m) {
          const playerOn = m[1]!.trim()
          const playerOff = m[2]!.trim()
          map.set(normName(playerOn), { type: 'on', minute })
          map.set(normName(playerOff), { type: 'off', minute })
        }
      }
    }
    return map
  })

  /** Look up a player in the subMap by normalized display name or short name */
  function getSubEvent(player: Player): SubEvent | undefined {
    return (
      subMap.value.get(normName(player.name)) ??
      subMap.value.get(normName(player.shortName))
    )
  }

  // ── Display rosters (WC data takes priority) ────────────────────────────────
  const displayHomeRoster = computed(() =>
    hasData.value ? homeRoster.value : homeFallbackRoster.value
  )
  const displayAwayRoster = computed(() =>
    hasData.value ? awayRoster.value : awayFallbackRoster.value
  )
  const isFallback = computed(() => !hasData.value && hasFallbackData.value)
  const isLoading = computed(
    () =>
      !hasData.value &&
      !hasFallbackData.value &&
      (props.homeLastPending || props.awayLastPending)
  )
</script>

<template>
  <div class="lineups-tab">
    <!-- Teams not yet determined (knockout placeholder) -->
    <div v-if="!teamsKnown" class="lineups-tab__empty">
      <p>Match data will be available closer to kick-off.</p>
    </div>

    <!-- No data at all -->
    <div
      v-else-if="!hasData && !hasFallbackData && !isLoading"
      class="lineups-tab__empty"
    >
      <p>Lineups will be available closer to kick-off.</p>
    </div>

    <!-- Loading fallback data -->
    <div v-else-if="isLoading" class="lineups-tab__empty">
      <p>Loading last match lineups…</p>
    </div>

    <!-- Roster columns -->
    <div v-else class="lineups-tab__cols">
      <!-- Fallback context banner -->
      <div v-if="isFallback" class="lineups-tab__fallback-banner">
        <span>Last match lineups</span>
      </div>

      <!-- Home -->
      <div class="lineups-tab__col">
        <div class="lineups-tab__col-header">
          <CountryFlag :iso2="match.homeIso2" :size="20" />
          <span class="lineups-tab__col-team">{{ match.homeShort }}</span>
          <span
            v-if="isFallback && homeLastMatchLabel"
            class="lineups-tab__last-label"
          >
            {{ homeLastMatchLabel }}
          </span>
        </div>
        <div
          v-for="player in displayHomeRoster"
          :key="player.name"
          class="player-row"
          :class="{ 'player-row--starter': player.starter }"
        >
          <span class="player-row__jersey">{{ player.jersey }}</span>
          <span class="player-row__name">{{ player.name }}</span>
          <span
            v-if="getSubEvent(player)"
            class="player-row__sub"
            :class="
              getSubEvent(player)!.type === 'on'
                ? 'player-row__sub--on'
                : 'player-row__sub--off'
            "
          >
            <span class="player-row__sub-arrow">{{
              getSubEvent(player)!.type === 'on' ? '▲' : '▼'
            }}</span>
            <span class="player-row__sub-min">{{
              getSubEvent(player)!.minute
            }}</span>
          </span>
          <span class="player-row__pos">{{ player.position }}</span>
        </div>
        <div
          v-if="displayHomeRoster.length === 0"
          class="lineups-tab__col-empty"
        >
          No lineup data
        </div>
      </div>

      <!-- Away -->
      <div class="lineups-tab__col">
        <div class="lineups-tab__col-header">
          <CountryFlag :iso2="match.awayIso2" :size="20" />
          <span class="lineups-tab__col-team">{{ match.awayShort }}</span>
          <span
            v-if="isFallback && awayLastMatchLabel"
            class="lineups-tab__last-label"
          >
            {{ awayLastMatchLabel }}
          </span>
        </div>
        <div
          v-for="player in displayAwayRoster"
          :key="player.name"
          class="player-row"
          :class="{ 'player-row--starter': player.starter }"
        >
          <span class="player-row__jersey">{{ player.jersey }}</span>
          <span class="player-row__name">{{ player.name }}</span>
          <span
            v-if="getSubEvent(player)"
            class="player-row__sub"
            :class="
              getSubEvent(player)!.type === 'on'
                ? 'player-row__sub--on'
                : 'player-row__sub--off'
            "
          >
            <span class="player-row__sub-arrow">{{
              getSubEvent(player)!.type === 'on' ? '▲' : '▼'
            }}</span>
            <span class="player-row__sub-min">{{
              getSubEvent(player)!.minute
            }}</span>
          </span>
          <span class="player-row__pos">{{ player.position }}</span>
        </div>
        <div
          v-if="displayAwayRoster.length === 0"
          class="lineups-tab__col-empty"
        >
          No lineup data
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .lineups-tab__empty {
    @apply py-12 text-center text-white/40;
  }

  .lineups-tab__cols {
    @apply grid grid-cols-2 gap-4;
  }

  .lineups-tab__fallback-banner {
    @apply col-span-2 mb-1 rounded bg-white/5 px-3 py-1.5 text-center text-xs font-semibold tracking-widest text-white/40 uppercase;
  }

  .lineups-tab__col-header {
    @apply mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-white;
  }

  /* Must explicitly override the global span rule in main.css */
  .lineups-tab__col-team {
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
  }

  .lineups-tab__last-label {
    @apply ml-auto text-xs font-normal text-white/35;
  }

  .lineups-tab__col-empty {
    @apply py-4 text-center text-xs text-white/30;
  }

  .player-row {
    @apply flex items-center gap-2 border-t border-white/5 py-1.5 text-xs text-white/60;
  }

  .player-row--starter {
    @apply text-white;
  }

  .player-row__jersey {
    @apply w-5 text-center font-bold text-white/30;
  }

  .player-row__name {
    @apply flex-1 truncate;
  }

  .player-row__pos {
    @apply rounded bg-white/10 px-1 py-0.5 text-xs font-bold text-white/40;
  }

  .player-row__sub {
    display: flex;
    align-items: baseline;
    gap: 0.15rem;
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .player-row__sub--on .player-row__sub-arrow {
    color: oklab(0.8003 -0.1603 0.0863);
    font-size: 0.55rem;
  }

  .player-row__sub--off .player-row__sub-arrow {
    color: oklab(0.7106 0.1538 0.0628);
    font-size: 0.55rem;
  }

  .player-row__sub-min {
    color: oklab(100% 0 0 / 0.45);
  }
</style>
