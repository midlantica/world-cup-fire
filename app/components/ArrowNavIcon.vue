<script setup lang="ts">
  defineProps<{ flipped?: boolean }>()
</script>

<template>
  <svg
    width="20"
    height="19"
    viewBox="0 0 20 19"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :style="flipped ? 'transform: scaleX(-1)' : undefined"
  >
    <path
      d="M9.2955 17.9352L17.875 9.35571L9.5195 1.0001"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M1 9.36719H17.875"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
</template>
