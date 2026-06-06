<script setup lang="ts">
  // ── PoolModal ─────────────────────────────────────────────────────────────
  // Create / Edit a pool. In "create" mode it shows explanatory copy; in "edit"
  // mode that copy is omitted and the submit button reads "Update Pool".

  import type { Pool } from '../../composables/usePools'

  const props = defineProps<{
    open: boolean
    mode: 'create' | 'edit' | 'join'
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
        yourName.value = props.pool.ownerName
        poolName.value = props.pool.name
      } else if (props.mode === 'join') {
        // The pool they're joining is shown in the copy (joinPoolName); the name
        // input is pre-filled if we already know who they are (else empty).
        yourName.value = known
        poolName.value = props.joinPoolName?.trim() || 'Shared Pool'
      } else {
        // Create: pre-fill the known name, leave the (new) pool name blank.
        yourName.value = known
        poolName.value = ''
      }
    },
    { immediate: true }
  )

  const title = computed(() => {
    if (props.mode === 'edit') return 'Edit Pool'
    if (props.mode === 'join') return 'Join Pool'
    return 'Create Pool'
  })
  const submitLabel = computed(() => {
    if (props.mode === 'edit') return 'Update Pool'
    if (props.mode === 'join') return 'Join Pool'
    return 'Make Pool'
  })
  const valid = computed(() => {
    if (props.mode === 'join') return yourName.value.trim().length > 0
    return yourName.value.trim().length > 0 && poolName.value.trim().length > 0
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
      <div v-if="open" class="pool-modal__backdrop" @click="onBackdrop">
        <div class="pool-modal">
          <button
            class="pool-modal__close"
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
              placeholder="Your name..."
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
    position: fixed;
    inset: 0;
    z-index: 9200;
    background: oklab(0% 0 0 / 0.82);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 1rem;
    overflow-y: auto;
  }

  .pool-modal {
    position: relative;
    margin-top: 4rem;
    width: 100%;
    max-width: 30rem;
    border-radius: 0;
    background: #1b1917;
    border: 1px solid oklab(100% 0 0 / 0.1);
    box-shadow: none;
    padding: 2rem 2.25rem 2.15rem;
  }

  .pool-modal__close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: none;
    border: none;
    color: oklab(100% 0 0 / 0.5);
    padding: 0.35rem;
    border-radius: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pool-modal__close:hover {
    color: oklab(100% 0 0);
  }

  .pool-modal__close :deep(svg) {
    width: 17px;
    height: 17px;
  }

  .pool-modal__title {
    @apply text-white;
    @apply font-anybody-bold;
    font-size: 1.35rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    text-align: left;
  }

  .pool-modal__copy {
    @apply mx-auto mt-3 max-w-sm text-center text-white/70;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .pool-modal__pool-name {
    color: #86efac;
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
    background: #9c9c9c;
    border: none;
    color: #111111;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    font-size: 1.1rem;
    outline: none;
  }

  .pool-modal__input::placeholder {
    color: rgb(0 0 0 / 0.55);
  }

  .pool-modal__input:focus {
    box-shadow: 0 0 0 2px oklab(0.62 0.13 0.14);
  }

  .pool-modal__actions {
    @apply mt-2 flex items-center justify-between gap-3;
  }

  .pool-modal__actions-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
  }

  .pool-modal__delete {
    background: #dc2626;
    color: #ffffff;
    border: none;
    border-radius: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1rem;
    padding: 0.5rem 1rem 0.45rem;
    cursor: pointer;
    transition:
      background-color 0.12s ease,
      opacity 0.12s ease;
  }

  .pool-modal__delete:hover:not(:disabled) {
    background: #b91c1c;
  }

  .pool-modal__delete:disabled {
    background: #4b4b4b;
    color: rgb(255 255 255 / 0.35);
    cursor: not-allowed;
  }

  .pool-modal__cancel {
    background: transparent;
    border: none;
    color: #6f6f6f;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.95rem;
    padding: 0.5rem 1rem 0.45rem;
    cursor: pointer;
    transition: color 0.12s ease;
  }

  .pool-modal__cancel:hover {
    color: #b5b5b5;
  }

  .pool-modal__submit {
    background: oklab(0.62 0.13 0.14);
    color: #ffffff;
    border: none;
    border-radius: 0;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1rem;
    padding: 0.5rem 1rem 0.45rem;
    cursor: pointer;
    transition:
      background-color 0.12s ease,
      opacity 0.12s ease;
  }

  .pool-modal__submit:hover:not(:disabled) {
    background: oklab(0.68 0.14 0.15);
  }

  .pool-modal__submit:disabled {
    opacity: 0.45;
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
