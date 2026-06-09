<script setup lang="ts">
  // ── SyncDeviceModal ───────────────────────────────────────────────────────
  // Shown when the owner clicks "Sync to Another Device".
  // Displays a QR-friendly link + copy button so the owner can open it on
  // their phone/tablet and have all their picks appear instantly.

  const props = defineProps<{
    open: boolean
    syncUrl: string
  }>()

  const emit = defineEmits<{
    (e: 'close'): void
  }>()

  const copied = ref(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(props.syncUrl)
    } catch {
      // ignore
    }
    copied.value = true
    setTimeout(() => (copied.value = false), 2200)
  }

  function onBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('sync-modal__backdrop')) {
      emit('close')
    }
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="sync-modal">
      <div v-if="open" class="sync-modal__backdrop" @click="onBackdrop">
        <div class="sync-modal">
          <button
            class="sync-modal__close"
            aria-label="Close"
            @click="emit('close')"
          >
            <IconsClose />
          </button>

          <div class="sync-modal__header">
            <div class="sync-modal__icon"><IconsSync /></div>
            <h2 class="sync-modal__title">Sync to Another Device</h2>
          </div>

          <p class="sync-modal__copy">
            Open this link on your phone, tablet, or any other browser and
            <strong>all your picks will appear automatically</strong> — no
            sign-in needed.
          </p>

          <p class="sync-modal__warning">
            ⚠️ Keep this link private — it gives full owner access to your pool.
          </p>

          <div class="sync-modal__url-row">
            <span class="sync-modal__url">{{ syncUrl }}</span>
          </div>

          <button
            class="sync-modal__copy-btn"
            :class="{ 'sync-modal__copy-btn--copied': copied }"
            @click="copy"
          >
            {{ copied ? '✓ Copied!' : 'Copy Sync Link' }}
          </button>

          <p class="sync-modal__note">
            The link works once per device. After syncing, your picks stay in
            sync automatically through your pool.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .sync-modal__backdrop {
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

  .sync-modal {
    position: relative;
    margin-top: 4rem;
    width: 100%;
    max-width: 34rem;
    background: #1b1917;
    border: 1px solid oklab(100% 0 0 / 0.1);
    padding: 2rem 2.25rem 2.15rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .sync-modal__close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    color: oklab(100% 0 0 / 0.5);
    padding: 0.35rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sync-modal__close:hover {
    color: oklab(100% 0 0);
  }

  .sync-modal__close :deep(svg) {
    width: 17px;
    height: 17px;
  }

  .sync-modal__header {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .sync-modal__icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .sync-modal__icon :deep(svg) {
    width: 1.4rem;
    height: 1.4rem;
    color: rgb(255 255 255 / 0.6);
  }

  .sync-modal__title {
    color: #ffffff;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 1.25rem;
    letter-spacing: 0.06rem;
    margin: 0;
  }

  .sync-modal__copy {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 1rem;
    color: rgb(255 255 255 / 0.75);
    line-height: 1.65;
    letter-spacing: 0.06rem;
    margin: 0;
  }

  .sync-modal__copy strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    color: #ffffff;
  }

  .sync-modal__warning {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 0.82rem;
    color: rgb(251 146 60 / 0.9);
    line-height: 1.5;
    margin: 0;
  }

  .sync-modal__url-row {
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.1);
    padding: 0.65rem 0.9rem;
    overflow: hidden;
  }

  .sync-modal__url {
    font-family: 'Courier New', monospace;
    font-size: 0.72rem;
    color: rgb(255 255 255 / 0.55);
    word-break: break-all;
    display: block;
  }

  .sync-modal__copy-btn {
    background: oklab(0.54 0.12 0.12);
    color: #ffffff;
    border: none;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 1rem;
    padding: 0.6rem 1rem 0.5rem;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;
    align-self: flex-start;
    width: 100%;
  }

  .sync-modal__copy-btn:hover {
    background: oklab(0.62 0.13 0.14);
  }

  .sync-modal__copy-btn--copied {
    background: #16a34a;
    color: #ffffff;
  }

  .sync-modal__copy-btn--copied:hover {
    background: #15803d;
  }

  .sync-modal__note {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 300;
    font-size: 0.78rem;
    color: rgb(255 255 255 / 0.35);
    line-height: 1.5;
    margin: 0;
  }

  /* ── Transition ───────────────────────────────────────────────────────────── */
  .sync-modal-enter-active,
  .sync-modal-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.22s ease;
  }

  .sync-modal-enter-from,
  .sync-modal-leave-to {
    opacity: 0;
    transform: translateY(1rem);
  }
</style>
