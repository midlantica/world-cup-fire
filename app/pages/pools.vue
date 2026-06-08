<script setup lang="ts">
  import { usePicks } from '../composables/usePicks'
  import { usePools } from '../composables/usePools'
  import { useMatchDetail } from '../composables/useMatchDetail'
  import { useCountryDetail } from '../composables/useCountryDetail'
  import { useGroupDetail } from '../composables/useGroupDetail'
  import { normaliseEvent } from '../composables/useScores'
  import type { PickOutcome } from '../composables/usePicks'
  import type { Pool } from '../composables/usePools'

  useHead({
    title: 'Pools — World Cup Fire 🔥',
  })

  const { picks } = usePicks()

  const {
    pools,
    canCreate,
    ownedCount,
    selfName,
    hasAnyCreds,
    MAX_POOLS,
    hasPool,
    joinPool,
    leavePool,
    createPool,
    updatePool,
    deletePool,
    deleteMember,
    renameSelf,
    syncOwnerPicks,
    refreshPools,
    leaderboard,
    poolLink,
  } = usePools()

  useMatchDetail()
  useCountryDetail()
  useGroupDetail()

  // Fetch ALL tournament matches (full date range) so resolveResult works
  // regardless of which week tab the user is currently viewing.
  // Use an explicit key so Nuxt doesn't deduplicate this against the
  // per-week fetch in useScores (same URL, different query).
  const { data: allMatchEvents } = useFetch<unknown[]>('/api/schedule', {
    key: 'pools-all-matches',
    query: { dates: '20260611-20260719' },
  })
  const allMatches = computed<ReturnType<typeof normaliseEvent>[]>(() => {
    if (!allMatchEvents.value) return []
    return allMatchEvents.value.map(normaliseEvent)
  })
  const route = useRoute()

  // ── Pool / invite state ────────────────────────────────────────────────────
  const poolId = computed(() => {
    const p = route.query.p
    return typeof p === 'string' && p.length > 0 ? p : null
  })
  const isInvitee = computed(() => poolId.value !== null)

  const linkOwnerName = computed(() => {
    const o = route.query.o
    return typeof o === 'string' ? o : ''
  })
  const linkPoolName = computed(() => {
    const n = route.query.n
    return typeof n === 'string' ? n : ''
  })

  // ── Join modal ─────────────────────────────────────────────────────────────
  const joinModalOpen = ref(false)
  const poolsReady = ref(false)
  /** Set when the invite link's pool ID doesn't exist on the server. */
  const inviteError = ref(false)
  /** Real pool name fetched from the server (overrides the URL ?n= hint). */
  const fetchedPoolName = ref('')

  onMounted(async () => {
    // Wait a tick so usePools' own onMounted has finished re-hydrating creds
    // from localStorage (SSR hands the client an empty useState; usePools
    // re-reads localStorage in its own onMounted which registers first but
    // the reactive assignment may not be visible until the next tick).
    await nextTick()

    // Snapshot whether this device has ANY stored creds BEFORE refreshPools()
    // runs. refreshPools() may call removeLocal() on a 404 (deleted pool),
    // which would wipe creds and make hasAnyCreds false — causing the
    // auto-create guard to fire incorrectly for returning users whose pool
    // was temporarily unreachable. Reading localStorage here captures the
    // "did this device ever belong to a pool?" truth before any server calls.
    const hadStoredCreds = (() => {
      if (!import.meta.client) return false
      try {
        const raw = localStorage.getItem('wc-pool-tokens-v1')
        if (!raw) return false
        const parsed = JSON.parse(raw) as Record<string, unknown>
        return typeof parsed === 'object' && Object.keys(parsed).length > 0
      } catch {
        return false
      }
    })()

    // Refresh all pools from the server now that creds are hydrated.
    // usePools.onMounted re-hydrates localStorage but does NOT call
    // refreshPools() — we do it here (awaited) so pools.value is fully
    // populated before we decide whether to auto-create or show the join modal.
    await refreshPools()

    // Mark pools as ready AFTER the server fetch — this prevents the empty
    // state from flashing while pools are still loading on refresh.
    poolsReady.value = true

    // Re-sync picks now that creds are hydrated and pools are loaded.
    await syncOwnerPicks(picks.value)

    // Brand-new users (no pools, not arriving via an invite link) always get
    // a pool — gratis, whether they want one or not. Their picks auto-populate
    // into it. Guard: only auto-create if pools is STILL empty after refreshPools
    // AND we held no creds at all before the refresh — a returning user with
    // creds (even if the pool fetch failed) should NOT get a new pool created.
    if (pools.value.length === 0 && !poolId.value && !hadStoredCreds) {
      const name = selfName.value.trim()
      // Always auto-create — use whatever name we know, or fall back to 'You'.
      // The user can rename via the edit modal at any time.
      const created = await createPool({
        yourName: name && name !== 'You' ? name : 'You',
        poolName: 'World Cup Fire Pool',
      })
      if (created) await syncOwnerPicks(picks.value)
    }

    if (poolId.value && !hasPool(poolId.value)) {
      // Don't re-show the join modal if this browser already has a token for
      // this pool — the user has already joined and is just refreshing with
      // the invite URL still in the address bar.
      const alreadyJoined = (() => {
        if (!import.meta.client) return false
        try {
          const raw = localStorage.getItem('wc-pool-tokens-v1')
          if (!raw) return false
          const tokens = JSON.parse(raw) as Record<string, unknown>
          return poolId.value! in tokens
        } catch {
          return false
        }
      })()
      if (!alreadyJoined) {
        // Validate the pool ID against the server before opening the join modal.
        // This catches tampered/deleted/made-up pool IDs and shows a clear error
        // instead of a join modal that would fail silently.
        try {
          const res = await $fetch<{ pool: { name: string } }>(
            `/api/pools/${poolId.value}`
          )
          // Pool exists — use the real server name (ignores tampered ?n= param)
          fetchedPoolName.value = res.pool.name
          joinModalOpen.value = true
        } catch {
          // Pool not found or server error — show the error banner, not the modal
          inviteError.value = true
        }
      }
    }
  })

  async function onJoinSubmit(value: { yourName: string; poolName: string }) {
    if (poolId.value && !hasPool(poolId.value)) {
      const joined = await joinPool(poolId.value, {
        yourName: value.yourName,
        poolName: linkPoolName.value || value.poolName,
        ownerName: linkOwnerName.value,
      })
      if (joined) await syncOwnerPicks(picks.value)
    }
    joinModalOpen.value = false
  }

  async function onLeave(pool: Pool) {
    if (
      import.meta.client &&
      !window.confirm(`Leave "${pool.name}"? You can rejoin from the link.`)
    )
      return
    leavePool(pool.id)
    // If the user just left their last pool, auto-create a default one so the
    // right column is never empty — the area must always have a pool ready.
    if (pools.value.length === 0) {
      const name = selfName.value.trim()
      const created = await createPool({
        yourName: name && name !== 'You' ? name : 'You',
        poolName: 'World Cup Fire Pool',
      })
      if (created) await syncOwnerPicks(picks.value)
    }
  }

  // ── Keep owner picks synced ────────────────────────────────────────────────
  // NOTE: NOT immediate — the immediate watch would fire during setup with an
  // empty picks map (SSR state, before usePicks re-hydrates from localStorage
  // in its own onMounted), which would push {} to the server and wipe stored
  // picks. Instead we do an explicit sync in onMounted after nextTick (below),
  // and then watch for subsequent changes.
  watch(picks, (val) => syncOwnerPicks(val), { deep: true })

  // ── Live leaderboard: refresh pools when tab becomes visible + every 10s ──
  // This ensures all members see each other's name changes and picks without
  // a manual refresh. 10s keeps it snappy without hammering the server.
  if (import.meta.client) {
    const POLL_INTERVAL = 10_000
    let pollTimer: ReturnType<typeof setInterval> | null = null

    function startPolling() {
      if (pollTimer) return
      pollTimer = setInterval(() => refreshPools(), POLL_INTERVAL)
    }

    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // Immediately fetch fresh data when the user tabs back in.
        refreshPools()
        startPolling()
      } else {
        stopPolling()
      }
    }

    onMounted(() => {
      document.addEventListener('visibilitychange', onVisibilityChange)
      startPolling()
    })

    onUnmounted(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stopPolling()
    })
  }

  // ── Resolve finished match outcome ────────────────────────────────────────
  function resolveResult(matchId: string): PickOutcome | null {
    const m = allMatches.value.find((x) => x.id === matchId)
    if (!m || m.status.code !== 'ft') return null
    const h = Number(m.homeScore)
    const a = Number(m.awayScore)
    if (Number.isNaN(h) || Number.isNaN(a)) return null
    if (h === a) return 'draw'
    return h > a ? 'home' : 'away'
  }

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

  // ── Edit-name modal (click your name in the leaderboard) ──────────────────
  const editNameOpen = ref(false)
  const editNamePool = ref<Pool | null>(null)

  function openEditName(pool: Pool) {
    editNamePool.value = pool
    editNameOpen.value = true
  }

  async function onEditNameSubmit(newName: string) {
    // Rename the user in ALL pools they belong to so the name stays consistent
    // across every leaderboard, not just the one they clicked.
    await Promise.all(pools.value.map((p: Pool) => renameSelf(p.id, newName)))
    // Immediately re-fetch all pools so every member's view reflects the
    // new name as quickly as possible (don't wait for the next poll tick).
    await refreshPools()
    editNameOpen.value = false
    editNamePool.value = null
  }

  // ── Share modal ────────────────────────────────────────────────────────────
  const shareModalOpen = ref(false)
  const sharingPool = ref<Pool | null>(null)

  function openShare(pool: Pool) {
    sharingPool.value = pool
    shareModalOpen.value = true
  }

  async function onShareSubmit(value: { yourName: string; poolName: string }) {
    if (sharingPool.value) {
      // Save the name + pool name, then copy the link.
      await updatePool(sharingPool.value.id, value)
      // Re-fetch so poolLink() uses the updated pool name in the URL params.
      await refreshPools()
      const link = poolLink(sharingPool.value.id)
      try {
        await navigator.clipboard.writeText(link)
      } catch {
        // ignore clipboard errors
      }
    }
    shareModalOpen.value = false
    sharingPool.value = null
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
      // Re-fetch so the pool card name/ownerName reflect the server state.
      await refreshPools()
    } else {
      const created = await createPool(value)
      if (created) await syncOwnerPicks(picks.value)
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

  function onModalDelete() {
    if (!editingPool.value) return
    modalOpen.value = false
    onDelete(editingPool.value)
  }

  // ── Delete member (owner only) ─────────────────────────────────────────────
  async function onDeleteMember(pool: Pool, memberId: string) {
    await deleteMember(pool.id, memberId)
    await refreshPools()
  }
</script>

<template>
  <div class="pools-page">
    <div class="pools-page__inner">
      <!-- ── Invite error banner — shown when the pool ID is invalid ───────── -->
      <div v-if="inviteError" class="pools-invite-error">
        <p class="pools-invite-error__title">⚠️ That pool doesn't exist.</p>
        <p class="pools-invite-error__text">
          This invite link is invalid or the pool has been deleted. Ask the pool
          owner to share a fresh link.
        </p>
      </div>

      <!-- ── Invitee welcome banner (full-width, above the two columns) ──── -->
      <div v-else-if="isInvitee" class="pools-welcome">
        <h2 class="pools-welcome__title">Welcome to World Cup Fire! 🔥</h2>
        <p class="pools-welcome__text">
          You were sent this link to make your picks and find out who brings the
          Fire 🔥 Make a pick on any upcoming match over on the
          <NuxtLink to="/" class="pools-welcome__link">Matches</NuxtLink>
          page, then come back here to see them all. May the best fan win!
        </p>
      </div>

      <!-- ── Two-column layout ─────────────────────────────────────────────── -->
      <div class="pools-layout">
        <!-- LEFT: hero copy + explainer + CTA ──────────────────────────────── -->
        <aside class="pools-sidebar">
          <div class="pools-sidebar__content">
            <div class="pools-sidebar__heading-row">
              <h1 class="pools-sidebar__heading">
                <span class="pools-sidebar__trophy">🏆</span> Pools
              </h1>
              <button
                class="pools-sidebar__new-btn"
                :disabled="!canCreate"
                @click="openCreate"
              >
                New Pool
              </button>
            </div>
            <p class="pools-sidebar__lead">
              Compete with friends &amp; family all tournament long. Create a
              pool, share the link, and see who really knows their football.
            </p>

            <ul class="pools-sidebar__steps">
              <li>
                <span class="pools-sidebar__step-num">1</span>
                <span
                  >Edit the Pool or create a new pool and give it a name.</span
                >
              </li>
              <li>
                <span class="pools-sidebar__step-num">2</span>
                <span>Share the invite link with your crew.</span>
              </li>
              <li>
                <span class="pools-sidebar__step-num">3</span>
                <span>
                  Everyone picks match results on the
                  <NuxtLink to="/" class="pools-sidebar__link"
                    >Matches</NuxtLink
                  >
                  page.
                </span>
              </li>
              <li>
                <span class="pools-sidebar__step-num">4</span>
                <span>Watch the leaderboard update in real time. ⚽️</span>
              </li>
            </ul>

            <p v-if="!canCreate" class="pools-sidebar__cap-note">
              You've reached the {{ MAX_POOLS }}-pool limit.
            </p>
          </div>
        </aside>

        <!-- RIGHT: pool cards / leaderboards ──────────────────────────────── -->
        <main class="pools-main">
          <!-- Pool cards: shown once ready and there are pools -->
          <div v-if="pools.length > 0" class="pools-list">
            <PicksPoolCard
              v-for="pool in pools"
              :key="pool.id"
              :pool="pool"
              :link="poolLink(pool.id)"
              :leader-rows="leaderboard(pool.id, resolveResult)"
              :picks-made="poolSummary(pool).made"
              :picks-correct="poolSummary(pool).correct"
              @edit="openEdit"
              @share="openShare"
              @delete="onDelete"
              @leave="onLeave"
              @edit-picks="$router.push('/')"
              @rename="openEditName"
              @delete-member="
                (pool, memberId) => onDeleteMember(pool, memberId)
              "
            />
          </div>
        </main>
      </div>
      <!-- /.pools-layout -->
    </div>

    <!-- Pool create / edit dialog -->
    <PicksPoolModal
      :open="modalOpen"
      :mode="modalMode"
      :pool="editingPool"
      :known-name="selfName"
      :is-last-owned="ownedCount <= 1"
      default-pool-name="World Cup Fire Pool"
      @close="modalOpen = false"
      @submit="onModalSubmit"
      @delete="onModalDelete"
    />

    <!-- Share dialog (name required before copying invite link) -->
    <PicksPoolModal
      :open="shareModalOpen"
      mode="share"
      :pool="sharingPool"
      :known-name="selfName"
      @close="shareModalOpen = false"
      @submit="onShareSubmit"
    />

    <!-- Join dialog — uses the real server pool name, not the URL param -->
    <PicksPoolModal
      :open="joinModalOpen"
      mode="join"
      :join-pool-name="fetchedPoolName || linkPoolName"
      :known-name="selfName"
      @close="joinModalOpen = false"
      @submit="onJoinSubmit"
    />

    <!-- Edit name dialog (click your name in the leaderboard) -->
    <PicksEditNameModal
      :open="editNameOpen"
      :current-name="
        editNamePool
          ? (editNamePool.members.find((m) => m.isSelf)?.name ?? '')
          : ''
      "
      @close="editNameOpen = false"
      @submit="onEditNameSubmit"
    />

    <!-- Modals -->
    <GameDetailModal />
    <FlagModal />
    <CountryDetailModal />
    <GroupDetailModal />
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── Page shell ──────────────────────────────────────────────────────────── */
  .pools-page__inner {
    @apply space-y-4 pb-8;
    max-width: 80rem;
    margin-inline: auto;
    padding-inline: 1.5rem;
  }

  /* ── Invite error banner ─────────────────────────────────────────────────── */
  .pools-invite-error {
    @apply border px-6 py-5;
    border-color: rgb(239 68 68 / 0.5);
    background: rgb(239 68 68 / 0.08);
  }

  .pools-invite-error__title {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 1rem;
    color: rgb(252 165 165);
  }

  .pools-invite-error__text {
    margin-top: 0.25rem;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 0.9rem;
    color: rgb(255 255 255 / 0.6);
    line-height: 1.5;
  }

  /* ── Invitee welcome banner ──────────────────────────────────────────────── */
  .pools-welcome {
    @apply border px-6 py-5;
    border-color: rgb(34 197 94 / 0.4);
    background: rgb(34 197 94 / 0.08);
  }

  .pools-welcome__title {
    @apply text-lg font-black text-white;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 900;
  }

  .pools-welcome__text {
    @apply mt-1 text-base text-white/70;
    line-height: 1.55;
  }

  .pools-welcome__link {
    @apply font-bold text-green-300 underline;
  }

  /* ── Two-column layout ───────────────────────────────────────────────────── */
  .pools-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
  }

  /* Single column on mobile */
  @media (max-width: 768px) {
    .pools-layout {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  /* ── LEFT: sidebar ───────────────────────────────────────────────────────── */
  .pools-sidebar {
    /* Stick to the top as the right column scrolls (desktop only) */
    position: sticky;
    top: calc(var(--app-header-h, 4.5rem) + 1rem);
  }

  @media (max-width: 768px) {
    .pools-sidebar {
      position: static;
    }
  }

  .pools-sidebar__content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.25rem;
  }

  /* Heading row: title on left, New Pool button on right */
  .pools-sidebar__heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .pools-sidebar__heading-row .pools-sidebar__new-btn {
    width: auto;
    flex-shrink: 0;
    font-size: 1.2rem;
    padding: 0.3rem 1.05rem 0.25rem;
  }

  .pools-sidebar__trophy {
    font-size: 1em;
    line-height: 1;
    vertical-align: baseline;
  }

  .pools-sidebar__heading {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 1.5rem;
    color: #ffffff;
    letter-spacing: 0.05em;
    line-height: 1.1;
  }

  .pools-sidebar__lead {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 1rem;
    color: rgb(255 255 255 / 1);
    line-height: 1.6;
    letter-spacing: 0.07rem;
  }

  /* How-it-works steps */
  .pools-sidebar__steps {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    list-style: none;
    padding: 0;
    margin: 0;
    justify-content: center;
  }

  .pools-sidebar__steps li {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 90,
      'wght' 300;
    font-size: 0.9rem;
    color: rgb(255 255 255 / 1);
    line-height: 1.45;
    letter-spacing: 0.08rem;
  }

  .pools-sidebar__step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    background: rgb(255 255 255 / 0.1);
    border: 1px solid rgb(255 255 255 / 0.15);
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 0.75rem;
    color: #ffffff;
    margin-top: 0.05rem;
  }

  .pools-sidebar__link {
    color: #86efac;
    font-variation-settings:
      'wdth' 90,
      'wght' 300;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .pools-sidebar__link:hover {
    color: #bbf7d0;
  }

  /* CTA row */
  .pools-sidebar__cta {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
    margin-top: 0;
    justify-content: center;
  }

  .pools-sidebar__new-btn {
    width: 100%;
    background: oklab(0.62 0.13 0.14 / 0.85);
    color: #ffffff;
    border: none;
    border-radius: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1rem;
    padding: 0.55rem 1.25rem 0.45rem;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background-color 0.12s ease,
      opacity 0.12s ease;
  }

  .pools-sidebar__new-btn:hover:not(:disabled) {
    background: oklab(0.68 0.14 0.15);
  }

  .pools-sidebar__new-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pools-sidebar__cap {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    font-size: 0.8rem;
    color: rgb(255 255 255 / 0.4);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .pools-sidebar__cap-note {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    font-size: 0.8rem;
    color: rgb(251 146 60 / 0.85);
  }

  /* ── RIGHT: main pool list ───────────────────────────────────────────────── */
  .pools-main {
    min-width: 0; /* prevent grid blowout */
  }

  .pools-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* ── Empty state ─────────────────────────────────────────────────────────── */
  .pools-empty {
    @apply flex flex-col items-center gap-2 border border-white/10 bg-white/5 px-6 py-12 text-center;
  }

  .pools-empty__icon {
    @apply text-4xl;
  }

  .pools-empty__title {
    @apply text-base font-bold text-white;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
  }

  .pools-empty__text {
    @apply max-w-xs text-sm text-white/60;
    line-height: 1.5;
  }

  .pools-empty__btn {
    @apply mt-3;
    background: oklab(0.62 0.13 0.14);
    color: #ffffff;
    border: none;
    border-radius: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1rem;
    padding: 0.45rem 1.25rem 0.35rem;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background-color 0.12s ease,
      opacity 0.12s ease;
  }

  .pools-empty__btn:hover:not(:disabled) {
    background: oklab(0.68 0.14 0.15);
  }

  .pools-empty__btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
