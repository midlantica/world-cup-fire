<script setup lang="ts">
  // ── PoolModal ─────────────────────────────────────────────────────────────
  // Create / Edit / Join / Share a pool.
  // "share" mode: shown when the owner clicks "Copy Invite Link" but hasn't
  // set a real name yet. They enter their name (≥3 chars) and optionally rename
  // the pool (≥3 chars), then hit "Copy Invite Link" to save + copy in one step.

  import type { Pool } from '../../composables/usePools'

  const props = defineProps<{
    open: boolean
    mode: 'create' | 'edit' | 'join' | 'share'
    /** The pool being edited (edit mode only). */
    pool?: Pool | null
    /**
     * The name of the pool being joined (JOIN mode only). Shown in the copy so
     * the joiner knows which pool they're joining. Carried on the invite link
     * as ?n=. The input itself stays empty — it's for the NEW joiner's name.
     */
    joinPoolName?: string | null
    /**
     * The local user's already-known display name (learned from a pool they
     * already belong to). When present we PRE-FILL the name input in create /
     * join mode so they don't have to retype it every time.
     */
    knownName?: string | null
    /**
     * True when this is the only owned pool — delete is shown but disabled so
     * the user always has at least one pool.
     */
    isLastOwned?: boolean
    /**
     * Optional default pool name to pre-fill in create mode (e.g. "World Cup
     * Fire Pool" for the auto-created first pool). Ignored in edit/join modes.
     */
    defaultPoolName?: string | null
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
    (e: 'submit', value: { yourName: string; poolName: string }): void
    (e: 'delete'): void
  }>()

  const yourName = ref('')
  const poolName = ref('')

  // Seed the inputs whenever the modal opens.
  watch(
    () => props.open,
    (isOpen) => {
      if (!isOpen) return
      // Prefill the name with whatever we already know about this user (from a
      // pool they've already joined/created) so they don't retype it each time.
      const known = props.knownName?.trim() ?? ''
      if (props.mode === 'edit' && props.pool) {
        // Don't pre-fill the placeholder name "You" — show the input empty
        // so the user sees the placeholder and knows they need to set a real name.
        const ownerName =
          props.pool.ownerName === 'You' ? '' : props.pool.ownerName
        yourName.value = ownerName
        poolName.value = props.pool.name
      } else if (props.mode === 'share' && props.pool) {
        // Share: same as edit but the primary action is "Copy Invite Link".
        // Clear the name if it's the placeholder so they must enter a real one.
        const ownerName =
          props.pool.ownerName === 'You' ? '' : props.pool.ownerName
        yourName.value = ownerName
        poolName.value = props.pool.name
      } else if (props.mode === 'join') {
        // The pool they're joining is shown in the copy (joinPoolName); the name
        // input is pre-filled if we already know who they are (else empty).
        yourName.value = known
        poolName.value = props.joinPoolName?.trim() || 'Shared Pool'
      } else {
        // Create: pre-fill the known name and optional default pool name.
        yourName.value = known
        poolName.value = props.defaultPoolName?.trim() || ''
      }
    },
    { immediate: true }
  )

  const title = computed(() => {
    if (props.mode === 'edit') return 'Edit Pool'
    if (props.mode === 'share') return 'Edit Pool'
    if (props.mode === 'join') return 'Join Pool'
    return 'Create Pool'
  })
  const submitLabel = computed(() => {
    if (props.mode === 'edit') return 'Update Pool'
    if (props.mode === 'share') return 'Copy Invite Link'
    if (props.mode === 'join') return 'Join Pool'
    return 'Make Pool'
  })
  const valid = computed(() => {
    if (props.mode === 'join') return yourName.value.trim().length > 0
    // share / edit / create: both name and pool name must be ≥3 chars
    return (
      yourName.value.trim().length >= 3 && poolName.value.trim().length >= 3
    )
  })

  function onSubmit() {
    if (!valid.value) return
    emit('submit', {
      yourName: yourName.value.trim(),
      poolName: poolName.value.trim(),
    })
  }

  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('pool-modal__backdrop')) {
      emit('close')
    }
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="pool-modal">
      <div
        v-if="open"
        class="pool-modal__backdrop modal-backdrop-base"
        @click="onBackdrop"
      >
        <div class="pool-modal modal-panel-base">
          <button
            class="pool-modal__close modal-close-base"
            aria-label="Close"
            @click="emit('close')"
          >
            <IconsClose />
          </button>

          <h2 class="pool-modal__title">{{ title }}</h2>
          <!-- spacer so close button doesn't overlap title -->

          <p v-if="mode === 'create'" class="pool-modal__copy">
            You can share this pool with friends via a link. Send the link to
            friends &amp; family, then they can make picks too! We'll keep a
            leaderboard for you. 🏆
          </p>
          <p v-else-if="mode === 'join'" class="pool-modal__copy">
            You're joining
            <strong class="pool-modal__pool-name">{{ poolName }}</strong
            >. Add your name below, then make your picks. We'll keep a
            leaderboard for everyone. 🏆
          </p>

          <form class="pool-modal__form" @submit.prevent="onSubmit">
            <input
              v-model="yourName"
              class="pool-modal__input"
              type="text"
              placeholder="Enter your name or handle..."
              autocomplete="name"
              maxlength="40"
            />
            <input
              v-if="mode !== 'join'"
              v-model="poolName"
              class="pool-modal__input"
              type="text"
              placeholder="Your Pool name..."
              maxlength="50"
            />

            <div class="pool-modal__actions">
              <button
                v-if="mode === 'edit'"
                type="button"
                class="pool-modal__delete"
                :disabled="isLastOwned"
                :title="
                  isLastOwned ? 'You must keep at least one pool' : undefined
                "
                @click="!isLastOwned && emit('delete')"
              >
                Delete
              </button>
              <div class="pool-modal__actions-right">
                <button
                  type="button"
                  class="pool-modal__cancel"
                  @click="emit('close')"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="pool-modal__submit"
                  :disabled="!valid"
                >
                  {{ submitLabel }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .pool-modal__backdrop {
    /* position/inset/display/justify-content/padding come from modal-backdrop-base */
    z-index: 9200;
    background: oklab(0% 0 0 / 0.82);
    align-items: flex-start;
    overflow-y: auto;
  }

  .pool-modal {
    /* border comes from modal-panel-base (border-bottom is overridden to none
       below via box-shadow:none; this panel is fully square, no bottom accent) */
    position: relative;
    margin-top: 2rem;
    width: 100%;
    max-width: 34rem;
    border-radius: 0;
    background: oklab(0.2149 0.0019 0.0046);
    border: 1px solid oklab(100% 0 0 / 0.1);
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    box-shadow: none;
    padding: 1.25rem 1.25rem 1.5rem;
  }

  @media (min-width: 500px) {
    .pool-modal {
      padding: 2rem 2.25rem 2.15rem;
    }
  }

  .pool-modal__close {
    /* position/background/border/padding/cursor/display/align-items/
       justify-content come from modal-close-base */
    top: 0.75rem;
    right: 0.75rem;
    color: oklab(100% 0 0 / 0.5);
    border-radius: 0;
  }

  .pool-modal__close:hover {
    color: oklab(100% 0 0);
  }

  .pool-modal__close :deep(svg) {
    width: 17px;
    height: 17px;
  }

  .pool-modal__title {
    color: var(--color-white, oklab(1 0 0));
    font-family: 'Anybody', sans-serif;
    font-size: 1.35rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    text-align: left;
    letter-spacing: 0.06rem;
    margin-bottom: 0.3rem;
  }

  .pool-modal__copy {
    @apply mt-3 text-white/70;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 1rem;
    text-align: left;
    line-height: 1.7;
    letter-spacing: 0.08rem;
  }

  .pool-modal__pool-name {
    color: oklab(0.8712 -0.1229 0.0588);
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
  }

  .pool-modal__form {
    margin-top: calc(var(--spacing, 0.25rem) * 3);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .pool-modal__input {
    width: 100%;
    padding: 0.75rem 1.1rem;
    border-radius: 0;
    background: oklab(0.6927 0 0);
    border: none;
    color: oklab(0.1776 0 0);
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    font-size: 1.1rem;
    outline: none;
  }

  .pool-modal__input::placeholder {
    color: oklab(0 0 0 / 0.55);
  }

  .pool-modal__input:focus {
    box-shadow: 0 0 0 2px oklab(0.62 0.13 0.14);
  }

  .pool-modal__actions {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
  }

  @media (min-width: 500px) {
    .pool-modal__actions {
      gap: 0.75rem;
    }
  }

  .pool-modal__actions-right {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: auto;
  }

  @media (min-width: 500px) {
    .pool-modal__actions-right {
      gap: 0.5rem;
    }
  }

  .pool-modal__delete {
    background: oklab(0.5771 0.1911 0.0988);
    color: oklab(1 0 0);
    border: none;
    border-radius: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem 0.45rem;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background-color 0.12s ease,
      opacity 0.12s ease;
  }

  @media (min-width: 500px) {
    .pool-modal__delete {
      font-size: 1rem;
      padding: 0.5rem 1rem 0.45rem;
    }
  }

  .pool-modal__delete:hover:not(:disabled) {
    background: oklab(0.5054 0.1689 0.088);
  }

  .pool-modal__delete:disabled {
    background: oklab(0.4128 0 0);
    color: oklab(1 0 0 / 0.35);
    cursor: not-allowed;
  }

  .pool-modal__cancel {
    background: transparent;
    border: none;
    color: oklab(0.5417 0 0);
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.9rem;
    padding: 0.5rem 0.5rem 0.45rem;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.12s ease;
  }

  @media (min-width: 500px) {
    .pool-modal__cancel {
      font-size: 1.25rem;
      padding: 0.5rem 1.3rem 0.45rem;
    }
  }

  .pool-modal__cancel:hover {
    color: oklab(0.7731 0 0);
  }

  .pool-modal__submit {
    background: oklab(0.62 0.13 0.14);
    color: oklab(1 0 0);
    border: none;
    border-radius: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.9rem;
    padding: 0.5rem 0.75rem 0.45rem;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      opacity 0.15s ease;
  }

  @media (min-width: 500px) {
    .pool-modal__submit {
      font-size: 1.25rem;
      padding: 0.5rem 1.2rem 0.45rem;
    }
  }

  .pool-modal__submit:hover:not(:disabled) {
    background: oklab(0.68 0.14 0.15);
  }

  .pool-modal__submit:disabled {
    background: oklab(0.3485 0 0);
    color: oklab(1 0 0 / 0.3);
    opacity: 1;
    cursor: not-allowed;
  }

  /* ── Transition ───────────────────────────────────────────────────────────── */
  .pool-modal-enter-active,
  .pool-modal-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.22s ease;
  }

  .pool-modal-enter-from,
  .pool-modal-leave-to {
    opacity: 0;
    transform: translateY(1rem);
  }
</style>
