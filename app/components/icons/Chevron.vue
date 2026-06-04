<script setup lang="ts">
  // ── Chevron ───────────────────────────────────────────────────────────────
  // A simple chevron (caret). Points DOWN by default; rotate via CSS on the
  // consumer's class (the component forwards its class through to the <svg>).
  // `strokeWidth` is a prop because call sites use slightly different weights.
  withDefaults(
    defineProps<{
      strokeWidth?: number | string
    }>(),
    {
      strokeWidth: 2.5,
    }
  )
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
</template>
