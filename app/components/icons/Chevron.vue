<script setup lang="ts">
  // ── Chevron ───────────────────────────────────────────────────────────────
  // A simple chevron (caret). Points DOWN by default; rotate via CSS on the
  // consumer's class (the component forwards its class through to the <svg>).
  // `strokeWidth`, `strokeLinecap`, and `strokeLinejoin` are props so call
  // sites can tune the look without needing a separate component.
  withDefaults(
    defineProps<{
      strokeWidth?: number | string
      strokeLinecap?: 'round' | 'square' | 'butt'
      strokeLinejoin?: 'round' | 'square' | 'miter'
    }>(),
    {
      strokeWidth: 5,
      strokeLinecap: 'square',
      strokeLinejoin: 'square',
    }
  )
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    :stroke-linecap="strokeLinecap"
    :stroke-linejoin="strokeLinejoin"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
</template>
