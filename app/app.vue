<script setup lang="ts">
  import { useMatchDetail } from '~/composables/useMatchDetail'
  import { useNationTheme } from '~/composables/useNationTheme'
  import { usePicks } from '~/composables/usePicks'
  import { usePools } from '~/composables/usePools'
  import { useAnalytics } from '~/composables/useAnalytics'
  import {
    TEAM_BY_NAME,
    venueLocation as lookupVenueLocation,
  } from '~/constants/worldcup'
  import type { Match } from '~/composables/useScores'

  const { modalOpen, openMatch } = useMatchDetail()
  const route = useRoute()

  // Apply the selected nation's contrast-safe color theme (sets CSS vars on
  // <html> and toggles the .has-nation-theme class).
  useNationTheme()

  // ── Analytics: track every route change ───────────────────────────────────
  const { trackPageview } = useAnalytics()
  // Track the initial page load
  if (import.meta.client) {
    onMounted(() => trackPageview(route.fullPath))
  }
  // Track subsequent navigations
  watch(
    () => route.fullPath,
    (path) => trackPageview(path)
  )

  // ── Global picks → pool sync ───────────────────────────────────────────────
  // 1. On mount: push the full local picks to the server once creds are ready.
  //    This ensures picks made before this session (or on another page) are
  //    always on the server, even if the user never visits the Pools page.
  // 2. Watch: debounced 400ms so subsequent pick changes sync immediately.
  //    NOT immediate — usePicks re-hydrates localStorage in its own onMounted,
  //    so the initial state during SSR/hydration is empty. The onMounted below
  //    handles the initial push after nextTick (when localStorage is readable).
  if (import.meta.client) {
    const { picks } = usePicks()
    const { syncOwnerPicks, refreshPools, hasAnyCreds } = usePools()
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    // Initial sync: pull server state first, then push local picks.
    // Pulling first ensures that picks made on another device are merged into
    // local state before we push — preventing an older device from overwriting
    // newer selections made elsewhere.
    onMounted(() => {
      setTimeout(async () => {
        // Re-read creds directly from localStorage in case usePools.onMounted
        // hasn't propagated them to creds.value yet (e.g. after reverse-sync
        // redirect where creds were written directly to localStorage).
        const rawCreds = (() => {
          try {
            const raw = localStorage.getItem('wc-pool-tokens-v1')
            return raw ? JSON.parse(raw) : {}
          } catch {
            return {}
          }
        })()
        const hasCreds = Object.keys(rawCreds).length > 0
        if (!hasCreds) return

        // Step 1: pull server state (reverse-sync merges server picks into local).
        await refreshPools()

        // Step 2: push the now-merged local picks back to the server.
        // Re-read from localStorage so we get the post-merge state.
        // Always push (even an empty map) so a "clear all" on this device
        // propagates to the server rather than being silently skipped.
        const currentPicks = (() => {
          try {
            const raw = localStorage.getItem('wc-picks-v1')
            return raw ? JSON.parse(raw) : {}
          } catch {
            return {}
          }
        })()
        syncOwnerPicks(currentPicks)
      }, 300)
    })

    watch(
      picks,
      (val) => {
        // Snapshot the picks at the time the watch fires so the debounced
        // sync sends the correct value even if picks.value is mutated again
        // (e.g. by reconcileServerPicks) before the 400ms timer fires.
        const snapshot = { ...val }
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => syncOwnerPicks(snapshot), 400)
      },
      { deep: true }
    )

    // ── Global background poll: pull server picks on all pages ───────────────
    // The Pools page has its own 10s poll, but the Matches page doesn't.
    // This global poll runs on every page so picks made on another device
    // (e.g. Mobile) show up as W/D chips on this device without needing to
    // visit the Pools page. We skip polling when on /pools to avoid doubling
    // up with that page's own interval.
    const GLOBAL_POLL_MS = 15_000
    let globalPollTimer: ReturnType<typeof setInterval> | null = null

    function startGlobalPoll() {
      if (globalPollTimer) return
      globalPollTimer = setInterval(() => {
        // Don't double-poll on the Pools page — it has its own 10s interval.
        if (route.path === '/pools') return
        refreshPools()
      }, GLOBAL_POLL_MS)
    }

    function stopGlobalPoll() {
      if (globalPollTimer) {
        clearInterval(globalPollTimer)
        globalPollTimer = null
      }
    }

    onMounted(() => {
      startGlobalPoll()
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // Immediately pull fresh data when the user tabs back in.
          if (route.path !== '/pools') refreshPools()
          startGlobalPoll()
        } else {
          stopGlobalPoll()
        }
      })
    })

    onUnmounted(() => {
      stopGlobalPoll()
    })
  }

  // ── Deep-link: ?match=<eventId> opens the game detail modal on load ──────
  // Only restore the match modal if it was the active modal (modal=match),
  // or if there's no modal param and no team param (direct match link).
  onMounted(async () => {
    const matchId = route.query.match as string | undefined
    const modalParam = route.query.modal as string | undefined
    const teamParam = route.query.team as string | undefined
    // If modal=team, the country modal will handle restoration — skip match
    if (!matchId) return
    if (modalParam === 'team') return
    if (!modalParam && teamParam) return // legacy: team-only URL, no match modal

    try {
      // ── Step 1: fetch the match-detail summary (for status/score/date) ──────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await $fetch<any>('/api/match-detail', {
        query: { eventId: matchId },
      })

      // Reconstruct a Match object from the ESPN summary header
      const header = data?.header as Record<string, unknown> | undefined
      const comps =
        (header?.competitions as Array<Record<string, unknown>>) ?? []
      const comp = comps[0]
      if (!comp) return

      const competitors =
        (comp.competitors as Array<Record<string, unknown>>) ?? []
      const homeComp =
        competitors.find((c) => c.homeAway === 'home') ?? competitors[0]
      const awayComp =
        competitors.find((c) => c.homeAway === 'away') ?? competitors[1]
      if (!homeComp || !awayComp) return

      const homeTeam = homeComp.team as Record<string, unknown>
      const awayTeam = awayComp.team as Record<string, unknown>
      const homeName = (homeTeam?.displayName as string) ?? ''
      const awayName = (awayTeam?.displayName as string) ?? ''
      const homeData = TEAM_BY_NAME.get(homeName)
      const awayData = TEAM_BY_NAME.get(awayName)

      const statusType = (comp.status as Record<string, unknown>)
        ?.type as Record<string, unknown>
      const statusName = (statusType?.name as string) ?? ''
      const statusState = (statusType?.state as string) ?? ''
      const completed = statusType?.completed as boolean | undefined
      let code: Match['status']['code'] = 'ns'
      if (completed === true || statusState === 'post') code = 'ft'
      else if (statusName === 'STATUS_HALFTIME') code = 'ht'
      else if (statusState === 'in') code = 'live'

      const clock = (statusType?.displayClock as string) ?? undefined

      const homeScore =
        code !== 'ns' ? ((homeComp.score as string) ?? '0') : null
      const awayScore =
        code !== 'ns' ? ((awayComp.score as string) ?? '0') : null

      // ── Step 2: get venue from the scoreboard API — it always has it ────────
      // The summary API returns null for comp.venue on pre-match events.
      // The scoreboard (schedule) API always has the venue.
      // comp.date is UTC, so the event may be in the previous calendar day's
      // bucket — query a 2-day window to guarantee we find it.
      let venue: string | null = null
      const compDate = comp.date as string | undefined
      if (compDate) {
        try {
          const utcDate = new Date(compDate)
          const fmt = (d: Date) =>
            d.toISOString().slice(0, 10).replace(/-/g, '')
          const dayBefore = new Date(utcDate)
          dayBefore.setUTCDate(dayBefore.getUTCDate() - 1)
          const dateRange = `${fmt(dayBefore)}-${fmt(utcDate)}`
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const scheduleEvents = await $fetch<any[]>('/api/schedule', {
            query: { dates: dateRange },
          })
          const scheduleEvent = scheduleEvents?.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (e: any) => String(e.id) === String(matchId)
          )
          venue =
            (scheduleEvent?.competitions?.[0]?.venue?.fullName as string) ??
            null
        } catch {
          // Ignore — venue will be null
        }
      }

      const match: Match = {
        id: matchId,
        date: compDate ?? (header?.date as string) ?? '',
        home: homeName,
        homeShort: homeData?.shortName ?? homeData?.name ?? homeName,
        homeScore,
        homeColor: homeData?.color ?? '888888',
        homeAltColor: homeData?.altColor ?? 'ffffff',
        homeIso2: homeData?.iso2 ?? '',
        homeAbbrev: homeData?.abbrev ?? homeName.slice(0, 3).toUpperCase(),
        away: awayName,
        awayShort: awayData?.shortName ?? awayData?.name ?? awayName,
        awayScore,
        awayColor: awayData?.color ?? '888888',
        awayAltColor: awayData?.altColor ?? 'ffffff',
        awayIso2: awayData?.iso2 ?? '',
        awayAbbrev: awayData?.abbrev ?? awayName.slice(0, 3).toUpperCase(),
        group:
          homeData?.group &&
          awayData?.group &&
          homeData.group === awayData.group
            ? homeData.group
            : null,
        venue,
        venueLocation: lookupVenueLocation(venue),
        status: { code, clock: clock !== '0:00' ? clock : undefined },
        qualityScore: 0,
        badge: null,
        kickoffSlot: (() => {
          const ms = new Date(
            compDate ?? (header?.date as string) ?? ''
          ).getTime()
          const SLOT_MS = 30 * 60_000
          return Math.floor(ms / SLOT_MS) * SLOT_MS
        })(),
      }

      openMatch(match)
    } catch {
      // Silently ignore — bad/expired match ID
    }
  })

  useHead({
    titleTemplate: (title) =>
      title ? title : 'World Cup Fire 🔥 — 2026 FIFA World Cup',
    htmlAttrs: { lang: 'en' },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#0a0a0a' },
    ],
    link: [
      {
        rel: 'preconnect',
        href: 'https://purecatamphetamine.github.io',
      },
    ],
  })
</script>

<template>
  <div class="app-root" :class="{ 'modal-blurred': modalOpen }">
    <AppHeader />
    <NuxtPage />
    <AppFooter />
    <FlagModal />
    <GameDetailModal />
    <!-- Sticky picks reminder — only visible on the Matches page (/) -->
    <Teleport to="body">
      <PicksDeadlineBanner v-if="route.path === '/'" class="picks-sticky" />
    </Teleport>
  </div>
</template>

<style>
  @reference "~/assets/css/main.css";

  /* Sticky picks deadline banner — fixed to the bottom of the viewport */
  .picks-sticky {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 200;
    padding: 0 0.75rem 0.75rem;
    pointer-events: none;
  }

  .picks-sticky > * {
    pointer-events: auto;
  }

  .app-root {
    @apply min-h-screen text-white;
    position: relative;
    display: flex;
    flex-direction: column;
    /* Nation-tinted base (falls back to stone-950 when no nation selected). */
    background-color: var(--nation-bg, #0c0a09);
    transition:
      filter 0.2s ease,
      background-color 0.4s ease;
  }

  /* ── Nation theme: subtle background wash ──────────────────────────────────
     A faint nation-colored tint over the whole page plus a soft glow that
     fades in from the top. Dark stays dark — these only appear once a nation
     is selected (the vars are unset otherwise, so the layer is transparent). */
  .app-root::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(
        130% 60% at 50% 0%,
        var(--nation-glow, transparent) 0%,
        transparent 55%
      ),
      radial-gradient(
        130% 50% at 50% 100%,
        var(--nation-glow, transparent) 0%,
        transparent 55%
      ),
      linear-gradient(
        180deg,
        var(--nation-tint, transparent) 0%,
        transparent 35%,
        transparent 65%,
        var(--nation-tint, transparent) 100%
      );
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  :global(html.has-nation-theme) .app-root::before {
    opacity: 1;
  }

  /* Keep real content above the background wash. */
  .app-root > * {
    position: relative;
    z-index: 1;
  }

  /* The footer uses `margin-top: auto` to pin itself to the bottom of the
     flex column on short pages, while hugging the content on tall pages —
     no empty gap. The page roots no longer need `flex: 1`. */

  .app-root.modal-blurred {
    filter: blur(2px);
  }
</style>
