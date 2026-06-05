<script setup lang="ts">
  import { usePicks } from '../composables/usePicks'
  import { usePools } from '../composables/usePools'
  import { useTimezone } from '../composables/useTimezone'
  import { useMatchDetail } from '../composables/useMatchDetail'
  import { useCountryDetail } from '../composables/useCountryDetail'
  import { useGroupDetail } from '../composables/useGroupDetail'
  import { useScores } from '../composables/useScores'
  import type { PickOutcome } from '../composables/usePicks'
  import type { Pool } from '../composables/usePools'

  useHead({
    title: 'Pools — World Cup Fire 🔥',
  })

  const { picks, picksReady } = usePicks()

  const {
    pools,
    canCreate,
    selfName,
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
  const { openGroupSilent: openGroup } = useGroupDetail()
  const { matches } = useScores()
  const route = useRoute()
  const router = useRouter()

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

  onMounted(async () => {
    poolsReady.value = true

    // Auto-create the default "World Cup Fire Pool" for brand-new users who
    // have no pools yet and aren't arriving via an invite link.
    if (pools.value.length === 0 && !poolId.value) {
      const name = selfName.value.trim() || 'You'
      const created = await createPool({
        yourName: name,
        poolName: 'World Cup Fire Pool',
      })
      if (created) await syncOwnerPicks(picks.value)
    }

    if (poolId.value && !hasPool(poolId.value)) {
      joinModalOpen.value = true
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

  function onLeave(pool: Pool) {
    if (
      import.meta.client &&
      !window.confirm(`Leave "${pool.name}"? You can rejoin from the link.`)
    )
      return
    leavePool(pool.id)
  }

  // ── Keep owner picks synced ────────────────────────────────────────────────
  watch(picks, (val) => syncOwnerPicks(val), { deep: true, immediate: true })

  // ── Resolve finished match outcome ────────────────────────────────────────
  function resolveResult(matchId: string): PickOutcome | null {
    const m = matches.value.find((x) => x.id === matchId)
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
</script>

<template>
  <div class="pools-page">
    <div class="pools-page__inner">
      <!-- ── Invitee welcome banner (full-width, above the two columns) ──── -->
      <div v-if="isInvitee" class="pools-welcome">
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
            <h1 class="pools-sidebar__heading">
              <span class="pools-sidebar__trophy">🏆</span> Pools
            </h1>
            <p class="pools-sidebar__lead">
              Compete with friends &amp; family all tournament long. Create a
              pool, share the link, and see who really knows their football.
            </p>

            <ul class="pools-sidebar__steps">
              <li>
                <span class="pools-sidebar__step-num">1</span>
                <span>Create a pool and give it a name.</span>
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

            <div class="pools-sidebar__cta">
              <button
                class="pools-sidebar__new-btn"
                :disabled="!canCreate"
                @click="openCreate"
              >
                + New Pool
              </button>
            </div>

            <p v-if="!canCreate" class="pools-sidebar__cap-note">
              You've reached the {{ MAX_POOLS }}-pool limit.
            </p>
          </div>
        </aside>

        <!-- RIGHT: pool cards / leaderboards ──────────────────────────────── -->
        <main class="pools-main">
          <!-- Empty state -->
          <div v-if="poolsReady && pools.length === 0" class="pools-empty">
            <div class="pools-empty__icon">🏆</div>
            <h3 class="pools-empty__title">No pools yet</h3>
            <p class="pools-empty__text">
              Hit <strong>+ New Pool</strong> to get started, then share the
              invite link with your friends &amp; family.
            </p>
            <button
              class="pools-empty__btn"
              :disabled="!canCreate"
              @click="openCreate"
            >
              + New Pool
            </button>
          </div>

          <!-- Pool cards -->
          <div v-else class="pools-list">
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
              @edit-picks="$router.push('/')"
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
      @close="modalOpen = false"
      @submit="onModalSubmit"
      @delete="onModalDelete"
    />

    <!-- Join dialog -->
    <PicksPoolModal
      :open="joinModalOpen"
      mode="join"
      :join-pool-name="linkPoolName"
      :known-name="selfName"
      @close="joinModalOpen = false"
      @submit="onJoinSubmit"
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
    @apply mx-auto max-w-7xl space-y-4 pb-8;
    margin-inline: 1.5rem;
  }

  /* ── Invitee welcome banner ──────────────────────────────────────────────── */
  .pools-welcome {
    @apply rounded-2xl border px-6 py-5;
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
    /* Stick to the top as the right column scrolls */
    position: sticky;
    top: calc(var(--app-header-h, 4.5rem) + 1rem);
  }

  .pools-sidebar__content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.25rem;
  }

  .pools-sidebar__trophy {
    font-size: 1rem;
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
    align-items: center;
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
  }

  .pools-sidebar__new-btn {
    background: #056900;
    color: #ffffff;
    border: none;
    border-radius: 10px;
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

  .pools-sidebar__new-btn:hover:not(:disabled) {
    background: #067a00;
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
    @apply flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center;
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
    background: #056900;
    color: #ffffff;
    border: none;
    border-radius: 10px;
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
    background: #067a00;
  }

  .pools-empty__btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
