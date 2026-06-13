<script setup lang="ts">
  import { useMatchDetail } from '../../composables/useMatchDetail'
  import { useCountryDetail } from '../../composables/useCountryDetail'
  import { useModalNav } from '../../composables/useModalNav'
  import { usePicks } from '../../composables/usePicks'
  import {
    useScores,
    pushLiveScoreOverride,
    clearLiveScoreOverride,
  } from '../../composables/useScores'
  import { TEAM_BY_NAME } from '~/constants/worldcup'

  const { selectedMatch, modalOpen, closeMatch, detail, pending } =
    useMatchDetail()

  // ── Keep selectedMatch in sync with live score updates ────────────────────
  // selectedMatch is set once at openMatch() time. When the scores list polls
  // and gets updated status/score, we sync it here so the modal header, pick
  // lock state, and live polling all reflect the current match state.
  const { matches } = useScores()
  watch(matches, (updatedMatches) => {
    if (!selectedMatch.value || !modalOpen.value) return
    const updated = updatedMatches.find((m) => m.id === selectedMatch.value!.id)
    if (!updated) return
    // Only reassign when something we care about actually changed. The matches
    // computed rebuilds a fresh array (and fresh objects) on every recompute,
    // so a blind reassignment here would loop forever with the score-sync
    // watchEffect below (it pushes an override → recompute → this watch fires
    // → reassign → push again …). Comparing values first lets the cycle settle.
    const cur = selectedMatch.value
    if (
      cur.homeScore === updated.homeScore &&
      cur.awayScore === updated.awayScore &&
      cur.status.code === updated.status.code &&
      cur.status.clock === updated.status.clock
    ) {
      return
    }
    selectedMatch.value = updated
  })

  const { openCountry } = useCountryDetail()
  const { pushHistory, popHistory, clearHistory, canGoBack } = useModalNav()

  // ── Picks (pick straight from the modal header via the unified WTL unit) ───
  const { wtlOutcome, canPick, canPickDraw, pickWtl, clearPick } = usePicks()

  /** Win·Tie·Lose pick for the open match (anchored to home), or null. */
  const matchWtl = computed(() =>
    selectedMatch.value ? wtlOutcome(selectedMatch.value.id) : null
  )
  const matchPickable = computed(() =>
    selectedMatch.value ? canPick(selectedMatch.value) : false
  )
  const matchHasPick = computed(() => matchWtl.value !== null)
  /** Tie (draw) slot only at group stage. */
  const matchAllowTie = computed(() =>
    selectedMatch.value ? canPickDraw(selectedMatch.value) : false
  )
  /** Show the control when pickable, or a pick already exists. */
  const showWtl = computed(() => matchPickable.value || matchHasPick.value)

  // ── Hover / tap arming (mirrors MatchCard) ─────────────────────────────────
  // Desktop: hovering a team name reveals that side's picker. Mobile: the first
  // tap "arms" that side (reveals the picker) and a second tap drills into the
  // country. We track which side is active so the picker pops in that exact row.
  const armedSide = ref<'home' | 'away' | null>(null)
  const hoveredSide = ref<'home' | 'away' | null>(null)

  /** Picker is revealed for a side (hover desktop / armed mobile). */
  function rowRevealed(side: 'home' | 'away'): boolean {
    return (
      matchPickable.value &&
      (hoveredSide.value === side || armedSide.value === side)
    )
  }

  // Reset arming whenever the open match changes.
  watch(
    () => selectedMatch.value?.id,
    () => {
      armedSide.value = null
      hoveredSide.value = null
    }
  )

  // Close the armed picker when the user taps anywhere outside the teams row.
  // Without this, tapping off without selecting W or D leaves the picker open.
  const teamsRowEl = ref<HTMLElement | null>(null)

  function onModalDocumentClick(e: MouseEvent) {
    if (armedSide.value === null) return
    if (teamsRowEl.value && teamsRowEl.value.contains(e.target as Node)) return
    armedSide.value = null
  }

  onMounted(() =>
    document.addEventListener('click', onModalDocumentClick, true)
  )
  onUnmounted(() =>
    document.removeEventListener('click', onModalDocumentClick, true)
  )

  function onWtlPick(choice: 'win' | 'tie' | 'lose') {
    if (selectedMatch.value && matchPickable.value)
      pickWtl(selectedMatch.value, choice)
    // Dismiss the picker after the tap. Clear BOTH armed (touch) and hovered
    // (sticky on touch where mouseleave never fires) so the popper reliably
    // closes on mobile. A short delay lets the slot's pop animation finish.
    setTimeout(() => {
      armedSide.value = null
      hoveredSide.value = null
    }, 260)
  }

  function cancelPick() {
    if (selectedMatch.value) clearPick(selectedMatch.value.id)
    armedSide.value = null
  }

  function goToCountry(name: string, side: 'home' | 'away') {
    // On a pickable match the first tap arms that side's picker (so touch users
    // can pick); a second tap drills into the country.
    if (matchPickable.value && armedSide.value !== side) {
      armedSide.value = side
      return
    }
    // Push current match onto history before navigating away
    if (selectedMatch.value) {
      pushHistory({ type: 'match', match: selectedMatch.value })
    }
    closeMatch()
    openCountry(name)
  }

  function goBack() {
    const prev = popHistory()
    if (!prev) return
    closeMatch()
    if (prev.type === 'country') {
      openCountry(prev.name)
    }
    // match → match back not needed currently
  }

  // ── Key events (scorers / cards) row ──────────────────────────────────────
  interface KeyEvent {
    clock: string
    team: string | null
    text: string | null
    type: string
  }

  const keyEvents = computed<KeyEvent[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = (detail.value?.keyEvents as any[]) ?? []
    return (
      events
        .filter((e: any) => {
          const t = e?.type?.text as string | undefined
          if (!t) return false
          // Match any goal variant (e.g. "Goal", "Goal - Header", "Goal - Free Kick", "Own Goal")
          // plus penalties, and cards.
          return (
            t === 'Goal' ||
            t.startsWith('Goal') ||
            t.includes('Goal') ||
            t === 'Penalty - Scored' ||
            t === 'Red Card' ||
            t === 'Yellow Card'
          )
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((e: any) => ({
          clock: (e?.clock?.displayValue as string) ?? '',
          team: (e?.team?.displayName as string) ?? null,
          text: (e?.text as string) ?? null,
          type: (e?.type?.text as string) ?? '',
        }))
    )
  })

  /** Extract player name from ESPN event text.
   *  Goals:  "Goal! Brazil 1, Argentina 0. Vinicius Jr. (Brazil) cuts inside…"
   *  Cards:  "Rodrigo De Paul (Argentina) is shown the yellow card…"
   *  Both patterns have "Name (Team)" — grab the part before the first "(".
   */
  function extractName(text: string | null): string {
    if (!text) return ''
    // After a score line: ". Name (Team)"
    const afterScore = text.match(/\.\s+([^(]+)\s+\(/)
    if (afterScore) return afterScore[1]!.trim()
    // Card / sub at start of sentence: "Name (Team) is shown…"
    const atStart = text.match(/^([^(]+)\s+\(/)
    if (atStart) return atStart[1]!.trim()
    return ''
  }

  /** Goals and penalties for one side, sorted by clock */
  function sideGoals(teamName: string | undefined) {
    if (!teamName) return []
    return keyEvents.value.filter(
      (e) =>
        e.team === teamName &&
        (e.type.includes('Goal') || e.type === 'Penalty - Scored')
    )
  }

  /** True if a key event is an own goal (type "Own Goal", or text mentions it). */
  function isOwnGoal(ev: KeyEvent): boolean {
    if (/own goal/i.test(ev.type)) return true
    return ev.text ? /own goal/i.test(ev.text) : false
  }

  /** Surname of a full name ("Folarin Balogun" → "Balogun").
   *  Handles compound surnames loosely by taking the last whitespace token,
   *  which is the common, space-efficient case for the header chips. */
  function surnameOf(full: string): string {
    const parts = full.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return ''
    return parts[parts.length - 1]!
  }

  /** First initial of a full name ("Folarin Balogun" → "F"). */
  function firstInitialOf(full: string): string {
    const parts = full.trim().split(/\s+/).filter(Boolean)
    if (parts.length < 2) return ''
    return parts[0]!.charAt(0).toUpperCase()
  }

  // Set of surnames that are shared by 2+ distinct goal scorers in THIS match —
  // those need an initial prefix to disambiguate (e.g. "F. Smith" vs "J. Smith").
  const ambiguousSurnames = computed<Set<string>>(() => {
    const bySurname = new Map<string, Set<string>>()
    for (const ev of keyEvents.value) {
      if (!(ev.type.includes('Goal') || ev.type === 'Penalty - Scored'))
        continue
      if (isOwnGoal(ev)) continue
      const name = extractName(ev.text)
      if (!name) continue
      const s = surnameOf(name).toLowerCase()
      if (!s) continue
      if (!bySurname.has(s)) bySurname.set(s, new Set())
      bySurname.get(s)!.add(name)
    }
    const ambiguous = new Set<string>()
    for (const [surname, fullNames] of bySurname) {
      if (fullNames.size > 1) ambiguous.add(surname)
    }
    return ambiguous
  })

  /** Display label for a goal scorer: "OG" for own goals, otherwise the
   *  surname, prefixed with a first initial only when another scorer in this
   *  match shares the same surname. */
  function goalScorerLabel(ev: KeyEvent): string {
    if (isOwnGoal(ev)) return 'OG'
    const full = extractName(ev.text)
    if (!full) return ''
    const surname = surnameOf(full)
    if (ambiguousSurnames.value.has(surname.toLowerCase())) {
      const initial = firstInitialOf(full)
      return initial ? `${initial}. ${surname}` : surname
    }
    return surname
  }

  // ── Score derived from keyEvents ──────────────────────────────────────────
  // The score in selectedMatch comes from /api/schedule (polls every 10 s).
  // The goal icons come from detail.keyEvents via /api/match-detail (also polls
  // every 10 s, but independently). These two sources can be out of sync for up
  // to ~30 s, causing the mismatch: a ⚽ icon appears but the score hasn't
  // updated yet (or vice versa).
  //
  // Fix: when detail data is available and the match is not yet finished,
  // count goals directly from keyEvents so the score and icons always agree.
  // For finished matches we trust the authoritative score from selectedMatch.
  const derivedHomeScore = computed<string | null>(() => {
    const m = selectedMatch.value
    if (!m || m.status.code === 'ns') return m?.homeScore ?? null
    // If we have key-event data, count goals from it so score + icons are in sync
    if (detail.value && keyEvents.value.length > 0) {
      return String(sideGoals(m.home).length)
    }
    return m.homeScore
  })

  const derivedAwayScore = computed<string | null>(() => {
    const m = selectedMatch.value
    if (!m || m.status.code === 'ns') return m?.awayScore ?? null
    if (detail.value && keyEvents.value.length > 0) {
      return String(sideGoals(m.away).length)
    }
    return m.awayScore
  })

  // ── Push derived scores back to the shared wall-card state ────────────────
  // derivedHomeScore / derivedAwayScore are computed from keyEvents (fresher
  // than the /api/schedule poll). Whenever they change while the modal is open
  // and the match is live/HT, push the override so wall cards stay in sync.
  // Clear the override when the modal closes or the match ends.
  watchEffect(() => {
    const m = selectedMatch.value
    if (!m || !modalOpen.value) return
    if (m.status.code === 'ns' || m.status.code === 'ft') {
      clearLiveScoreOverride(m.id)
      return
    }
    const hs = derivedHomeScore.value
    const as_ = derivedAwayScore.value
    // Only push when we have key-event-derived scores (not just the raw API score)
    if (hs === null || as_ === null) return
    pushLiveScoreOverride(m.id, {
      homeScore: hs,
      awayScore: as_,
      status: m.status,
    })
  })

  // Clear override when modal closes
  watch(modalOpen, (open) => {
    if (!open && selectedMatch.value) {
      clearLiveScoreOverride(selectedMatch.value.id)
    }
  })

  /** Cards (yellow + red) for one side */
  function sideCards(teamName: string | undefined) {
    if (!teamName) return []
    return keyEvents.value.filter(
      (e) =>
        e.team === teamName &&
        (e.type === 'Yellow Card' || e.type === 'Red Card')
    )
  }

  // ── Venue popup ───────────────────────────────────────────────────────────
  const venuePopupOpen = ref(false)

  function openVenuePopup() {
    venuePopupOpen.value = true
  }
  function closeVenuePopup() {
    venuePopupOpen.value = false
  }

  // Close venue popup when the match modal closes
  watch(modalOpen, (open) => {
    if (!open) venuePopupOpen.value = false
  })

  const activeTab = ref<'info' | 'stats' | 'lineups'>('info')

  // Reset tab only when the match ID changes (not on reactive updates to the same match)
  watch(
    () => selectedMatch.value?.id,
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        activeTab.value = 'info'
      }
    }
  )

  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('gd-backdrop')) {
      closeMatch()
    }
  }

  const tabs = [
    { key: 'info', label: 'Info' },
    { key: 'stats', label: 'Stats' },
    { key: 'lineups', label: 'Lineups' },
  ] as const

  const kickoffLabel = computed(() => {
    if (!selectedMatch.value?.date) return ''
    const d = new Date(selectedMatch.value.date)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  })

  // ── Fallback lineups — loaded from pre-built static JSON ───────────────────
  // Static files at /lineups/<teamId>.json are downloaded by scripts/download-lineups.mjs
  // and only used before the WC starts (once real match rosters are available they take priority)

  interface StaticLineup {
    teamId: string
    teamName: string
    matchId: string
    matchDate: string
    opponentName: string
    players: Array<{
      name: string
      position: string
      jersey: string
      starter: boolean
    }>
  }

  const homeTeamId = computed(
    () => TEAM_BY_NAME.get(selectedMatch.value?.home ?? '')?.id ?? null
  )
  const awayTeamId = computed(
    () => TEAM_BY_NAME.get(selectedMatch.value?.away ?? '')?.id ?? null
  )

  const homeAbbrev = computed(() => {
    const name = selectedMatch.value?.home ?? ''
    return TEAM_BY_NAME.get(name)?.abbrev ?? abbrevTeamName(name)
  })
  const awayAbbrev = computed(() => {
    const name = selectedMatch.value?.away ?? ''
    return TEAM_BY_NAME.get(name)?.abbrev ?? abbrevTeamName(name)
  })

  // Abbreviate long knockout placeholder team names for the header
  function abbrevTeamName(name: string): string {
    if (TEAM_BY_NAME.has(name)) return name
    return name
      .replace(/\bRound of 32\b/gi, 'R32')
      .replace(/\bRound of 16\b/gi, 'R16')
      .replace(/\bQuarter.?final\b/gi, 'QF')
      .replace(/\bSemi.?final\b/gi, 'SF')
      .replace(/\bThird Place\b/gi, '3rd Pl.')
      .replace(/\bGroup\b/gi, 'Grp')
      .replace(/\bWinner\b/gi, 'W')
      .replace(/\b1st Place\b/gi, '1st')
      .replace(/\b2nd Place\b/gi, '2nd')
      .replace(/\b3rd Place\b/gi, '3rd')
      .replace(/\b(\d+)th Place\b/gi, '$1th')
  }

  const homeDisplay = computed(() => {
    const name = selectedMatch.value?.home ?? ''
    const team = TEAM_BY_NAME.get(name)
    return team?.shortName ?? abbrevTeamName(name)
  })
  const awayDisplay = computed(() => {
    const name = selectedMatch.value?.away ?? ''
    const team = TEAM_BY_NAME.get(name)
    return team?.shortName ?? abbrevTeamName(name)
  })

  const hasLineupData = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rosters = (detail.value?.rosters as any[]) ?? []
    return rosters.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => (r?.roster ?? r?.athletes ?? []).length > 0
    )
  })

  // Fetch static lineup JSON for home team
  const homeStaticLineup = ref<StaticLineup | null>(null)
  const homeLastPending = ref(false)

  // Fetch static lineup JSON for away team
  const awayStaticLineup = ref<StaticLineup | null>(null)
  const awayLastPending = ref(false)

  async function fetchStaticLineup(
    teamId: string,
    target: typeof homeStaticLineup,
    pending: typeof homeLastPending
  ) {
    if (!teamId) return
    pending.value = true
    try {
      const data = await $fetch<StaticLineup>(`/lineups/${teamId}.json`)
      target.value = data
    } catch {
      // Static file not found — no fallback data
    } finally {
      pending.value = false
    }
  }

  watch(
    homeTeamId,
    (id) => {
      if (id) fetchStaticLineup(id, homeStaticLineup, homeLastPending)
    },
    { immediate: true }
  )

  watch(
    awayTeamId,
    (id) => {
      if (id) fetchStaticLineup(id, awayStaticLineup, awayLastPending)
    },
    { immediate: true }
  )

  // Convert static lineup to the shape LineupsTab expects (homeLastDetail / awayLastDetail)
  // We wrap it in a fake "match detail" object with a rosters array
  const homeLastDetail = computed(() => {
    if (!homeStaticLineup.value) return undefined
    return {
      rosters: [
        {
          team: { displayName: homeStaticLineup.value.teamName },
          roster: homeStaticLineup.value.players.map((p) => ({
            athlete: { displayName: p.name, jersey: p.jersey },
            position: { abbreviation: p.position },
            starter: p.starter,
          })),
        },
        {
          team: { displayName: homeStaticLineup.value.opponentName },
          roster: [],
        },
      ],
    }
  })

  const awayLastDetail = computed(() => {
    if (!awayStaticLineup.value) return undefined
    return {
      rosters: [
        {
          team: { displayName: awayStaticLineup.value.opponentName },
          roster: [],
        },
        {
          team: { displayName: awayStaticLineup.value.teamName },
          roster: awayStaticLineup.value.players.map((p) => ({
            athlete: { displayName: p.name, jersey: p.jersey },
            position: { abbreviation: p.position },
            starter: p.starter,
          })),
        },
      ],
    }
  })
</script>

<template>
  <Teleport to="body">
    <Transition name="gd-modal">
      <div
        v-if="modalOpen && selectedMatch"
        class="gd-backdrop"
        @click="onBackdrop"
      >
        <div class="gd-panel-wrap">
          <!-- Fire / wild badge — perched on the top-right corner of the panel -->
          <span
            v-if="
              selectedMatch.badge === 'fire' &&
              selectedMatch.status.code !== 'ft'
            "
            class="gd-panel-badge"
            title="Fire match!"
            >🔥</span
          >
          <span
            v-else-if="
              selectedMatch.badge === 'wild' &&
              selectedMatch.status.code !== 'ft'
            "
            class="gd-panel-badge"
            title="Could be good"
            >🎲</span
          >

          <div class="gd-panel">
            <!-- Header -->
            <div class="gd-header">
              <!-- Group link -->
              <button
                v-if="selectedMatch.group"
                class="gd-header__group-link"
                @click="
                  () => {
                    closeMatch()
                    $router.push(
                      `/group/${selectedMatch!.group!.toLowerCase()}`
                    )
                  }
                "
              >
                Group {{ selectedMatch.group }}
              </button>

              <!-- Teams row: [pick] Name Flag | vs/score | Flag Name [pick] -->
              <div ref="teamsRowEl" class="gd-header__teams-row">
                <!-- Home side -->
                <div
                  class="gd-header__side gd-header__side--home"
                  @mouseenter="hoveredSide = 'home'"
                  @mouseleave="hoveredSide = null"
                >
                  <!-- Unified Win·Tie·Lose pick control — anchored to home -->
                  <PicksWtlToggle
                    v-if="showWtl"
                    :outcome="matchWtl"
                    :perspective="'home'"
                    :caret="'right'"
                    :allow-tie="matchAllowTie"
                    :revealed="rowRevealed('home')"
                    :readonly="!matchPickable"
                    @pick="onWtlPick"
                    @cancel="cancelPick"
                  />

                  <button
                    class="gd-header__team-btn"
                    :title="`View ${selectedMatch.home}`"
                    @click="goToCountry(selectedMatch.home, 'home')"
                  >
                    <span class="gd-header__team-name">
                      <span class="gd-header__team-name-full">{{
                        homeDisplay
                      }}</span>
                      <span class="gd-header__team-name-abbrev">{{
                        homeAbbrev
                      }}</span>
                    </span>
                    <CountryFlag :iso2="selectedMatch.homeIso2" :size="32" />
                  </button>
                </div>

                <!-- Centre: vs or score -->
                <div class="gd-header__centre">
                  <template v-if="selectedMatch.status.code !== 'ns'">
                    <span class="gd-header__score">{{ derivedHomeScore }}</span>
                    <span
                      class="gd-header__status"
                      :class="{
                        'gd-header__status--live':
                          selectedMatch.status.code === 'live' ||
                          selectedMatch.status.code === 'ht',
                      }"
                    >
                      {{
                        selectedMatch.status.code === 'ht'
                          ? 'HT'
                          : selectedMatch.status.code === 'ft'
                            ? 'FT'
                            : (selectedMatch.status.clock ?? 'LIVE')
                      }}
                    </span>
                    <span class="gd-header__score">{{ derivedAwayScore }}</span>
                  </template>
                  <template v-else>
                    <span class="gd-header__vs">vs</span>
                  </template>
                </div>

                <!-- Away side -->
                <div
                  class="gd-header__side gd-header__side--away"
                  @mouseenter="hoveredSide = 'away'"
                  @mouseleave="hoveredSide = null"
                >
                  <button
                    class="gd-header__team-btn"
                    :title="`View ${selectedMatch.away}`"
                    @click="goToCountry(selectedMatch.away, 'away')"
                  >
                    <CountryFlag :iso2="selectedMatch.awayIso2" :size="32" />
                    <span class="gd-header__team-name">
                      <span class="gd-header__team-name-full">{{
                        awayDisplay
                      }}</span>
                      <span class="gd-header__team-name-abbrev">{{
                        awayAbbrev
                      }}</span>
                    </span>
                  </button>

                  <!-- Unified Win·Tie·Lose pick control — anchored to away -->
                  <PicksWtlToggle
                    v-if="showWtl"
                    :outcome="matchWtl"
                    :perspective="'away'"
                    :caret="'left'"
                    :allow-tie="matchAllowTie"
                    :revealed="rowRevealed('away')"
                    :readonly="!matchPickable"
                    @pick="onWtlPick"
                    @cancel="cancelPick"
                  />
                </div>
              </div>

              <!-- Key events: goals row + cards row, each spanning both sides -->
              <div v-if="keyEvents.length > 0" class="gd-header__events">
                <!-- Goals row (only if either side has goals) -->
                <template
                  v-if="
                    sideGoals(selectedMatch?.home).length > 0 ||
                    sideGoals(selectedMatch?.away).length > 0
                  "
                >
                  <!-- Home goals: name clock | icon (icon on inside/right) -->
                  <div
                    class="gd-header__events-side gd-header__events-side--home"
                  >
                    <span
                      v-for="(ev, i) in sideGoals(selectedMatch?.home)"
                      :key="'hg' + i"
                      class="gd-event"
                    >
                      <span class="gd-event__name">{{
                        goalScorerLabel(ev)
                      }}</span>
                      <span class="gd-event__clock">{{ ev.clock }}</span>
                      <span class="gd-event__icon">⚽</span>
                    </span>
                  </div>
                  <!-- Away goals: icon · clock · name -->
                  <div
                    class="gd-header__events-side gd-header__events-side--away"
                  >
                    <span
                      v-for="(ev, i) in sideGoals(selectedMatch?.away)"
                      :key="'ag' + i"
                      class="gd-event"
                    >
                      <span class="gd-event__icon">⚽</span>
                      <span class="gd-event__clock">{{ ev.clock }}</span>
                      <span class="gd-event__name">{{
                        goalScorerLabel(ev)
                      }}</span>
                    </span>
                  </div>
                </template>

                <!-- Cards row (only if either side has cards) -->

                <template
                  v-if="
                    sideCards(selectedMatch?.home).length > 0 ||
                    sideCards(selectedMatch?.away).length > 0
                  "
                >
                  <!-- Home cards: name clock | icon (icon on inside/right) -->
                  <div
                    class="gd-header__events-side gd-header__events-side--home"
                  >
                    <span
                      v-for="(ev, i) in sideCards(selectedMatch?.home)"
                      :key="'hc' + i"
                      class="gd-event"
                    >
                      <span class="gd-event__name">{{
                        extractName(ev.text)
                      }}</span>
                      <span class="gd-event__clock">{{ ev.clock }}</span>
                      <span class="gd-event__icon">{{
                        ev.type === 'Yellow Card' ? '🟨' : '🟥'
                      }}</span>
                    </span>
                  </div>
                  <!-- Away cards: icon · clock · name -->
                  <div
                    class="gd-header__events-side gd-header__events-side--away"
                  >
                    <span
                      v-for="(ev, i) in sideCards(selectedMatch?.away)"
                      :key="'ac' + i"
                      class="gd-event"
                    >
                      <span class="gd-event__icon">{{
                        ev.type === 'Yellow Card' ? '🟨' : '🟥'
                      }}</span>
                      <span class="gd-event__clock">{{ ev.clock }}</span>
                      <span class="gd-event__name">{{
                        extractName(ev.text)
                      }}</span>
                    </span>
                  </div>
                </template>
              </div>

              <!-- Date + Venue -->
              <div
                v-if="kickoffLabel || selectedMatch.venue"
                class="gd-header__meta"
              >
                <span v-if="kickoffLabel" class="gd-header__kickoff">{{
                  kickoffLabel
                }}</span>
                <button
                  v-if="selectedMatch.venue"
                  class="gd-header__venue gd-header__venue--btn"
                  @click="openVenuePopup"
                >
                  {{ selectedMatch.venue }}
                </button>
                <span
                  v-if="selectedMatch.venueLocation"
                  class="gd-header__venue-location"
                >
                  {{ selectedMatch.venueLocation }}
                </span>
              </div>

              <!-- Close button -->
              <button class="gd-close" aria-label="Close" @click="closeMatch">
                <IconsClose />
              </button>
            </div>

            <!-- Tabs -->
            <div class="gd-tabs">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                class="gd-tab"
                :class="{ 'gd-tab--active': activeTab === tab.key }"
                @click="activeTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Tab content -->
            <div class="gd-body">
              <div v-if="pending && !detail" class="gd-loading">
                <div class="gd-spinner" />
                <span>Loading match data…</span>
              </div>
              <template v-else>
                <!-- Info tab: static data, always available -->
                <GameDetailInfoTab
                  v-if="activeTab === 'info'"
                  :match="selectedMatch"
                />
                <!-- Lineups tab: always render so fallback data can show -->
                <GameDetailLineupsTab
                  v-else-if="activeTab === 'lineups'"
                  :detail="detail ?? {}"
                  :match="selectedMatch"
                  :home-last-detail="homeLastDetail ?? undefined"
                  :away-last-detail="awayLastDetail ?? undefined"
                  :home-last-pending="homeLastPending"
                  :away-last-pending="awayLastPending"
                />
                <!-- Stats tab: requires live match detail data -->
                <template v-else-if="activeTab === 'stats'">
                  <GameDetailStatsTab
                    v-if="detail"
                    :detail="detail"
                    :match="selectedMatch"
                  />
                  <div v-else class="gd-empty">
                    <p>Match data will be available closer to kick-off.</p>
                  </div>
                </template>
              </template>
            </div>
          </div>
          <!-- /.gd-panel -->
        </div>
        <!-- /.gd-panel-wrap -->
      </div>
    </Transition>
  </Teleport>

  <!-- Venue popup — sits above this modal (z-index 9200) -->
  <VenueDetailModal
    :venue-name="selectedMatch?.venue"
    :open="venuePopupOpen"
    @close="closeVenuePopup"
  />
</template>

<style scoped>
  .gd-header__venue--btn {
    background: none !important;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font-family: inherit;
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-color: oklab(100% 0 0 / 0.3);
    transition:
      color 0.15s,
      text-decoration-color 0.15s;
  }

  .gd-header__venue--btn:hover {
    color: oklab(100% 0 0);
    text-decoration-color: oklab(100% 0 0 / 0.6);
  }

  @reference "~/assets/css/main.css";

  /* ── Backdrop ──────────────────────────────────────────────────────────────── */
  .gd-backdrop {
    position: fixed;
    inset: 0;
    /* Above GroupDetail (9050) so cards clicked inside a group modal
       surface the game detail on top; below CountryDetail (9100) so
       drilling into a team from here still layers correctly. */
    z-index: 9075;
    background: hsl(0deg 0% 0% / 60%);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 1rem;
    overflow-y: auto;
  }

  /* ── Panel wrap — positions the badge relative to the panel corner ─────────── */
  .gd-panel-wrap {
    position: relative;
    margin-top: 1rem;
    width: 100%;
    max-width: 44rem;
  }

  /* Fire / wild badge — perched on the top-right corner, half outside the panel */
  .gd-panel-badge {
    position: absolute;
    top: -0.5rem;
    right: -0.3rem;
    font-size: 1.5rem;
    line-height: 1;
    z-index: 10;
    pointer-events: none;
  }

  /* ── Panel ─────────────────────────────────────────────────────────────────── */
  .gd-panel {
    width: 100%;
    max-height: 88dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 0.75rem;
    background: #07090c;
    border: 1px solid oklab(100% 0 0 / 0.08);
    border-bottom: 3px solid oklab(100% 0 0 / 0.1);
    box-shadow: 0px 0px 20px -7px hsl(0deg 0% 0% / 85%);
  }

  @media (min-width: 640px) {
    .gd-panel {
      max-height: 80dvh;
    }
  }

  /* ── Header ────────────────────────────────────────────────────────────────── */
  .gd-header {
    position: relative;
    padding: 0.85rem 2.5rem 0.3rem;
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    /* Prevent the header from forcing the panel wider than its container */
    min-width: 0;
    /* flex-shrink: 0 ensures the header takes its natural height and is never
       compressed by the scrolling body below it */
    flex-shrink: 0;
  }

  /* Group link — tight rounded outline button */
  .gd-header__group-link {
    font-size: 0.7rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.6);
    text-decoration: none;
    margin-bottom: 0.4rem;
    background: hsl(0deg 0% 100% / 12%);
    border-radius: 9999px;
    padding: 0.2rem 0.75rem 0.1rem;
    cursor: pointer;
    font-family: inherit;
    transition:
      color 0.15s,
      border-color 0.15s;
  }

  .gd-header__group-link:hover {
    color: oklab(100% 0 0);
    border-color: oklab(1 0 0 / 0.3);
    text-decoration: none;
  }

  /* Teams row — 3-column grid so centre is always truly centred */
  .gd-header__teams-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
    gap: 0.5rem;
    /* Prevent overflow from long team names */
    min-width: 0;
  }

  .gd-header__side {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    /* Allow side to shrink so names don't overflow */
    min-width: 0;
  }

  .gd-header__team-btn {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    border-radius: 0;
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .gd-header__team-btn:hover .gd-header__team-name {
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-color: oklab(100% 0 0 / 0.5);
  }

  .gd-header__side--home {
    justify-content: flex-end;
  }

  .gd-header__side--home .gd-header__team-name {
    text-align: right;
  }

  .gd-header__side--away {
    justify-content: flex-start;
  }

  .gd-header__side--away .gd-header__team-name {
    text-align: left;
  }

  .gd-header__centre {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    flex-shrink: 0;
  }

  .gd-header__team-name {
    font-size: 1.3rem;
    line-height: 1;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    letter-spacing: 0.06rem;
    color: oklab(100% 0 0);
    /* Allow wrapping — long names flow to a second line */
    white-space: normal;
    overflow-wrap: break-word;
    min-width: 0;
    /* Ensure the text span aligns to center with the flag */
    display: flex;
    align-items: center;
  }

  /* Child spans must explicitly override the global span { wdth 87.5, wght 300 } rule */
  .gd-header__team-name-full,
  .gd-header__team-name-abbrev {
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    letter-spacing: inherit;
  }

  /* By default show full name, hide abbrev */
  .gd-header__team-name-abbrev {
    display: none;
  }

  /* Narrow: tighten gaps/padding so wrapping names don't waste space */
  @media (max-width: 480px) {
    .gd-header {
      padding: 0.85rem 2rem 0.3rem;
    }
    .gd-header__team-name {
      font-size: 1.1rem;
      letter-spacing: 0.03rem;
    }
  }

  /* Narrow phones (≤425px): switch to 3-letter abbreviations */
  @media (max-width: 425px) {
    .gd-header {
      padding: 0.85rem 1.5rem 0.3rem;
    }
    /* Swap to 3-letter abbreviation */
    .gd-header__team-name-full {
      display: none;
    }
    .gd-header__team-name-abbrev {
      display: inline;
    }
    .gd-header__vs {
      font-size: 0.95rem;
      padding: 0 0.15rem;
    }
  }

  .gd-header__vs {
    font-size: 1.15rem;
    font-variation-settings:
      'wdth' 80,
      'wght' 400;
    letter-spacing: 0.05em;
    color: oklab(100% 0 0 / 0.85);
    padding: 0 0.2rem;
  }

  .gd-header__score {
    font-size: 1.75rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: oklab(100% 0 0);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    padding: 0 0.1rem;
  }

  .gd-header__status {
    font-size: 0.75rem;
    font-variation-settings:
      'wdth' 85,
      'wght' 600;
    color: oklab(0 0 0 / 1);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 2px;
    background: hsl(0deg 0% 73.03%);
    padding: 2px 4px 1px 6px;
    position: relative;
    top: -1px;
  }

  .gd-header__status--live {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    background: oklab(50% -0.1 0.1 / 1);
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

  /* Date + venue below teams */
  .gd-header__meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    margin-top: 0.2rem;
    margin-bottom: 0.2rem;
  }

  .gd-header__kickoff {
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.75);
  }

  .gd-header__venue {
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.75);
  }

  .gd-header__venue-location {
    font-size: 0.75rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.45);
  }

  /* Close button */
  .gd-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    color: oklab(100% 0 0 / 0.5);
    line-height: 1;
    padding: 0.35rem;
    border-radius: 0.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;
  }

  .gd-close :deep(svg) {
    width: 16px;
    height: 16px;
  }

  .gd-close:hover {
    color: oklab(100% 0 0);
  }

  /* ── Tabs ──────────────────────────────────────────────────────────────────── */
  .gd-tabs {
    display: flex;
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    background: oklch(12% 0.006 260);
  }

  .gd-tab {
    flex: 1 1 0;
    min-width: 0;
    padding: 0.5rem 0rem;
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

  .gd-tab:hover:not(.gd-tab--active) {
    color: oklab(100% 0 0 / 0.75);
  }

  .gd-tab--active {
    color: oklab(100% 0 0);
    border-bottom-color: oklab(100% 0 0);
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
  }

  /* ── Body ──────────────────────────────────────────────────────────────────── */
  .gd-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem;
  }

  .gd-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 3rem 0;
    color: oklab(100% 0 0 / 0.5);
    font-size: 0.9rem;
  }

  .gd-spinner {
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

  .gd-empty {
    padding: 3rem 0;
    text-align: center;
    color: oklab(100% 0 0 / 0.4);
    font-size: 0.9rem;
    font-weight: 200;
    letter-spacing: 0.05em;
  }

  /* ── Key events row (scorers / cards) ─────────────────────────────────────── */
  .gd-header__events {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    gap: 0.25rem 1.25rem;
    padding: 0.3rem 0 0;
  }

  .gd-header__events-side {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
    line-height: 1.2;
  }

  .gd-header__events-side--home {
    justify-content: flex-end;
  }

  .gd-header__events-side--away {
    justify-content: flex-start;
  }

  .gd-event {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    font-size: 0.75rem;
    line-height: 1.2;
    color: oklab(100% 0 0 / 0.85);
  }

  .gd-event__icon {
    font-size: 0.7rem;
    flex-shrink: 0;
  }

  .gd-event__name {
    font-variation-settings:
      'wdth' 90,
      'wght' 200;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 10rem;
    letter-spacing: 0.08rem;
  }

  .gd-event__clock {
    font-size: 0.75rem;
    color: oklab(100% 0 0 / 0.65);
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  /* ── Transition ────────────────────────────────────────────────────────────── */
  .gd-modal-enter-active,
  .gd-modal-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.22s ease;
  }

  .gd-modal-enter-from,
  .gd-modal-leave-to {
    opacity: 0;
    transform: translateY(1.5rem);
  }

  @media (min-width: 640px) {
    .gd-modal-enter-from,
    .gd-modal-leave-to {
      transform: scale(0.97) translateY(0.5rem);
    }
  }
</style>
