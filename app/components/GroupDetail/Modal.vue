<script setup lang="ts">
  import { useGroupDetail } from '~/composables/useGroupDetail'
  import { useStandings } from '~/composables/useStandings'
  import { useMatchDetail } from '~/composables/useMatchDetail'
  import { useCountryDetail } from '~/composables/useCountryDetail'
  import { normaliseEvent, useScores } from '~/composables/useScores'
  import type { Match } from '~/composables/useScores'
  import { TEAM_BY_NAME } from '~/constants/worldcup'

  const {
    groupModalOpen,
    selectedGroupLetter,
    switchGroup,
    closeGroup,
    closeGroupSilent,
    openGroupSilent,
  } = useGroupDetail()
  const { groupByLetter, groups } = useStandings()
  const { openMatch } = useMatchDetail()
  const { openCountry } = useCountryDetail()
  const { pushHistory } = useModalNav()

  /** Drill into a team's country modal from the group standings table.
   *  Records the current group on the shared history stack first so the
   *  country modal's Back button returns here (and the reverse-navigation
   *  chain stays consistent for Match → Team → Group → Team flows). */
  function drillToCountry(teamName: string) {
    if (selectedGroupLetter.value) {
      pushHistory({ type: 'group', letter: selectedGroupLetter.value })
    }
    openCountry(teamName)
  }

  // Live-polled matches from useScores (covers the current week tab).
  // We use this to overlay real-time status/scores onto the schedule data.
  const { matches: liveMatches } = useScores()

  // Build a lookup map: match id → live Match (with real status/scores)
  const liveMatchMap = computed<Map<string, Match>>(() => {
    const map = new Map<string, Match>()
    for (const m of liveMatches.value) {
      map.set(m.id, m)
    }
    return map
  })

  // Fetch ALL group-stage matches (Jun 11–27) — covers all 3 group-stage weeks
  const { data: allGroupEvents } = useFetch<unknown[]>('/api/schedule', {
    query: { dates: '20260611-20260627' },
  })

  // Full Match objects for every group-stage match (all weeks).
  // Live status/scores from useScores are overlaid when available so that
  // matches currently in progress show as LIVE (not as scheduled).
  const allGroupMatches = computed<Match[]>(() => {
    if (!allGroupEvents.value) return []
    return allGroupEvents.value
      .map((ev) => {
        const m = normaliseEvent(ev)
        // Overlay live data if useScores has a fresher version of this match
        const live = liveMatchMap.value.get(m.id)
        if (live) {
          return {
            ...m,
            homeScore: live.homeScore,
            awayScore: live.awayScore,
            status: live.status,
          }
        }
        return m
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  // All group letters in order
  const groupLetters = computed(() => groups.value.map((g) => g.letter))

  const group = computed(() =>
    selectedGroupLetter.value
      ? groupByLetter.value.get(selectedGroupLetter.value)
      : null
  )

  // All matches for the selected group across all group-stage weeks
  const groupMatches = computed<Match[]>(() =>
    allGroupMatches.value.filter((m) => m.group === selectedGroupLetter.value)
  )

  // Unique stadiums for this group
  const stadiumList = computed<string[]>(() => {
    const venues = new Set<string>()
    for (const m of groupMatches.value) {
      if (m.venue) venues.add(m.venue)
    }
    return [...venues]
  })

  // ── Venue popup ───────────────────────────────────────────────────────────
  const venuePopupOpen = ref(false)
  const venuePopupName = ref<string | null>(null)

  function openVenuePopup(name: string) {
    venuePopupName.value = name
    venuePopupOpen.value = true
  }
  function closeVenuePopup() {
    venuePopupOpen.value = false
  }

  // Close venue popup when the group modal closes
  watch(groupModalOpen, (open) => {
    if (!open) venuePopupOpen.value = false
  })

  // Navigation: prev/next group
  const currentIndex = computed(() => {
    if (!selectedGroupLetter.value) return -1
    return groupLetters.value.indexOf(selectedGroupLetter.value)
  })

  // Slide direction for transition: 1 = next (slide left), -1 = prev (slide right)
  const slideDir = ref<1 | -1>(1)

  // Hides the match cards reactively during a swipe so the new group's cards
  // never flash in before their staggered "plop". Set false synchronously on
  // arrow click (before the data swaps), restored when cards plop in.
  const cardsVisible = ref(true)

  function goToPrev() {
    const len = groupLetters.value.length
    if (!len) return
    slideDir.value = -1
    cardsVisible.value = false
    const idx = (currentIndex.value - 1 + len) % len
    const letter = groupLetters.value[idx]
    if (letter) switchGroup(letter)
  }

  function goToNext() {
    const len = groupLetters.value.length
    if (!len) return
    slideDir.value = 1
    cardsVisible.value = false
    const idx = (currentIndex.value + 1) % len
    const letter = groupLetters.value[idx]
    if (letter) switchGroup(letter)
  }

  // ── Manual swipe animation (Web Animations API) ──────────────────────────
  // Vue's <Transition> JS hooks weren't firing reliably for a keyed swap, so
  // we drive the whole thing ourselves: a template ref to the content, and a
  // watcher on the selected group that plays leave → (swap) → enter.
  const SWIPE = 140 // px of horizontal travel
  const ENTER_MS = 340
  const LEAVE_MS = 200

  const bodyInner = ref<HTMLElement | null>(null)
  const headerTitle = ref<HTMLElement | null>(null)

  // The header title renders from this, NOT directly from group.letter, so the
  // visible letter doesn't change until the title has whizzed off-screen. Kept
  // in sync with the active group whenever we're not mid-swipe (open / URL nav).
  const displayedLetter = ref<string>('')
  watch(
    [selectedGroupLetter, groupModalOpen],
    ([letter, open], [prevLetter, prevOpen]) => {
      // Only auto-sync on open or when there was no previous group to swipe
      // from; arrow/key swaps update displayedLetter mid-animation instead.
      const isSwipe = open && prevOpen && prevLetter && letter !== prevLetter
      if (letter && !isSwipe) displayedLetter.value = letter
    },
    { immediate: true }
  )

  /** Run the same leave→enter "whiz" used by the standings table on any
   *  element, so it travels in sync. `onSwap` (optional) runs once the element
   *  is off-screen, right before it whizzes back — use it to swap text/content
   *  so the change is never seen. Returns immediately (fire-and-forget). */
  function whizElement(el: HTMLElement, dir: 1 | -1, onSwap?: () => void) {
    el.style.willChange = 'opacity, transform, filter'
    const leave = el.animate(
      [
        { opacity: 1, transform: 'translateX(0)', filter: 'blur(0px)' },
        {
          opacity: 0,
          transform: `translateX(${-dir * SWIPE}px)`,
          filter: 'blur(12px)',
        },
      ],
      {
        duration: LEAVE_MS,
        easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)',
        fill: 'forwards',
      }
    )
    leave.onfinish = () => {
      onSwap?.()

      const enter = el.animate(
        [
          {
            opacity: 0,
            transform: `translateX(${dir * SWIPE}px)`,
            filter: 'blur(12px)',
          },
          { opacity: 1, transform: 'translateX(0)', filter: 'blur(0px)' },
        ],
        {
          duration: ENTER_MS,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'forwards',
        }
      )
      enter.onfinish = () => {
        el.style.willChange = ''
        el.style.opacity = ''
        el.style.transform = ''
        el.style.filter = ''
      }
    }
  }

  function playSwipe(dir: 1 | -1) {
    const node = bodyInner.value
    if (!node) return

    // The header "Group {x}" title whizzes in sync with the standings table.
    // Its letter is only swapped (via displayedLetter) once it's off-screen,
    // so you never see the new letter on the title before it slides away.
    const newLetter = selectedGroupLetter.value
    if (headerTitle.value) {
      headerTitle.value.getAnimations().forEach((a) => a.cancel())
      whizElement(headerTitle.value, dir, () => {
        if (newLetter) displayedLetter.value = newLetter
      })
    } else if (newLetter) {
      displayedLetter.value = newLetter
    }

    // Only the standings table block does the "whiz". The match cards below
    // stay put and re-stagger in afterwards.
    const table = node.querySelector<HTMLElement>('.grd-standings-block')
    if (!table) return

    // Lock the matches area's height NOW (before the data swaps) so the modal
    // doesn't collapse/jump while the cards are hidden (cardsVisible=false was
    // already set synchronously on the arrow click). Released after the plop.
    const matches = node.querySelector<HTMLElement>('.grd-matches')
    if (matches) {
      matches.style.minHeight = `${matches.offsetHeight}px`

      // Cancel any lingering plop animations from a PREVIOUS swipe. Their
      // `fill: 'both'` effect otherwise keeps opacity:1 latched onto the
      // title/cards, which would override the reactive `opacity:0` (set via
      // cardsVisible=false) — making "Matches" fail to disappear and "blink"
      // on every swipe after the first.
      matches
        .querySelectorAll<HTMLElement>(
          '.grd-section-title, .grd-match-grid > *'
        )
        .forEach((el) => el.getAnimations().forEach((a) => a.cancel()))
    }

    table.style.willChange = 'opacity, transform, filter'

    // 1) Whiz the table OUT to the side.
    const leave = table.animate(
      [
        { opacity: 1, transform: 'translateX(0)', filter: 'blur(0px)' },
        {
          opacity: 0,
          transform: `translateX(${-dir * SWIPE}px)`,
          filter: 'blur(12px)',
        },
      ],
      {
        duration: LEAVE_MS,
        easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)',
        fill: 'forwards',
      }
    )

    leave.onfinish = () => {
      // 2) Content has already swapped (data is reactive); whiz the table IN.
      const enter = table.animate(
        [
          {
            opacity: 0,
            transform: `translateX(${dir * SWIPE}px)`,
            filter: 'blur(12px)',
          },
          { opacity: 1, transform: 'translateX(0)', filter: 'blur(0px)' },
        ],
        {
          duration: ENTER_MS,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'forwards',
        }
      )

      enter.onfinish = () => {
        table.style.willChange = ''
        table.style.opacity = ''
        table.style.transform = ''
        table.style.filter = ''

        // 3) ONLY once the table is completely settled: plop the match cards
        // in one after another. Flip cardsVisible (removes the reactive
        // opacity:0 on the grid), then animate each card from 0. The matches
        // area kept its locked height the whole time, so nothing jumped.
        cardsVisible.value = true

        // The "Matches" title plops in FIRST, then each card in order.
        const title = node.querySelector<HTMLElement>('.grd-section-title')
        const cards = node.querySelectorAll<HTMLElement>('.grd-match-grid > *')
        const items: HTMLElement[] = [
          ...(title ? [title] : []),
          ...Array.from(cards),
        ]
        const perItem = 240
        const stagger = 90
        items.forEach((item, i) => {
          const anim = item.animate(
            [
              { opacity: 0, transform: 'translateY(10px) scale(0.96)' },
              { opacity: 1, transform: 'translateY(0) scale(1)' },
            ],
            {
              duration: perItem,
              delay: 80 + i * stagger, // deliberate "plop... plop..." cadence
              easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // slight overshoot pop
              fill: 'backwards', // hold opacity:0 during the delay only
            }
          )
          // On finish, cancel so NO fill effect lingers — the element reverts
          // to its natural CSS (cardsVisible=true ⇒ opacity:1). This is what
          // lets the NEXT swipe's reactive opacity:0 actually hide it again.
          anim.onfinish = () => {
            anim.cancel()
            // Release the height lock once the LAST item has plopped in.
            if (i === items.length - 1 && matches) matches.style.minHeight = ''
          }
        })

        // Safety: if there are no items, release the lock immediately.
        if (items.length === 0 && matches) matches.style.minHeight = ''
      }
    }
  }

  // When the selected group changes (via arrows, keys, or URL), play the swipe.
  watch(selectedGroupLetter, (next, prev) => {
    if (!next || !prev || next === prev) return
    if (!groupModalOpen.value) return
    nextTick(() => playSwipe(slideDir.value))
  })

  // Known abbreviations for long team names
  const NAME_ABBR: Record<string, string> = {
    'Bosnia-Herzegovina': 'Bos-Herz',
    'Bosnia & Herzegovina': 'Bos-Herz',
    'Bosnia and Herzegovina': 'Bos-Herz',
    'North Macedonia': 'N. Macedonia',
    'South Korea': 'S. Korea',
    'South Africa': 'S. Africa',
    'Saudi Arabia': 'Saudi Arabia',
    'United States': 'USA',
    'United Arab Emirates': 'UAE',
    'Dominican Republic': 'Dom. Rep.',
    'Trinidad and Tobago': 'T&T',
    'Trinidad & Tobago': 'T&T',
    'Central African Republic': 'CAR',
    'Equatorial Guinea': 'Eq. Guinea',
    'Papua New Guinea': 'PNG',
    'New Zealand': 'New Zealand',
  }

  function abbreviateTeamName(name: string): string {
    return NAME_ABBR[name] ?? name
  }

  function abbrevTeamName(name: string): string {
    return TEAM_BY_NAME.get(name)?.abbrev ?? name.slice(0, 3).toUpperCase()
  }

  // Watch route changes to sync modal state (browser back/forward, direct URL)
  const route = useRoute()
  watch(
    () => route.path,
    (path) => {
      const match = path.match(/^\/group\/([a-z])$/i)
      if (match?.[1]) {
        const letter = match[1].toUpperCase()
        if (selectedGroupLetter.value !== letter || !groupModalOpen.value) {
          openGroupSilent(letter)
        }
      } else if (groupModalOpen.value && !path.startsWith('/group/')) {
        // Navigated away — close without re-routing
        closeGroupSilent()
      }
    }
  )

  // NOTE: Match modal restoration from URL params (?match=<id>&modal=match) is
  // handled exclusively by app.vue onMounted, which fetches /api/match-detail
  // and constructs a complete Match object including venue. We must NOT restore
  // here from the schedule API data — the scoreboard endpoint does not include
  // venue, so doing so would open the modal without the stadium name.

  // Body scroll lock
  watchEffect(() => {
    if (import.meta.client) {
      if (groupModalOpen.value) {
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

  // Backdrop click
  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('grd-backdrop')) {
      closeGroup()
    }
  }

  // Keyboard navigation
  function onKeydown(e: KeyboardEvent) {
    if (!groupModalOpen.value) return
    if (e.key === 'Escape') closeGroup()
    if (e.key === 'ArrowLeft') goToPrev()
    if (e.key === 'ArrowRight') goToNext()
  }

  onMounted(() => {
    if (import.meta.client) {
      window.addEventListener('keydown', onKeydown)
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('keydown', onKeydown)
    }
  })
</script>

<template>
  <Teleport to="body">
    <Transition name="grd-modal">
      <div
        v-if="groupModalOpen && group"
        class="grd-backdrop"
        @click="onBackdrop"
      >
        <div class="grd-panel">
          <!-- Header -->
          <div class="grd-header">
            <!-- Centered nav group -->
            <div class="grd-header__nav-group">
              <!-- Left arrow -->
              <button
                class="grd-nav-btn grd-nav-btn--prev"
                aria-label="Previous group"
                @click="goToPrev"
              >
                <IconsArrowNav :flipped="true" />
              </button>

              <!-- Title -->
              <div class="grd-header__title-block">
                <h2 ref="headerTitle" class="grd-header__title">
                  Group {{ displayedLetter || group.letter }}
                </h2>
              </div>

              <!-- Right arrow -->
              <button
                class="grd-nav-btn grd-nav-btn--next"
                aria-label="Next group"
                @click="goToNext"
              >
                <IconsArrowNav />
              </button>
            </div>

            <!-- Close -->
            <button class="grd-close" aria-label="Close" @click="closeGroup">
              <IconsClose />
            </button>
          </div>

          <!-- Body: outer scroll container, inner clips the swipe -->
          <div class="grd-body">
            <div class="grd-body-clip">
              <div ref="bodyInner" class="grd-body-inner">
                <!-- Standings + Venues -->
                <div class="grd-standings-block">
                  <!-- Standings table -->
                  <div class="grd-standings">
                    <table class="grd-table">
                      <thead>
                        <tr>
                          <th class="grd-th grd-th--pos">#</th>
                          <th class="grd-th grd-th--team">Team</th>
                          <th class="grd-th">P</th>
                          <th class="grd-th col-wdl">W</th>
                          <th class="grd-th col-wdl">D</th>
                          <th class="grd-th col-wdl">L</th>
                          <th class="grd-th col-gfga">GF</th>
                          <th class="grd-th col-gfga">GA</th>
                          <th class="grd-th col-gd">GD</th>
                          <th class="grd-th grd-th--pts">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(entry, idx) in group.entries"
                          :key="entry.teamName"
                          class="grd-row"
                          :class="{ 'grd-row--qualify': idx < 2 }"
                        >
                          <td class="grd-td grd-td--pos">{{ idx + 1 }}</td>
                          <td class="grd-td grd-td--team">
                            <CountryFlag :iso2="entry.iso2" :size="24" />
                            <button
                              class="grd-team-name grd-team-name--btn"
                              @click="drillToCountry(entry.teamName)"
                            >
                              <span class="team-name-full">{{
                                entry.teamName
                              }}</span>
                              <span class="team-name-short">{{
                                abbreviateTeamName(entry.teamName)
                              }}</span>
                              <span class="team-name-abbrev">{{
                                abbrevTeamName(entry.teamName)
                              }}</span>
                            </button>
                          </td>
                          <td class="grd-td">{{ entry.played }}</td>
                          <td class="grd-td col-wdl">{{ entry.wins }}</td>
                          <td class="grd-td col-wdl">{{ entry.draws }}</td>
                          <td class="grd-td col-wdl">{{ entry.losses }}</td>
                          <td class="grd-td col-gfga">
                            {{ entry.goalsFor }}
                          </td>
                          <td class="grd-td col-gfga">
                            {{ entry.goalsAgainst }}
                          </td>
                          <td class="grd-td col-gd">
                            {{ entry.goalDiff > 0 ? '+' : ''
                            }}{{ entry.goalDiff }}
                          </td>
                          <td class="grd-td grd-td--pts">
                            {{ entry.points }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p class="grd-qualify-note">
                      <span class="grd-qualify-dot" /> Top 2 advance to Round of
                      32
                    </p>
                  </div>

                  <!-- Venues -->
                  <p v-if="stadiumList.length" class="grd-header__stadiums">
                    <template v-for="(vName, i) in stadiumList" :key="vName">
                      <button
                        class="grd-venue-btn"
                        @click="openVenuePopup(vName)"
                      >
                        {{ vName }}</button
                      ><template v-if="i < stadiumList.length - 1">, </template>
                    </template>
                  </p>
                </div>

                <!-- Matches -->
                <div class="grd-matches">
                  <h3
                    class="grd-section-title"
                    :style="cardsVisible ? undefined : { opacity: 0 }"
                  >
                    Matches
                  </h3>

                  <div v-if="groupMatches.length === 0" class="grd-empty">
                    No matches scheduled.
                  </div>

                  <div
                    v-else
                    class="grd-match-grid"
                    :style="cardsVisible ? undefined : { opacity: 0 }"
                  >
                    <MatchCard
                      v-for="match in groupMatches"
                      :key="match.id"
                      :match="match"
                      show-date
                      @click="openMatch(match)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  <VenueDetailModal
    :venue-name="venuePopupName"
    :open="venuePopupOpen"
    @close="closeVenuePopup"
  />
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── Backdrop ──────────────────────────────────────────────────────────── */
  .grd-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9050;
    background: hsl(0deg 0% 0% / 80%);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 1rem;
    overflow-y: auto;
  }

  /* ── Panel ─────────────────────────────────────────────────────────────── */
  .grd-panel {
    margin-top: 1rem;
    width: 100%;
    max-width: 44rem;
    display: flex;
    flex-direction: column;
    border-radius: 0.875rem;
    /* No overflow:hidden here — it would clip the slide transition */
    background: oklch(14% 0.008 260);
    border: 1px solid oklab(100% 0 0 / 0.08);
    border-bottom: 3px solid oklab(100% 0 0 / 0.1);
    box-shadow: 0 12px 48px oklab(0% 0 0 / 1);
  }

  /* ── Header ────────────────────────────────────────────────────────────── */
  .grd-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 0.75rem 0.4rem;
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    background: oklch(12% 0.006 260);
    border-top-left-radius: 0.875rem;
    border-top-right-radius: 0.875rem;
  }

  .grd-header__nav-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .grd-header__title-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    width: 7rem;
    flex-shrink: 0;
  }

  .grd-header__title {
    margin: 0;
    font-size: 1.25rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.08em;
    color: oklab(100% 0 0);
    font-family: 'Anybody', sans-serif;
    line-height: 1.1;
  }

  .grd-header__stadiums {
    margin: 0;
    font-size: 0.9rem;
    font-variation-settings:
      'wdth' 90,
      'wght' 300;
    color: oklab(100% 0 0 / 0.9);
    letter-spacing: 0.125em;
    line-height: 1.4;
    white-space: normal;
    text-wrap-style: balance;
    text-align: center;
  }

  /* ── Venue button (inside stadiums line) ──────────────────────────────── */
  .grd-venue-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: inherit;
    font-family: inherit;
    font-variation-settings: inherit;
    letter-spacing: inherit;
    color: oklab(100% 0 0 / 0.9);
    text-decoration: underline;
    text-decoration-color: oklab(100% 0 0 / 0.3);
    text-underline-offset: 2px;
    transition:
      color 0.12s,
      text-decoration-color 0.12s;
  }

  .grd-venue-btn:hover {
    color: oklab(100% 0 0);
    text-decoration-color: oklab(100% 0 0 / 0.7);
  }

  /* ── Nav arrows ────────────────────────────────────────────────────────── */
  .grd-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none !important;
    border: none;
    padding: 0.4rem 0.5rem;
    cursor: pointer;
    flex-shrink: 0;
    color: oklab(100% 0 0);
    opacity: 0.6;
    transition: opacity 0.15s !important;
  }

  .grd-nav-btn:hover:not(.grd-nav-btn--disabled),
  .grd-nav-btn:focus-visible:not(.grd-nav-btn--disabled) {
    opacity: 1;
    background: none !important;
    outline: none;
  }

  /* A mouse click leaves :focus on the button — don't keep it lit. */
  .grd-nav-btn:focus:not(:focus-visible):not(:hover) {
    opacity: 0.6;
  }

  .grd-nav-btn--disabled {
    opacity: 0.2;
    cursor: default;
  }

  .grd-nav-btn svg {
    display: block;
  }

  /* ── Close ─────────────────────────────────────────────────────────────── */
  .grd-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none !important;
    border: none;
    color: oklab(100% 0 0 / 0.6);
    line-height: 1;
    padding: 0.35rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s !important;
    z-index: 1;
  }

  .grd-close :deep(svg) {
    width: 16px;
    height: 16px;
  }

  .grd-close:hover,
  .grd-close:focus,
  .grd-close:active {
    color: oklab(100% 0 0);
    background: none !important;
    outline: none;
  }

  /* ── Body ──────────────────────────────────────────────────────────────── */
  .grd-body {
    overflow-y: auto;
    max-height: 80dvh;
    padding: 1rem 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    scrollbar-width: thin;
  }

  .grd-body-clip {
    position: relative;
  }

  .grd-body::-webkit-scrollbar {
    width: 4px;
  }

  .grd-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .grd-body::-webkit-scrollbar-thumb {
    background: oklab(100% 0 0 / 0.2);
    border-radius: 2px;
  }

  /* ── Standings block ───────────────────────────────────────────────────── */
  .grd-standings-block {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* ── Standings ─────────────────────────────────────────────────────────── */
  .grd-standings {
    overflow: hidden;
    border-radius: 0.75rem;
    border: 1px solid oklab(100% 0 0 / 0.1);
    background: oklab(100% 0 0 / 0.03);
  }

  .grd-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .grd-th {
    padding: 0.45rem 0.5rem;
    text-align: right;
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

  .grd-th--pos {
    text-align: center;
    padding-left: 0.6rem;
    padding-right: 0.25rem;
    width: 2rem;
  }

  .grd-th--team {
    text-align: left;
    padding-left: 0.6rem;
    width: 99%;
  }

  .grd-th--pts {
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    color: oklab(100% 0 0 / 0.55);
    padding-right: 0.6rem;
  }

  .grd-row {
    border-top: 1px solid oklab(100% 0 0 / 0.05);
    transition: background 0.12s;
  }

  .grd-row:hover {
    background: oklab(100% 0 0 / 0.04);
  }

  .grd-row--qualify {
    background: oklch(20% 0.025 160 / 0.35);
  }

  .grd-row--qualify:hover {
    background: oklch(22% 0.03 160 / 0.45);
  }

  .grd-td {
    padding: 0.55rem 0.5rem;
    text-align: right;
    color: oklab(100% 0 0 / 0.7);
    font-variant-numeric: tabular-nums;
  }

  .grd-td--pos {
    text-align: center;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: oklab(100% 0 0 / 0.3);
    padding-left: 0.6rem;
    padding-right: 0.25rem;
  }

  .grd-td--team {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-align: left;
    padding-left: 0.6rem;
  }

  .grd-td--pts {
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    color: oklab(100% 0 0);
    padding-right: 0.6rem;
  }

  .grd-team-name {
    color: oklab(100% 0 0);
    font-variation-settings:
      'wdth' 100,
      'wght' 680;
  }

  .grd-team-name--btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    font-size: inherit;
    font-family: inherit;
    text-underline-offset: 2px;
    transition: all 0.12s;
  }

  .grd-team-name--btn:hover {
    text-decoration: underline;
    text-decoration-color: oklab(100% 0 0 / 0.4);
  }

  /* Team name tiers */
  .team-name-full,
  .team-name-short,
  .team-name-abbrev {
    font-variation-settings:
      'wdth' 100,
      'wght' 680;
  }

  .team-name-full {
    display: inline;
  }
  .team-name-short {
    display: none;
  }
  .team-name-abbrev {
    display: none;
  }

  @media (max-width: 430px) {
    .col-gfga {
      display: none;
    }
    .team-name-full {
      display: none;
    }
    .team-name-short {
      display: inline;
    }
  }

  @media (max-width: 360px) {
    .col-gd {
      display: none;
    }

    .grd-header__stadiums {
      font-size: 0.7rem;
    }
  }

  @media (max-width: 320px) {
    .team-name-short {
      display: none;
    }
    .team-name-abbrev {
      display: inline;
    }
  }

  @media (max-width: 300px) {
    .col-wdl {
      display: none;
    }
  }

  .grd-qualify-note {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    font-size: 0.7rem;
    color: oklab(100% 0 0 / 0.3);
    background: oklab(0% 0 0 / 0.1);
    border-top: 1px solid oklab(100% 0 0 / 0.06);
    margin: 0;
  }

  .grd-qualify-dot {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: oklch(65% 0.15 160 / 0.7);
    flex-shrink: 0;
  }

  /* ── Matches ───────────────────────────────────────────────────────────── */
  .grd-section-title {
    font-size: 1rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: oklab(100% 0 0);
    margin: 0 0 0.5rem;
    letter-spacing: 0.04em;
    text-align: center;
  }

  .grd-empty {
    padding: 2rem 0;
    text-align: center;
    color: oklab(100% 0 0 / 0.35);
    font-size: 0.9rem;
  }

  .grd-match-grid {
    display: grid;
    gap: 0.6rem;
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 480px) {
    .grd-match-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ── Body inner ────────────────────────────────────────────────────────── */
  .grd-body-inner {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ── Modal transition ──────────────────────────────────────────────────── */
  .grd-modal-enter-active,
  .grd-modal-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .grd-modal-enter-from,
  .grd-modal-leave-to {
    opacity: 0;
  }

  .grd-modal-enter-from .grd-panel,
  .grd-modal-leave-to .grd-panel {
    transform: translateY(-0.5rem) scale(0.98);
  }
</style>
