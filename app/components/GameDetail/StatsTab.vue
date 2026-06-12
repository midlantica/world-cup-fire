<script setup lang="ts">
  import type { Match } from '../../composables/useScores'

  const props = defineProps<{
    detail: Record<string, unknown>
    match: Match
  }>()

  interface StatRow {
    label: string
    home: string | number
    away: string | number
    homeVal: number
    awayVal: number
  }

  interface StatGroup {
    heading: string
    rows: StatRow[]
  }

  // Ordered groups matching the design spec in docs/Stats.txt.
  // Each entry maps an ESPN stat `name` → display label.
  const STAT_GROUPS: {
    heading: string
    keys: { name: string; label: string }[]
  }[] = [
    {
      heading: 'ATTACK',
      keys: [
        { name: 'totalShots', label: 'Shots' },
        { name: 'shotsOnTarget', label: 'On Goal' },
        { name: 'shotPct', label: 'On Target %' },
        { name: 'totalCrosses', label: 'Crosses' },
        { name: 'wonCorners', label: 'Corners' },
      ],
    },
    {
      heading: 'CONTROL',
      keys: [
        { name: 'possessionPct', label: 'Possession' },
        { name: 'totalPasses', label: 'Passes' },
        { name: 'passPct', label: 'Pass Completion %' },
      ],
    },
    {
      heading: 'DEFENSE',
      keys: [
        { name: 'totalTackles', label: 'Tackles' },
        { name: 'tacklePct', label: 'Tackle %' },
      ],
    },
    {
      heading: 'GOALKEEPING',
      keys: [
        { name: 'saves', label: 'Saves' },
        { name: 'blockedShots', label: 'Blocked Shots' },
      ],
    },
    {
      heading: 'FOULS',
      keys: [
        { name: 'offsides', label: 'Offsides' },
        { name: 'foulsCommitted', label: 'Fouls' },
        { name: 'yellowCards', label: 'Yellow Cards' },
        { name: 'redCards', label: 'Red Cards' },
      ],
    },
  ]

  const groups = computed<StatGroup[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boxscore = props.detail?.boxscore as any
    const teams = boxscore?.teams as unknown[] | undefined
    if (!teams || teams.length < 2) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const homeStats: Record<string, unknown>[] =
      (teams[0] as any)?.statistics ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awayStats: Record<string, unknown>[] =
      (teams[1] as any)?.statistics ?? []

    // Build lookup maps by ESPN stat name
    const homeMap = new Map(homeStats.map((s) => [s.name as string, s]))
    const awayMap = new Map(awayStats.map((s) => [s.name as string, s]))

    return STAT_GROUPS.map(({ heading, keys }) => {
      const rows: StatRow[] = []
      for (const { name, label } of keys) {
        const h = homeMap.get(name)
        const a = awayMap.get(name)
        if (!h && !a) continue // stat not present in this match's data
        rows.push({
          label,
          home: (h?.displayValue ?? h?.value ?? '—') as string | number,
          away: (a?.displayValue ?? a?.value ?? '—') as string | number,
          homeVal: Number(h?.value) || 0,
          awayVal: Number(a?.value) || 0,
        })
      }
      return { heading, rows }
    }).filter((g) => g.rows.length > 0)
  })

  const hasStats = computed(() => groups.value.some((g) => g.rows.length > 0))
</script>

<template>
  <div class="stats-tab">
    <div v-if="!hasStats" class="stats-empty">
      <p>Match data will be available closer to kick-off.</p>
    </div>

    <div v-else class="stats-table">
      <!-- Column headers: team name + flag -->
      <div class="stats-head">
        <div class="stats-th stats-th--home">
          <span class="stats-th__name">{{ match.home }}</span>
          <CountryFlag :iso2="match.homeIso2" :size="22" />
        </div>
        <div class="stats-th-center" />
        <div class="stats-th stats-th--away">
          <CountryFlag :iso2="match.awayIso2" :size="22" />
          <span class="stats-th__name">{{ match.away }}</span>
        </div>
      </div>

      <!-- Grouped stat rows -->
      <template v-for="group in groups" :key="group.heading">
        <!-- Section heading -->
        <div class="stats-group-heading">{{ group.heading }}</div>

        <!-- Stat rows within this group -->
        <div
          v-for="(stat, idx) in group.rows"
          :key="stat.label"
          class="stats-row"
          :class="{ 'stats-row--stripe': idx % 2 === 1 }"
        >
          <div class="stats-val stats-val--home">
            <span
              class="stats-num"
              :class="{ 'stats-num--hi': stat.homeVal > stat.awayVal }"
              >{{ stat.home }}</span
            >
          </div>
          <div class="stats-label">{{ stat.label }}</div>
          <div class="stats-val stats-val--away">
            <span
              class="stats-num"
              :class="{ 'stats-num--hi': stat.awayVal > stat.homeVal }"
              >{{ stat.away }}</span
            >
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .stats-tab {
    display: flex;
    flex-direction: column;
  }

  .stats-empty {
    padding: 3rem 0;
    text-align: center;
    color: oklab(100% 0 0 / 0.4);
    font-size: 0.9rem;
    font-weight: 200;
    letter-spacing: 0.05em;
  }

  /* ── Table ─────────────────────────────────────────────────────────────────── */
  .stats-table {
    display: flex;
    flex-direction: column;
  }

  /* Header row */
  .stats-head {
    display: grid;
    grid-template-columns: 1fr 8rem 1fr;
    align-items: center;
    padding: 0.25rem 0 0.5rem;
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    margin-bottom: 0.25rem;
  }

  .stats-th {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: oklab(100% 0 0 / 0.85);
  }

  .stats-th--home {
    justify-content: flex-end;
  }

  .stats-th--away {
    justify-content: flex-start;
  }

  .stats-th__name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
  }

  .stats-th-center {
    /* empty centre column spacer */
  }

  /* ── Group heading ─────────────────────────────────────────────────────────── */
  .stats-group-heading {
    padding: 0.55rem 0 0.2rem;
    font-size: 0.85rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    text-transform: uppercase;
    color: oklab(0.81 0.06 0.19 / 0.75);
    border-top: 1px solid oklab(100% 0 0 / 0.4);
    border-bottom: 1px solid hsl(0deg 0% 100% / 20%);
    text-align: center;
  }

  /* No top border on the very first group heading */
  .stats-group-heading:first-of-type {
    border-top: none;
  }

  /* ── Data rows ─────────────────────────────────────────────────────────────── */
  .stats-row {
    display: grid;
    grid-template-columns: 1fr 8rem 1fr;
    align-items: center;
    min-height: 2rem;
    padding: 0.2rem 0;
  }

  .stats-row--stripe {
    background: oklab(100% 0 0 / 0.035);
  }

  .stats-val {
    display: flex;
    align-items: center;
  }

  .stats-val--home {
    justify-content: flex-end;
  }

  .stats-val--away {
    justify-content: flex-start;
  }

  .stats-num {
    font-size: 0.95rem;
    font-weight: 300;
    color: oklab(100% 0 0);
    letter-spacing: 0.02em;
    min-width: 2.5ch;
    text-align: center;
  }

  .stats-num--hi {
    font-weight: 600;
    color: oklab(100% 0 0);
  }

  .stats-label {
    font-size: 0.8rem;
    font-weight: 100;
    color: oklab(100% 0 0 / 0.9);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-align: center;
    padding: 0 0.25rem;
  }
</style>
