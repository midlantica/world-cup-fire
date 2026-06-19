<script setup lang="ts">
  import { useMatchDetail } from '../../composables/useMatchDetail'
  import { useCountryDetail } from '../../composables/useCountryDetail'
  import { useGroupDetail } from '../../composables/useGroupDetail'
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

  // Desktop home: wtl-wrap is on the FAR LEFT of the home column, so the picker
  // must pop RIGHT (toward the team name) to stay within the panel.
  // Mobile home: wtl-wrap is between the name and score (order:2), so the picker
  // pops LEFT (over the name area) — same direction as the away side.
  // Track the mobile breakpoint reactively so the prop updates on resize.
  const isMobile = ref(false)
  let mobileQuery: MediaQueryList | null = null
  onMounted(() => {
    mobileQuery = window.matchMedia('(max-width: 639px)')
    isMobile.value = mobileQuery.matches
    const handler = (e: MediaQueryListEvent) => {
      isMobile.value = e.matches
    }
    mobileQuery.addEventListener('change', handler)
    onUnmounted(() => mobileQuery?.removeEventListener('change', handler))
  })

  // Desktop home: wtl-wrap is on the FAR LEFT of the home column (first in DOM,
  //   justify-content: flex-end). Picker pops LEFT into empty space.
  //   caret RIGHT → points back at team name (which is to the right of the wtl-wrap).
  //   PICK ONE outside on LEFT → [PICK ONE][D][W][→caret] TeamName Flag
  // Desktop away: wtl-wrap is on the FAR RIGHT of the away column (last in DOM,
  //   justify-content: flex-start). Picker pops RIGHT into empty space.
  //   caret LEFT → points back at team name (which is to the left of the wtl-wrap).
  //   PICK ONE outside on RIGHT → Flag TeamName [←caret][W][D] [PICK ONE]
  // Mobile: both sides pop LEFT, caret LEFT → [PICK ONE inside][←caret][D][W]
  //   PICK ONE is inside the grey bar, to the left of the caret+buttons.
  const homePopout = computed<'left' | 'right'>(() => 'left')
  const homeCaret = computed<'left' | 'right'>(() =>
    isMobile.value ? 'left' : 'right'
  )
  const awayPopout = computed<'left' | 'right'>(() =>
    isMobile.value ? 'left' : 'right'
  )
  const awayCaret = computed<'left' | 'right'>(() => 'left')
  const showPickOneOutside = computed(() => !isMobile.value)

  // Ghost-click guard: after arming the picker via a tap, the browser fires a
  // synthetic click ~300ms later that can land on the W button (which just
  // appeared under the finger). We record the arm timestamp and ignore any
  // pick that arrives within 400ms of arming.
  const armedAt = ref<number>(0)
  const GHOST_CLICK_GUARD_MS = 400

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

  // Whether the WTL picker buttons are in the ghost-click guard window.
  // When true, the buttons render with pointer-events: none so no click
  // (real or synthetic) can reach them.
  const wtlGuarded = ref(false)
  let wtlGuardTimer: ReturnType<typeof setTimeout> | null = null

  function armSide(side: 'home' | 'away', fromClick = false) {
    // If this call comes from the @click handler (not @touchend), ignore it
    // during the ghost-click guard window. The browser fires a synthetic click
    // ~300ms after touchend; if that click lands on the wrap it would call
    // armSide() again and toggle the picker closed (or re-open the other side).
    if (fromClick && wtlGuarded.value) return

    armedSide.value = armedSide.value === side ? null : side
    armedAt.value = Date.now()
    // Engage CSS pointer-events guard for the ghost-click window.
    // This is belt-and-suspenders with the timestamp check: even if the
    // synthetic click fires before onWtlPick runs, the buttons are
    // pointer-events: none so the click can't reach them at all.
    wtlGuarded.value = true
    if (wtlGuardTimer) clearTimeout(wtlGuardTimer)
    wtlGuardTimer = setTimeout(() => {
      wtlGuarded.value = false
    }, GHOST_CLICK_GUARD_MS)
  }

  onUnmounted(() => {
    if (wtlGuardTimer) clearTimeout(wtlGuardTimer)
  })

  function onWtlPick(choice: 'win' | 'tie' | 'lose') {
    // Timestamp guard (belt): ignore picks within GHOST_CLICK_GUARD_MS of arming.
    if (Date.now() - armedAt.value < GHOST_CLICK_GUARD_MS) return

    if (selectedMatch.value && matchPickable.value)
      pickWtl(selectedMatch.value, choice)

    // Re-engage the ghost-click guard after a pick so the synthetic click that
    // fires ~300ms after the touchend on the W/D button can't re-trigger a pick
    // on the chip that now appears in the same spot.
    wtlGuarded.value = true
    if (wtlGuardTimer) clearTimeout(wtlGuardTimer)
    wtlGuardTimer = setTimeout(() => {
      wtlGuarded.value = false
    }, GHOST_CLICK_GUARD_MS)

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

  function goToCountry(name: string, _side: 'home' | 'away') {
    // The country name always drills straight into the country modal on the
    // first click. The W|D picker is armed/revealed independently via the
    // PicksWtlToggle control itself (and via hover on desktop), so the name
    // button no longer needs a first "arming" tap — that previously caused the
    // first click to be swallowed and required a second click to navigate.
    // Push current match onto history before navigating away
    if (selectedMatch.value) {
      pushHistory({ type: 'match', match: selectedMatch.value })
    }
    closeMatch()
    openCountry(name)
  }

  const { openGroup } = useGroupDetail()

  function goBack() {
    const prev = popHistory()
    if (!prev) return
    closeMatch()
    if (prev.type === 'country') {
      openCountry(prev.name)
    } else if (prev.type === 'group') {
      openGroup(prev.letter)
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

  /** True if a key event is a penalty goal (not a shootout penalty). */
  function isPenaltyGoal(ev: KeyEvent): boolean {
    return ev.type === 'Penalty - Scored'
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

  // Map of surname → set of distinct full names sharing that surname across ALL
  // displayed events in THIS match (goals AND cards). When 2+ distinct people
  // share a surname we prefix an initial to disambiguate (e.g. "F. Smith" vs
  // "J. Smith"). We compute this over every named event so a goal scorer and a
  // card recipient with the same surname also get disambiguated.
  const surnameFullNames = computed<Map<string, Set<string>>>(() => {
    const bySurname = new Map<string, Set<string>>()
    for (const ev of keyEvents.value) {
      if (isOwnGoal(ev)) continue
      const name = extractName(ev.text)
      if (!name) continue
      const s = surnameOf(name).toLowerCase()
      if (!s) continue
      if (!bySurname.has(s)) bySurname.set(s, new Set())
      bySurname.get(s)!.add(name)
    }
    return bySurname
  })

  /** Surnames shared by 2+ distinct people in this match (need an initial). */
  const ambiguousSurnames = computed<Set<string>>(() => {
    const ambiguous = new Set<string>()
    for (const [surname, fullNames] of surnameFullNames.value) {
      if (fullNames.size > 1) ambiguous.add(surname)
    }
    return ambiguous
  })

  /** Display label for any named event (goal scorer / card recipient):
   *  the surname, prefixed with as many leading initials as needed to
   *  disambiguate when others in this match share the same surname. */
  function playerLabel(full: string): string {
    if (!full) return ''
    const surname = surnameOf(full)
    if (!ambiguousSurnames.value.has(surname.toLowerCase())) return surname

    // Disambiguation needed — find the other full names sharing this surname.
    const peers = surnameFullNames.value.get(surname.toLowerCase())
    const parts = full.trim().split(/\s+/).filter(Boolean)
    // Given-name tokens are everything before the (last) surname token.
    const given = parts.slice(0, -1)
    if (given.length === 0) return surname

    // Grow the initial prefix one token at a time until this person's prefix is
    // unique among peers (handles "Juan Cáceres" vs "Julio Cáceres" → "Ju." vs
    // "Jl."? no — we add whole-initial tokens, e.g. "J. Cáceres" then add a 2nd
    // given-name initial if still ambiguous).
    const peerList = peers ? [...peers] : [full]
    for (let n = 1; n <= given.length; n++) {
      const prefix = given
        .slice(0, n)
        .map((g) => g.charAt(0).toUpperCase())
        .join('. ')
      const myLabel = `${prefix}. ${surname}`
      const clashes = peerList.filter((peer) => {
        if (peer === full) return false
        const pParts = peer.trim().split(/\s+/).filter(Boolean)
        const pGiven = pParts.slice(0, -1)
        if (pGiven.length < n) return false
        const pPrefix = pGiven
          .slice(0, n)
          .map((g) => g.charAt(0).toUpperCase())
          .join('. ')
        return `${pPrefix}. ${surname}` === myLabel
      })
      if (clashes.length === 0) return myLabel
    }
    // Fallback: full given names + surname (shouldn't normally be reached).
    const initial = firstInitialOf(full)
    return initial ? `${initial}. ${surname}` : surname
  }

  /** Display label for a goal scorer: "OG" for own goals, otherwise the
   *  disambiguated surname label. */
  function goalScorerLabel(ev: KeyEvent): string {
    if (isOwnGoal(ev)) return 'OG'
    return playerLabel(extractName(ev.text))
  }

  /** Display label for a card recipient: disambiguated surname label. */
  function cardLabel(ev: KeyEvent): string {
    return playerLabel(extractName(ev.text))
  }

  // A single scorer's consolidated line: one label + all their goal clocks.
  interface GoalGroup {
    label: string
    clocks: string[]
    own: boolean
    penalty: boolean
  }

  /** Group a side's goals by scorer so a player who scores more than once is
   *  listed once with their goal times in order (e.g. "Balogun 31', 45'+5'").
   *  Own goals are NOT merged with each other (each "OG" stays distinct).
   *  Penalty goals are tracked so the template can show "(P)". */
  function groupedSideGoals(teamName: string | undefined): GoalGroup[] {
    const groups: GoalGroup[] = []
    // Key by scorer label so repeat scorers collapse. Own goals get a unique
    // key per occurrence so multiple OGs remain separate entries.
    const indexByKey = new Map<string, number>()
    let ogCounter = 0
    for (const ev of sideGoals(teamName)) {
      const own = isOwnGoal(ev)
      const penalty = isPenaltyGoal(ev)
      const label = goalScorerLabel(ev)
      const key = own ? `__og__${ogCounter++}` : label
      const existing = indexByKey.get(key)
      if (existing !== undefined) {
        groups[existing]!.clocks.push(ev.clock)
        if (penalty) groups[existing]!.penalty = true
      } else {
        indexByKey.set(key, groups.length)
        groups.push({ label, clocks: [ev.clock], own, penalty })
      }
    }
    return groups
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
      // Preserve the clock from the base match — don't let the override clobber
      // a correctly-parsed clock value with an undefined one from selectedMatch.
      status: { code: m.status.code, clock: m.status.clock },
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

  // A single player's consolidated card line: which icon to show + all the
  // minutes it happened at.
  interface CardGroup {
    label: string
    kind: 'yellow' | 'red' | 'second-yellow'
    clocks: string[]
  }

  /** True when a Red Card event is actually a second-booking dismissal (two
   *  yellows) rather than a straight red — ESPN notes this in the event text. */
  function isSecondBookingRed(ev: KeyEvent): boolean {
    if (ev.type !== 'Red Card') return false
    return ev.text
      ? /second yellow|second booking|two yellow/i.test(ev.text)
      : false
  }

  /** Group a side's cards by player so a player booked twice (two yellows →
   *  sent off) shows ONE combined icon with both minutes (e.g. "Alonso 28',
   *  67'"). A lone yellow stays yellow; a lone straight red stays red. */
  function groupedSideCards(teamName: string | undefined): CardGroup[] {
    const groups: CardGroup[] = []
    const indexByLabel = new Map<string, number>()
    for (const ev of sideCards(teamName)) {
      const label = cardLabel(ev)
      const existing = label ? indexByLabel.get(label) : undefined
      if (existing !== undefined) {
        // Second card for this player → second-booking dismissal.
        groups[existing]!.kind = 'second-yellow'
        groups[existing]!.clocks.push(ev.clock)
        continue
      }
      const kind: CardGroup['kind'] =
        ev.type === 'Yellow Card'
          ? 'yellow'
          : isSecondBookingRed(ev)
            ? 'second-yellow'
            : 'red'
      if (label) indexByLabel.set(label, groups.length)
      groups.push({ label, kind, clocks: [ev.clock] })
    }
    return groups
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
                <!-- Home side: wtl-wrap first in DOM so it renders on the left
                     (justify-content: flex-end pushes the group rightward, and
                     the first child = wtl-wrap ends up on the far left of the group) -->
                <div
                  class="gd-header__side gd-header__side--home"
                  @mouseenter="hoveredSide = 'home'"
                  @mouseleave="hoveredSide = null"
                >
                  <!-- Unified Win·Tie·Lose pick control — anchored to home -->
                  <span
                    v-if="showWtl"
                    class="gd-header__wtl-wrap"
                    :class="{ 'gd-header__wtl-wrap--guarded': wtlGuarded }"
                    @touchend.prevent="armSide('home')"
                    @click.stop="armSide('home', true)"
                  >
                    <PicksWtlToggle
                      :outcome="matchWtl"
                      :perspective="'home'"
                      :popout="homePopout"
                      :caret="homeCaret"
                      :allow-tie="matchAllowTie"
                      :revealed="rowRevealed('home')"
                      :readonly="!matchPickable"
                      :pick-one-outside="showPickOneOutside"
                      @pick="onWtlPick"
                      @cancel="cancelPick"
                    />
                  </span>

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

                  <!-- Mobile-only inline score for home team -->
                  <span
                    v-if="selectedMatch.status.code !== 'ns'"
                    class="gd-header__score gd-header__score--mobile"
                    >{{ derivedHomeScore }}</span
                  >
                </div>

                <!-- Centre: vs or score (desktop only; hidden on mobile) -->
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
                  <span
                    v-if="showWtl"
                    class="gd-header__wtl-wrap"
                    :class="{ 'gd-header__wtl-wrap--guarded': wtlGuarded }"
                    @touchend.prevent="armSide('away')"
                    @click.stop="armSide('away', true)"
                  >
                    <PicksWtlToggle
                      :outcome="matchWtl"
                      :perspective="'away'"
                      :popout="awayPopout"
                      :caret="awayCaret"
                      :allow-tie="matchAllowTie"
                      :revealed="rowRevealed('away')"
                      :readonly="!matchPickable"
                      :pick-one-outside="showPickOneOutside"
                      @pick="onWtlPick"
                      @cancel="cancelPick"
                    />
                  </span>

                  <!-- Mobile-only inline score for away team -->
                  <span
                    v-if="selectedMatch.status.code !== 'ns'"
                    class="gd-header__score gd-header__score--mobile"
                    >{{ derivedAwayScore }}</span
                  >
                </div>

                <!-- Mobile-only status column (FT/HT/clock) — right side, spans both rows -->
                <div
                  v-if="selectedMatch.status.code !== 'ns'"
                  class="gd-header__mobile-status"
                >
                  <span
                    v-if="
                      selectedMatch.status.code === 'live' &&
                      selectedMatch.status.clock
                    "
                    class="gd-header__mobile-clock"
                    >{{ selectedMatch.status.clock }}</span
                  >
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
                          : 'LIVE'
                    }}
                  </span>
                </div>
              </div>

              <!-- Key events: goals row + cards row, each spanning both sides -->
              <div v-if="keyEvents.length > 0" class="gd-header__events">
                <!-- Team name headers — mobile only, no flags -->
                <div
                  class="gd-header__events-team gd-header__events-team--home"
                >
                  <span>{{ homeDisplay }}</span>
                </div>
                <div
                  class="gd-header__events-team gd-header__events-team--away"
                >
                  <span>{{ awayDisplay }}</span>
                </div>

                <!-- Goals row (only if either side has goals) -->
                <template
                  v-if="
                    sideGoals(selectedMatch?.home).length > 0 ||
                    sideGoals(selectedMatch?.away).length > 0
                  "
                >
                  <!-- Home goals: name clock(s) | icon (icon on inside/right) -->
                  <div
                    class="gd-header__events-side gd-header__events-side--home"
                  >
                    <span
                      v-for="(g, i) in groupedSideGoals(selectedMatch?.home)"
                      :key="'hg' + i"
                      class="gd-event"
                    >
                      <span class="gd-event__name">{{ g.label }}</span>
                      <span v-if="g.penalty" class="gd-event__penalty"
                        >(P)</span
                      >
                      <span class="gd-event__clock">{{
                        g.clocks.join(', ')
                      }}</span>
                      <span class="gd-event__icon">⚽</span>
                    </span>
                  </div>
                  <!-- Away goals: icon · clock(s) · name -->
                  <div
                    class="gd-header__events-side gd-header__events-side--away"
                  >
                    <span
                      v-for="(g, i) in groupedSideGoals(selectedMatch?.away)"
                      :key="'ag' + i"
                      class="gd-event"
                    >
                      <span class="gd-event__icon">⚽</span>
                      <span class="gd-event__clock">{{
                        g.clocks.join(', ')
                      }}</span>
                      <span v-if="g.penalty" class="gd-event__penalty"
                        >(P)</span
                      >
                      <span class="gd-event__name">{{ g.label }}</span>
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
                  <!-- Home cards: name clock(s) | icon (icon on inside/right) -->
                  <div
                    class="gd-header__events-side gd-header__events-side--home"
                  >
                    <span
                      v-for="(c, i) in groupedSideCards(selectedMatch?.home)"
                      :key="'hc' + i"
                      class="gd-event"
                    >
                      <span class="gd-event__name">{{ c.label }}</span>
                      <span class="gd-event__clock">{{
                        c.clocks.join(', ')
                      }}</span>
                      <span class="gd-event__icon"
                        ><GameDetailCardIcon :kind="c.kind"
                      /></span>
                    </span>
                  </div>
                  <!-- Away cards: icon · clock(s) · name -->
                  <div
                    class="gd-header__events-side gd-header__events-side--away"
                  >
                    <span
                      v-for="(c, i) in groupedSideCards(selectedMatch?.away)"
                      :key="'ac' + i"
                      class="gd-event"
                    >
                      <span class="gd-event__icon"
                        ><GameDetailCardIcon :kind="c.kind"
                      /></span>
                      <span class="gd-event__clock">{{
                        c.clocks.join(', ')
                      }}</span>
                      <span class="gd-event__name">{{ c.label }}</span>
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

  /* Home side: toggle on far left, then name+flag flowing right toward centre.
     justify-content: flex-end pushes the group to the right (toward centre).
     The wtl-wrap is first in DOM order so it appears on the left of the name+flag. */
  .gd-header__side--home {
    justify-content: flex-end;
  }

  .gd-header__side--home .gd-header__team-name {
    text-align: left;
  }

  /* Away side: flag+name flowing left from centre, toggle on far right.
     The wtl-wrap is last in DOM so it sits on the far right of the away column.
     On desktop the picker pops RIGHT (into empty space toward the panel edge)
     with PICK ONE appearing outside to the right of the buttons. */
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

  /* Mobile-only score and status elements — hidden on desktop */
  .gd-header__score--mobile {
    display: none;
  }

  .gd-header__mobile-status {
    display: none;
  }

  /* ── WTL wrap — tap target for arming the picker on mobile ─────────────────
     Wraps the WtlToggle so a tap anywhere on the toggle area (including the
     absolute-positioned picker overlay) arms the side. flex-shrink: 0 keeps
     it from collapsing; display: flex so it hugs the inner wtl span. */
  .gd-header__wtl-wrap {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    cursor: pointer;
  }

  /* Ghost-click guard: while wtlGuarded is true, pointer events on ALL
     interactive wtl elements are disabled so no synthetic click can
     auto-select or auto-cancel. Covers the picker buttons (.wtl__btn),
     the leftover chip (.wtl__chip), and the loser-row placeholder button
     (.wtl__placeholder--btn) so no ghost click can land on any of them. */
  .gd-header__wtl-wrap--guarded :deep(.wtl__btn),
  .gd-header__wtl-wrap--guarded :deep(.wtl__chip),
  .gd-header__wtl-wrap--guarded :deep(.wtl__placeholder--btn) {
    pointer-events: none;
  }

  /* Vertical centering fix: the .wtl root is only 1.3rem tall by default,
     so its absolute-positioned picker centers on that tiny box rather than
     the full team row. Stretching it to fill the row height makes top: 50%
     resolve to the true row midpoint, keeping the picker visually centered
     on the flag + team name. */
  .gd-header__wtl-wrap :deep(.wtl) {
    align-self: stretch;
    height: auto;
  }

  /* ── Mobile (≤639px): match-card style layout ──────────────────────────────
     Mirrors the Wall MatchCard exactly:
       Left col: two stacked team rows, each [flag name wtl ... score]
       Right col: FT/HT/LIVE status badge, separated by a vertical border
     CSS grid: col 1 = teams (1fr), col 2 = status (auto), rows 1+2 = home/away */
  @media (max-width: 639px) {
    .gd-header {
      padding: 0.75rem 1rem 0.3rem;
    }

    /* 2-col grid: teams on left, status on right spanning both rows */
    .gd-header__teams-row {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      align-items: stretch;
      gap: 0;
      width: 100%;
    }

    /* The desktop centre column (score/status) is hidden on mobile */
    .gd-header__centre {
      display: none;
    }

    /* Each team row: flex row — [flag][name][wtl][score] left-to-right,
       matching the wall MatchCard team row layout exactly */
    .gd-header__side {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.5rem 0.35rem 0;
      min-width: 0;
      justify-content: flex-start;
    }

    /* Home side: grid row 1, col 1 */
    .gd-header__side--home {
      grid-column: 1;
      grid-row: 1;
    }

    /* Away side: grid row 2, col 1 */
    .gd-header__side--away {
      grid-column: 1;
      grid-row: 2;
    }

    /* Status column: grid col 2, spans both rows — matches wall card time-block */
    .gd-header__mobile-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      grid-column: 2;
      grid-row: 1 / 3;
      padding: 0.35rem 0 0.35rem 0.65rem;
      border-left: 1px solid #393939;
    }

    /* On mobile, home team-btn shows [flag][name] left-to-right.
       The DOM order is [name][flag] for desktop (reversed layout), so we
       use row-reverse to flip it back to flag-first on mobile. */
    .gd-header__side--home .gd-header__team-btn {
      flex-direction: row-reverse;
    }

    /* team-btn takes all available space so score is pushed to the right.
       overflow: hidden + truncation prevents long names from breaking layout. */
    .gd-header__side .gd-header__team-btn {
      flex: 1 1 0;
      min-width: 0;
      gap: 0.5rem;
      overflow: hidden;
    }

    /* Shrink flag to match wall card (22px) on mobile.
       CountryFlag renders a <span> with inline width/height styles — override them. */
    .gd-header__side .gd-header__team-btn :deep(span) {
      width: 22px !important;
      height: 15px !important;
      flex-shrink: 0;
    }

    /* Team name: truncate on mobile, no wrapping — matches wall card */
    .gd-header__team-name {
      font-size: 1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      flex: 1 1 0;
    }

    /* wtl-wrap on home side: keep it after the team-btn on mobile
       (it's before in DOM for desktop, so use order to push it right) */
    .gd-header__side--home .gd-header__wtl-wrap {
      order: 2;
      flex-shrink: 0;
    }

    /* score--mobile always last in the row */
    .gd-header__side--home .gd-header__score--mobile {
      order: 3;
    }

    /* Show mobile-only inline scores — matches wall card .match-card__score.
       Override the base .gd-header__score rule (1.75rem) so the score matches
       the team name font-size exactly. */
    .gd-header__score.gd-header__score--mobile {
      display: block;
      font-size: 1rem;
      font-variation-settings:
        'wdth' 100,
        'wght' 700;
      flex-shrink: 0;
      color: oklab(100% 0 0 / 0.8);
      font-variant-numeric: tabular-nums;
      line-height: 1;
      padding: 0;
    }

    /* Fix row height stability: the .wtl stretch trick (used on desktop to
       center the picker on the full row height) must not apply on mobile —
       it causes the row to grow when the picker opens because the PICK ONE
       text inside the picker bar is taller than the resting row. On mobile
       the rows have a fixed min-height so the picker always centers correctly
       without needing the stretch. */
    .gd-header__wtl-wrap :deep(.wtl) {
      align-self: auto;
      height: 1.3rem;
    }

    /* Give each team row a stable height so opening the picker never shifts
       the layout. The picker is position:absolute so it doesn't affect flow. */
    .gd-header__side {
      min-height: 2.2rem;
    }

    /* Live clock minute above the status badge */
    .gd-header__mobile-clock {
      font-size: 1rem;
      font-variation-settings:
        'wdth' 100,
        'wght' 700;
      color: oklab(100% 0 0);
      line-height: 1.1;
      margin-bottom: 0.15rem;
      font-variant-numeric: tabular-nums;
    }
  }

  /* ── Mobile 375px+: larger text and flags ──────────────────────────────────── */
  @media (min-width: 375px) and (max-width: 639px) {
    .gd-header__team-name {
      font-size: 1.2rem;
    }

    .gd-header__score.gd-header__score--mobile {
      font-size: 1.2rem;
    }

    /* Larger flags at 375px+ */
    .gd-header__side .gd-header__team-btn :deep(span) {
      width: 32px !important;
      height: 21px !important;
    }
  }

  /* ── Mobile 470px+: wider teams row ───────────────────────────────────────── */
  @media (min-width: 470px) and (max-width: 639px) {
    .gd-header__teams-row {
      width: 80%;
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
    /* Row gap between goal/card rows; column gap = center spine between teams */
    gap: 0.25rem 1.5rem;
    padding: 0.3rem 0 0;
  }

  /* Team name header row — hidden on desktop (teams already shown above),
     shown on mobile only (text only, no flags). */
  .gd-header__events-team {
    display: none;
  }

  .gd-header__events-team--home {
    justify-content: flex-end;
  }

  .gd-header__events-team--away {
    justify-content: flex-start;
  }

  /* Mobile: events section gets padding + divider borders */
  @media (max-width: 639px) {
    .gd-header__events {
      padding: 0.5rem 0;
      border-top: 1px solid hsl(0deg 0% 100% / 10%);
      border-bottom: 1px solid hsl(0deg 0% 100% / 10%);
    }

    .gd-header__meta {
      margin-top: 0;
    }
  }

  /* Mobile: show team name headers */
  @media (max-width: 639px) {
    .gd-header__events-team {
      display: flex;
      align-items: center;
      font-size: 0.75rem;
      font-variation-settings:
        'wdth' 100,
        'wght' 600;
      letter-spacing: 0.06em;
      color: oklab(100% 0 0 / 0.55);
      text-transform: uppercase;
      margin-bottom: 0.1rem;
    }
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
    gap: 0.3rem;
    font-size: 0.75rem;
    line-height: 1.2;
    color: oklab(100% 0 0 / 0.85);
  }

  .gd-event__icon {
    font-size: 0.7rem;
    flex-shrink: 0;
    margin-right: 0.2rem;
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

  .gd-event__penalty {
    font-size: 0.7rem;
    color: oklab(100% 0 0 / 0.5);
    flex-shrink: 0;
    letter-spacing: 0;
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
