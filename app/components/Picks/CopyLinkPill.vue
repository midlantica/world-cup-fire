<script setup lang="ts">
  // ── CopyLinkPill ──────────────────────────────────────────────────────────
  // A clickable pool-URL pill. Clicking copies the URL to the clipboard and
  // flips the label to "URL copied ✓" for ~1.8s. Styled per Figma:
  // bg #212121, stroke rgba(150,150,150,0.5), r20, underlined URL #D4D4D4, with
  // a trailing copy icon.

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
    class="copy-pill"
    :class="{ 'copy-pill--copied': copied }"
    :title="copied ? 'URL copied!' : 'Copy pool link'"
    @click.stop="copy"
  >
    <span class="copy-pill__text">{{ copied ? 'URL copied' : url }}</span>
    <span class="copy-pill__icon" aria-hidden="true">
      <IconsCopy v-if="!copied" />
      <IconsCheck v-else />
    </span>
  </button>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .copy-pill {
    @apply inline-flex items-center gap-2;
    max-width: 20rem;
    padding: 0.4rem 0.85rem;
    border-radius: 20px;
    background: #212121;
    border: none;
    cursor: pointer;
    transition: background-color 0.12s ease;
  }

  .copy-pill:hover {
    background: #2a2a2a;
  }

  .copy-pill__text {
    @apply truncate underline;
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 500;
    font-size: 0.8rem;
    color: #d4d4d4;
    text-underline-offset: 2px;
  }

  .copy-pill__icon {
    @apply flex shrink-0 items-center justify-center;
    width: 1.05rem;
    height: 1.05rem;
    color: rgb(212 212 212 / 0.85);
  }

  .copy-pill--copied .copy-pill__text {
    color: #4ade80;
    text-decoration: none;
  }

  .copy-pill--copied .copy-pill__icon {
    color: #4ade80;
  }
</style>
