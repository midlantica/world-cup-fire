<script setup lang="ts">
  import { usePicks } from '../composables/usePicks'
  import { usePools } from '../composables/usePools'
  import { useTimezone } from '../composables/useTimezone'
  import { useMatchDetail } from '../composables/useMatchDetail'
  import { useCountryDetail } from '../composables/useCountryDetail'
  import { useScores } from '../composables/useScores'
  import type { PickOutcome } from '../composables/usePicks'
  import type { Pool } from '../composables/usePools'

  useHead({
    title: 'Picks — World Cup Fire 🔥',
  })

  const { picks, picksReady, pickListByDay, pickCount, clearAll } = usePicks()

  const {
    pools,
    canCreate,
    MAX_POOLS,
    hasPool,
    joinPool,
    leavePool,
    createPool,
    updatePool,
    deletePool,
    syncOwnerPicks,
    leaderboard,
    poolLink,
  } = usePools()

  const { iana } = useTimezone()
  const { openMatch } = useMatchDetail()
  const { openCountry } = useCountryDetail()
  const { matches } = useScores()
  const route = useRoute()
  const router = useRouter()

  // ── Sub-nav: Personal Picks | Group Pools ──────────────────────────────────
  // The active tab is reflected in the URL (?tab=personal | ?tab=pools) so each
  // view has a hard, deep-linkable route that survives a page refresh.
  type Tab = 'personal' | 'pools'

  function tabFromQuery(): Tab {
    return route.query.tab === 'pools' ? 'pools' : 'personal'
  }

  const activeTab = ref<Tab>(tabFromQuery())

  // Switch tab + push it onto the URL (replace, so it doesn't spam history).
  function setTab(tab: Tab) {
    activeTab.value = tab
    router.replace({ query: { ...route.query, tab } })
  }

  // Keep the tab in sync if the URL changes (back/forward, manual edit).
  watch(
    () => route.query.tab,
    () => {
      activeTab.value = tabFromQuery()
    }
  )

  // ── Pool / invite state ────────────────────────────────────────────────────
  // When someone follows a shared link it carries a ?p=<poolId> query param.
  const poolId = computed(() => {
    const p = route.query.p
    return typeof p === 'string' && p.length > 0 ? p : null
  })
  const isInvitee = computed(() => poolId.value !== null)

  // Optional owner name (?o=) and pool name (?n=) carried on the invite link so
  // the invitee's local stub can show who they're up against + the real name.
  const linkOwnerName = computed(() => {
    const o = route.query.o
    return typeof o === 'string' ? o : ''
  })
  const linkPoolName = computed(() => {
    const n = route.query.n
    return typeof n === 'string' ? n : ''
  })

  // ── Join modal (invitee enters their name to join a shared pool) ────────────
  const joinModalOpen = ref(false)

  // When an invitee arrives via a ?p=<id> link and we don't yet have a local
  // copy of that pool, prompt them once for a display name, then create a local
  // "joined pool" stub so it shows under Group Pools and collects their picks.
  // (Phase A: single-device only — Phase B will sync with the owner's pool.)
  onMounted(() => {
    if (poolId.value && !hasPool(poolId.value)) {
      joinModalOpen.value = true
    }
  })

  async function onJoinSubmit(value: { yourName: string; poolName: string }) {
    if (poolId.value && !hasPool(poolId.value)) {
      const joined = await joinPool(poolId.value, {
        yourName: value.yourName,
        // The pool name comes from the invite link (?n=); the join modal hides
        // the pool-name input, so prefer the link value and fall back to any
        // value the modal happened to seed.
        poolName: linkPoolName.value || value.poolName,
        ownerName: linkOwnerName.value,
      })

      if (joined) {
        await syncOwnerPicks(picks.value)
        setTab('pools')
      }
    }
    joinModalOpen.value = false
  }

  function onLeave(pool: Pool) {
    if (
      import.meta.client &&
      !window.confirm(`Leave "${pool.name}"? You can rejoin from the link.`)
    )
      return
    leavePool(pool.id)
  }

  // ── Keep owner picks synced into every pool whenever personal picks change ──
  watch(picks, (val) => syncOwnerPicks(val), { deep: true, immediate: true })

  // ── Resolve a finished match's OUTCOME (for leaderboard scoring) ───────────
  // Returns 'home' | 'away' | 'draw' for finished matches, else null. A draw is
  // a real scorable outcome now (group-stage games can end level).
  function resolveResult(matchId: string): PickOutcome | null {
    const m = matches.value.find((x) => x.id === matchId)
    if (!m || m.status.code !== 'ft') return null
    const h = Number(m.homeScore)
    const a = Number(m.awayScore)
    if (Number.isNaN(h) || Number.isNaN(a)) return null
    if (h === a) return 'draw'
    return h > a ? 'home' : 'away'
  }

  // ── Per-pool summary of the LOCAL user's picks (made + correct so far) ──────
  // Picks are GLOBAL — the same set scores in every pool. We read the `isSelf`
  // member's picks (which mirror the personal map) and tally correct outcomes.
  function poolSummary(pool: Pool): { made: number; correct: number } {
    const self = pool.members.find((m) => m.isSelf)
    if (!self) return { made: 0, correct: 0 }
    let made = 0
    let correct = 0
    for (const [matchId, outcome] of Object.entries(self.picks)) {
      made++
      const result = resolveResult(matchId)
      if (result !== null && result === outcome) correct++
    }
    return { made, correct }
  }

  // ── Pool modal (create / edit) ─────────────────────────────────────────────
  const modalOpen = ref(false)
  const modalMode = ref<'create' | 'edit'>('create')
  const editingPool = ref<Pool | null>(null)

  function openCreate() {
    if (!canCreate.value) return
    modalMode.value = 'create'
    editingPool.value = null
    modalOpen.value = true
  }

  function openEdit(pool: Pool) {
    modalMode.value = 'edit'
    editingPool.value = pool
    modalOpen.value = true
  }

  async function onModalSubmit(value: { yourName: string; poolName: string }) {
    if (modalMode.value === 'edit' && editingPool.value) {
      await updatePool(editingPool.value.id, value)
    } else {
      const created = await createPool(value)
      if (created) {
        await syncOwnerPicks(picks.value)
        setTab('pools')
      }
    }
    modalOpen.value = false
  }

  function onDelete(pool: Pool) {
    if (
      import.meta.client &&
      !window.confirm(`Delete "${pool.name}"? This can't be undone.`)
    )
      return
    deletePool(pool.id)
  }

  // ── Picks grouped by day (shared logic lives in usePicks) ──────────────────
  const picksByDay = pickListByDay

  // ── Next-deadline banner ───────────────────────────────────────────────────
  // The "soonest" kickoff among matches the user hasn't picked yet that haven't
  // started. Drives a 🚨 nudge so picks get made before the window closes.
  const nextDeadline = computed(() => {
    // Wait until picks have actually been read from localStorage. Otherwise, on
    // a refresh the map is momentarily empty and this banner flashes up for an
    // already-picked match before disappearing.
    if (!picksReady.value) return null
    const now = Date.now()
    let soonest: {
      match: (typeof matches.value)[number]
      kickoff: number
    } | null = null

    for (const m of matches.value) {
      if (m.status.code !== 'ns') continue
      if (picks.value[m.id]) continue
      const kickoff = new Date(m.date).getTime()
      if (Number.isNaN(kickoff) || kickoff <= now) continue
      if (!soonest || kickoff < soonest.kickoff) soonest = { match: m, kickoff }
    }
    return soonest
  })

  const nextDeadlineLabel = computed(() => {
    const d = nextDeadline.value
    if (!d) return ''
    return new Date(d.match.date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: iana.value,
    })
  })

  // ── Scope banner: where do these picks count? ──────────────────────────────
  const scopeLabel = computed(() => {
    const n = pools.value.length
    if (n === 0) return 'My Picks'
    return `My Picks + ${n} ${n === 1 ? 'pool' : 'pools'}`
  })
</script>

<template>
  <div class="picks-page">
    <!-- Sub-nav (My Picks | Group Pools) now lives in AppHeader, rendered as a
         header sub-tab row (like the Matches stage tabs). The active tab is
         driven by the ?tab= query, which both AppHeader and this page read. -->
    <div class="picks-page__inner">
      <!-- ── Invitee welcome banner ─────────────────────────────────────── -->
      <div v-if="isInvitee" class="picks-page__welcome">
        <h2 class="picks-page__welcome-title">Welcome to World Cup Fire! 🔥</h2>
        <p class="picks-page__welcome-text">
          You were sent this link to make your picks and find out who brings the
          Fire 🔥 Make a pick on any upcoming match over on the
          <NuxtLink to="/" class="picks-page__welcome-link">Matches</NuxtLink>
          page, then come back here to see them all. May the best fan win!
        </p>
      </div>

      <!-- ════════════════ PERSONAL PICKS ════════════════ -->
      <section v-show="activeTab === 'personal'">
        <div class="picks-panel__title-row">
          <span class="picks-panel__title">My Picks</span>
          <span class="picks-panel__count"
            >{{ pickCount }} {{ pickCount === 1 ? 'Match' : 'Matches' }}</span
          >
        </div>

        <!-- Explanatory copy -->
        <p class="picks-panel__copy">
          These are the picks you made. These are just for you. If you'd like to
          match your wits with your friends and family, create a pool, then send
          them the link. Then they can make picks too! Oh, the excitement! 😄 ⚽️
        </p>

        <!-- Scope banner: your single picks set counts everywhere -->
        <div class="picks-scope">
          <span class="picks-scope__icon">🎯</span>
          <span class="picks-scope__text">
            You make your picks once — they count in
            <strong>{{ scopeLabel }}</strong
            >. Same picks, every pool.
          </span>
        </div>

        <!-- Deadline nudge: next unpicked, not-yet-started match -->
        <div v-if="nextDeadline" class="picks-deadline">
          <span class="picks-deadline__icon">🚨</span>
          <span class="picks-deadline__text">
            Next pick deadline:
            <strong>{{ nextDeadline.match.home }}</strong> vs
            <strong>{{ nextDeadline.match.away }}</strong>
            kicks off
            <strong>{{ nextDeadlineLabel }}</strong
            >. Get your pick in!
          </span>
        </div>

        <div v-if="pickCount === 0" class="picks-panel__empty">
          <div class="picks-panel__empty-icon">🎯</div>
          <h3 class="picks-panel__empty-title">No picks yet</h3>
          <p class="picks-panel__empty-text">
            Head over to the
            <NuxtLink to="/" class="picks-panel__empty-link">Matches</NuxtLink>
            page and hover (or tap) any upcoming match to pick the team you
            think will win. Your picks show up right here.
          </p>
        </div>

        <div v-else class="picks-panel__days">
          <div
            v-for="day in picksByDay"
            :key="day.key"
            class="picks-panel__day"
          >
            <div class="picks-panel__day-header">{{ day.label }}</div>
            <div class="picks-panel__grid">
              <MatchCard
                v-for="p in day.picks"
                :key="p.matchId"
                :match="p.match"
                @click="openMatch(p.match)"
                @click-country="openCountry"
              />
            </div>
          </div>
        </div>

        <div v-if="pickCount > 0" class="picks-panel__footer">
          <button class="picks-panel__clear" @click="clearAll">
            Clear all picks
          </button>
        </div>
      </section>

      <!-- ════════════════ GROUP POOLS ════════════════ -->
      <section v-show="activeTab === 'pools'" class="picks-pools">
        <div class="picks-pools__head">
          <div>
            <h2 class="picks-pools__title">Group Pools</h2>
            <p class="picks-pools__sub">
              {{ pools.length }} of {{ MAX_POOLS }} pools
            </p>
          </div>
          <button
            class="picks-pools__new"
            :disabled="!canCreate"
            @click="openCreate"
          >
            + New Pool
          </button>
        </div>

        <div v-if="pools.length === 0" class="picks-pools__empty">
          <div class="picks-pools__empty-icon">🏆</div>
          <h3 class="picks-pools__empty-title">No pools yet</h3>
          <p class="picks-pools__empty-text">
            Create a pool, share the link with friends &amp; family, and compete
            on a leaderboard all tournament long.
          </p>
          <button
            class="picks-pools__empty-btn"
            :disabled="!canCreate"
            @click="openCreate"
          >
            + New Pool
          </button>
        </div>

        <div v-else class="picks-pools__list">
          <PicksPoolCard
            v-for="pool in pools"
            :key="pool.id"
            :pool="pool"
            :link="poolLink(pool.id)"
            :leader-rows="leaderboard(pool.id, resolveResult)"
            :picks-made="poolSummary(pool).made"
            :picks-correct="poolSummary(pool).correct"
            @edit="openEdit"
            @delete="onDelete"
            @leave="onLeave"
            @edit-picks="setTab('personal')"
          />
        </div>
      </section>
    </div>

    <!-- Pool create / edit dialog -->
    <PicksPoolModal
      :open="modalOpen"
      :mode="modalMode"
      :pool="editingPool"
      @close="modalOpen = false"
      @submit="onModalSubmit"
    />

    <!-- Join dialog (shown to invitees arriving via a ?p= link) -->
    <PicksPoolModal
      :open="joinModalOpen"
      mode="join"
      @close="joinModalOpen = false"
      @submit="onJoinSubmit"
    />

    <!-- Modals (so picks can be inspected / drilled into) -->

    <GameDetailModal />
    <MyNationModal />
    <CountryDetailModal />
    <GroupDetailModal />
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .picks-page__inner {
    @apply mx-auto max-w-7xl space-y-4 px-3 pb-1;
  }

  /* ── Invitee welcome ──────────────────────────────────────────────────────── */
  .picks-page__welcome {
    @apply rounded-2xl border px-6 py-5;
    border-color: rgb(34 197 94 / 0.4);
    background: rgb(34 197 94 / 0.08);
  }

  .picks-page__welcome-title {
    @apply text-lg font-black text-white;
    @apply font-anybody-bold;
  }

  .picks-page__welcome-text {
    @apply mt-1 text-base text-white/70;
    line-height: 1.55;
  }

  .picks-page__welcome-link {
    @apply font-bold text-green-300 underline;
  }

  /* ── Panel ────────────────────────────────────────────────────────────────── */
  .picks-panel__title-row {
    @apply flex items-center gap-2;
  }

  .picks-panel__title {
    @apply text-lg text-white uppercase;
    @apply font-anybody-wide;
    letter-spacing: 0.06em;
    font-weight: 800;
  }

  .picks-panel__count {
    @apply text-xs text-white/50 uppercase;
    @apply font-anybody-bold;
    letter-spacing: 0.1em;
  }

  /* New Pool (green, prominent) */
  .picks-pools__new {
    background: #056900;
    color: #ffffff;
    border: none;
    border-radius: 15px;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1rem;
    padding: 0.6rem 1.3rem;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background-color 0.12s ease,
      opacity 0.12s ease;
  }

  .picks-pools__new:hover:not(:disabled) {
    background: #067a00;
  }

  .picks-pools__new:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Explanatory copy */
  .picks-panel__copy {
    @apply mt-3 max-w-3xl text-sm text-white/70;
    line-height: 1.55;
  }

  /* ── Scope banner (bright, full-width) ────────────────────────────────────── */
  .picks-scope {
    @apply mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3;
    background: linear-gradient(
      90deg,
      rgb(5 105 0 / 0.22) 0%,
      rgb(5 105 0 / 0.08) 100%
    );
    border: 1px solid rgb(74 222 128 / 0.35);
  }

  .picks-scope__icon {
    @apply text-lg;
    flex-shrink: 0;
  }

  .picks-scope__text {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 0.9rem;
    color: rgb(255 255 255 / 0.82);
    line-height: 1.45;
  }

  .picks-scope__text strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: #86efac;
  }

  /* ── Deadline nudge ───────────────────────────────────────────────────────── */
  .picks-deadline {
    @apply mt-2.5 flex items-center gap-2.5 rounded-xl px-4 py-3;
    background: rgb(234 88 12 / 0.12);
    border: 1px solid rgb(251 146 60 / 0.4);
  }

  .picks-deadline__icon {
    @apply text-lg;
    flex-shrink: 0;
  }

  .picks-deadline__text {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 0.9rem;
    color: rgb(255 255 255 / 0.82);
    line-height: 1.45;
  }

  .picks-deadline__text strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: #fdba74;
  }

  /* ── Empty state ──────────────────────────────────────────────────────────── */
  .picks-panel__empty {
    @apply mt-6 flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center;
  }

  .picks-panel__empty-icon {
    @apply text-4xl;
  }

  .picks-panel__empty-title {
    @apply text-base font-bold text-white;
  }

  .picks-panel__empty-text {
    @apply max-w-md text-sm text-white/60;
    line-height: 1.5;
  }

  .picks-panel__empty-link {
    @apply font-bold text-orange-300 underline;
  }

  /* ── Days ─────────────────────────────────────────────────────────────────── */
  .picks-panel__days {
    @apply mt-5 flex flex-col gap-5;
  }

  .picks-panel__day {
    @apply flex flex-col gap-2;
  }

  .picks-panel__day-header {
    @apply text-sm text-white/90 uppercase;
    @apply font-anybody-wide;
    letter-spacing: 0.075em;
    font-weight: 700;
  }

  .picks-panel__grid {
    @apply grid gap-3 sm:grid-cols-2 lg:grid-cols-3;
  }

  /* ── Footer ───────────────────────────────────────────────────────────────── */
  .picks-panel__footer {
    @apply mt-5 flex justify-end;
  }

  .picks-panel__clear {
    @apply rounded-lg px-3 py-1.5 text-xs font-bold text-white/50;
    @apply font-anybody-bold;
    background: transparent;
    border: 1px solid rgb(255 255 255 / 0.12);
    cursor: pointer;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    transition:
      color 0.12s ease,
      border-color 0.12s ease;
  }

  .picks-panel__clear:hover {
    color: rgb(248 113 113 / 0.9);
    border-color: rgb(248 113 113 / 0.4);
  }

  /* ── Group Pools ──────────────────────────────────────────────────────────── */
  .picks-pools {
    @apply space-y-4;
  }

  .picks-pools__head {
    @apply flex items-center justify-between;
  }

  .picks-pools__title {
    @apply text-lg text-white uppercase;
    @apply font-anybody-wide;
    letter-spacing: 0.06em;
    font-weight: 800;
  }

  .picks-pools__sub {
    @apply text-xs text-white/45 uppercase;
    @apply font-anybody-bold;
    letter-spacing: 0.08em;
  }

  .picks-pools__list {
    @apply flex flex-col gap-4;
  }

  .picks-pools__empty {
    @apply flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center;
  }

  .picks-pools__empty-icon {
    @apply text-4xl;
  }

  .picks-pools__empty-title {
    @apply text-base font-bold text-white;
  }

  .picks-pools__empty-text {
    @apply max-w-md text-sm text-white/60;
    line-height: 1.5;
  }

  .picks-pools__empty-btn {
    @apply mt-3;
    background: #056900;
    color: #ffffff;
    border: none;
    border-radius: 15px;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1rem;
    padding: 0.6rem 1.5rem;
    cursor: pointer;
  }

  .picks-pools__empty-btn:hover:not(:disabled) {
    background: #067a00;
  }

  .picks-pools__empty-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
