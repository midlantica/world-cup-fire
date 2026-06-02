<script setup lang="ts">
  import { useCountryDetail } from '~/composables/useCountryDetail'
  import { useStandings } from '~/composables/useStandings'
  import {
    TEAM_BY_NAME,
    espnLogoUrl,
    wcTitles,
    nameToIso2,
    venueLocation,
  } from '~/constants/worldcup'

  import type { Match } from '~/composables/useScores'
  import { useMatchDetail } from '~/composables/useMatchDetail'
  import { useModalNav } from '~/composables/useModalNav'
  import { useGroupDetail } from '~/composables/useGroupDetail'

  const { selectedCountry, countryData, modalOpen, closeCountry, openCountry } =
    useCountryDetail()
  const { myNation } = useMyNation()
  const { openMatch } = useMatchDetail()

  /** True when a given match involves the user's selected nation, so it gets
   *  the subtle accent ring (consistent with MatchCard's --mine treatment).
   *  Works in any country's modal: e.g. viewing Haiti while Brazil is your
   *  nation rings the Brazil-vs-Haiti card. */
  function isMyMatch(home: string, away: string): boolean {
    const mine = myNation.value
    return !!mine && (home === mine || away === mine)
  }

  const { pushHistory, popHistory, clearHistory, canGoBack } = useModalNav()
  const { openGroup } = useGroupDetail()

  function goToGroup() {
    const g = countryData.value?.group
    if (!g) return
    closeCountry({ silent: true })
    openGroup(g)
  }

  function goBack() {
    const prev = popHistory()
    if (!prev) return
    closeCountry({ silent: true })
    if (prev.type === 'match') {
      openMatch(prev.match)
    }
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  type ModalTab = 'schedule' | 'squad' | 'results' | 'standing'
  const TAB_ORDER: ModalTab[] = ['schedule', 'squad', 'standing', 'results']
  const activeTab = ref<ModalTab>('schedule')
  const slideDir = ref<'left' | 'right'>('left')

  function setTab(tab: ModalTab) {
    const from = TAB_ORDER.indexOf(activeTab.value)
    const to = TAB_ORDER.indexOf(tab)
    slideDir.value = to > from ? 'left' : 'right'
    activeTab.value = tab
  }

  // Reset tab when country changes
  watch(selectedCountry, () => {
    activeTab.value = 'schedule'
  })

  // ── Body scroll lock ──────────────────────────────────────────────────────
  watchEffect(() => {
    if (import.meta.client) {
      if (modalOpen.value) {
        document.documentElement.classList.add('modal-open')
      } else {
        document.documentElement.classList.remove('modal-open')
      }
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      document.documentElement.classList.remove('modal-open')
    }
  })

  // ── Backdrop click ────────────────────────────────────────────────────────
  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('cd-backdrop')) {
      closeCountry()
    }
  }

  // ── Country colors → CSS vars ─────────────────────────────────────────────

  /** Returns perceived luminance 0–255 for a 6-char hex string */
  function hexLuminance(hex: string): number {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return 0.299 * r + 0.587 * g + 0.114 * b
  }

  /** Pick the best accent color for the active tab underline.
   *  Prefer primary; if it's too dark (≤ 30 lum) try altColor;
   *  if that's also too dark fall back to white. */
  function pickTabAccent(primary: string, alt: string): string {
    const clean = (h: string) => h.replace('#', '').toLowerCase()
    const p = clean(primary)
    const a = clean(alt)
    if (hexLuminance(p) > 30) return `#${p}`
    if (hexLuminance(a) > 30) return `#${a}`
    return '#ffffff'
  }

  const headerStyle = computed(() => {
    const c = countryData.value
    if (!c) return {}
    const primary = `#${c.color}`
    const alt = `#${c.altColor}`
    const text = `#${c.textColor}`

    // ── Group pill colors ────────────────────────────────────────────────
    // The pill is filled with the country's secondary (alt) color. For the text
    // we deliberately avoid using the primary brand color directly: saturated
    // colors layered on a saturated background (e.g. red on blue) cause an
    // uncomfortable "vibrating" optical effect (chromostereopsis). Instead we
    // pick a neutral black or white — whichever contrasts best against the pill
    // background — so the label is always crisp and stable.
    const groupBg = alt
    const bgLum = hexLuminance(c.altColor) // 0–255
    // Resting text: contrasting black/white. On hover we deepen it to full
    // strength black/white so the change still reads clearly.
    const restText =
      bgLum > 150 ? 'oklab(0% 0 0 / 0.78)' : 'oklab(100% 0 0 / 0.9)'
    const hoverText = bgLum > 150 ? '#000000' : '#ffffff'
    return {
      '--cd-primary': primary,
      '--cd-alt': alt,
      '--cd-text': text,
      '--cd-group-bg': groupBg,
      '--cd-group-text': restText,
      '--cd-group-hover-text': hoverText,
      background: `linear-gradient(135deg, ${primary} 0%, color-mix(in oklab, ${primary} 70%, black) 100%)`,
      color: text,
    }
  })

  const tabsStyle = computed(() => {
    const c = countryData.value
    if (!c) return {}
    return {
      '--cd-tab-accent': pickTabAccent(c.color, c.altColor),
    }
  })

  // ── Schedule: fetch all WC matches, filter for this country ──────────────
  const { data: allEvents, pending: schedPending } = useLazyFetch<unknown[]>(
    '/api/schedule',
    {
      query: { dates: '20260611-20260719' },
      server: false,
    }
  )

  interface ScheduleMatch {
    id: string
    date: string
    home: string
    homeIso2: string
    homeScore: string | null
    away: string
    awayIso2: string
    awayScore: string | null
    venue: string | null
    statusCode: 'ns' | 'ft' | 'live' | 'ht'
    statusClock?: string
    group: string | null
    isHome: boolean
    opponent: string
    opponentIso2: string
  }

  function parseStatus(ev: Record<string, unknown>): {
    code: 'ns' | 'ft' | 'live' | 'ht'
    clock?: string
  } {
    const status = ev.status as Record<string, unknown> | undefined
    const type = status?.type as Record<string, unknown> | undefined
    const state = (type?.state as string) ?? ''
    const name = (type?.name as string) ?? ''
    const completed = type?.completed as boolean | undefined
    if (completed === true || state === 'post') return { code: 'ft' }
    if (name === 'STATUS_HALFTIME') return { code: 'ht' }
    if (state === 'in') {
      const clock = (type?.displayClock as string) ?? undefined
      return { code: 'live', clock: clock !== '0:00' ? clock : undefined }
    }
    return { code: 'ns' }
  }

  const countryMatches = computed<ScheduleMatch[]>(() => {
    const name = selectedCountry.value
    if (!name || !allEvents.value) return []

    const results: ScheduleMatch[] = []
    for (const raw of allEvents.value) {
      const ev = raw as Record<string, unknown>
      const comps = (ev.competitions as Array<Record<string, unknown>>) ?? []
      const comp = comps[0]
      if (!comp) continue
      const competitors =
        (comp.competitors as Array<Record<string, unknown>>) ?? []
      const homeComp =
        competitors.find((c) => c.homeAway === 'home') ?? competitors[0]
      const awayComp =
        competitors.find((c) => c.homeAway === 'away') ?? competitors[1]
      if (!homeComp || !awayComp) continue

      const homeTeam = homeComp.team as Record<string, unknown>
      const awayTeam = awayComp.team as Record<string, unknown>
      const homeName = (homeTeam?.displayName as string) ?? ''
      const awayName = (awayTeam?.displayName as string) ?? ''

      if (homeName !== name && awayName !== name) continue

      const isHome = homeName === name
      const homeData = TEAM_BY_NAME.get(homeName)
      const awayData = TEAM_BY_NAME.get(awayName)
      const { code, clock } = parseStatus(ev)

      const homeScore =
        code !== 'ns' ? ((homeComp.score as string) ?? '0') : null
      const awayScore =
        code !== 'ns' ? ((awayComp.score as string) ?? '0') : null

      const venue = (comp.venue as Record<string, unknown>)?.fullName as
        | string
        | null

      results.push({
        id: String(ev.id ?? ''),
        date: String(ev.date ?? ''),
        home: homeName,
        homeIso2: homeData?.iso2 ?? '',
        homeScore,
        away: awayName,
        awayIso2: awayData?.iso2 ?? '',
        awayScore,
        venue: venue ?? null,
        statusCode: code,
        statusClock: clock,
        group: homeData?.group ?? awayData?.group ?? null,
        isHome,
        opponent: isHome ? awayName : homeName,
        opponentIso2: isHome ? (awayData?.iso2 ?? '') : (homeData?.iso2 ?? ''),
      })
    }

    // Sort chronologically
    return results.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  })

  // ── Squad: fetch from the team's first WC match detail ───────────────────
  interface SquadPlayer {
    name: string
    jersey: string
    position: string
    starter: boolean
    subbedIn: boolean
    subbedOut: boolean
  }

  // Find the first match ID for this country (any status)
  const firstMatchId = computed(() => {
    return countryMatches.value[0]?.id ?? null
  })

  const {
    data: squadDetail,
    pending: squadPending,
    execute: fetchSquad,
  } = useLazyFetch<Record<string, unknown>>('/api/match-detail', {
    query: computed(() => ({ eventId: firstMatchId.value ?? '' })),
    watch: false,
    immediate: false,
    server: false,
  })

  // Fetch squad when tab becomes active and we have a match ID
  watch(
    [() => activeTab.value, firstMatchId],
    ([tab, id]) => {
      if (tab === 'squad' && id && !squadDetail.value) {
        fetchSquad()
      }
    },
    { immediate: true }
  )

  function extractSquadPlayers(
    detail: Record<string, unknown> | null | undefined,
    countryName: string
  ): SquadPlayer[] {
    if (!detail || !countryName) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (detail.rosters as any[]) ?? []
    // Find the roster entry for this country
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = rosters.find((r: any) => {
      const teamName = r.team?.displayName ?? r.team?.name ?? ''
      return (
        teamName === countryName ||
        teamName.toLowerCase().includes(countryName.toLowerCase()) ||
        countryName.toLowerCase().includes(teamName.toLowerCase())
      )
    })
    if (!entry) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list: any[] = entry.roster ?? entry.athletes ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return list.map((a: any) => ({
      name: a.athlete?.displayName ?? a.athlete?.shortName ?? '—',
      jersey: a.athlete?.jersey ?? a.jersey ?? '',
      position: a.position?.abbreviation ?? '',
      starter: a.starter ?? false,
      subbedIn: a.subbedIn ?? false,
      subbedOut: a.subbedOut ?? false,
    }))
  }

  const squadPlayers = computed<SquadPlayer[]>(() =>
    extractSquadPlayers(squadDetail.value, selectedCountry.value ?? '')
  )

  // ── Results: completed WC matches + recent historical results ─────────────
  const completedMatches = computed<ScheduleMatch[]>(() => {
    return countryMatches.value.filter((m) => m.statusCode === 'ft').slice(-10)
  })

  // Recent results from ESPN "all" league (pre-tournament matches)
  interface RecentResult {
    id: string
    date: string
    homeTeam: string
    homeTeamId: string
    homeScore: string
    awayTeam: string
    awayTeamId: string
    awayScore: string
    status: string
    venue: string | null
  }

  const teamId = computed(() => countryData.value?.id ?? null)

  const {
    data: recentResults,
    pending: recentPending,
    execute: fetchRecentResults,
  } = useLazyFetch<RecentResult[]>('/api/team-results', {
    query: computed(() => ({ teamId: teamId.value ?? '', limit: 10 })),
    watch: false,
    immediate: false,
    server: false,
  })

  // ── Fallback squad: walk recent matches until one has roster data ─────────
  // Index into recentResults — advances if a match has no roster data
  const fallbackMatchIndex = ref(0)

  const lastMatchEventId = computed<string | null>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (recentResults.value as any)?.[fallbackMatchIndex.value]?.id ?? null
  )

  const {
    data: lastMatchDetail,
    pending: lastMatchPending,
    execute: fetchLastMatchDetail,
  } = useLazyFetch<Record<string, unknown>>('/api/match-detail', {
    query: computed(() => ({ eventId: lastMatchEventId.value ?? '' })),
    watch: false,
    immediate: false,
    server: false,
  })

  // Pre-fetch recentResults as soon as teamId is available (modal open),
  // so the fallback squad chain is already in flight before the user clicks Squad.
  watch(
    teamId,
    (id) => {
      if (id && !recentResults.value) {
        fetchRecentResults()
      }
    },
    { immediate: true }
  )

  // Once recentResults loads (or index advances), fetch that match's detail
  watch(lastMatchEventId, (id) => {
    if (id && !squadPlayers.value.length) {
      lastMatchDetail.value = undefined
      fetchLastMatchDetail()
    }
  })

  // After fetching a match detail, if it has no roster data try the next match
  watch(lastMatchDetail, (detail) => {
    if (!detail || squadPlayers.value.length) return
    const players = extractSquadPlayers(detail, selectedCountry.value ?? '')
    if (
      players.length === 0 &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fallbackMatchIndex.value < ((recentResults.value as any)?.length ?? 0) - 1
    ) {
      fallbackMatchIndex.value++
    }
  })

  // Re-fetch if team changes (reset stale data and restart the chain)
  watch(teamId, (id, oldId) => {
    if (id && oldId && id !== oldId) {
      recentResults.value = undefined
      lastMatchDetail.value = undefined
      fallbackMatchIndex.value = 0
      fetchRecentResults()
    }
  })

  // Fetch recent results when results tab becomes active (in case pre-fetch hasn't run yet)
  watch([() => activeTab.value, teamId], ([tab, id]) => {
    if (tab === 'results' && id && !recentResults.value) {
      fetchRecentResults()
    }
  })

  const fallbackSquadPlayers = computed<SquadPlayer[]>(() =>
    extractSquadPlayers(lastMatchDetail.value, selectedCountry.value ?? '')
  )

  // Label: "vs [opponent] · [date]" — uses the actual match that had roster data
  const fallbackSquadLabel = computed<string>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const last = (recentResults.value as any)?.[fallbackMatchIndex.value]
    if (!last) return 'Last match'
    const id = teamId.value
    const opponent = last.homeTeamId === id ? last.awayTeam : last.homeTeam
    const date = new Date(last.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `vs ${opponent} · ${date}`
  })

  // Helper: determine result label (W/D/L) from the perspective of the featured team
  function getResultLabel(r: RecentResult): 'W' | 'D' | 'L' | null {
    const id = teamId.value
    if (!id) return null
    const isHome = r.homeTeamId === id
    const myScore = Number(isHome ? r.homeScore : r.awayScore)
    const oppScore = Number(isHome ? r.awayScore : r.homeScore)
    if (myScore > oppScore) return 'W'
    if (myScore < oppScore) return 'L'
    return 'D'
  }

  // Helper: get opponent name from a recent result
  function getOpponent(r: RecentResult): string {
    const id = teamId.value
    if (!id) return ''
    return r.homeTeamId === id ? r.awayTeam : r.homeTeam
  }

  // Helper: get opponent ISO2 from a recent result (best-effort via TEAM_BY_NAME)
  function getOpponentIso2(r: RecentResult): string {
    const oppName = getOpponent(r)
    return TEAM_BY_NAME.get(oppName)?.iso2 ?? ''
  }

  // Helper: get my score / opp score
  function getScores(r: RecentResult): { mine: string; opp: string } {
    const id = teamId.value
    if (!id) return { mine: r.homeScore, opp: r.awayScore }
    const isHome = r.homeTeamId === id
    return {
      mine: isHome ? r.homeScore : r.awayScore,
      opp: isHome ? r.awayScore : r.homeScore,
    }
  }

  // ── Standings: fetch group standing for this country ──────────────────────
  const { groupByLetter } = useStandings()

  const groupStanding = computed(() => {
    const c = countryData.value
    if (!c) return null
    return groupByLetter.value.get(c.group) ?? null
  })

  // ── Helpers ───────────────────────────────────────────────────────────────
  function formatMatchDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatMatchTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // ── Navigate to another country's modal ──────────────────────────────────
  function navigateToCountry(name: string) {
    if (!name || name === selectedCountry.value) return
    // Push current country onto history so user can go back
    if (selectedCountry.value) {
      pushHistory({ type: 'country', name: selectedCountry.value })
    }
    openCountry(name)
  }

  function openMatchDetail(m: ScheduleMatch) {
    // Build a minimal Match object to open the game detail modal
    const homeData = TEAM_BY_NAME.get(m.home)
    const awayData = TEAM_BY_NAME.get(m.away)
    const match: Match = {
      id: m.id,
      date: m.date,
      home: m.home,
      homeShort: homeData?.shortName ?? homeData?.name ?? m.home,
      homeScore: m.homeScore,
      homeColor: homeData?.color ?? '888888',
      homeAltColor: homeData?.altColor ?? 'ffffff',
      homeIso2: m.homeIso2,
      homeAbbrev: homeData?.abbrev ?? m.home.slice(0, 3).toUpperCase(),
      away: m.away,
      awayShort: awayData?.shortName ?? awayData?.name ?? m.away,
      awayScore: m.awayScore,
      awayColor: awayData?.color ?? '888888',
      awayAltColor: awayData?.altColor ?? 'ffffff',
      awayIso2: m.awayIso2,
      awayAbbrev: awayData?.abbrev ?? m.away.slice(0, 3).toUpperCase(),
      group: m.group,
      venue: m.venue,
      venueLocation: venueLocation(m.venue),
      status: { code: m.statusCode, clock: m.statusClock },
      qualityScore: 0,
      badge: null,
    }
    // Push current country onto history before navigating to match
    if (selectedCountry.value) {
      pushHistory({ type: 'country', name: selectedCountry.value })
    }
    closeCountry({ silent: true })
    openMatch(match)
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="cd-modal">
      <div
        v-if="modalOpen && countryData"
        class="cd-backdrop"
        @click="onBackdrop"
      >
        <div class="cd-card">
          <!-- ── Header ──────────────────────────────────────────────────── -->
          <div class="cd-header" :style="headerStyle">
            <div class="cd-header__inner">
              <!-- Flag + ESPN logo -->
              <div class="cd-header__logos">
                <img
                  :src="espnLogoUrl(countryData.abbrev)"
                  :alt="countryData.name"
                  class="cd-header__crest"
                  loading="lazy"
                />
              </div>

              <!-- Name + meta -->
              <div class="cd-header__info">
                <h2 class="cd-header__name">
                  <span class="cd-header__name-text">{{
                    countryData.name
                  }}</span>
                  <!-- One star per World Cup title, sized to the name's x-height -->
                  <span
                    v-if="wcTitles(countryData.name)"
                    class="cd-header__stars"
                    :title="`${wcTitles(countryData.name)}× World Cup winner`"
                    aria-hidden="true"
                  >
                    <svg
                      v-for="n in wcTitles(countryData.name)"
                      :key="n"
                      class="cd-header__star"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"
                      />
                    </svg>
                  </span>
                </h2>

                <p class="cd-header__meta">
                  <button class="cd-header__group" @click="goToGroup">
                    Group {{ countryData.group }}
                  </button>
                  <span class="cd-header__rank"
                    >FIFA #{{ countryData.fifaRank }}</span
                  >
                </p>
              </div>
            </div>

            <!-- Close -->
            <button class="cd-close" aria-label="Close" @click="closeCountry">
              <CloseIcon />
            </button>
          </div>

          <!-- ── Bio blurb ─────────────────────────────────────────────── -->
          <p v-if="countryData.bio" class="cd-bio">{{ countryData.bio }}</p>

          <!-- ── Tabs ───────────────────────────────────────────────────── -->
          <div class="cd-tabs" :style="tabsStyle">
            <button
              class="cd-tab"
              :class="{ active: activeTab === 'schedule' }"
              @click="setTab('schedule')"
            >
              Schedule
            </button>
            <button
              class="cd-tab"
              :class="{ active: activeTab === 'squad' }"
              @click="setTab('squad')"
            >
              Squad
            </button>
            <button
              class="cd-tab"
              :class="{ active: activeTab === 'standing' }"
              @click="setTab('standing')"
            >
              Group {{ countryData.group }}
            </button>
            <button
              class="cd-tab"
              :class="{ active: activeTab === 'results' }"
              @click="setTab('results')"
            >
              Form
            </button>
          </div>

          <!-- ── Body ───────────────────────────────────────────────────── -->
          <div class="cd-body">
            <!-- Schedule tab -->
            <Transition :name="`tab-slide-${slideDir}`" mode="out-in">
              <div
                v-if="activeTab === 'schedule'"
                key="schedule"
                class="tab-pane"
              >
                <div v-if="schedPending" class="cd-loading">
                  <div class="cd-spinner" />
                  <span>Loading schedule…</span>
                </div>

                <template v-else-if="countryMatches.length">
                  <div
                    v-for="m in countryMatches"
                    :key="m.id"
                    class="cd-match"
                    :class="{
                      'cd-match--live':
                        m.statusCode === 'live' || m.statusCode === 'ht',
                      'cd-match--ft': m.statusCode === 'ft',
                      'cd-match--mine': isMyMatch(m.home, m.away),
                    }"
                    @click="openMatchDetail(m)"
                  >
                    <!-- Top bar: group + venue -->

                    <div class="cd-match__top">
                      <span v-if="m.group" class="cd-match__group">
                        Group {{ m.group }}
                      </span>
                      <span v-else class="cd-match__group">Knockout</span>
                      <span v-if="m.venue" class="cd-match__venue">{{
                        m.venue
                      }}</span>
                    </div>

                    <!-- Teams + score/time -->
                    <div class="cd-match__body">
                      <div class="cd-match__teams">
                        <!-- Home -->
                        <div class="cd-match__team">
                          <CountryFlag :iso2="m.homeIso2" :size="20" />
                          <div class="cd-match__team-name-wrap">
                            <span
                              class="cd-match__team-name"
                              :class="{
                                'cd-match__team-name--featured': m.isHome,
                                'cd-match__team-name--link':
                                  m.home !== selectedCountry,
                              }"
                              @click.stop="
                                m.home !== selectedCountry &&
                                navigateToCountry(m.home)
                              "
                            >
                              {{
                                TEAM_BY_NAME.get(m.home)?.shortName ?? m.home
                              }}
                            </span>
                          </div>
                          <span
                            v-if="m.statusCode !== 'ns'"
                            class="cd-match__score"
                            :class="{
                              'cd-match__score--winner':
                                m.statusCode === 'ft' &&
                                Number(m.homeScore) > Number(m.awayScore),
                            }"
                          >
                            {{ m.homeScore }}
                          </span>
                        </div>
                        <!-- Away -->
                        <div class="cd-match__team">
                          <CountryFlag :iso2="m.awayIso2" :size="20" />
                          <div class="cd-match__team-name-wrap">
                            <span
                              class="cd-match__team-name"
                              :class="{
                                'cd-match__team-name--featured': !m.isHome,
                                'cd-match__team-name--link':
                                  m.away !== selectedCountry,
                              }"
                              @click.stop="
                                m.away !== selectedCountry &&
                                navigateToCountry(m.away)
                              "
                            >
                              {{
                                TEAM_BY_NAME.get(m.away)?.shortName ?? m.away
                              }}
                            </span>
                          </div>
                          <span
                            v-if="m.statusCode !== 'ns'"
                            class="cd-match__score"
                            :class="{
                              'cd-match__score--winner':
                                m.statusCode === 'ft' &&
                                Number(m.awayScore) > Number(m.homeScore),
                            }"
                          >
                            {{ m.awayScore }}
                          </span>
                        </div>
                      </div>

                      <!-- Right: time/status -->
                      <div class="cd-match__time-block">
                        <template v-if="m.statusCode === 'ns'">
                          <span class="cd-match__time">{{
                            formatMatchTime(m.date)
                          }}</span>
                          <span class="cd-match__date">{{
                            formatMatchDate(m.date)
                          }}</span>
                        </template>
                        <template v-else>
                          <span
                            class="cd-match__status"
                            :class="{
                              'cd-match__status--live':
                                m.statusCode === 'live' ||
                                m.statusCode === 'ht',
                            }"
                          >
                            {{
                              m.statusCode === 'ht'
                                ? 'HT'
                                : m.statusCode === 'ft'
                                  ? 'FT'
                                  : (m.statusClock ?? 'LIVE')
                            }}
                          </span>
                          <span class="cd-match__date">{{
                            formatMatchDate(m.date)
                          }}</span>
                        </template>
                      </div>
                    </div>
                  </div>
                </template>

                <div v-else class="cd-empty">
                  <p>No matches found.</p>
                </div>
              </div>

              <!-- Squad tab -->
              <div
                v-else-if="activeTab === 'squad'"
                key="squad"
                class="tab-pane"
              >
                <div
                  v-if="squadPending || recentPending || lastMatchPending"
                  class="cd-loading"
                >
                  <div class="cd-spinner" />
                  <span>Loading squad…</span>
                </div>

                <template v-else-if="squadPlayers.length">
                  <!-- Section header -->
                  <div class="cd-squad__section-label">
                    From Match vs
                    {{
                      countryMatches[0]?.isHome
                        ? (TEAM_BY_NAME.get(countryMatches[0]?.away ?? '')
                            ?.shortName ?? countryMatches[0]?.away)
                        : (TEAM_BY_NAME.get(countryMatches[0]?.home ?? '')
                            ?.shortName ?? countryMatches[0]?.home)
                    }}
                  </div>

                  <!-- Starters -->
                  <div class="cd-squad__group">
                    <div class="cd-squad__group-label">Starting XI</div>
                    <div
                      v-for="p in squadPlayers.filter((p) => p.starter)"
                      :key="p.name"
                      class="cd-squad__player"
                    >
                      <span class="cd-squad__jersey">{{ p.jersey }}</span>
                      <div class="cd-squad__name">{{ p.name }}</div>
                      <span v-if="p.position" class="cd-squad__pos">{{
                        p.position
                      }}</span>
                      <span
                        v-if="p.subbedOut"
                        class="cd-squad__event cd-squad__event--out"
                        >↓</span
                      >
                    </div>
                  </div>

                  <!-- Substitutes -->
                  <div
                    v-if="squadPlayers.filter((p) => !p.starter).length"
                    class="cd-squad__group"
                  >
                    <div class="cd-squad__group-label">Substitutes</div>
                    <div
                      v-for="p in squadPlayers.filter((p) => !p.starter)"
                      :key="p.name"
                      class="cd-squad__player cd-squad__player--sub"
                    >
                      <span class="cd-squad__jersey">{{ p.jersey }}</span>
                      <div class="cd-squad__name">{{ p.name }}</div>
                      <span v-if="p.position" class="cd-squad__pos">{{
                        p.position
                      }}</span>
                      <span
                        v-if="p.subbedIn"
                        class="cd-squad__event cd-squad__event--in"
                        >↑</span
                      >
                    </div>
                  </div>
                </template>

                <!-- Fallback: last match squad -->
                <template v-else-if="fallbackSquadPlayers.length">
                  <div class="cd-squad__section-label">
                    Last match · {{ fallbackSquadLabel }}
                  </div>

                  <!-- Starters -->
                  <div class="cd-squad__group">
                    <div class="cd-squad__group-label">Starting XI</div>
                    <div
                      v-for="p in fallbackSquadPlayers.filter((p) => p.starter)"
                      :key="p.name"
                      class="cd-squad__player"
                    >
                      <span class="cd-squad__jersey">{{ p.jersey }}</span>
                      <div class="cd-squad__name">{{ p.name }}</div>
                      <span v-if="p.position" class="cd-squad__pos">{{
                        p.position
                      }}</span>
                      <span
                        v-if="p.subbedOut"
                        class="cd-squad__event cd-squad__event--out"
                        >↓</span
                      >
                    </div>
                  </div>

                  <!-- Substitutes -->
                  <div
                    v-if="fallbackSquadPlayers.filter((p) => !p.starter).length"
                    class="cd-squad__group"
                  >
                    <div class="cd-squad__group-label">Substitutes</div>
                    <div
                      v-for="p in fallbackSquadPlayers.filter(
                        (p) => !p.starter
                      )"
                      :key="p.name"
                      class="cd-squad__player cd-squad__player--sub"
                    >
                      <span class="cd-squad__jersey">{{ p.jersey }}</span>
                      <div class="cd-squad__name">{{ p.name }}</div>
                      <span v-if="p.position" class="cd-squad__pos">{{
                        p.position
                      }}</span>
                      <span
                        v-if="p.subbedIn"
                        class="cd-squad__event cd-squad__event--in"
                        >↑</span
                      >
                    </div>
                  </div>
                </template>

                <div
                  v-else-if="!firstMatchId && !lastMatchEventId"
                  class="cd-empty"
                >
                  <p>Squad will be available once the schedule is loaded.</p>
                </div>

                <div v-else class="cd-empty">
                  <p>Squad not yet announced.</p>
                </div>
              </div>

              <!-- Results tab -->
              <div
                v-else-if="activeTab === 'results'"
                key="results"
                class="tab-pane"
              >
                <!-- World Cup completed matches (once tournament starts) -->
                <template v-if="completedMatches.length">
                  <div class="cd-results__section-label">World Cup 2026</div>
                  <div
                    v-for="m in completedMatches"
                    :key="m.id"
                    class="cd-match cd-match--ft"
                    @click="openMatchDetail(m)"
                  >
                    <div class="cd-match__top">
                      <span v-if="m.group" class="cd-match__group">
                        Group {{ m.group }}
                      </span>
                      <span v-else class="cd-match__group">Knockout</span>
                      <span v-if="m.venue" class="cd-match__venue">{{
                        m.venue
                      }}</span>
                    </div>
                    <div class="cd-match__body">
                      <div class="cd-match__teams">
                        <div class="cd-match__team">
                          <CountryFlag :iso2="m.homeIso2" :size="20" />
                          <div class="cd-match__team-name-wrap">
                            <span
                              class="cd-match__team-name"
                              :class="{
                                'cd-match__team-name--featured': m.isHome,
                                'cd-match__team-name--link':
                                  m.home !== selectedCountry,
                              }"
                              @click.stop="
                                m.home !== selectedCountry &&
                                navigateToCountry(m.home)
                              "
                            >
                              {{
                                TEAM_BY_NAME.get(m.home)?.shortName ?? m.home
                              }}
                            </span>
                          </div>
                          <span
                            class="cd-match__score"
                            :class="{
                              'cd-match__score--winner':
                                Number(m.homeScore) > Number(m.awayScore),
                            }"
                          >
                            {{ m.homeScore }}
                          </span>
                        </div>
                        <div class="cd-match__team">
                          <CountryFlag :iso2="m.awayIso2" :size="20" />
                          <div class="cd-match__team-name-wrap">
                            <span
                              class="cd-match__team-name"
                              :class="{
                                'cd-match__team-name--featured': !m.isHome,
                                'cd-match__team-name--link':
                                  m.away !== selectedCountry,
                              }"
                              @click.stop="
                                m.away !== selectedCountry &&
                                navigateToCountry(m.away)
                              "
                            >
                              {{
                                TEAM_BY_NAME.get(m.away)?.shortName ?? m.away
                              }}
                            </span>
                          </div>
                          <span
                            class="cd-match__score"
                            :class="{
                              'cd-match__score--winner':
                                Number(m.awayScore) > Number(m.homeScore),
                            }"
                          >
                            {{ m.awayScore }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Recent historical results -->
                <div v-if="recentPending" class="cd-loading">
                  <div class="cd-spinner" />
                  <span>Loading recent results…</span>
                </div>

                <template v-else-if="recentResults && recentResults.length">
                  <div v-for="r in recentResults" :key="r.id" class="cd-result">
                    <!-- Top bar: date + venue -->
                    <div class="cd-result__top">
                      <span class="cd-result__date">{{
                        formatMatchDate(r.date)
                      }}</span>
                      <span v-if="r.venue" class="cd-match__venue">{{
                        r.venue
                      }}</span>
                    </div>
                    <!-- Body: teams + score + W/D/L badge -->
                    <div class="cd-match__body">
                      <div class="cd-match__teams">
                        <!-- Home -->
                        <div class="cd-match__team">
                          <CountryFlag
                            :iso2="nameToIso2(r.homeTeam)"
                            :size="20"
                          />

                          <div class="cd-match__team-name-wrap">
                            <span
                              class="cd-match__team-name"
                              :class="{
                                'cd-match__team-name--featured':
                                  r.homeTeamId === teamId,
                              }"
                            >
                              {{
                                TEAM_BY_NAME.get(r.homeTeam)?.shortName ??
                                r.homeTeam
                              }}
                            </span>
                          </div>
                          <span
                            class="cd-match__score"
                            :class="{
                              'cd-match__score--winner':
                                Number(r.homeScore) > Number(r.awayScore),
                            }"
                          >
                            {{ r.homeScore }}
                          </span>
                        </div>
                        <!-- Away -->
                        <div class="cd-match__team">
                          <CountryFlag
                            :iso2="nameToIso2(r.awayTeam)"
                            :size="20"
                          />

                          <div class="cd-match__team-name-wrap">
                            <span
                              class="cd-match__team-name"
                              :class="{
                                'cd-match__team-name--featured':
                                  r.awayTeamId === teamId,
                              }"
                            >
                              {{
                                TEAM_BY_NAME.get(r.awayTeam)?.shortName ??
                                r.awayTeam
                              }}
                            </span>
                          </div>
                          <span
                            class="cd-match__score"
                            :class="{
                              'cd-match__score--winner':
                                Number(r.awayScore) > Number(r.homeScore),
                            }"
                          >
                            {{ r.awayScore }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <div
                  v-else-if="!recentPending && !completedMatches.length"
                  class="cd-empty"
                >
                  <p>No results available.</p>
                </div>
              </div>

              <!-- Standing tab -->
              <div
                v-else-if="activeTab === 'standing'"
                key="standing"
                class="tab-pane"
              >
                <div v-if="!groupStanding" class="cd-loading">
                  <div class="cd-spinner" />
                  <span>Loading standings…</span>
                </div>

                <template v-else>
                  <div class="cd-standing">
                    <div class="cd-standing__header">
                      Group {{ groupStanding.letter }}
                    </div>
                    <table class="cd-standing__table">
                      <thead>
                        <tr>
                          <th class="cd-th cd-th--team">Team</th>
                          <th class="cd-th">P</th>
                          <th class="cd-th">W</th>
                          <th class="cd-th">D</th>
                          <th class="cd-th">L</th>
                          <th class="cd-th">GD</th>
                          <th class="cd-th cd-th--pts">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(entry, idx) in groupStanding.entries"
                          :key="entry.teamName"
                          class="cd-tr"
                          :class="{
                            'cd-tr--qualify': idx < 2,
                            'cd-tr--featured':
                              entry.teamName === selectedCountry,
                            'cd-tr--clickable':
                              entry.teamName !== selectedCountry,
                          }"
                          @click="navigateToCountry(entry.teamName)"
                        >
                          <td class="cd-td cd-td--team">
                            <span class="cd-td__rank">{{ idx + 1 }}</span>
                            <CountryFlag :iso2="entry.iso2" :size="18" />
                            <span class="cd-td__name">{{
                              entry.shortName
                            }}</span>
                          </td>
                          <td class="cd-td">{{ entry.played }}</td>
                          <td class="cd-td">{{ entry.wins }}</td>
                          <td class="cd-td">{{ entry.draws }}</td>
                          <td class="cd-td">{{ entry.losses }}</td>
                          <td class="cd-td">
                            {{ entry.goalDiff > 0 ? '+' : ''
                            }}{{ entry.goalDiff }}
                          </td>
                          <td class="cd-td cd-td--pts">{{ entry.points }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <p class="cd-standing__note">
                      <span class="cd-standing__qualify-dot" />
                      Top 2 advance to Round of 32
                    </p>
                  </div>
                </template>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  /* ── Backdrop ──────────────────────────────────────────────────────────── */
  .cd-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9100;
    background: oklab(0% 0 0 / 0.82);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 1rem;
    overflow-y: auto;
  }

  /* ── Card ──────────────────────────────────────────────────────────────── */
  .cd-card {
    margin-top: 1rem;
    width: 100%;
    max-width: 36rem;
    display: flex;
    flex-direction: column;
    border-radius: 0.875rem;
    overflow: hidden;
    background: oklch(14% 0.008 260);
    border: 1px solid oklab(100% 0 0 / 0.08);
    border-bottom: 3px solid oklab(100% 0 0 / 0.1);
    box-shadow: 0 12px 48px oklab(0% 0 0 / 1);
  }

  /* ── Header ────────────────────────────────────────────────────────────── */
  .cd-header {
    position: relative;
    padding: 1.25rem 3rem 1.1rem 1.25rem;
    min-height: 5.5rem;
  }

  .cd-header__inner {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .cd-header__crest {
    width: 64px;
    height: 64px;
    object-fit: contain;
    border-radius: 0.5rem;
    background: oklab(100% 0 0 / 0.1);
    padding: 0.25rem;
    flex-shrink: 0;
  }

  .cd-header__info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .cd-header__name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.6rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    letter-spacing: 0.02em;
    line-height: 1.1;
    margin: 0;
    color: inherit;
  }

  /* World Cup title stars — sit beside the name at roughly its x-height,
     inheriting the header's contrast text color. */
  .cd-header__stars {
    display: inline-flex;
    align-items: baseline;
    gap: 0;
    flex-shrink: 0;
    color: inherit;
    opacity: 0.95;
    /* Stars render larger than the name and are nudged up slightly so they
       sit balanced against the cap height of the team name. */
    font-size: 2.2rem;
    position: relative;
    top: -0.2rem;
  }

  .cd-header__star {
    width: 0.62em;
    height: 0.62em;
    display: block;
  }

  .cd-header__meta {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    font-size: 0.8rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 680 !important;
    letter-spacing: 0.05rem;
    text-transform: uppercase;
    margin: 0;
    color: inherit;
  }

  .cd-header__meta span {
    font-variation-settings:
      'wdth' 100,
      'wght' 680;
    letter-spacing: 0.05rem;
    opacity: 0.8;
  }

  /* Group link — tight rounded pill filled with the country's secondary color,
     text in the primary color. On hover the text flips to a contrasting
     black/white so the interaction reads clearly. */
  .cd-header__group {
    background: var(--cd-group-bg, oklab(100% 0 0 / 0.15));
    border: none;
    border-radius: 9999px;
    padding: 0.15rem 0.65rem 0.05rem;
    margin: 0;
    font-size: 0.65rem;
    font-family: inherit;

    font-variation-settings: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    color: var(--cd-group-text, inherit);
    cursor: pointer;
    text-decoration: none;
    /* Thin line beneath the button, matching the text color. Transparent at
       rest, revealed in the text color on hover. */
    box-shadow: 0 1px 0 transparent;
    transition:
      color 0.15s,
      box-shadow 0.15s;
  }

  .cd-header__group:hover {
    color: var(--cd-group-hover-text, oklab(0% 0 0));
    box-shadow: 0 1px 0 var(--cd-group-hover-text, oklab(0% 0 0));
  }

  /* Close button */

  .cd-close {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    background: none;
    border: none;
    color: inherit;
    opacity: 0.6;
    line-height: 1;
    padding: 0.35rem;
    border-radius: 0.35rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;
  }

  .cd-close :deep(svg) {
    width: 13px;
    height: 13px;
  }

  .cd-close:hover {
    opacity: 1;
  }

  /* ── Bio blurb ─────────────────────────────────────────────────────────── */
  .cd-bio {
    margin: 0;
    padding: 0.7rem 1rem 0.6rem;
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 90,
      'wght' 200;
    line-height: 1.7;
    letter-spacing: 0.07rem;
    color: oklab(100% 0 0 / 0.85);
    background: oklch(11% 0.006 260);
    border-bottom: 1px solid oklab(100% 0 0 / 0.08);
  }

  /* ── Tabs ──────────────────────────────────────────────────────────────── */
  .cd-tabs {
    display: flex;
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    background: oklch(12% 0.006 260);
  }

  .cd-tab {
    flex: 1 1 0;
    min-width: 0;
    padding: 0.6rem 0rem 0.4rem;
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: center;
    color: oklab(100% 0 0 / 0.4);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition:
      color 0.15s,
      border-color 0.15s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cd-tab.active {
    color: oklab(100% 0 0);
    border-bottom-color: var(--cd-tab-accent, oklab(100% 0 0));
  }

  .cd-tab:hover:not(.active) {
    color: oklab(100% 0 0 / 0.75);
  }

  /* ── Body ──────────────────────────────────────────────────────────────── */
  .cd-body {
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    max-height: 65dvh;
    padding: 0.5rem 0.85rem 0.9rem;
    scrollbar-width: thin;
  }

  .cd-body::-webkit-scrollbar {
    width: 4px;
  }

  .cd-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .cd-body::-webkit-scrollbar-thumb {
    background: oklab(100% 0 0 / 0.2);
    border-radius: 2px;
  }

  /* ── Loading / empty ───────────────────────────────────────────────────── */
  .cd-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 3rem 0;
    color: oklab(100% 0 0 / 0.5);
    font-size: 0.9rem;
  }

  .cd-spinner {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    border: 2px solid oklab(100% 0 0 / 0.2);
    border-top-color: oklab(100% 0 0 / 0.7);
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .cd-empty {
    padding: 3rem 0;
    text-align: center;
    color: oklab(100% 0 0 / 0.4);
    font-size: 0.9rem;
  }

  /* ── Tab pane ──────────────────────────────────────────────────────────── */
  .tab-pane {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
    align-items: stretch;
  }

  /* Section labels and squad groups span full width */
  .cd-results__section-label,
  .cd-squad__section-label,
  .cd-squad__group,
  .cd-standing,
  .cd-loading,
  .cd-empty {
    grid-column: 1 / -1;
  }

  @media (max-width: 480px) {
    .tab-pane {
      grid-template-columns: 1fr;
    }
  }

  /* ── Match card ────────────────────────────────────────────────────────── */
  .cd-match {
    height: 100%;
    border-radius: 0.75rem;
    background: oklch(18% 0.008 260);
    border: 1px solid oklab(100% 0 0 / 0.08);
    cursor: pointer;
    transition:
      background 0.15s,
      border-color 0.15s;
    overflow: hidden;
  }

  .cd-match:hover {
    background: oklch(22% 0.01 260);
    border-color: oklab(100% 0 0 / 0.15);
  }

  .cd-match--live {
    background: oklch(16% 0.02 160);
  }

  .cd-match--live:hover {
    background: oklch(20% 0.025 160);
  }

  /* My nation: subtle accent ring (consistent with MatchCard --mine). The
     background stays the neutral card color — only the ring distinguishes it.
     Falls back to a faint white ring if no nation theme is active. */
  .cd-match--mine {
    border-color: var(--nation-accent-soft, oklab(100% 0 0 / 0.08));
    box-shadow: 0 0 0 1px var(--nation-accent-soft, transparent);
  }

  .cd-match--mine:hover {
    box-shadow: 0 0 0 1px var(--nation-accent, oklab(100% 0 0 / 0.15));
  }

  /* Top bar */

  .cd-match__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.3rem 0.75rem;
    background: oklab(0% 0 0 / 0.25);
    border-bottom: 1px solid oklab(100% 0 0 / 0.06);
  }

  .cd-match__group {
    font-size: 0.7rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.55);
  }

  .cd-match__venue {
    font-size: 0.7rem;
    color: oklab(100% 0 0 / 0.4);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 55%;
  }

  /* Body */
  .cd-match__body {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
  }

  .cd-match__teams {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .cd-match__team {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: default;
  }

  .cd-match__team-name-wrap {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .cd-match__team-name {
    display: inline;
    white-space: nowrap;
    font-size: 0.9rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    color: oklab(100% 0 0 / 0.75);
  }

  .cd-match__team-name--featured {
    font-variation-settings:
      'wdth' 100,
      'wght' 750;
    color: oklab(100% 0 0);
  }

  .cd-match__team-name--link {
    cursor: pointer;
    border-radius: 0.2rem;
    transition: color 0.12s;
  }

  .cd-match__team-name--link:hover {
    color: oklab(100% 0 0);
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 3px;
    text-decoration-color: oklab(100% 0 0 / 0.6);
  }

  .cd-match__score {
    font-size: 0.9rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    color: oklab(100% 0 0 / 0.6);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .cd-match__score--winner {
    color: oklab(100% 0 0);
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
  }

  /* Time block */
  .cd-match__time-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
    gap: 0.1rem;
  }

  .cd-match__time {
    font-size: 1rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    color: oklab(100% 0 0 / 0.85);
    font-variant-numeric: tabular-nums;
  }

  .cd-match__date {
    font-size: 0.75rem;
    color: oklab(100% 0 0 / 0.5);
    white-space: nowrap;
  }

  .cd-match__status {
    font-size: 0.75rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.45);
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    background: oklab(100% 0 0 / 0.06);
  }

  .cd-match__status--live {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    background: oklab(50% -0.1 0.1 / 0.2);
    color: #4ade80;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* ── Standing table ────────────────────────────────────────────────────── */
  .cd-standing {
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid oklab(100% 0 0 / 0.1);
  }

  .cd-standing__header {
    padding: 0.5rem 0.85rem;
    font-size: 0.75rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.5);
    background: oklab(0% 0 0 / 0.3);
    border-bottom: 1px solid oklab(100% 0 0 / 0.08);
  }

  .cd-standing__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    table-layout: fixed;
  }

  .cd-th {
    padding: 0.4rem 0.5rem;
    text-align: center;
    font-size: 0.7rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.4);
    background: oklch(16% 0.008 260);
    border-bottom: 1px solid oklab(100% 0 0 / 0.08);
  }

  .cd-th--team {
    text-align: left;
    width: 99%;
  }

  .cd-th--pts {
    text-align: right;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    color: oklab(100% 0 0 / 0.55);
  }

  .cd-tr {
    border-top: 1px solid oklab(100% 0 0 / 0.06);
    transition: background 0.12s;
  }

  .cd-tr--qualify {
    background: oklch(20% 0.025 160 / 0.4);
  }

  .cd-tr--featured {
    background: oklab(100% 0 0 / 0.06);
  }

  .cd-tr--featured.cd-tr--qualify {
    background: oklch(22% 0.03 160 / 0.6);
  }

  .cd-tr--clickable {
    cursor: pointer;
  }

  .cd-tr--clickable:hover .cd-td__name {
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: oklab(100% 0 0 / 0.4);
  }

  .cd-td {
    padding: 0.55rem 0.5rem;
    text-align: center;
    color: oklab(100% 0 0 / 0.65);
    font-variant-numeric: tabular-nums;
  }

  .cd-td--team {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-align: left;
    padding-left: 0.75rem;
  }

  .cd-td__rank {
    font-size: 0.7rem;
    color: oklab(100% 0 0 / 0.3);
    width: 1rem;
    text-align: center;
    flex-shrink: 0;
  }

  .cd-td__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    color: oklab(100% 0 0 / 0.85);
  }

  .cd-tr--featured .cd-td__name {
    font-variation-settings:
      'wdth' 100,
      'wght' 750;
    color: oklab(100% 0 0);
  }

  .cd-td--pts {
    text-align: right;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    color: oklab(100% 0 0);
    padding-right: 0.75rem;
  }

  .cd-standing__note {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.7rem;
    color: oklab(100% 0 0 / 0.35);
    background: oklab(0% 0 0 / 0.15);
    border-top: 1px solid oklab(100% 0 0 / 0.06);
    margin: 0;
  }

  .cd-standing__qualify-dot {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 0.125rem;
    background: oklch(65% 0.15 160 / 0.7);
    flex-shrink: 0;
  }

  /* ── Squad ─────────────────────────────────────────────────────────────── */
  .cd-squad__section-label {
    font-size: 0.7rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.35);
    padding: 0;
  }

  .cd-squad__group {
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid oklab(100% 0 0 / 0.08);
    background: oklch(18% 0.008 260);
  }

  .cd-squad__group-label {
    padding: 0.35rem 0.75rem;
    font-size: 0.7rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.4);
    background: oklab(0% 0 0 / 0.25);
    border-bottom: 1px solid oklab(100% 0 0 / 0.06);
  }

  .cd-squad__player {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.75rem;
    border-top: 1px solid oklab(100% 0 0 / 0.05);
    font-size: 0.875rem;
  }

  .cd-squad__player:first-of-type {
    border-top: none;
  }

  .cd-squad__player--sub {
    opacity: 0.65;
  }

  .cd-squad__jersey {
    width: 1.5rem;
    text-align: center;
    font-size: 0.8rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: oklab(100% 0 0 / 0.35);
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  .cd-squad__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    letter-spacing: 0.07em !important;
    color: oklab(100% 0 0 / 0.9);
  }

  .cd-squad__pos {
    font-size: 0.7rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.05em;
    color: oklab(100% 0 0 / 0.35);
    background: oklab(100% 0 0 / 0.07);
    padding: 0.15rem 0.4rem;
    border-radius: 0.25rem;
    flex-shrink: 0;
  }

  .cd-squad__event {
    font-size: 0.75rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    flex-shrink: 0;
  }

  .cd-squad__event--out {
    color: #f87171;
  }

  .cd-squad__event--in {
    color: #4ade80;
  }

  /* ── Results section ───────────────────────────────────────────────────── */
  .cd-results__section-label {
    font-size: 0.7rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.35);
    padding: 0.25rem 0.1rem 0.25rem;
    margin-top: 0.25rem;
  }

  .cd-result {
    height: 100%;
    border-radius: 0.75rem;
    background: oklch(18% 0.008 260);
    border: 1px solid oklab(100% 0 0 / 0.08);
    overflow: hidden;
  }

  .cd-result__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.3rem 0.75rem;
    background: oklab(0% 0 0 / 0.25);
    border-bottom: 1px solid oklab(100% 0 0 / 0.06);
  }

  .cd-result__date {
    font-size: 0.7rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.05em;
    color: oklab(100% 0 0 / 0.5);
  }

  .cd-result__badge {
    font-size: 0.7rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    letter-spacing: 0.08em;
    padding: 0.2rem 0.45rem;
    border-radius: 0.3rem;
    flex-shrink: 0;
  }

  .cd-result__badge--w {
    background: oklch(35% 0.1 160 / 0.5);
    color: #4ade80;
  }

  .cd-result__badge--d {
    background: oklab(100% 0 0 / 0.08);
    color: oklab(100% 0 0 / 0.55);
  }

  .cd-result__badge--l {
    background: oklch(30% 0.1 20 / 0.5);
    color: #f87171;
  }

  /* ── Tab slide transitions ─────────────────────────────────────────────── */
  .tab-slide-left-enter-active,
  .tab-slide-left-leave-active,
  .tab-slide-right-enter-active,
  .tab-slide-right-leave-active {
    transition:
      transform 0.12s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.1s ease;
  }

  .tab-slide-left-enter-from {
    transform: translateX(16px);
    opacity: 0;
  }

  .tab-slide-left-leave-to {
    transform: translateX(-16px);
    opacity: 0;
  }

  .tab-slide-right-enter-from {
    transform: translateX(-16px);
    opacity: 0;
  }

  .tab-slide-right-leave-to {
    transform: translateX(16px);
    opacity: 0;
  }

  /* ── Modal transition ──────────────────────────────────────────────────── */
  .cd-modal-enter-active,
  .cd-modal-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .cd-modal-enter-from,
  .cd-modal-leave-to {
    opacity: 0;
  }

  .cd-modal-enter-from .cd-card,
  .cd-modal-leave-to .cd-card {
    transform: translateY(-0.5rem) scale(0.98);
  }
</style>
