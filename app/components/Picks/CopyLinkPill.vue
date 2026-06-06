<script setup lang="ts">
  // ── CopyLinkPill ──────────────────────────────────────────────────────────
  // A button that copies the pool invite URL to the clipboard and briefly
  // shows a "Copied!" confirmation. Icon has a fixed position; the label
  // slides in to the right on hover (or tap on mobile).

  const props = defineProps<{
    url: string
  }>()

  const copied = ref(false)
  const labelVisible = ref(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(props.url)
    } catch {
      // clipboard unavailable — still show feedback
    }
    copied.value = true
    labelVisible.value = true
    setTimeout(() => {
      copied.value = false
      labelVisible.value = false
    }, 1800)
  }

  function showLabel() {
    labelVisible.value = true
  }
  function hideLabel() {
    if (!copied.value) labelVisible.value = false
  }
</script>

<template>
  <button
    class="copy-btn"
    :class="{ 'copy-btn--copied': copied, 'copy-btn--labeled': labelVisible }"
    :title="copied ? 'Link copied!' : 'Copy invite link'"
    :aria-label="copied ? 'Link copied!' : 'Copy invite link'"
    @click.stop="copy"
    @mouseenter="showLabel"
    @mouseleave="hideLabel"
    @focus="showLabel"
    @blur="hideLabel"
  >
    <span class="copy-btn__icon">
      <IconsShareLink v-if="!copied" />
      <IconsCheck v-else />
    </span>
    <span class="copy-btn__label" aria-hidden="true">{{
      copied ? 'Copied!' : 'Copy Invite Link'
    }}</span>
  </button>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .copy-btn {
    display: inline-flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0.1rem 0;
    color: rgb(255 255 255 / 0.7);
    cursor: pointer;
    transition: color 0.12s ease;
    /* gap between icon and label */
    gap: 0.4rem;
  }

  .copy-btn:hover {
    background: none;
    color: #ffffff;
  }

  .copy-btn--copied {
    color: #4ade80;
  }

  .copy-btn--copied:hover {
    color: #4ade80;
  }

  .copy-btn__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.35rem;
    height: 1.35rem;
    flex-shrink: 0;
  }

  /* Label slides in to the right — hidden by default */
  .copy-btn__label {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 75,
      'wght' 200;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    max-width: 0;
    opacity: 0;
    transition:
      max-width 0.22s ease,
      opacity 0.18s ease;
  }

  /* Show label on hover / focus / copied state */
  .copy-btn:hover .copy-btn__label,
  .copy-btn:focus-visible .copy-btn__label,
  .copy-btn--labeled .copy-btn__label {
    max-width: 10rem;
    opacity: 1;
  }
</style>
