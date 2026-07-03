<script setup lang="ts">
  import { PREDICTOR_CONTEXT_KEY } from '~/composables/usePredictorContext'

  const ctx = inject(PREDICTOR_CONTEXT_KEY)
  if (!ctx) {
    throw new Error(
      'PredictorBracketPage must be rendered inside pages/predictor.vue'
    )
  }
  const { bracket, getPrediction, onBracketPick } = ctx
</script>

<template>
  <div class="predictor-page__content predictor-page__content--bracket">
    <PredictorBracket
      :bracket="bracket"
      :get-prediction="getPrediction"
      @pick="onBracketPick"
    />
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .predictor-page__content--bracket {
    @apply max-w-full px-0 py-0;
  }
</style>
