<script setup lang="ts">
  // Inline card icon used in the match-detail key-events rows.
  //
  // All three kinds render inside an identical fixed 1em inline-block box whose
  // baseline is pinned once via `vertical-align` on `.card-icon`. The combo
  // ("second-yellow → sent off") draws the red emoji as an ABSOLUTELY positioned
  // overlay so it is out of flow — it can rotate/spill without ever changing the
  // box size or shifting the shared baseline. This is what keeps single yellows,
  // single reds and the combo all sitting on the exact same line.
  defineProps<{
    kind: 'yellow' | 'red' | 'second-yellow'
  }>()

  const labels: Record<string, string> = {
    yellow: 'Yellow card',
    red: 'Red card',
    'second-yellow': 'Second yellow — sent off',
  }
</script>

<template>
  <span
    class="card-icon"
    :class="`card-icon--${kind}`"
    role="img"
    :aria-label="labels[kind]"
    :title="labels[kind]"
  >
    <template v-if="kind === 'second-yellow'">
      <span class="card-icon__glyph">🟨</span>
      <span class="card-icon__glyph card-icon__glyph--over">🟥</span>
    </template>
    <template v-else-if="kind === 'red'">
      <span class="card-icon__glyph">🟥</span>
    </template>
    <template v-else>
      <span class="card-icon__glyph">🟨</span>
    </template>
  </span>
</template>

<style scoped>
  /* Single source of truth for size + baseline — never overridden per-kind.
     The emoji's visible square is driven by FONT-SIZE (the glyph overflows its
     em box), so we set the box to the desired pixel square and size the glyph
     font to fill it. The previous emoji rendered ~16px tall in the events row;
     dropping to a 10px square makes the cards noticeably smaller and keeps them
     inside the surrounding text's baseline-to-highline band. */
  .card-icon {
    display: inline-block;
    position: relative;
    width: 10px;
    height: 10px;
    line-height: 1;
    /* Pin the baseline once. Tune here only. */
    vertical-align: 0.085em;
    /* Let the rotated red spill without clipping; out of flow so no layout shift */
    overflow: visible;
  }

  .card-icon__glyph {
    display: block;
    width: 10px;
    height: 10px;
    /* Font-size drives the emoji's visible square; line-height pins it in box */
    font-size: 10px;
    line-height: 10px;
    /* Override the global span variable-font settings so emoji render normally */
    font-variation-settings: normal;
  }

  /* The combo box is the ONLY kind whose red spills to the right beyond the
     10px box, so it alone needs extra trailing room to keep the following
     event text from sitting too close. Single yellow/red boxes are untouched. */
  .card-icon--second-yellow {
    margin-right: 0.45rem;
  }

  /* The red of the combo: absolutely positioned overlay, out of normal flow so
     it contributes nothing to the box size or baseline. The 4px nudge reveals
     more of the yellow underneath so the "two cards" read is clear at a glance. */
  .card-icon__glyph--over {
    position: absolute;
    inset: 0;
    left: 4px;
    transform: translate(0.18em, 0.04em) rotate(15deg);
    transform-origin: center;
    filter: drop-shadow(-1px 0 1px oklab(0 0 0));
  }
</style>
