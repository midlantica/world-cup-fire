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
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
    (e: 'submit', value: { yourName: string; poolName: string }): void
  }>()

  const yourName = ref('')
  const poolName = ref('')

  // Seed the inputs whenever the modal opens.
  watch(
    () => props.open,
    (isOpen) => {
      if (!isOpen) return
      if (props.mode === 'edit' && props.pool) {
        yourName.value = props.pool.ownerName
        poolName.value = props.pool.name
      } else if (props.mode === 'join') {
        // The input is for the NEW joiner's name — always start empty. The pool
        // they're joining is shown in the copy (joinPoolName), not pre-filled.
        yourName.value = ''
        poolName.value = props.joinPoolName?.trim() || 'Shared Pool'
      } else {
        yourName.value = ''
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
    border-radius: 1rem;
    background: #1b1917;
    border: 1px solid oklab(100% 0 0 / 0.1);
    box-shadow: 0 8px 32px oklab(0% 0 0 / 1);
    padding: 1.75rem 1.5rem 1.5rem;
  }

  .pool-modal__close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: none;
    border: none;
    color: oklab(100% 0 0 / 0.5);
    padding: 0.35rem;
    border-radius: 0.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pool-modal__close:hover {
    color: oklab(100% 0 0);
  }

  .pool-modal__close :deep(svg) {
    width: 14px;
    height: 14px;
  }

  .pool-modal__title {
    @apply text-center text-white;
    @apply font-anybody-bold;
    font-size: 1.35rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
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
    @apply mt-5 flex flex-col gap-3;
  }

  .pool-modal__input {
    width: 100%;
    padding: 0.75rem 1.1rem;
    border-radius: 30px;
    background: #9c9c9c;
    border: none;
    color: #111111;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    font-size: 0.95rem;
    outline: none;
  }

  .pool-modal__input::placeholder {
    color: rgb(0 0 0 / 0.55);
  }

  .pool-modal__input:focus {
    box-shadow: 0 0 0 2px #056900;
  }

  .pool-modal__actions {
    @apply mt-2 flex items-center justify-end gap-3;
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
    padding: 0.6rem 1rem;
    cursor: pointer;
    transition: color 0.12s ease;
  }

  .pool-modal__cancel:hover {
    color: #b5b5b5;
  }

  .pool-modal__submit {
    background: #056900;
    color: #ffffff;
    border: none;
    border-radius: 12px;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1rem;
    padding: 0.65rem 1.4rem;
    cursor: pointer;
    transition:
      background-color 0.12s ease,
      opacity 0.12s ease;
  }

  .pool-modal__submit:hover:not(:disabled) {
    background: #067a00;
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
