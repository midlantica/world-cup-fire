<script setup lang="ts">
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

  function barWidth(val: number, max: number) {
    if (!max) return '0%'
    return `${Math.round((val / max) * 100)}%`
  }

  const PAGE_LABELS: Record<string, string> = {
    '/': 'Home / Scores',
    '/groups': 'Groups',
    '/stats': 'Stats',
    '/pools': 'Pools',
    '/knockout': 'Knockout',
    '/predictor': 'Predictor',
  }

  const topPages = computed(() => {
    const source = selectedDay.value
      ? selectedDay.value.topPages
      : (data.value?.topPages ?? [])
    return [...source].sort((a, b) => b.views - a.views)
  })

  const maxTopPage = computed(() =>
    Math.max(1, ...topPages.value.map((p) => p.views))
  )

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

  const todayStats = computed(() => data.value?.days[0] ?? null)
  const yesterdayStats = computed(() => data.value?.days[1] ?? null)

  function trend(today: number, yesterday: number | undefined) {
    if (yesterday == null || yesterday === 0) return null
    return Math.round(((today - yesterday) / yesterday) * 100)
  }

  const avgPagesPerSession = computed(() => {
    const t = data.value?.totals
    if (!t || !t.sessions) return '—'
    return (t.pageViews / t.sessions).toFixed(1)
  })

  function pageLabel(path: string) {
    return PAGE_LABELS[path] ?? path
  }

  useHead({ title: 'Analytics — World Cup Fire' })
</script>

<template>
  <div class="analytics-wrap">
    <div class="page-header">
      <h1 class="page-title">Analytics</h1>
      <button class="refresh-btn" :disabled="pending" @click="refresh()">
        ↻ Refresh
      </button>
    </div>

    <div v-if="error" class="state-box state-box--error">
      Failed to load analytics: {{ error.message }}
    </div>

    <div v-else-if="pending" class="state-box">Loading…</div>

    <div v-else-if="data?.message" class="state-box state-box--note">
      {{ data.message }}
    </div>

    <template v-else-if="data">
      <!-- ── 30-day totals ── -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Page Views</div>
          <div class="kpi-value">
            {{ data.totals.pageViews.toLocaleString() }}
          </div>
          <div class="kpi-sub">last 30 days</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Unique Visitors</div>
          <div class="kpi-value">
            {{ data.totals.uniqueVisitors.toLocaleString() }}
          </div>
          <div class="kpi-sub">last 30 days</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Sessions</div>
          <div class="kpi-value">
            {{ data.totals.sessions.toLocaleString() }}
          </div>
          <div class="kpi-sub">last 30 days</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Pages / Session</div>
          <div class="kpi-value">{{ avgPagesPerSession }}</div>
          <div class="kpi-sub">engagement · 30 days</div>
        </div>
      </div>

      <!-- ── Today strip ── -->
      <div v-if="todayStats" class="today-strip">
        <span class="today-eyebrow">Today so far</span>
        <div class="today-stats">
          <div class="today-stat">
            <span class="today-num">{{
              todayStats.pageViews.toLocaleString()
            }}</span>
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
            <span class="today-num">{{
              todayStats.uniqueVisitors.toLocaleString()
            }}</span>
            <span class="today-key">visitors</span>
          </div>
          <div class="today-divider" />
          <div class="today-stat">
            <span class="today-num">{{
              todayStats.sessions.toLocaleString()
            }}</span>
            <span class="today-key">sessions</span>
          </div>
        </div>
      </div>

      <!-- ── Main two-column layout ── -->
      <div class="main-cols">
        <!-- Left: daily table -->
        <section class="card">
          <h2 class="card-title">Daily Breakdown</h2>
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
                  class="day-row"
                  @click="
                    selectedDay = selectedDay?.date === day.date ? null : day
                  "
                >
                  <td>{{ fmtDate(day.date) }}</td>
                  <td>{{ day.pageViews.toLocaleString() }}</td>
                  <td>{{ day.uniqueVisitors.toLocaleString() }}</td>
                  <td>{{ day.sessions.toLocaleString() }}</td>
                  <td class="td-chevron">
                    {{ selectedDay?.date === day.date ? '▲' : '▼' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Right: top pages -->
        <section class="card">
          <h2 class="card-title">
            Top Pages
            <span v-if="selectedDay" class="card-title-sub"
              >— {{ fmtDate(selectedDay.date) }}</span
            >
            <span v-else class="card-title-sub">— 30 days</span>
          </h2>
          <div v-if="topPages.length === 0" class="empty-note">
            No data yet.
          </div>
          <div v-else class="bar-list">
            <div v-for="page in topPages" :key="page.path" class="bar-row">
              <div class="bar-label-wrap">
                <span class="bar-path">{{ page.path || '/' }}</span>
                <span class="bar-route-label">{{ pageLabel(page.path) }}</span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :class="{ 'bar-fill--zero': page.views === 0 }"
                  :style="{ width: barWidth(page.views, maxTopPage) }"
                />
              </div>
              <div
                class="bar-val"
                :class="{ 'bar-val--zero': page.views === 0 }"
              >
                {{ page.views.toLocaleString() }}
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ── Hourly chart (when a day is selected) ── -->
      <section v-if="selectedDay" class="card">
        <h2 class="card-title">Hourly — {{ fmtDate(selectedDay.date) }}</h2>
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
      </section>

      <div v-else class="hint-row">
        💡 Click any day row to see hourly breakdown
      </div>
    </template>
  </div>
</template>

<style scoped>
  .analytics-wrap {
    max-width: 72rem;
    margin: 0 auto;
    padding: 1.5rem 1rem 4rem;
    color: #e2e8f0;
    font-family: var(--font-condensed);
    min-height: 100dvh;
  }

  /* ── Header ── */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .page-title {
    font-size: 1.4rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: #fff;
    letter-spacing: 0.04em;
  }

  .refresh-btn {
    background: #1e293b;
    border: 1px solid #334155;
    color: #cbd5e1;
    padding: 0.35rem 0.8rem;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: color 0.15s;
  }
  .refresh-btn:hover:not(:disabled) {
    color: #fff;
  }
  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── State boxes ── */
  .state-box {
    padding: 1rem 1.25rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    color: #e2e8f0;
  }
  .state-box--error {
    border-color: #991b1b;
    color: #fca5a5;
  }
  .state-box--note {
    border-color: #1e3a5f;
    color: #93c5fd;
  }

  /* ── KPI cards ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 0.875rem;
  }

  @media (max-width: 640px) {
    .kpi-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .kpi-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
  }

  .kpi-label {
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 0.2rem;
  }

  .kpi-value {
    font-size: 2rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: #fff;
    line-height: 1.1;
  }

  .kpi-sub {
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 0.2rem;
  }

  /* ── Today strip ── */
  .today-strip {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    padding: 0.7rem 1.25rem;
    margin-bottom: 0.875rem;
  }

  .today-eyebrow {
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #64748b;
    white-space: nowrap;
  }

  .today-stats {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    flex-wrap: wrap;
  }

  .today-stat {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
  }

  .today-num {
    font-size: 1.2rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    color: #fff;
  }

  .today-key {
    font-size: 0.72rem;
    color: #94a3b8;
  }

  .today-trend {
    font-size: 0.68rem;
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
    height: 1.1rem;
    background: #334155;
  }

  /* ── Two-column layout ── */
  .main-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.875rem;
    margin-bottom: 0.875rem;
    align-items: start;
  }

  @media (max-width: 768px) {
    .main-cols {
      grid-template-columns: 1fr;
    }
  }

  /* ── Card ── */
  .card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    margin-bottom: 0.875rem;
  }

  .card-title {
    font-size: 1rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.05em;
    color: #e2e8f0;
    margin-bottom: 0.75rem;
  }

  .card-title-sub {
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    color: #64748b;
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
    padding: 0.35rem 0.5rem;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #64748b;
    border-bottom: 1px solid #334155;
  }

  .data-table td {
    padding: 0.45rem 0.5rem;
    border-bottom: 1px solid #0f172a;
    color: #cbd5e1;
  }

  .day-row {
    cursor: pointer;
  }
  .day-row:hover td {
    background: #0f172a;
    color: #fff;
  }
  .row-selected td {
    background: #0f172a;
    color: #fff;
  }

  .td-chevron {
    color: #475569;
    font-size: 0.6rem;
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
    grid-template-columns: 8rem 1fr 3rem;
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
    font-family: ui-monospace, monospace;
    font-size: 0.72rem;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-route-label {
    font-size: 0.6rem;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-track {
    background: #0f172a;
    border-radius: 2px;
    height: 0.45rem;
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
    color: #94a3b8;
    text-align: right;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
  }
  .bar-val--zero {
    color: #334155;
  }

  .empty-note {
    font-size: 0.85rem;
    color: #475569;
    padding: 0.5rem 0;
  }

  /* ── Hourly chart ── */
  .hourly-chart {
    display: flex;
    align-items: flex-end;
    gap: 0.2rem;
    height: 7rem;
    padding-bottom: 1.5rem;
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
    font-size: 0.48rem;
    color: #334155;
    margin-top: 0.2rem;
    white-space: nowrap;
  }
  .hour-col:nth-child(3n + 1) .hour-label {
    color: #64748b;
  }

  /* ── Hint ── */
  .hint-row {
    font-size: 0.8rem;
    color: #475569;
    text-align: center;
    padding: 0.75rem 0 0.25rem;
  }
</style>
