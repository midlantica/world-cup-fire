<script setup lang="ts">
  // Dev-only admin dashboard — /admin
  // Dev-only: this page is hidden in production via the dev-only middleware.
  definePageMeta({ middleware: 'dev-only' })

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
  const simMsg = ref('')
  const simLoading = ref(false)

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
    strategy: 'winner' | 'home' | 'away' | 'draw' = 'winner',
    includeUpcoming = false
  ) {
    if (!import.meta.client) return
    simLoading.value = true
    simMsg.value = ''
    try {
      const events = await $fetch<RawEvent[]>('/api/schedule', {
        query: { dates: '20260611-20260719' },
      })

      const cutoff = cutoffIso ? new Date(cutoffIso) : null

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
        const isFinished = ev.status.type.completed
        const isNs =
          ev.status.type.name === 'STATUS_SCHEDULED' ||
          ev.status.type.state === 'pre'

        if (!isFinished && !(includeUpcoming && isNs)) {
          skipped++
          continue
        }

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
        if (strategy === 'winner' && isFinished) {
          const resolved = resolveOutcome(ev)
          if (!resolved) {
            skipped++
            continue
          }
          outcome = resolved
        } else if (strategy === 'winner' && isNs) {
          outcome = 'home'
        } else {
          outcome = strategy as 'home' | 'away' | 'draw'
        }

        const team =
          outcome === 'home'
            ? home.team.displayName
            : outcome === 'away'
              ? away.team.displayName
              : ''

        const statusCode = isFinished ? 'ft' : 'ns'

        existing[ev.id] = {
          matchId: ev.id,
          team,
          outcome,
          pickedAt: new Date().toISOString(),
          match: {
            id: ev.id,
            date: ev.date,
            home: home.team.displayName,
            homeShort: home.team.displayName,
            homeScore: isFinished ? home.score : null,
            homeColor: '888888',
            homeAltColor: 'ffffff',
            homeIso2: '',
            homeAbbrev: home.team.abbreviation,
            away: away.team.displayName,
            awayShort: away.team.displayName,
            awayScore: isFinished ? away.score : null,
            awayColor: '888888',
            awayAltColor: 'ffffff',
            awayIso2: '',
            awayAbbrev: away.team.abbreviation,
            group: null,
            venue: null,
            venueLocation: null,
            status: { code: statusCode },
            qualityScore: 0,
            badge: null,
            kickoffSlot: new Date(ev.date).getTime(),
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

  // ── Pool Data ──────────────────────────────────────────────────────────────
  const clearPoolMsg = ref('')

  function clearLocalPoolData() {
    if (!import.meta.client) return
    localStorage.removeItem('wc-pool-tokens-v1')
    localStorage.removeItem('wc-pools-cache-v1')
    clearPoolMsg.value =
      '✅ Pool localStorage cleared — reload /pools to confirm.'
  }

  // ── Demo Game ──────────────────────────────────────────────────────────────
  // Opens a fake completed match in the GameDetail modal so you can preview
  // the full match detail UI (goals, cards, subs, stats, lineups).
  const { openMatch, modalOpen } = useMatchDetail()

  const DEMO_BASE = {
    id: 'demo-game',
    date: '2026-06-14T19:00:00Z',
    home: 'Brazil',
    homeShort: 'Brazil',
    homeColor: '009c3b',
    homeAltColor: 'ffdf00',
    homeIso2: 'BR',
    homeAbbrev: 'BRA',
    away: 'Argentina',
    awayShort: 'Argentina',
    awayColor: '74acdf',
    awayAltColor: 'ffffff',
    awayIso2: 'AR',
    awayAbbrev: 'ARG',
    group: 'C',
    venue: 'MetLife Stadium',
    venueLocation: 'East Rutherford, New Jersey',
    qualityScore: 95,
    badge: null,
    kickoffSlot: new Date('2026-06-14T19:00:00Z').getTime(),
  } as const

  // Time-state snapshots for the demo game buttons.
  // Scores reflect what's happened up to that point in the mock keyEvents:
  //   12' Vinicius (BRA 1-0), 28' Messi pen (1-1), 41' Rodrygo (2-1),
  //   63' Álvarez (2-2), 84' Endrick (3-2)
  //
  // All states share the same id ('demo-game') so picks made in Pre-Game
  // persist correctly when the game state advances to live/HT/FT.
  const DEMO_STATES = [
    {
      label: 'Pre-Game',
      homeScore: null,
      awayScore: null,
      status: { code: 'ns' as const },
    },
    {
      label: "10'",
      homeScore: '0',
      awayScore: '0',
      status: { code: 'live' as const, clock: "10'" },
    },
    {
      label: "30'",
      homeScore: '1',
      awayScore: '0',
      status: { code: 'live' as const, clock: "30'" },
    },
    {
      label: 'HT',
      homeScore: '2',
      awayScore: '1',
      status: { code: 'ht' as const },
    },
    {
      label: "58'",
      homeScore: '2',
      awayScore: '1',
      status: { code: 'live' as const, clock: "58'" },
    },
    {
      label: "83'",
      homeScore: '2',
      awayScore: '2',
      status: { code: 'live' as const, clock: "83'" },
    },
    {
      label: 'FT',
      homeScore: '3',
      awayScore: '2',
      status: { code: 'ft' as const },
    },
  ]

  const activeDemoState = ref('FT')

  function openDemoGame(stateLabel = 'FT') {
    const state = DEMO_STATES.find((s) => s.label === stateLabel)
    if (!state) return
    activeDemoState.value = stateLabel
    openMatch({
      ...DEMO_BASE,
      homeScore: state.homeScore,
      awayScore: state.awayScore,
      status: state.status,
    })
  }

  onMounted(() => loadMockTime())

  useHead({ title: 'Admin — Dev Tools' })
</script>

<template>
  <div class="admin-wrap">
    <div class="admin-header">
      <h1 class="admin-title">🛠 Dev Tools</h1>
    </div>

    <!-- ── Demo Game ── -->
    <div class="admin-section demo-section">
      <div class="demo-section-inner">
        <div>
          <div class="dev-sub-title">🎮 Demo Game</div>
          <p class="dev-note" style="margin-bottom: 0.75rem">
            Opens a fake Brazil 3–2 Argentina match in the GameDetail modal.
            Pick a game-state to preview how the UI looks at that moment.
          </p>
          <button class="dev-btn dev-btn--demo" @click="openDemoGame('FT')">
            ⚽ Open Demo Game Modal
          </button>
        </div>
        <div class="demo-time-panel">
          <span class="demo-time-label">Game State</span>
          <div class="demo-time-btns">
            <button
              v-for="state in DEMO_STATES"
              :key="state.label"
              class="demo-time-btn"
              :class="{
                'demo-time-btn--active': activeDemoState === state.label,
              }"
              @click="openDemoGame(state.label)"
            >
              {{ state.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

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
            class="dev-btn dev-btn--sim dev-btn--upcoming"
            :disabled="simLoading"
            @click="runSimulator(null, 'winner', true)"
          >
            🗓 Pick ALL games (finished + upcoming)
          </button>
          <div style="border-top: 1px solid #166534; margin: 0.4rem 0" />
          <button
            v-for="scenario in SIM_SCENARIOS"
            :key="scenario.label"
            class="dev-btn dev-btn--sim"
            :disabled="simLoading"
            @click="runSimulator(scenario.cutoff, 'winner', true)"
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

  <!-- GameDetail modal is rendered globally via app.vue — openMatch() triggers it -->

  <!-- ── Floating demo time-control panel (visible when modal is open) ── -->
  <Teleport to="body">
    <Transition name="demo-panel">
      <div v-if="modalOpen" class="demo-float-panel">
        <span class="demo-float-label">Game State</span>
        <button
          v-for="state in DEMO_STATES"
          :key="state.label"
          class="demo-float-btn"
          :class="{ 'demo-float-btn--active': activeDemoState === state.label }"
          @click="openDemoGame(state.label)"
        >
          {{ state.label }}
        </button>
      </div>
    </Transition>
  </Teleport>
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

  /* ── Section ── */
  .admin-section {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
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

  /* ── Demo Game section ── */
  .demo-section {
    background: #0f1f2e;
    border-color: #1d4ed8;
  }

  .demo-section-inner {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .demo-time-panel {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .demo-time-label {
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #64748b;
  }

  .demo-time-btns {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .demo-time-btn {
    padding: 0.3rem 0.6rem;
    border-radius: 0.3rem;
    border: 1px solid #1e40af;
    background: #0c1e3a;
    color: #93c5fd;
    font-size: 0.78rem;
    font-family: var(--font-condensed);
    cursor: pointer;
    transition:
      background 0.12s,
      border-color 0.12s,
      color 0.12s;
    white-space: nowrap;
  }

  .demo-time-btn:hover {
    background: #1e3a5f;
    border-color: #3b82f6;
  }

  .demo-time-btn--active {
    background: #1d4ed8;
    border-color: #60a5fa;
    color: #ffffff;
    font-weight: 600;
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

  .dev-btn--demo {
    background: #0c1e3a;
    border-color: #1d4ed8;
    color: #93c5fd;
    font-size: 0.9rem;
    padding: 0.5rem 1.25rem;
    transition: background 0.15s;
  }

  .dev-btn--demo:hover {
    background: #1e3a5f;
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
    background: #2d1b69;
  }

  .dev-btn--preset:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  /* ── Floating demo time-control panel ── */
  /* Note: uses :global() because the element is teleported outside this component's scope */
  :global(.demo-float-panel) {
    position: fixed;
    top: 50%;
    right: 1.25rem;
    transform: translateY(-50%);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.3rem;
    background: #0a1628;
    border: 1px solid #1d4ed8;
    border-radius: 0.5rem;
    padding: 0.6rem 0.5rem;
    box-shadow:
      0 0 0 1px #1e40af44,
      0 8px 32px rgba(0, 0, 0, 0.6);
    min-width: 5.5rem;
  }

  :global(.demo-float-label) {
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #475569;
    text-align: center;
    margin-bottom: 0.2rem;
    font-family: var(--font-condensed);
  }

  :global(.demo-float-btn) {
    padding: 0.35rem 0.5rem;
    border-radius: 0.3rem;
    border: 1px solid #1e3a6e;
    background: #0c1e3a;
    color: #93c5fd;
    font-size: 0.8rem;
    font-family: var(--font-condensed);
    cursor: pointer;
    text-align: center;
    transition:
      background 0.12s,
      border-color 0.12s,
      color 0.12s;
    white-space: nowrap;
  }

  :global(.demo-float-btn:hover) {
    background: #1e3a5f;
    border-color: #3b82f6;
    color: #bfdbfe;
  }

  :global(.demo-float-btn--active) {
    background: #1d4ed8 !important;
    border-color: #60a5fa !important;
    color: #ffffff !important;
    font-weight: 700;
  }

  /* Slide-in from right */
  :global(.demo-panel-enter-active),
  :global(.demo-panel-leave-active) {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  :global(.demo-panel-enter-from),
  :global(.demo-panel-leave-to) {
    opacity: 0;
    transform: translateY(-50%) translateX(1rem);
  }
</style>
