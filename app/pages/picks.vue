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
    title: 'Picks — World Cup Fire 🔥',
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
  // "joined pool" stub so it shows under Pools and collects their picks.
  onMounted(() => {
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

      if (joined) {
        await syncOwnerPicks(picks.value)
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
</script>

<template>
  <div class="picks-page">
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

      <!-- ════════════════ POOLS ════════════════ -->
      <section class="picks-pools">
        <div class="picks-pools__head">
          <div>
            <h2 class="picks-pools__title">Pools</h2>
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

        <!-- Explainer / scope banner -->
        <div class="picks-scope">
          <span class="picks-scope__icon">⚽️</span>
          <span class="picks-scope__text">
            All of your picks count in every pool you're in. Create a pool,
            share the link with friends &amp; family, and compete on a
            leaderboard all tournament long. May the best fan win! 😄
          </span>
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
            @edit-picks="$router.push('/')"
          />
        </div>
      </section>
    </div>

    <!-- Pool create / edit dialog -->
    <PicksPoolModal
      :open="modalOpen"
      :mode="modalMode"
      :pool="editingPool"
      :known-name="selfName"
      @close="modalOpen = false"
      @submit="onModalSubmit"
    />

    <!-- Join dialog (shown to invitees arriving via a ?p= link) -->
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

  /* ── Scope / explainer banner ─────────────────────────────────────────────── */
  .picks-scope {
    @apply flex items-start gap-2.5 rounded-xl px-4 py-3;
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
    margin-top: 0.05rem;
  }

  .picks-scope__text {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 0.9rem;
    color: rgb(255 255 255 / 0.82);
    line-height: 1.5;
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
