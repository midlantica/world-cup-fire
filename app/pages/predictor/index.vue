<script setup lang="ts">
  // Bare /predictor redirects to whichever subnav (Group Stage or My Bracket)
  // is currently in progress, based on the tournament's current stage.
  import { currentStage } from '~/composables/useScores'

  definePageMeta({
    middleware: [
      () =>
        navigateTo(
          currentStage() === 'knockout'
            ? '/predictor/bracket'
            : '/predictor/group'
        ),
    ],
  })
</script>

<template>
  <div />
</template>
