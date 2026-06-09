<script setup lang="ts">
  defineProps<{ open: boolean }>()
  const emit = defineEmits<{ (e: 'close'): void }>()

  type FormState = 'idle' | 'submitting' | 'success' | 'error'

  const state = ref<FormState>('idle')
  const name = ref('')
  const email = ref('')
  const message = ref('')

  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      handleClose()
    }
  }

  function handleClose() {
    emit('close')
    // Reset after transition
    setTimeout(() => {
      state.value = 'idle'
      name.value = ''
      email.value = ''
      message.value = ''
    }, 250)
  }

  async function handleSubmit() {
    state.value = 'submitting'
    try {
      const body = new URLSearchParams({
        'form-name': 'contact',
        name: name.value,
        email: email.value,
        message: message.value,
      })
      const res = await fetch('/netlify-forms.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      if (res.ok) {
        state.value = 'success'
      } else {
        state.value = 'error'
      }
    } catch {
      state.value = 'error'
    }
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click="onBackdrop">
        <div
          class="modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-title"
        >
          <!-- Header -->
          <div class="modal-header">
            <h2 id="contact-title" class="modal-title">✉️ Contact</h2>
            <button class="modal-close" aria-label="Close" @click="handleClose">
              ✕
            </button>
          </div>

          <!-- Success state -->
          <div v-if="state === 'success'" class="modal-success">
            <span class="modal-success__icon">🎉</span>
            <p class="modal-success__msg">Thanks! Message received.</p>
            <button class="btn-secondary" @click="handleClose">Close</button>
          </div>

          <!-- Form -->
          <form
            v-else
            name="contact"
            netlify
            netlify-honeypot="bot-field"
            class="modal-form"
            @submit.prevent="handleSubmit"
          >
            <!-- Honeypot (hidden from humans) -->
            <input type="hidden" name="form-name" value="contact" />
            <p class="hidden">
              <label>Don't fill this out: <input name="bot-field" /></label>
            </p>

            <div class="form-field">
              <label class="form-label" for="contact-name">Name</label>
              <input
                id="contact-name"
                v-model="name"
                type="text"
                name="name"
                class="form-input"
                placeholder="Your name"
                required
                autocomplete="name"
              />
            </div>

            <div class="form-field">
              <label class="form-label" for="contact-email">Email</label>
              <input
                id="contact-email"
                v-model="email"
                type="email"
                name="email"
                class="form-input"
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="form-field">
              <label class="form-label" for="contact-message">Message</label>
              <textarea
                id="contact-message"
                v-model="message"
                name="message"
                class="form-input form-textarea"
                placeholder="Say hello…"
                rows="5"
                required
              />
            </div>

            <p v-if="state === 'error'" class="form-error">
              Something went wrong — please try again.
            </p>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="handleClose">
                Cancel
              </button>
              <button
                type="submit"
                class="btn-primary"
                :disabled="state === 'submitting'"
              >
                {{ state === 'submitting' ? 'Sending…' : 'Submit' }}
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

  .hidden {
    display: none;
  }

  .modal-backdrop {
    @apply fixed inset-0 z-50 bg-black/70 backdrop-blur-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .modal-panel {
    @apply flex w-full max-w-md flex-col bg-zinc-900;
    max-height: min(92vh, 92dvh);
  }

  .modal-header {
    @apply flex items-center justify-between border-b border-white/10;
    padding: 0.6rem 0.6rem 0.3rem 1.3rem;
  }

  .modal-title {
    @apply text-lg font-bold text-white;
  }

  .modal-close {
    @apply rounded-none p-1.5 text-white/50 transition-colors hover:text-white;
  }

  /* Form */
  .modal-form {
    @apply flex flex-col gap-4 overflow-y-auto p-5;
  }

  .form-field {
    @apply flex flex-col gap-1.5;
  }

  .form-label {
    @apply text-sm font-medium text-white/70;
  }

  .form-input {
    @apply w-full rounded-none border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 transition-colors outline-none;
    &:focus {
      @apply border-white/30 bg-white/8;
    }
  }

  .form-textarea {
    resize: vertical;
    min-height: 7rem;
  }

  .form-error {
    @apply rounded-none bg-red-900/40 px-3 py-2 text-sm text-red-300;
  }

  .modal-actions {
    @apply flex justify-end gap-3 pt-1;
  }

  .btn-secondary {
    @apply rounded-none px-4 py-2 text-sm font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white;
  }

  .btn-primary {
    @apply rounded-none bg-orange-600 px-5 py-2 text-base font-bold text-white transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    letter-spacing: 0.07rem;
  }

  /* Success */
  .modal-success {
    @apply flex flex-col items-center gap-4 p-8 text-center;
  }

  .modal-success__icon {
    font-size: 2.5rem;
  }

  .modal-success__msg {
    @apply text-base font-medium text-white;
  }

  /* Transition */
  .modal-enter-active,
  .modal-leave-active {
    @apply transition-all duration-200;
  }

  .modal-enter-from,
  .modal-leave-to {
    @apply opacity-0;
  }

  .modal-enter-from .modal-panel,
  .modal-leave-to .modal-panel {
    @apply translate-y-4 scale-95;
  }
</style>
