<script setup lang="ts">
  import { TEAM_BY_NAME, espnLogoUrl } from '~/constants/worldcup'
  import type { Match } from '~/composables/useScores'

  const props = defineProps<{
    match: Match
  }>()

  const homeTeam = computed(() => TEAM_BY_NAME.get(props.match.home))
  const awayTeam = computed(() => TEAM_BY_NAME.get(props.match.away))
</script>

<template>
  <div class="info-tab">
    <!-- Home team card -->
    <div v-if="homeTeam" class="info-card">
      <div class="info-card__header">
        <img
          :src="espnLogoUrl(homeTeam.abbrev)"
          :alt="homeTeam.name"
          class="info-card__crest"
          loading="lazy"
        />
        <div class="info-card__title">
          <span class="info-card__name">{{ homeTeam.name }}</span>
          <span class="info-card__rank">FIFA #{{ homeTeam.fifaRank }}</span>
        </div>
      </div>
      <p v-if="homeTeam.bio" class="info-card__bio">{{ homeTeam.bio }}</p>
      <p v-else class="info-card__bio info-card__bio--empty">
        No team info available.
      </p>
    </div>

    <!-- Away team card -->
    <div v-if="awayTeam" class="info-card">
      <div class="info-card__header">
        <img
          :src="espnLogoUrl(awayTeam.abbrev)"
          :alt="awayTeam.name"
          class="info-card__crest"
          loading="lazy"
        />
        <div class="info-card__title">
          <span class="info-card__name">{{ awayTeam.name }}</span>
          <span class="info-card__rank">FIFA #{{ awayTeam.fifaRank }}</span>
        </div>
      </div>
      <p v-if="awayTeam.bio" class="info-card__bio">{{ awayTeam.bio }}</p>
      <p v-else class="info-card__bio info-card__bio--empty">
        No team info available.
      </p>
    </div>
  </div>
</template>

<style scoped>
  .info-tab {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    align-items: start;
  }

  @media (max-width: 480px) {
    .info-tab {
      grid-template-columns: 1fr;
    }
  }

  .info-card {
    border-radius: 0.75rem;
    background: oklch(18% 0.008 260);
    border: 1px solid oklab(100% 0 0 / 0.08);
    overflow: hidden;
  }

  .info-card__header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.75rem 1rem;
    background: oklab(0% 0 0 / 0.2);
    border-bottom: 1px solid oklab(100% 0 0 / 0.07);
  }

  .info-card__crest {
    width: 40px;
    height: 40px;
    object-fit: contain;
    border-radius: 0.35rem;
    background: oklab(100% 0 0 / 0.06);
    padding: 0.2rem;
    flex-shrink: 0;
  }

  .info-card__title {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .info-card__name {
    font-size: 1rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: oklab(100% 0 0);
    letter-spacing: 0.02em;
  }

  .info-card__rank {
    font-size: 0.72rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.45);
  }

  .info-card__bio {
    margin: 0;
    padding: 0.7rem 1rem 0.6rem;
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 90,
      'wght' 200;
    line-height: 1.7;
    letter-spacing: 0.07rem;
    color: oklab(100% 0 0 / 0.85);
  }

  .info-card__bio--empty {
    color: oklab(100% 0 0 / 0.3);
    font-style: italic;
  }
</style>
