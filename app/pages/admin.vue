<script setup lang="ts">
  // Simple analytics admin dashboard — /admin

  interface DaySummary {
    date: string
    pageViews: number
    uniqueVisitors: number
    sessions: number
    topPages: { path: string; views: number }[]
    hourly: { hour: string; views: number }[]
  }

  interface AnalyticsData {
    days: DaySummary[]
    totals: { pageViews: number; uniqueVisitors: number; sessions: number }
    topPages: { path: string; views: number }[]
    message?: string
  }

  // All hard-coded routes in the app
  const KNOWN_ROUTES = [
    { path: '/', label: 'Home / Scores' },
    { path: '/standings', label: 'Standings' },
    { path: '/stats', label: 'Stats' },
    { path: '/team', label: 'Team Modal' },
    { path: '/game', label: 'Game Detail' },
  ]

  const { data, pending, error, refresh } = await useFetch<AnalyticsData>(
    '/api/analytics',
    { lazy: true }
  )

  const selectedDay = ref<DaySummary | null>(null)

  function fmtDate(iso: string) {
    return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  function fmtHour(h: string) {
    const hour = parseInt(h.slice(11, 13))
    if (hour === 0) return '12am'
    if (hour < 12) return `${hour}am`
    if (hour === 12) return '12pm'
    return `${hour - 12}pm`
  }

  function barWidth(val: number, max: number) {
    if (!max) return '0%'
    return `${Math.round((val / max) * 100)}%`
  }

  // Merge known routes into top pages so all routes always appear
  const mergedTopPages = computed(() => {
    const source = selectedDay.value
      ? selectedDay.value.topPages
      : (data.value?.topPages ?? [])

    const map = new Map<string, number>()
    // Seed with known routes at 0
    for (const r of KNOWN_ROUTES) map.set(r.path, 0)
    // Fill in actual data
    for (const p of source) map.set(p.path, p.views)

    return Array.from(map.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
  })

  const maxTopPage = computed(() =>
    Math.max(1, ...mergedTopPages.value.map((p) => p.views))
  )

  // Full 24-hour array for the hourly chart
  const fullHourly = computed(() => {
    if (!selectedDay.value) return []
    const map = new Map<number, number>()
    for (const h of selectedDay.value.hourly) {
      map.set(parseInt(h.hour.slice(11, 13)), h.views)
    }
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      views: map.get(i) ?? 0,
    }))
  })

  const maxHourly = computed(() =>
    Math.max(1, ...fullHourly.value.map((h) => h.views))
  )

  function hourTitle(hour: number, views: number) {
    const label =
      hour === 0
        ? '12am'
        : hour === 12
          ? '12pm'
          : hour < 12
            ? `${hour}am`
            : `${hour - 12}pm`
    return `${label}: ${views} views`
  }

  // Today's stats (first day in the array = most recent)
  const todayStats = computed(() => data.value?.days[0] ?? null)

  // Yesterday for trend comparison
  const yesterdayStats = computed(() => data.value?.days[1] ?? null)

  function trend(today: number, yesterday: number | undefined) {
    if (yesterday == null || yesterday === 0) return null
    const pct = Math.round(((today - yesterday) / yesterday) * 100)
    return pct
  }

  // Avg pages per session (engagement proxy)
  const avgPagesPerSession = computed(() => {
    const t = data.value?.totals
    if (!t || !t.sessions) return '—'
    return (t.pageViews / t.sessions).toFixed(1)
  })

  // Route label helper
  function routeLabel(path: string) {
    return KNOWN_ROUTES.find((r) => r.path === path)?.label ?? path
  }

  // ── Dev tools ──────────────────────────────────────────────────────────────
  const clearPoolMsg = ref('')

  function clearLocalPoolData() {
    if (!import.meta.client) return
    localStorage.removeItem('wc-pool-tokens-v1')
    localStorage.removeItem('wc-pools-cache-v1')
    clearPoolMsg.value =
      '✅ Pool localStorage cleared — reload /pools to confirm.'
  }

  // ── Mock time controls ─────────────────────────────────────────────────────
  const MOCK_PRESETS = [
    {
      label: 'Jun 10 (pre-tournament, all picks open)',
      iso: '2026-06-10T12:00:00Z',
    },
    { label: 'Jun 11 23:59 (after Day 1)', iso: '2026-06-11T23:59:00Z' },
    { label: 'Jun 12 23:59 (after Day 2)', iso: '2026-06-12T23:59:00Z' },
    { label: 'Jun 13 23:59 (after Day 3)', iso: '2026-06-13T23:59:00Z' },
    { label: 'Jun 14 23:59 (after Day 4)', iso: '2026-06-14T23:59:00Z' },
    { label: 'Jun 15 23:59 (after Day 5)', iso: '2026-06-15T23:59:00Z' },
    { label: 'Jun 21 23:59 (end of Week 2)', iso: '2026-06-21T23:59:00Z' },
    { label: 'Jul 2 23:59 (end of Round of 32)', iso: '2026-07-02T23:59:00Z' },
  ]

  const mockTimeMsg = ref('')
  const mockTimeCurrent = ref('')
  const mockTimeLoading = ref(false)

  async function loadMockTime() {
    try {
      const res = await $fetch<{ iso: string }>('/api/dev/mock-time')
      mockTimeCurrent.value = res.iso
    } catch {
      /* ignore */
    }
  }

  async function setMockTime(iso: string) {
    mockTimeLoading.value = true
    mockTimeMsg.value = ''
    try {
      await $fetch('/api/dev/mock-time', { method: 'POST', body: { iso } })
      mockTimeCurrent.value = iso
      mockTimeMsg.value = `✅ Mock time set to ${iso || '(real time)'} — server will hot-reload in a moment.`
    } catch (e: unknown) {
      mockTimeMsg.value = `❌ Failed: ${e instanceof Error ? e.message : String(e)}`
    } finally {
      mockTimeLoading.value = false
    }
  }

  // ── Picks Simulator ────────────────────────────────────────────────────────
  // Reads the schedule API, finds all STATUS_FINAL games, and writes picks
  // into localStorage (wc-picks-v1) for this browser. Simulates what a user
  // would have picked if they always backed the winner (or draw).
  const simMsg = ref('')
  const simLoading = ref(false)

  // Scenario presets: pick all finished games up to a given date
  const SIM_SCENARIOS = [
    { label: 'All finished games (current mock time)', cutoff: null },
    { label: 'Through Jun 11 23:59', cutoff: '2026-06-11T23:59:00Z' },
    { label: 'Through Jun 12 23:59', cutoff: '2026-06-12T23:59:00Z' },
    { label: 'Through Jun 13 23:59', cutoff: '2026-06-13T23:59:00Z' },
    { label: 'Through Jun 14 23:59', cutoff: '2026-06-14T23:59:00Z' },
    { label: 'Through Jun 15 23:59', cutoff: '2026-06-15T23:59:00Z' },
    { label: 'Through Jun 21 23:59', cutoff: '2026-06-21T23:59:00Z' },
    { label: 'Through Jul 2 23:59', cutoff: '2026-07-02T23:59:00Z' },
  ]

  interface RawEvent {
    id: string
    date: string
    name: string
    status: { type: { name: string; state: string; completed: boolean } }
    competitions: Array<{
      competitors: Array<{
        homeAway: string
        score: string
        team: { displayName: string; abbreviation: string }
      }>
    }>
  }

  function resolveOutcome(ev: RawEvent): 'home' | 'away' | 'draw' | null {
    const comp = ev.competitions[0]
    if (!comp) return null
    const home = comp.competitors.find((c) => c.homeAway === 'home')
    const away = comp.competitors.find((c) => c.homeAway === 'away')
    if (!home || !away) return null
    const h = Number(home.score)
    const a = Number(away.score)
    if (Number.isNaN(h) || Number.isNaN(a)) return null
    if (h === a) return 'draw'
    return h > a ? 'home' : 'away'
  }

  async function runSimulator(
    cutoffIso: string | null,
    strategy: 'winner' | 'home' | 'away' | 'draw' = 'winner'
  ) {
    if (!import.meta.client) return
    simLoading.value = true
    simMsg.value = ''
    try {
      // Fetch all mock events (full tournament range)
      const events = await $fetch<RawEvent[]>('/api/schedule', {
        query: { dates: '20260611-20260719' },
      })

      const cutoff = cutoffIso ? new Date(cutoffIso) : null

      // Load existing picks so we can merge
      let existing: Record<string, unknown> = {}
      try {
        const raw = localStorage.getItem('wc-picks-v1')
        if (raw) existing = JSON.parse(raw)
      } catch {
        /* ignore */
      }

      let added = 0
      let skipped = 0

      for (const ev of events) {
        // Only pick STATUS_FINAL games
        if (!ev.status.type.completed) {
          skipped++
          continue
        }
        // Respect cutoff date
        if (cutoff && new Date(ev.date) > cutoff) {
          skipped++
          continue
        }

        const comp = ev.competitions[0]
        if (!comp) {
          skipped++
          continue
        }
        const home = comp.competitors.find((c) => c.homeAway === 'home')
        const away = comp.competitors.find((c) => c.homeAway === 'away')
        if (!home || !away) {
          skipped++
          continue
        }

        let outcome: 'home' | 'away' | 'draw'
        if (strategy === 'winner') {
          const resolved = resolveOutcome(ev)
          if (!resolved) {
            skipped++
            continue
          }
          outcome = resolved
        } else {
          outcome = strategy
        }

        const team =
          outcome === 'home'
            ? home.team.displayName
            : outcome === 'away'
              ? away.team.displayName
              : ''

        existing[ev.id] = {
          matchId: ev.id,
          team,
          outcome,
          pickedAt: new Date().toISOString(),
          match: {
            id: ev.id,
            date: ev.date,
            home: home.team.displayName,
            away: away.team.displayName,
            homeAbbr: home.team.abbreviation,
            awayAbbr: away.team.abbreviation,
            homeScore: home.score,
            awayScore: away.score,
            status: {
              code: 'ft',
              label: 'FT',
              state: 'post',
            },
            group: null,
            venue: '',
            fire: 0,
          },
        }
        added++
      }

      localStorage.setItem('wc-picks-v1', JSON.stringify(existing))
      simMsg.value = `✅ Simulated ${added} picks (${skipped} skipped). Reload the page to see them.`
    } catch (e: unknown) {
      simMsg.value = `❌ Failed: ${e instanceof Error ? e.message : String(e)}`
    } finally {
      simLoading.value = false
    }
  }

  function clearAllPicks() {
    if (!import.meta.client) return
    localStorage.removeItem('wc-picks-v1')
    simMsg.value =
      '🗑 All picks cleared from localStorage. Reload the page to confirm.'
  }

  onMounted(() => loadMockTime())

  useHead({ title: 'Admin — MLS Analytics' })
</script>

<template>
  <div class="admin-wrap">
    <div class="admin-header">
      <h1 class="admin-title">📊 MLS Analytics</h1>
      <button class="refresh-btn" @click="refresh()">↻ Refresh</button>
    </div>

    <div v-if="error" class="admin-error">
      <p>Error loading analytics: {{ error.message }}</p>
    </div>

    <div v-else-if="pending" class="admin-loading">Loading…</div>

    <div v-else-if="data?.message" class="admin-note">{{ data.message }}</div>

    <template v-else-if="data">
      <!-- ── Totals (30-day) ── -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Page Views</div>
          <div class="stat-value">
            {{ data.totals.pageViews.toLocaleString() }}
          </div>
          <div class="stat-sub">last 30 days</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Unique Visitors</div>
          <div class="stat-value">
            {{ data.totals.uniqueVisitors.toLocaleString() }}
          </div>
          <div class="stat-sub">last 30 days</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Sessions</div>
          <div class="stat-value">
            {{ data.totals.sessions.toLocaleString() }}
          </div>
          <div class="stat-sub">last 30 days</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pages / Session</div>
          <div class="stat-value">{{ avgPagesPerSession }}</div>
          <div class="stat-sub">engagement · 30 days</div>
        </div>
      </div>

      <!-- ── Today so far ── -->
      <div v-if="todayStats" class="today-strip">
        <div class="today-label">Today so far</div>
        <div class="today-stats">
          <div class="today-stat">
            <span class="today-num">{{ todayStats.pageViews }}</span>
            <span class="today-key">views</span>
            <span
              v-if="
                trend(todayStats.pageViews, yesterdayStats?.pageViews) !== null
              "
              class="today-trend"
              :class="
                trend(todayStats.pageViews, yesterdayStats?.pageViews)! >= 0
                  ? 'up'
                  : 'down'
              "
            >
              {{
                trend(todayStats.pageViews, yesterdayStats?.pageViews)! >= 0
                  ? '▲'
                  : '▼'
              }}
              {{
                Math.abs(
                  trend(todayStats.pageViews, yesterdayStats?.pageViews)!
                )
              }}%
            </span>
          </div>
          <div class="today-divider" />
          <div class="today-stat">
            <span class="today-num">{{ todayStats.uniqueVisitors }}</span>
            <span class="today-key">visitors</span>
          </div>
          <div class="today-divider" />
          <div class="today-stat">
            <span class="today-num">{{ todayStats.sessions }}</span>
            <span class="today-key">sessions</span>
          </div>
        </div>
      </div>

      <!-- ── Daily breakdown ── -->
      <div class="admin-section">
        <h2 class="section-title">Daily Breakdown</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Views</th>
                <th>Visitors</th>
                <th>Sessions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="day in data.days"
                :key="day.date"
                :class="{ 'row-selected': selectedDay?.date === day.date }"
                @click="
                  selectedDay = selectedDay?.date === day.date ? null : day
                "
                style="cursor: pointer"
              >
                <td>{{ fmtDate(day.date) }}</td>
                <td>{{ day.pageViews.toLocaleString() }}</td>
                <td>{{ day.uniqueVisitors.toLocaleString() }}</td>
                <td>{{ day.sessions.toLocaleString() }}</td>
                <td class="td-arrow">
                  {{ selectedDay?.date === day.date ? '▲' : '▼' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Top Pages ── -->
      <div class="admin-section">
        <h2 class="section-title">
          Top Pages
          <span v-if="selectedDay" class="section-sub"
            >— {{ fmtDate(selectedDay.date) }}</span
          >
          <span v-else class="section-sub">— 30 days</span>
        </h2>
        <div class="bar-list">
          <div v-for="page in mergedTopPages" :key="page.path" class="bar-row">
            <div class="bar-label-wrap">
              <span class="bar-path">{{ page.path || '/' }}</span>
              <span class="bar-route-label">{{ routeLabel(page.path) }}</span>
            </div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :class="{ 'bar-fill--zero': page.views === 0 }"
                :style="{ width: barWidth(page.views, maxTopPage) }"
              />
            </div>
            <div class="bar-val" :class="{ 'bar-val--zero': page.views === 0 }">
              {{ page.views }}
            </div>
          </div>
        </div>

        <!-- ── Site Routes Reference ── -->
        <div class="routes-divider" />
        <h3 class="routes-title">All App Routes</h3>
        <div class="routes-list">
          <div v-for="r in KNOWN_ROUTES" :key="r.path" class="route-row">
            <code class="route-path">{{ r.path }}</code>
            <span class="route-desc">{{ r.label }}</span>
          </div>
          <div class="route-row route-row--admin">
            <code class="route-path">/admin</code>
            <span class="route-desc">Analytics Dashboard</span>
          </div>
        </div>
      </div>

      <!-- ── Hourly breakdown for selected day ── -->
      <div v-if="selectedDay" class="admin-section">
        <h2 class="section-title">
          Hourly — {{ fmtDate(selectedDay.date) }}
          <span class="section-sub">· click a day row to view</span>
        </h2>
        <div class="hourly-chart">
          <div v-for="h in fullHourly" :key="h.hour" class="hour-col">
            <div class="hour-bar-wrap">
              <div
                class="hour-bar"
                :class="{ 'hour-bar--active': h.views > 0 }"
                :style="{ height: barWidth(h.views, maxHourly) }"
                :title="hourTitle(h.hour, h.views)"
              />
            </div>
            <div class="hour-label">
              {{
                h.hour === 0
                  ? '12a'
                  : h.hour === 12
                    ? '12p'
                    : h.hour < 12
                      ? `${h.hour}a`
                      : `${h.hour - 12}p`
              }}
            </div>
          </div>
        </div>
      </div>

      <div v-else class="admin-section admin-section--hint">
        <span class="hint-text"
          >💡 Click any day row to see hourly breakdown &amp; per-day top
          pages</span
        >
      </div>
    </template>

    <!-- ── Dev Tools (always visible) ── -->
    <h2 class="section-title dev-tools-heading">🛠 Dev Tools</h2>

    <!-- Outer grid: two side-by-side column cards -->
    <div class="dev-cols-wrap">
      <!-- ── Mock Time column ── -->
      <div class="dev-col-card dev-col-card--time">
        <div class="dev-sub-title">⏱ Mock Time</div>
        <div class="dev-current-time">
          Current: <code>{{ mockTimeCurrent || '(loading…)' }}</code>
        </div>
        <div class="dev-btn-list">
          <button
            class="dev-btn dev-btn--real"
            :class="{ 'dev-btn--active': !mockTimeCurrent }"
            :disabled="mockTimeLoading"
            @click="setMockTime('')"
          >
            🕐 Use Real Time
          </button>
          <button
            v-for="preset in MOCK_PRESETS"
            :key="preset.iso"
            class="dev-btn dev-btn--preset"
            :class="{ 'dev-btn--active': mockTimeCurrent === preset.iso }"
            :disabled="mockTimeLoading"
            @click="setMockTime(preset.iso)"
          >
            {{ preset.label }}
          </button>
        </div>
        <p v-if="mockTimeMsg" class="dev-msg" style="margin-top: 0.5rem">
          {{ mockTimeMsg }}
        </p>
        <p class="dev-note" style="margin-top: 0.5rem">
          Patches <code>MOCK_NOW_ISO</code> in both <code>schedule.ts</code> and
          <code>useMockTime.ts</code>. Nuxt will hot-reload automatically —
          refresh the page after a second to see the change.
        </p>
      </div>

      <!-- ── Picks Simulator column ── -->
      <div class="dev-col-card dev-col-card--sim">
        <div class="dev-sub-title">🎲 Picks Simulator</div>
        <p class="dev-note" style="margin-bottom: 0.75rem">
          Auto-fills <code>wc-picks-v1</code> in this browser's localStorage
          with picks for all STATUS_FINAL games up to the chosen date. Strategy:
          <strong style="color: #c4b5fd">winner</strong> always picks the actual
          winning team (or draw). Reload the page after running.
        </p>
        <div class="dev-btn-list">
          <button
            v-for="scenario in SIM_SCENARIOS"
            :key="scenario.label"
            class="dev-btn dev-btn--sim"
            :disabled="simLoading"
            @click="runSimulator(scenario.cutoff)"
          >
            ✅ {{ scenario.label }}
          </button>
        </div>
        <div style="margin-top: 0.75rem">
          <button
            class="dev-btn dev-btn--danger"
            :disabled="simLoading"
            @click="clearAllPicks"
          >
            🗑 Clear All Picks
          </button>
        </div>
        <p v-if="simMsg" class="dev-msg" style="margin-top: 0.5rem">
          {{ simMsg }}
        </p>
      </div>
    </div>

    <!-- Pool Data -->
    <div class="admin-section dev-tools-section" style="margin-top: 0">
      <div class="dev-sub-title">🗄 Pool Data</div>
      <div class="dev-tools-row">
        <button class="dev-btn dev-btn--danger" @click="clearLocalPoolData">
          🗑 Clear Pool localStorage
        </button>
        <span v-if="clearPoolMsg" class="dev-msg">{{ clearPoolMsg }}</span>
      </div>
      <p class="dev-note">
        Removes <code>wc-pool-tokens-v1</code> and
        <code>wc-pools-cache-v1</code> from this browser's localStorage. Use
        this to reset the pools page to a fresh state (e.g. after deleting
        server pool data).
      </p>
    </div>
  </div>
</template>

<style scoped>
  .admin-wrap {
    max-width: 80rem;
    margin: 0 auto;
    padding: 1.5rem 1rem 4rem;
    font-family: var(--font-condensed);
    color: #e2e8f0;
    min-height: 100dvh;
  }

  .admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .admin-title {
    font-size: 1.25rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: white;
  }

  .refresh-btn {
    background: #1e293b;
    border: 1px solid #334155;
    color: #cbd5e1;
    padding: 0.35rem 0.75rem;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: color 0.15s;
  }
  .refresh-btn:hover {
    color: white;
  }

  .admin-error,
  .admin-loading,
  .admin-note {
    padding: 1rem 1.3rem;
    background: #1e293b;
    border-radius: 0.5rem;
    color: #e2e8f0;
    font-size: 1rem;
  }

  /* ── Stat cards ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .stat-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #e2e8f0;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 600;
    color: white;
    line-height: 1.1;
  }

  .stat-sub {
    font-size: 0.75rem;
    color: #e2e8f0;
    margin-top: 0.2rem;
  }

  /* ── Today strip ── */
  .today-strip {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    padding: 0.75rem 1.25rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .today-label {
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #e2e8f0;
    white-space: nowrap;
  }

  .today-stats {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .today-stat {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
  }

  .today-num {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
  }

  .today-key {
    font-size: 0.75rem;
    color: #e2e8f0;
  }

  .today-trend {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.1rem 0.3rem;
    border-radius: 0.25rem;
  }

  .today-trend.up {
    color: #4ade80;
    background: rgba(74, 222, 128, 0.1);
  }

  .today-trend.down {
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
  }

  .today-divider {
    width: 1px;
    height: 1.25rem;
    background: #334155;
  }

  /* ── Page-level two-column layout ── */
  .page-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: start;
  }

  .page-col-left,
  .page-col-right {
    min-width: 0;
  }

  @media (max-width: 768px) {
    .page-cols {
      grid-template-columns: 1fr;
    }
  }

  /* ── Section ── */
  .admin-section {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }

  .admin-section--hint {
    padding: 0.75rem 1.25rem;
    border-style: dashed;
    border-color: #1e3a5f;
    background: transparent;
  }

  .hint-text {
    font-size: 0.8rem;
    color: #e2e8f0;
  }

  .section-title {
    font-size: 1.25rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    letter-spacing: 0.04em;
    color: #e2e8f0;
    margin-bottom: 0.75rem;
  }

  .section-sub {
    font-weight: 400;
    color: #e2e8f0;
    text-transform: none;
    letter-spacing: 0;
  }

  /* ── Table ── */
  .table-wrap {
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .data-table th {
    text-align: left;
    padding: 0.4rem 0.5rem;
    color: #e2e8f0;
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-bottom: 1px solid #334155;
  }

  .data-table td {
    padding: 0.45rem 0.5rem;
    border-bottom: 1px solid #1e293b;
    color: #cbd5e1;
  }

  .data-table tbody tr:hover td {
    background: #0f172a;
    color: white;
  }

  .row-selected td {
    background: #0f172a;
    color: white;
  }

  .td-arrow {
    color: #e2e8f0;
    font-size: 0.65rem;
    text-align: right;
  }

  /* ── Bar chart ── */
  .bar-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 7.5rem 1fr 2.5rem;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
  }

  .bar-label-wrap {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .bar-path {
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.75rem;
    font-family: ui-monospace, monospace;
  }

  .bar-route-label {
    font-size: 0.6rem;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-track {
    background: #0f172a;
    border-radius: 2px;
    height: 0.5rem;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: #3b82f6;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .bar-fill--zero {
    background: #1e3a5f;
    width: 2px !important;
  }

  .bar-val {
    color: #e2e8f0;
    text-align: right;
    font-size: 0.75rem;
  }

  .bar-val--zero {
    color: #334155;
  }

  /* ── Routes reference ── */
  .routes-divider {
    border: none;
    border-top: 1px solid #334155;
    margin: 1rem 0 0.75rem;
  }

  .routes-title {
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #e2e8f0;
    margin-bottom: 0.5rem;
  }

  .routes-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .route-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.75rem;
  }

  .route-row--admin {
    opacity: 0.5;
  }

  .route-path {
    font-family: ui-monospace, monospace;
    font-size: 0.7rem;
    color: #60a5fa;
    background: #0f172a;
    padding: 0.1rem 0.35rem;
    border-radius: 0.2rem;
    min-width: 5rem;
    display: inline-block;
  }

  .route-desc {
    color: #e2e8f0;
    font-size: 0.72rem;
  }

  /* ── Hourly chart ── */
  .hourly-chart {
    display: flex;
    align-items: flex-end;
    gap: 0.2rem;
    height: 7rem;
    padding-bottom: 1.5rem;
    position: relative;
  }

  .hour-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .hour-bar-wrap {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
  }

  .hour-bar {
    width: 100%;
    background: #1e3a5f;
    border-radius: 2px 2px 0 0;
    min-height: 2px;
    transition: height 0.3s ease;
  }

  .hour-bar--active {
    background: #3b82f6;
  }

  .hour-label {
    font-size: 0.5rem;
    color: #64748b;
    margin-top: 0.25rem;
    white-space: nowrap;
  }

  /* Show every 3rd label to avoid crowding */
  .hour-col:nth-child(3n + 1) .hour-label {
    color: #e2e8f0;
  }

  /* ── Dev Tools heading outside the box ── */
  .dev-tools-heading {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }

  /* ── Dev Tools two separate column cards ── */
  .dev-cols-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: start;
    margin-bottom: 1rem;
  }

  @media (max-width: 640px) {
    .dev-cols-wrap {
      grid-template-columns: 1fr;
    }
  }

  .dev-col-card {
    border-radius: 0.5rem;
    border: 1px solid;
    padding: 1rem 1.25rem;
  }

  .dev-col-card--time {
    background: #1a1033;
    border-color: #4c1d95;
    height: 100%;
  }

  .dev-col-card--sim {
    background: #0a1f12;
    border-color: #166534;
  }

  .dev-btn-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  /* ── Dev Tools ── */
  .dev-tools-section {
    border-color: #7c3aed44;
    background: #1a1033;
  }

  .dev-tools-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.6rem;
  }

  .dev-btn {
    padding: 0.35rem 0.85rem;
    border-radius: 0.375rem;
    border: 1px solid;
    cursor: pointer;
    font-size: 0.8rem;
    font-family: var(--font-condensed);
    transition: opacity 0.15s;
  }

  .dev-btn--danger {
    background: #450a0a;
    border-color: #991b1b;
    color: #fca5a5;
  }

  .dev-btn--danger:hover {
    background: #7f1d1d;
  }

  .dev-msg {
    font-size: 0.8rem;
    color: #4ade80;
  }

  .dev-note {
    font-size: 0.75rem;
    color: #e2e8f0;
    line-height: 1.5;
  }

  .dev-note code {
    font-family: ui-monospace, monospace;
    font-size: 0.7rem;
    color: #e2e8f0;
    background: #0f172a;
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
  }

  .dev-subsection {
    margin-bottom: 0.25rem;
  }

  .dev-sub-title {
    font-size: 1rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.07em;
    color: #ffffff;
    margin-bottom: 0.75rem;
  }

  .dev-current-time {
    font-size: 0.78rem;
    color: #e2e8f0;
    margin-bottom: 0.6rem;
  }

  .dev-current-time code {
    font-family: ui-monospace, monospace;
    font-size: 0.72rem;
    color: #c4b5fd;
    background: #0f172a;
    padding: 0.1rem 0.35rem;
    border-radius: 0.2rem;
  }

  .dev-preset-grid {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .dev-btn--real {
    background: #0f172a;
    border-color: #475569;
    color: #e2e8f0;
    text-align: left;
    transition: background 0.12s;
    margin-bottom: 0.25rem;
  }

  .dev-btn--real:hover:not(:disabled) {
    background: #1e293b;
  }

  .dev-btn--real:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dev-btn--preset {
    background: #1e1040;
    border-color: #4c1d95;
    color: #c4b5fd;
    text-align: left;
    transition: background 0.12s;
  }

  .dev-btn--preset:hover:not(:disabled) {
    background: #2e1065;
  }

  .dev-btn--preset:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dev-btn--active {
    background: #4c1d95 !important;
    border-color: #7c3aed !important;
    color: #ede9fe !important;
  }

  .dev-divider {
    border: none;
    border-top: 1px solid #2d1b69;
    margin: 1rem 0;
  }

  /* ── Picks Simulator ── */
  .dev-sim-grid {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .dev-btn--sim {
    background: #0c2a1a;
    border-color: #166534;
    color: #86efac;
    text-align: left;
    transition: background 0.12s;
  }

  .dev-btn--sim:hover:not(:disabled) {
    background: #14532d;
  }

  .dev-btn--sim:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
