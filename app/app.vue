<script setup lang="ts">
  import { useMatchDetail } from '~/composables/useMatchDetail'
  import { TEAM_BY_NAME } from '~/constants/worldcup'
  import type { Match } from '~/composables/useScores'

  const { modalOpen, openMatch } = useMatchDetail()
  const route = useRoute()

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

      const venue = (comp.venue as Record<string, unknown>)?.fullName as
        | string
        | null

      const match: Match = {
        id: matchId,
        date: (header?.date as string) ?? '',
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
        group: homeData?.group ?? awayData?.group ?? null,
        venue: venue ?? null,
        status: { code, clock: clock !== '0:00' ? clock : undefined },
        qualityScore: 0,
        badge: null,
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
  </div>
</template>

<style>
  @reference "~/assets/css/main.css";
  .app-root {
    @apply min-h-screen text-white;
    display: flex;
    flex-direction: column;
    background-color: #0c0a09; /* stone-950 */
    transition: filter 0.2s ease;
  }

  /* Let the page content grow to fill available space, pushing footer down */
  .app-root > :deep(.nuxt-page),
  .app-root > :deep([data-v-app]),
  .app-root > main {
    flex: 1;
  }

  .app-root.modal-blurred {
    filter: blur(2px);
  }
</style>
