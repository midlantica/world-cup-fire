<script setup lang="ts">
  import { useStats } from '~/composables/useStats'
  import { TEAM_LOGO } from '~/composables/useMyTeam'
  import { TEAM_COLORS } from '~/composables/useTeamColors'

  const { data, loading, error, loaded, fetchStats } = useStats()

  // Sub-tab: Goals / Assists only
  type StatTab = 'goals' | 'assists'
  const statTab = ref<StatTab>('goals')

  const TABS: { key: StatTab; label: string }[] = [
    { key: 'goals', label: 'Goals' },
    { key: 'assists', label: 'Assists' },
  ]

  // For the mobile single-tab view
  const leaders = computed(() => data.value?.[statTab.value] ?? [])
  const statLabel = computed(
    () => TABS.find((t) => t.key === statTab.value)?.label ?? ''
  )

  onMounted(() => {
    if (!loaded.value) fetchStats()
  })

  function initials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  function avatarBg(team: string): string {
    const hex = TEAM_COLORS[team]
    return hex ? `${hex}40` : 'oklab(100% 0 0 / 0.08)'
  }

  function headshotSources(athleteId: string, espnUrl: string): string[] {
    const sources: string[] = []
    if (athleteId) sources.push(`/player-headshots/${athleteId}.png`)
    if (espnUrl) sources.push(espnUrl)
    return sources
  }

  const srcIndex = reactive<Record<string, number>>({})

  function currentSrc(player: { athleteId: string; headshot: string }): string {
    const sources = headshotSources(player.athleteId, player.headshot)
    const idx = srcIndex[player.athleteId] ?? 0
    return sources[idx] ?? ''
  }

  function hasAnySrc(player: { athleteId: string; headshot: string }): boolean {
    return headshotSources(player.athleteId, player.headshot).length > 0
  }

  function onImgError(
    e: Event,
    player: { athleteId: string; headshot: string }
  ) {
    const img = e.target as HTMLImageElement
    const sources = headshotSources(player.athleteId, player.headshot)
    const nextIdx = (srcIndex[player.athleteId] ?? 0) + 1
    if (nextIdx < sources.length) {
      srcIndex[player.athleteId] = nextIdx
      img.src = sources[nextIdx]!
    } else {
      img.style.display = 'none'
      const fallback = img.nextElementSibling as HTMLElement | null
      if (fallback) fallback.style.display = 'flex'
    }
  }
</script>

<template>
  <div class="stats-section">
    <!-- Loading skeleton -->
    <div v-if="loading" class="skeleton-wrap">
      <!-- Tabs placeholder -->
      <div class="skeleton-tabs" />
      <!-- Two columns on desktop, one on mobile -->
      <div class="desktop-grid">
        <div class="skeleton-col">
          <div class="col-header-skel" />
          <div v-for="i in 10" :key="i" class="skeleton-row" />
        </div>
        <div class="skeleton-col desktop-only">
          <div class="col-header-skel" />
          <div v-for="i in 10" :key="i" class="skeleton-row" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-box">{{ error }}</div>

    <template v-else>
      <!-- ── Desktop: side-by-side Goals + Assists ── -->
      <div class="desktop-grid">
        <div
          v-for="tab in TABS"
          :key="tab.key"
          class="stat-table"
          :class="`stat-table--${tab.key}`"
        >
          <!-- Column header -->
          <div class="col-header">
            <span class="col-player">Player</span>
            <span class="col-stat-label">{{ tab.label }}</span>
          </div>
          <!-- Rows -->
          <ol class="leaders-list">
            <li
              v-for="player in data?.[tab.key] ?? []"
              :key="player.athleteId"
              class="leader-row"
            >
              <span class="rank">{{ player.rank }}</span>
              <div class="headshot-wrap">
                <img
                  v-if="hasAnySrc(player)"
                  :src="currentSrc(player)"
                  :alt="player.displayName"
                  class="headshot-img"
                  loading="lazy"
                  @error="onImgError($event, player)"
                />
                <div
                  class="headshot-fallback"
                  :style="{ background: avatarBg(player.team) }"
                  style="display: none"
                >
                  {{ initials(player.displayName) }}
                </div>
                <div
                  v-if="!hasAnySrc(player)"
                  class="headshot-fallback"
                  :style="{ background: avatarBg(player.team) }"
                >
                  {{ initials(player.displayName) }}
                </div>
              </div>
              <div class="player-info">
                <span class="player-name">{{ player.displayName }}</span>
                <span class="player-team">
                  <img
                    v-if="TEAM_LOGO[player.team]"
                    :src="TEAM_LOGO[player.team]"
                    :alt="player.team"
                    class="team-logo"
                  />
                  <span class="team-name">{{ player.team }}</span>
                </span>
              </div>
              <span class="stat-value">{{ player.value }}</span>
            </li>
          </ol>
        </div>
      </div>

      <!-- ── Mobile: tabbed single column ── -->
      <div class="mobile-tabs-view">
        <div class="stat-tabs" role="tablist">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            class="stat-tab"
            :class="{ active: statTab === tab.key }"
            role="tab"
            :aria-selected="statTab === tab.key"
            @click="statTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="col-header">
          <span class="col-player">Player</span>
          <span class="col-stat-label">{{ statLabel }}</span>
        </div>
        <ol class="leaders-list">
          <li
            v-for="player in leaders"
            :key="player.athleteId"
            class="leader-row"
          >
            <span class="rank">{{ player.rank }}</span>
            <div class="headshot-wrap">
              <img
                v-if="hasAnySrc(player)"
                :src="currentSrc(player)"
                :alt="player.displayName"
                class="headshot-img"
                loading="lazy"
                @error="onImgError($event, player)"
              />
              <div
                class="headshot-fallback"
                :style="{ background: avatarBg(player.team) }"
                style="display: none"
              >
                {{ initials(player.displayName) }}
              </div>
              <div
                v-if="!hasAnySrc(player)"
                class="headshot-fallback"
                :style="{ background: avatarBg(player.team) }"
              >
                {{ initials(player.displayName) }}
              </div>
            </div>
            <div class="player-info">
              <span class="player-name">{{ player.displayName }}</span>
              <span class="player-team">
                <img
                  v-if="TEAM_LOGO[player.team]"
                  :src="TEAM_LOGO[player.team]"
                  :alt="player.team"
                  class="team-logo"
                />
                <span class="team-name">{{ player.team }}</span>
              </span>
            </div>
            <span class="stat-value">{{ player.value }}</span>
          </li>
        </ol>
      </div>
    </template>

    <!-- Empty -->
    <div v-if="!loading && !error && !data" class="empty-state">
      No stats available.
    </div>
  </div>
</template>

<style scoped>
  .stats-section {
    padding-top: 1rem;
  }

  /* ── Heading ──────────────────────────────────────────────────────────────── */
  .stats-heading {
    font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--color-text-primary);
    margin: 0 0 0.75rem;
  }

  /* ── Desktop grid: side-by-side tables ────────────────────────────────────── */
  .desktop-grid {
    display: none; /* hidden on mobile */
  }

  .mobile-tabs-view {
    display: block; /* shown on mobile */
  }

  @media (min-width: 640px) {
    .desktop-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .mobile-tabs-view {
      display: none;
    }
  }

  /* ── Tabs (mobile only) ───────────────────────────────────────────────────── */
  .stat-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    margin-bottom: 0;
  }

  .stat-tab {
    font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
    font-size: 0.9375rem;
    font-weight: 400;
    letter-spacing: 0.02em;
    padding: 0.4rem 1rem 0.5rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition:
      color 0.15s,
      border-color 0.15s;
    position: relative;
    bottom: -1px;
    white-space: nowrap;
  }

  .stat-tab:hover:not(.active) {
    color: var(--color-text-primary);
  }

  .stat-tab.active {
    color: var(--color-text-primary);
    border-bottom-color: var(--color-theme-400, #60a5fa);
    font-weight: 600;
  }

  /* ── Column header ────────────────────────────────────────────────────────── */
  .col-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.5rem 0.375rem;
    border-bottom: 1px solid oklab(100% 0 0 / 0.07);
  }

  .col-player,
  .col-stat-label {
    font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: oklab(70% 0 0);
  }

  /* ── Leaders list ─────────────────────────────────────────────────────────── */
  .leaders-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .leader-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.5rem;
    border-bottom: 1px solid oklab(100% 0 0 / 0.05);
    transition: background 0.12s;
  }

  .leader-row:hover {
    background: oklab(100% 0 0 / 0.04);
  }

  .rank {
    font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: oklab(70% 0 0);
    width: 1.25rem;
    text-align: center;
    flex-shrink: 0;
  }

  /* Headshot */
  .headshot-wrap {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: oklab(100% 0 0 / 0.08);
    position: relative;
  }

  .headshot-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }

  .headshot-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: oklab(90% 0 0);
  }

  /* Player info */
  .player-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  /* fw 400 on names */
  .player-name {
    font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
    font-size: 1rem;
    font-weight: 400;
    letter-spacing: 0.02em;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .player-team {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .team-logo {
    width: 0.9rem;
    height: 0.9rem;
    object-fit: contain;
    flex-shrink: 0;
    opacity: 0.85;
  }

  /* Two notches lighter than secondary (65%) → ~78% */
  .team-name {
    font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
    font-size: 0.775rem;
    font-weight: 400;
    letter-spacing: 0.03em;
    color: oklab(78% 0 0);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Stat value */
  .stat-value {
    font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
    font-size: 1.375rem;
    font-weight: 400;
    letter-spacing: 0.01em;
    color: var(--color-text-primary);
    flex-shrink: 0;
    min-width: 2rem;
    text-align: right;
  }

  /* ── Skeleton ─────────────────────────────────────────────────────────────── */
  .skeleton-wrap {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .skeleton-tabs {
    height: 2.25rem;
    background: oklab(100% 0 0 / 0.04);
    margin-bottom: 0.5rem;
  }

  .skeleton-col {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .desktop-only {
    display: none;
  }

  @media (min-width: 640px) {
    .skeleton-wrap .desktop-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .desktop-only {
      display: flex;
    }
  }

  .col-header-skel {
    height: 2rem;
    background: oklab(100% 0 0 / 0.04);
  }

  .skeleton-row {
    height: 3.25rem;
    border-bottom: 1px solid oklab(100% 0 0 / 0.05);
    background: oklab(100% 0 0 / 0.03);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .skeleton-row:nth-child(odd) {
    animation-delay: 0.15s;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  /* ── Error / empty ────────────────────────────────────────────────────────── */
  .error-box {
    margin-top: 1rem;
    border-radius: 0.5rem;
    background: oklab(30.8% 0.072 0.028 / 0.3);
    border: 1px solid oklab(68.5% 0.13 0.048 / 0.2);
    padding: 0.625rem 1rem;
    font-size: 0.75rem;
    color: oklab(75.8% 0.107 0.04);
  }

  .empty-state {
    color: var(--color-text-tertiary);
    font-size: 0.875rem;
    padding: 2rem 0;
    text-align: center;
  }
</style>
