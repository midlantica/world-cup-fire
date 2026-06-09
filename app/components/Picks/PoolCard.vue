<script setup lang="ts">
  // ── PoolCard ──────────────────────────────────────────────────────────────
  // Renders a single pool in the Group Pools view as a LEADERBOARD (not a copy
  // of every match card — picks are global and shown once under My Picks). The
  // card shows: the pool name, action buttons (copy link / edit / leave), a
  // compact "your picks" summary, and the leaderboard.

  import type { Pool, LeaderRow } from '../../composables/usePools'

  const props = defineProps<{
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
    (e: 'share', pool: Pool): void
    (e: 'delete', pool: Pool): void
    (e: 'leave', pool: Pool): void
    (e: 'edit-picks'): void
    (e: 'rename', pool: Pool): void
    (e: 'delete-member', pool: Pool, memberId: string, name: string): void
    (e: 'sync-device', pool: Pool): void
  }>()

  const copied = ref(false)

  async function copyLink() {
    // If the owner hasn't set a real name yet (≥3 chars), open the share modal
    // so they set their name before the invite link goes out.
    const ownerName = props.pool.ownerName?.trim() ?? ''
    if (props.pool.owned && (ownerName.length < 3 || ownerName === 'You')) {
      emit('share', props.pool)
      return
    }
    try {
      await navigator.clipboard.writeText(props.link)
    } catch {
      // ignore
    }
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  }
</script>

<template>
  <section class="pool-card">
    <!-- Head: pool name -->
    <h3 class="pool-card__name">{{ pool.name }}</h3>

    <!-- Action buttons row -->
    <div class="pool-card__actions">
      <!-- Copy invite link — always shown -->
      <button
        class="pool-card__action-btn pool-card__action-btn--copy"
        :class="{ 'pool-card__action-btn--copied': copied }"
        @click="copyLink"
      >
        {{ copied ? '✓ Link Copied!' : 'Copy Invite Link' }}
      </button>

      <!-- Edit (owner only) -->
      <button
        v-if="pool.owned"
        class="pool-card__action-btn pool-card__action-btn--edit"
        @click="emit('edit', pool)"
      >
        Edit Pool
      </button>

      <!-- Leave (member only) -->
      <button
        v-else
        class="pool-card__action-btn pool-card__action-btn--leave"
        @click="emit('leave', pool)"
      >
        Leave Pool
      </button>
    </div>

    <!-- Your picks summary -->
    <p class="pool-card__summary">
      <strong>{{ picksMade }}</strong> of
      <strong>{{ totalMatches ?? 72 }}</strong> picks made on Group matches —
      <button class="pool-card__check-picks" @click="emit('edit-picks')">
        {{ picksMade === 0 ? 'Make Picks!' : 'Check Picks' }}
      </button>
    </p>

    <!-- Leaderboard -->
    <div class="pool-card__board">
      <PicksLeaderboard
        :rows="leaderRows"
        :is-owner="pool.owned"
        @rename="emit('rename', pool)"
        @delete-member="
          (memberId, name) => emit('delete-member', pool, memberId, name)
        "
      />
    </div>

    <!-- Sync to another device (owner only) — last item in the card -->
    <button
      v-if="pool.owned"
      class="pool-card__sync-btn"
      @click="emit('sync-device', pool)"
    >
      📲 Sync to Another Device
    </button>
  </section>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .pool-card {
    @apply border p-4;
    border-radius: 0;
    border-color: rgb(255 255 255 / 0.08);
    background: rgb(255 255 255 / 0.03);
  }

  .pool-card__name {
    @apply text-white uppercase;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 110,
      'wght' 600;
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    margin: 0 0.2rem 0.4rem;
  }

  /* ── Action buttons ──────────────────────────────────────────────────────── */
  .pool-card__actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .pool-card__action-btn {
    flex: 1;
    border: none;
    border-radius: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.85rem;
    padding: 0.5rem 0.45rem 0.35rem;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;
    white-space: nowrap;
  }

  /* Copy invite link — orange */
  .pool-card__action-btn--copy {
    background: oklab(0.62 0.13 0.14 / 0.8);
    color: rgb(255 255 255 / 0.82);
  }

  .pool-card__action-btn--copy:hover {
    background: oklab(0.68 0.14 0.15);
  }

  /* Copied state — slightly darker orange, no green */
  .pool-card__action-btn--copied {
    background: oklab(0.52 0.13 0.14);
    color: rgb(255 255 255 / 0.9);
  }

  .pool-card__action-btn--copied:hover {
    background: oklab(0.52 0.13 0.14);
  }

  /* Edit pool — orange */
  .pool-card__action-btn--edit {
    background: oklab(0.62 0.13 0.14 / 0.8);
    color: rgb(255 255 255 / 0.82);
  }

  .pool-card__action-btn--edit:hover {
    background: oklab(0.68 0.14 0.15);
  }

  /* Leave pool — muted danger */
  .pool-card__action-btn--leave {
    background: rgb(255 255 255 / 0.08);
    color: rgb(255 255 255 / 0.6);
  }

  .pool-card__action-btn--leave:hover {
    background: #e06464;
    color: #ffffff;
  }

  /* ── Sync to device (last item in card, owner only) ─────────────────────── */
  .pool-card__sync-btn {
    background: none;
    border: 1px solid rgb(255 255 255 / 0.12);
    border-radius: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    font-size: 0.82rem;
    color: rgb(255 255 255 / 0.45);
    padding: 0.55rem 0.7rem;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      color 0.15s ease;
    white-space: nowrap;
    margin: 0.75rem 0 0;
    width: 100%;
  }

  .pool-card__sync-btn:hover {
    border-color: rgb(255 255 255 / 0.3);
    color: rgb(255 255 255 / 0.75);
  }

  /* ── Your picks summary ──────────────────────────────────────────────────── */
  .pool-card__summary {
    margin: 0.8rem 0 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 90,
      'wght' 200;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.7);
    line-height: 1.5;
  }

  .pool-card__summary strong {
    font-variation-settings:
      'wdth' 90,
      'wght' 200;
  }

  .pool-card__check-picks {
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 90,
      'wght' 200;
    font-size: 0.8rem;
    color: #ffffff;
    padding: 0;
    transition: color 0.12s ease;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .pool-card__check-picks:hover {
    color: rgb(255 255 255 / 0.7);
  }

  .pool-card__board {
    margin-top: calc(var(--spacing, 0.25rem) * 3);
  }
</style>
