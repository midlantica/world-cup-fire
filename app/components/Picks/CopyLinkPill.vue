<script setup lang="ts">
  // ── CopyLinkPill ──────────────────────────────────────────────────────────
  // A button that copies the pool invite URL to the clipboard and briefly
  // shows a "Copied!" confirmation. Styled as a compact action button
  // (matching Edit/Delete) rather than showing the raw URL.

  const props = defineProps<{
    url: string
  }>()

  const copied = ref(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(props.url)
    } catch {
      // clipboard unavailable — still show feedback
    }
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  }
</script>

<template>
  <button
    class="copy-btn"
    :class="{ 'copy-btn--copied': copied }"
    :title="copied ? 'Link copied!' : 'Copy invite link'"
    @click.stop="copy"
  >
    <span class="copy-btn__icon" aria-hidden="true">
      <IconsCopy v-if="!copied" />
      <IconsCheck v-else />
    </span>
    <span>{{ copied ? 'Copied!' : 'Invite Link' }}</span>
  </button>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
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
    white-space: nowrap;
    transition:
      background-color 0.12s ease,
      color 0.12s ease;
  }

  .copy-btn:hover {
    background: #d4d4d4;
  }

  .copy-btn--copied {
    background: rgb(74 222 128 / 0.2);
    color: #4ade80;
  }

  .copy-btn--copied:hover {
    background: rgb(74 222 128 / 0.28);
  }

  .copy-btn__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.9rem;
    height: 0.9rem;
    flex-shrink: 0;
  }
</style>
