<script setup lang="ts">
  // ── EditNameModal ─────────────────────────────────────────────────────────
  // Minimal modal: just "Edit Name" title, one name input, Cancel + Update Name.

  const props = defineProps<{
    open: boolean
    currentName?: string | null
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
    (e: 'submit', name: string): void
  }>()

  useModalKeyboard(
    () => props.open,
    () => emit('close')
  )

  const name = ref('')

  watch(
    () => props.open,
    (isOpen) => {
      if (!isOpen) return
      const n = props.currentName?.trim() ?? ''
      name.value = n === 'You' ? '' : n
    },
    { immediate: true }
  )

  const valid = computed(() => name.value.trim().length >= 1)

  function onSubmit() {
    if (!valid.value) return
    emit('submit', name.value.trim())
  }

  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('en-modal__backdrop')) {
      emit('close')
    }
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="en-modal">
      <div
        v-if="open"
        class="en-modal__backdrop modal-backdrop-base"
        @click="onBackdrop"
      >
        <div class="en-modal modal-panel-base">
          <button
            class="en-modal__close modal-close-base"
            aria-label="Close"
            @click="emit('close')"
          >
            <IconsClose />
          </button>

          <h2 class="en-modal__title">Edit Name</h2>

          <form class="en-modal__form" @submit.prevent="onSubmit">
            <input
              v-model="name"
              class="en-modal__input"
              type="text"
              placeholder="Your name or handle..."
              autocomplete="name"
              maxlength="40"
              autofocus
            />

            <div class="en-modal__actions">
              <button
                type="button"
                class="en-modal__cancel"
                @click="emit('close')"
              >
                Cancel
              </button>
              <button type="submit" class="en-modal__submit" :disabled="!valid">
                Update Name
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

  .en-modal__backdrop {
    /* position/inset/display/justify-content/padding come from modal-backdrop-base */
    z-index: 9300;
    background: oklab(0% 0 0 / 0.82);
    align-items: flex-start;
    overflow-y: auto;
  }

  .en-modal {
    /* border comes from modal-panel-base (this panel has no border-bottom accent) */
    position: relative;
    margin-top: 2rem;
    width: 100%;
    max-width: 34rem;
    background: oklab(0.2149 0.0019 0.0046);
    border: 1px solid oklab(100% 0 0 / 0.1);
    border-bottom: 1px solid oklab(100% 0 0 / 0.1);
    padding: 2rem 2.25rem 2.15rem;
  }

  .en-modal__close {
    /* position/background/border/padding/cursor/display/align-items/
       justify-content come from modal-close-base */
    top: 0.75rem;
    right: 0.75rem;
    color: oklab(100% 0 0 / 0.5);
  }

  .en-modal__close:hover {
    color: oklab(100% 0 0);
  }

  .en-modal__close :deep(svg) {
    width: 17px;
    height: 17px;
  }

  .en-modal__title {
    color: oklab(1 0 0);
    font-family: 'Anybody', sans-serif;
    font-size: 1.35rem;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    letter-spacing: 0.06rem;
    margin-bottom: 0.3rem;
  }

  .en-modal__form {
    margin-top: calc(var(--spacing, 0.25rem) * 3);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .en-modal__input {
    width: 100%;
    padding: 0.75rem 1.1rem;
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

  .en-modal__input::placeholder {
    color: oklab(0 0 0 / 0.55);
  }

  .en-modal__input:focus {
    box-shadow: 0 0 0 2px oklab(0.62 0.13 0.14);
  }

  .en-modal__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .en-modal__cancel {
    background: transparent;
    border: none;
    color: oklab(0.5417 0 0);
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1.25rem;
    padding: 0.5rem 1.3rem 0.45rem;
    cursor: pointer;
    transition: color 0.12s ease;
  }

  .en-modal__cancel:hover {
    color: oklab(0.7731 0 0);
  }

  .en-modal__submit {
    background: oklab(0.62 0.13 0.14);
    color: oklab(1 0 0);
    border: none;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1.25rem;
    padding: 0.5rem 1.2rem 0.45rem;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      opacity 0.15s ease;
  }

  .en-modal__submit:hover:not(:disabled) {
    background: oklab(0.68 0.14 0.15);
  }

  .en-modal__submit:disabled {
    background: oklab(0.3485 0 0);
    color: oklab(1 0 0 / 0.3);
    cursor: not-allowed;
  }

  /* Transition */
  .en-modal-enter-active,
  .en-modal-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.22s ease;
  }

  .en-modal-enter-from,
  .en-modal-leave-to {
    opacity: 0;
    transform: translateY(1rem);
  }
</style>
