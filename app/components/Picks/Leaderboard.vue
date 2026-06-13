<script setup lang="ts">
  // ── Leaderboard ───────────────────────────────────────────────────────────
  // Ranked list of a pool's members + their scores. The leader (rank 1) row is
  // highlighted. Styled per Figma: header bar #1A1817, body #252120.

  import type { LeaderRow } from '../../composables/usePools'

  defineProps<{
    rows: LeaderRow[]
    /** Kept for API compatibility but no longer gates delete buttons. */
    isOwner?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'rename'): void
    (e: 'delete-member', memberId: string, name: string): void
  }>()

  // ── Confirm modal state ───────────────────────────────────────────────────
  const confirmOpen = ref(false)
  const confirmMemberId = ref('')
  const confirmName = ref('')

  function askDelete(memberId: string, name: string) {
    confirmMemberId.value = memberId
    confirmName.value = name
    confirmOpen.value = true
  }

  function onConfirm() {
    emit('delete-member', confirmMemberId.value, confirmName.value)
    confirmOpen.value = false
  }

  function onCancel() {
    confirmOpen.value = false
  }
</script>

<template>
  <div class="leaderboard">
    <div class="leaderboard__head">LeaderBoard</div>

    <!-- Column header -->
    <div class="leaderboard__cols">
      <span class="leaderboard__col leaderboard__col--rank">#</span>
      <span class="leaderboard__col leaderboard__col--name">Player</span>
      <span class="leaderboard__col leaderboard__col--num" title="Picks made"
        >Picks</span
      >
      <span class="leaderboard__col leaderboard__col--num" title="Correct picks"
        >✓</span
      >
      <span class="leaderboard__col leaderboard__col--num" title="Accuracy %"
        >%</span
      >
    </div>

    <div class="leaderboard__body">
      <div
        v-for="row in rows"
        :key="row.memberId"
        class="leaderboard__row"
        :class="{
          'leaderboard__row--leader':
            row.rank === 1 && (rows[0]?.score ?? 0) > 0,
        }"
      >
        <span class="leaderboard__rank">{{ row.rank }}</span>
        <span class="leaderboard__name">
          <button
            v-if="row.isSelf"
            class="leaderboard__name-btn"
            title="Edit your name"
            @click="emit('rename')"
          >
            {{ row.name }}
          </button>
          <span v-else class="leaderboard__name-text">{{ row.name }}</span>
          <span v-if="row.isSelf" class="leaderboard__you">you</span>
          <!-- Delete button: inline after name, shown for all non-self rows -->
          <button
            v-if="!row.isSelf"
            class="leaderboard__del-btn"
            title="Remove player"
            @click="askDelete(row.memberId, row.name)"
          >
            <IconsClose />
          </button>
        </span>

        <span class="leaderboard__num">{{ row.picksMade }}</span>
        <span class="leaderboard__score">{{ row.score }}</span>
        <span class="leaderboard__num leaderboard__acc">{{
          row.decided > 0 ? Math.round(row.accuracy * 100) + '%' : '—'
        }}</span>
      </div>

      <div v-if="rows.length === 0" class="leaderboard__empty">
        No players yet.
      </div>
    </div>

    <!-- ── Confirm delete modal ── -->
    <Teleport to="body">
      <Transition name="lb-modal">
        <div
          v-if="confirmOpen"
          class="lb-confirm-backdrop"
          @click.self="onCancel"
        >
          <div class="lb-confirm-box" role="dialog" aria-modal="true">
            <p class="lb-confirm-msg">
              Are you sure you want to delete
              <strong>{{ confirmName }}</strong
              >?
            </p>
            <div class="lb-confirm-btns">
              <button
                class="lb-confirm-btn lb-confirm-btn--cancel"
                @click="onCancel"
              >
                Cancel
              </button>
              <button
                class="lb-confirm-btn lb-confirm-btn--yes"
                @click="onConfirm"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .leaderboard {
    border-radius: 0;
    overflow: hidden;
    border: 1px solid #3c3834;
  }

  .leaderboard__head {
    background: #1a1817;
    color: #d1cdcb;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    font-size: 0.875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.55rem 0.85rem;
    border-bottom: 1px solid #3c3834;
  }

  /* Shared row grid: rank | name | ✓ | picks | acc */
  .leaderboard__cols,
  .leaderboard__row {
    display: grid;
    grid-template-columns: 1.25rem minmax(0, 1fr) 2rem 2.5rem 2.75rem;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
  }

  .leaderboard__cols {
    background: rgb(0 0 0 / 0.2);
    border-bottom: 1px solid #3c3834;
  }

  .leaderboard__col {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgb(255 255 255 / 0.75);
  }

  .leaderboard__col--rank {
    text-align: center;
  }

  .leaderboard__col--num {
    text-align: right;
  }

  .leaderboard__col--del {
    width: 1.5rem;
  }

  .leaderboard__body {
    background: #252120;
  }

  .leaderboard__row {
    border-bottom: 1px solid rgb(255 255 255 / 0.04);
  }

  .leaderboard__row:last-child {
    border-bottom: none;
  }

  .leaderboard__rank {
    width: 1.25rem;
    flex-shrink: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.4);
    text-align: center;
  }

  .leaderboard__name {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    overflow: hidden;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 1rem;
    color: rgb(255 255 255 / 0.85);
  }

  /* The plain text name (non-self) sits in a span so it can truncate */
  .leaderboard__name-text {
    @apply truncate;
    min-width: 0;
    flex-shrink: 1;
  }

  /* Clickable self-name button */
  .leaderboard__name-btn {
    @apply truncate;
    min-width: 0;
    flex-shrink: 1;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font-family: inherit;
    font-variation-settings: inherit;
    font-size: inherit;
    color: inherit;
    text-align: left;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: rgb(255 255 255 / 0.35);
    transition: text-decoration-color 0.12s ease;
  }

  .leaderboard__name-btn:hover {
    text-decoration-color: rgb(255 255 255 / 0.85);
  }

  .leaderboard__you {
    @apply ml-1 px-1 align-middle text-xs;
    border-radius: 0;
    background: rgb(255 255 255 / 0.1);
    color: rgb(255 255 255 / 0.55);
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
  }

  .leaderboard__score {
    flex-shrink: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1rem;
    color: rgb(255 255 255 / 0.9);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .leaderboard__num {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.55);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .leaderboard__acc {
    color: rgb(255 255 255 / 0.7);
  }

  /* Leader row highlight */
  .leaderboard__row--leader {
    background: rgb(0 111 13 / 0.14);
  }

  .leaderboard__row--leader .leaderboard__name {
    color: #fff7f7;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
  }

  .leaderboard__row--leader .leaderboard__score {
    color: #fff7f7;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
  }

  .leaderboard__row--leader .leaderboard__rank {
    color: #4ade80;
  }

  .leaderboard__empty {
    padding: 0.85rem;
    text-align: center;
    color: rgb(255 255 255 / 0.4);
    font-size: 0.85rem;
  }

  /* ── Delete button (inline after name) ── */
  .leaderboard__del-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 50%;
    background: #7f1d1d;
    color: #ffffff;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.12s;
    line-height: 0;
    position: relative;
    top: -2px;
  }

  .leaderboard__del-btn :deep(svg) {
    width: 7px;
    height: 7px;
    stroke-width: 2;
  }

  .leaderboard__del-btn:hover {
    background: #991b1b;
  }

  /* ── Confirm modal ── */
  .lb-confirm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgb(0 0 0 / 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .lb-confirm-box {
    background: #1e1a18;
    border: 1px solid #3c3834;
    border-radius: 0.5rem;
    padding: 1.5rem 1.75rem;
    max-width: 22rem;
    width: 100%;
    box-shadow: 0 8px 32px rgb(0 0 0 / 0.5);
  }

  .lb-confirm-msg {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 1rem;
    color: rgb(255 255 255 / 0.85);
    line-height: 1.5;
    margin-bottom: 1.25rem;
  }

  .lb-confirm-msg strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: #ffffff;
  }

  .lb-confirm-btns {
    display: flex;
    gap: 0.65rem;
    justify-content: flex-end;
  }

  .lb-confirm-btn {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.9rem;
    padding: 0.4rem 1.1rem 0.35rem;
    border-radius: 0.25rem;
    border: 1px solid;
    cursor: pointer;
    transition: background 0.12s;
  }

  .lb-confirm-btn--cancel {
    background: rgb(255 255 255 / 0.07);
    border-color: rgb(255 255 255 / 0.15);
    color: rgb(255 255 255 / 0.7);
  }

  .lb-confirm-btn--cancel:hover {
    background: rgb(255 255 255 / 0.12);
  }

  .lb-confirm-btn--yes {
    background: #7f1d1d;
    border-color: #991b1b;
    color: #fca5a5;
  }

  .lb-confirm-btn--yes:hover {
    background: #991b1b;
  }

  /* ── Modal transition ── */
  .lb-modal-enter-active,
  .lb-modal-leave-active {
    transition: opacity 0.15s ease;
  }

  .lb-modal-enter-from,
  .lb-modal-leave-to {
    opacity: 0;
  }
</style>
