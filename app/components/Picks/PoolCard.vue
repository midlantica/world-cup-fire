<script setup lang="ts">
  // ── PoolCard ──────────────────────────────────────────────────────────────
  // Renders a single pool in the Group Pools view as a LEADERBOARD (not a copy
  // of every match card — picks are global and shown once under My Picks). The
  // card shows: the pool name, a copyable invite link, Edit / Delete (owner) or
  // Leave (joined) actions, a compact "your picks" summary, and the leaderboard.

  import type { Pool, LeaderRow } from '../../composables/usePools'

  defineProps<{
    pool: Pool
    link: string
    leaderRows: LeaderRow[]
    /** The local user's pick summary for this pool. */
    picksMade: number
    picksCorrect: number
    /** Total number of matches in the tournament (for the summary line). */
    totalMatches?: number
  }>()

  const emit = defineEmits<{
    (e: 'edit', pool: Pool): void
    (e: 'delete', pool: Pool): void
    (e: 'leave', pool: Pool): void
    (e: 'edit-picks'): void
  }>()
</script>

<template>
  <section class="pool-card">
    <!-- Head: name + actions -->
    <div class="pool-card__head">
      <h3 class="pool-card__name">
        {{ pool.name }}
      </h3>

      <div class="pool-card__head-right">
        <div class="pool-card__actions">
          <!-- Invite link button — always shown so any member can share -->
          <PicksCopyLinkPill :url="link" />
          <template v-if="pool.owned">
            <button
              class="pool-card__btn pool-card__btn--icon"
              aria-label="Edit pool"
              @click="emit('edit', pool)"
            >
              <IconsEditPencil class="pool-card__edit-icon" />
            </button>
          </template>
          <button
            v-else
            class="pool-card__btn pool-card__btn--danger"
            @click="emit('leave', pool)"
          >
            Leave
          </button>
        </div>
      </div>
    </div>

    <!-- Your picks summary (the same global picks, scored for this pool) -->
    <div class="pool-card__summary">
      <span class="pool-card__summary-text">
        Picks made:
        <strong>{{ picksMade }}</strong>
        of
        <strong>{{ totalMatches ?? 72 }}</strong>
        total matches
      </span>
      <button class="pool-card__edit-picks" @click="emit('edit-picks')">
        Edit picks →
      </button>
    </div>

    <!-- Leaderboard -->
    <div class="pool-card__board">
      <PicksLeaderboard :rows="leaderRows" />
    </div>
  </section>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .pool-card {
    @apply rounded-2xl border p-4;
    border-color: rgb(255 255 255 / 0.08);
    background: rgb(255 255 255 / 0.03);
  }

  .pool-card__head {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  @media (min-width: 40rem) {
    .pool-card__head {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin: 0 0.2rem;
    }
  }

  .pool-card__name {
    @apply text-white uppercase;
    @apply font-anybody-wide;
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .pool-card__head-right {
    @apply flex flex-wrap items-center;
  }

  .pool-card__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.7rem;
  }

  .pool-card__btn {
    background: rgb(255 255 255 / 0.68);
    color: #080808;
    border: none;
    border-radius: 8px;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.8rem;
    padding: 0.3rem 0.7rem 0.25rem;
    cursor: pointer;
    transition:
      background-color 0.12s ease,
      color 0.12s ease;
  }

  .pool-card__btn:hover {
    background: #d4d4d4;
  }

  .pool-card__btn--danger:hover {
    background: #e06464;
    color: #ffffff;
  }

  .pool-card__btn--icon {
    background: none;
    padding: 0.1rem 0.2rem;
    color: rgb(255 255 255 / 0.7);
    transition: color 0.12s ease;
  }

  .pool-card__btn--icon:hover {
    background: none;
    color: #ffffff;
  }

  .pool-card__edit-icon {
    width: 1.85rem;
    height: 1.85rem;
    display: block;
  }

  /* ── Your picks summary ──────────────────────────────────────────────────── */
  .pool-card__summary {
    @apply mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2.5;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.06);
  }

  .pool-card__summary-text {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.7);
  }

  .pool-card__summary-text strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    color: #fff;
  }

  .pool-card__edit-picks {
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.8rem;
    color: #fdba74;
    padding: 0.15rem 0.25rem;
    transition: color 0.12s ease;
  }

  .pool-card__edit-picks:hover {
    color: #fb923c;
    text-decoration: underline;
  }

  .pool-card__board {
    margin-top: calc(var(--spacing, 0.25rem) * 3);
  }
</style>
