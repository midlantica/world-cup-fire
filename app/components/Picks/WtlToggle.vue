<script setup lang="ts">
  // ── WtlToggle (Win · Tie) ─────────────────────────────────────────────────
  // A SINGLE pick control, anchored to ONE team row, using the exact Figma SVGs.
  //
  // You only ever pick a WINNER (✓) or a TIE (T) — there is no "lose" slot.
  // With only two teams, choosing one to win automatically makes the other the
  // loser, so the losing team shows NOTHING.
  //
  //   • Revealed (hover desktop / click-activate mobile) → the grey picker pops
  //     up IN THIS ROW, every time — even if a pick already exists. The picker
  //     has an integrated caret pointing at this row's team. Slots:
  //       group-stage → ✓ (green) + T (grey);  knockout → ✓ (green) only.
  //     Marks are WHITE.
  //   • Not revealed + a pick exists → the chosen icon for THIS ROW (dark mark):
  //       this row's team WON → ✓ green
  //       it's a TIE          → T grey (shown on BOTH rows)
  //       this row's team LOST → nothing
  //   • Clicking ✓ picks this row's team to win; clicking it again cancels.
  //     Clicking T picks a draw. The outcome is HOME-anchored: 'win' = home
  //     wins, 'tie' = draw, 'lose' = home loses (away wins). The parent maps
  //     these to teams.
  //
  // `perspective` says which row this instance sits on so the left-behind icon
  // and the button→outcome mapping read correctly from that team's point of view.

  type Outcome = 'win' | 'tie' | 'lose'
  type Slot = 'check' | 'tie'

  const props = defineProps<{
    /** Home-anchored pick for this match (or null). */
    outcome: Outcome | null
    /** Which team row this control sits on. Defaults to 'home'. */
    perspective?: 'home' | 'away'
    /** Offer the Tie (draw) slot — group-stage matches only. */
    allowTie?: boolean
    /** Reveal the full picker (hover on desktop / armed on mobile). */
    revealed?: boolean
    /** Read-only: render the chosen leftover icon, no interaction. */
    readonly?: boolean
    /**
     * Which way the revealed picker pops out. Defaults to mirroring the row
     * perspective (home → left, away → right) — correct for the modal header
     * where the two teams sit on opposite sides. In stacked layouts (match
     * cards) both rows live on the left with the time block on the right, so
     * pass `'left'` on both rows to keep the picker from overlapping the time.
     */
    popout?: 'left' | 'right'
    /**
     * Which side the caret points toward (i.e. which side this row's team name
     * sits on, relative to the picker). Defaults to the popout direction, which
     * is correct for stacked layouts (match cards) where the name is on the same
     * side the picker pops toward. In the modal header the name sits on the
     * OPPOSITE side from the empty space the picker pops into, so pass the side
     * the team name is on so the caret points back at it.
     */
    caret?: 'left' | 'right'
    /**
     * Render the "PICK ONE" label outside the grey picker bar, as a sibling
     * element. When true the label floats to the outer side of the toggle
     * (left for pop-left, right for pop-right). Use this in the modal header
     * where the label should sit outside the toggle, not inside the grey bar.
     */
    pickOneOutside?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'pick', outcome: Outcome): void
    (e: 'cancel'): void
  }>()

  const side = computed(() => props.perspective ?? 'home')

  // Visual popout direction. Defaults to mirroring the row perspective
  // (home → left, away → right) but can be forced via the `popout` prop for
  // stacked layouts where both rows should pop the same way.
  const popoutDir = computed<'left' | 'right'>(
    () => props.popout ?? (side.value === 'away' ? 'right' : 'left')
  )

  // Which side the caret points toward (this row's team name). Defaults to the
  // popout direction (correct for stacked layouts where the name sits on the
  // same side the picker pops toward). The modal header passes `caret`
  // explicitly because there the name sits opposite the popout direction.
  const caretDir = computed<'left' | 'right'>(
    () => props.caret ?? popoutDir.value
  )

  const hasPick = computed(() => props.outcome !== null)

  // Show the full picker when revealed and interactive.
  const open = computed(() => !props.readonly && !!props.revealed)

  // Show the semi-transparent placeholder when:
  //   1. No pick yet (not-yet-picked control, not revealed), OR
  //   2. A win is picked but this is the loser row — show the grey placeholder
  //      as a "change pick" tap target instead of a dimmed chip.
  const showPlaceholder = computed(
    () => !props.readonly && !open.value && (!hasPick.value || isLoserRow.value)
  )

  // ── Slot ⇄ home-anchored outcome mapping (per row perspective) ────────────
  // A visual "slot" (check / tie) means a different home-anchored outcome
  // depending on which team's row we sit on. The check on a row always means
  // "this row's team wins".
  function slotToOutcome(slot: Slot): Outcome {
    if (slot === 'tie') return 'tie'
    // check = this row's team wins
    return side.value === 'home' ? 'win' : 'lose'
  }

  // The leftover icon (slot) to show for this row given the home-anchored pick.
  // Winner row → ✓ (check). Draw → T (tie) on BOTH rows.
  // Loser row → null (no chip); the placeholder is shown instead via showPlaceholder.
  const leftoverSlot = computed<Slot | null>(() => {
    const o = props.outcome
    if (o === null) return null
    if (o === 'tie') return 'tie'
    const thisRowWon = side.value === 'home' ? o === 'win' : o === 'lose'
    return thisRowWon ? 'check' : null
  })

  // True when this row is the loser (other team won) — show the grey placeholder
  // as a "change pick" tap target instead of a dimmed chip.
  const isLoserRow = computed(() => {
    const o = props.outcome
    if (o === null || o === 'tie') return false
    return side.value === 'home' ? o !== 'win' : o !== 'lose'
  })

  // Transient "just tapped" key — bumps to retrigger the pop animation on the
  // clicked slot each time, even if the same slot is tapped again.
  const poppedSlot = ref<Slot | null>(null)
  const popKey = ref(0)
  let popTimer: ReturnType<typeof setTimeout> | null = null

  function onSlot(slot: Slot) {
    if (props.readonly) return
    const o = slotToOutcome(slot)

    // Fire the quick pop animation on the tapped slot.
    poppedSlot.value = slot
    popKey.value++
    if (popTimer) clearTimeout(popTimer)
    popTimer = setTimeout(() => {
      poppedSlot.value = null
    }, 340)

    if (props.outcome === o) emit('cancel')
    else emit('pick', o)
  }

  onBeforeUnmount(() => {
    if (popTimer) clearTimeout(popTimer)
  })

  // W (win/check) is always on the RIGHT side of the picker, D (draw/tie) on
  // the LEFT. This is consistent regardless of which team row the picker sits
  // on or which direction it pops out.
  const slots = computed<Slot[]>(() => {
    if (!props.allowTie) return ['check']
    return ['tie', 'check']
  })

  const titleFor: Record<Slot, string> = {
    check: 'Pick to win',
    tie: 'Pick a draw',
  }
</script>

<template>
  <span
    class="wtl"
    :class="{
      'wtl--open': open,
      'wtl--has-pick': hasPick,
      'wtl--pop-right': popoutDir === 'right',
      'wtl--caret-left': caretDir === 'left',
      'wtl--caret-right': caretDir === 'right',
      'wtl--pick-one-outside': pickOneOutside,
    }"
  >
    <!-- OPEN: the exact grey picker bar with integrated caret + coloured slots.
         The caret sits on the side facing this row's team name (`caretDir`) and
         points back at it. In stacked layouts the name is on the same side the
         picker pops toward; in the modal header it's on the opposite side, so
         `caretDir` is decoupled from `popoutDir`. -->
    <span v-if="open" class="wtl__picker">
      <!-- Outside label: always on the side AWAY from the team name (opposite caretDir).
           caretDir points toward the team name, so outside = the other side.
           caretDir=left (team on left) → outside label goes on the RIGHT (after btns).
           caretDir=right (team on right) → outside label goes on the LEFT (before caret+btns). -->

      <!-- Outside label on the LEFT side (caretDir=right → team is on right → outside is left) -->
      <span
        v-if="pickOneOutside && caretDir === 'right'"
        class="wtl__pick-one-outside"
        aria-hidden="true"
      >
        <template v-if="allowTie">
          <span class="wtl__pick-one-text--full">PICK ONE</span>
          <span class="wtl__pick-one-text--short">PICK 1</span>
        </template>
        <template v-else>PICK</template>
      </span>

      <!-- Inside label: only when NOT using outside mode AND caret is left -->
      <span
        v-if="!pickOneOutside && caretDir === 'left'"
        class="wtl__pick-one"
        :class="{ 'wtl__pick-one--knockout': !allowTie }"
        aria-hidden="true"
      >
        <template v-if="allowTie">PICK ONE</template>
        <template v-else
          >PICK<span class="wtl__pick-tri" aria-hidden="true"
        /></template>
      </span>
      <span v-if="caretDir === 'left'" class="wtl__caret" aria-hidden="true" />

      <span class="wtl__btns">
        <button
          v-for="slot in slots"
          :key="slot"
          type="button"
          class="wtl__btn"
          :class="[
            `wtl__btn--${slot}`,
            { 'wtl__btn--pop': poppedSlot === slot },
          ]"
          :title="titleFor[slot]"
          @touchend.prevent.stop="onSlot(slot)"
          @click.stop="onSlot(slot)"
        >
          <IconsPickWin v-if="slot === 'check'" />
          <IconsPickDraw v-else />
        </button>
      </span>
      <span v-if="caretDir === 'right'" class="wtl__caret" aria-hidden="true" />

      <!-- Inside label: only when NOT using outside mode AND caret is right -->
      <span
        v-if="!pickOneOutside && caretDir === 'right'"
        class="wtl__pick-one wtl__pick-one--right"
        aria-hidden="true"
      >
        <template v-if="allowTie">PICK ONE</template>
        <template v-else
          ><span
            class="wtl__pick-tri wtl__pick-tri--left"
            aria-hidden="true"
          />PICK</template
        >
      </span>

      <!-- Outside label on the RIGHT side (caretDir=left → team is on left → outside is right) -->
      <span
        v-if="pickOneOutside && caretDir === 'left'"
        class="wtl__pick-one-outside"
        aria-hidden="true"
      >
        <template v-if="allowTie">
          <span class="wtl__pick-one-text--full">PICK ONE</span>
          <span class="wtl__pick-one-text--short">PICK 1</span>
        </template>
        <template v-else>PICK</template>
      </span>
    </span>

    <!-- CLOSED + a pick exists: the single dark-marked leftover icon for this row -->

    <button
      v-if="!open && hasPick && leftoverSlot"
      type="button"
      class="wtl__chip"
      :class="[
        `wtl__chip--${leftoverSlot}`,
        {
          'wtl__chip--loser':
            leftoverSlot === 'check' &&
            outcome !== null &&
            outcome !== 'tie' &&
            (side === 'home' ? outcome !== 'win' : outcome !== 'lose'),
        },
      ]"
      :title="readonly ? 'Your pick' : 'Change pick'"
      :disabled="readonly"
      @touchend.prevent.stop="readonly ? undefined : onSlot(leftoverSlot)"
      @click.stop="readonly ? null : onSlot(leftoverSlot)"
    >
      <IconsPickWin v-if="leftoverSlot === 'check'" />
      <!-- draw (D) — shown on BOTH rows for a draw -->
      <IconsPickDraw v-else />
    </button>

    <!-- PLACEHOLDER: shown when (a) no pick yet, or (b) a win is picked but
         this is the loser row — acts as a "change pick" tap target.
         When it's the loser row, render as a button so it's tappable. -->
    <button
      v-else-if="showPlaceholder && isLoserRow"
      type="button"
      class="wtl__placeholder wtl__placeholder--btn"
      title="Change pick"
      @touchend.prevent.stop="emit('cancel')"
      @click.stop="emit('cancel')"
    >
      <IconsPickPlaceholder />
    </button>
    <span
      v-else-if="showPlaceholder"
      class="wtl__placeholder"
      aria-hidden="true"
    >
      <IconsPickPlaceholder />
    </span>
  </span>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* Fixed footprint so opening/closing never shifts the surrounding line.
     The slot reserves a constant box (matching the leftover chip) so revealing
     the picker on hover never changes the row height. */
  .wtl {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    width: 1.3rem;
    height: 1.3rem;
  }

  /* ── OPEN picker: grey bar (#424242) with caret + white-marked slots ───────
     Pops out to the LEFT, anchored to the right edge of the slot so it never
     pushes the layout or overlaps the kickoff time. Caret on the LEFT points
     back at this row's team name. */
  .wtl__picker {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    z-index: 5;
  }

  .wtl__caret {
    width: 4px;
    height: 8px;
    flex-shrink: 0;
    background: #424242;
    filter: drop-shadow(0 2px 1px rgb(0 0 0 / 0.5));
  }

  /* Caret pointing LEFT — sits on the picker's LEFT edge (before the btns),
     pointing back at a team name on the left. */
  .wtl--caret-left .wtl__caret {
    margin-right: -1px;
    clip-path: polygon(100% 0, 0 50%, 100% 100%);
  }

  /* Caret pointing RIGHT — sits on the picker's RIGHT edge (after the btns),
     pointing back at a team name on the right. */
  .wtl--caret-right .wtl__caret {
    margin-left: -1px;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }

  /* ── Pop-right variant: anchor the picker to the slot's LEFT edge so it pops
     out to the RIGHT (into empty space) instead of overlapping content on the
     left. Caret direction is controlled independently via `caretDir`. */
  .wtl--pop-right {
    justify-content: flex-start;
  }

  .wtl--pop-right .wtl__picker {
    right: auto;
    left: 0;
  }

  .wtl--pop-right .wtl__btns {
    flex-direction: row-reverse;
  }

  .wtl__btns {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 2px;
    border-radius: 0.2rem;
    background: #424242;
    box-shadow: none;
  }

  .wtl__btn {
    width: 1.3rem;
    height: 1.3rem;

    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.08s ease;
  }

  .wtl__btn:active {
    transform: scale(0.9);
  }

  /* ── Tap "pop" — quick acknowledgement when a slot is chosen ───────────────
     Expands to 115% and wobbles clockwise→counter-clockwise TWICE, then
     settles back to 100% over ~⅓s. Keyed remounting of the SVG retriggers the
     animation on every tap (even re-tapping the same slot). */
  .wtl__btn--pop svg {
    animation: wtl-pop 0.33s ease-out;
    transform-origin: center;
  }

  @keyframes wtl-pop {
    0% {
      transform: scale(1) rotate(0deg);
    }
    20% {
      transform: scale(1.15) rotate(20deg);
    }
    40% {
      transform: scale(1.15) rotate(-20deg);
    }
    60% {
      transform: scale(1.15) rotate(20deg);
    }
    80% {
      transform: scale(1.15) rotate(-20deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .wtl__btn--pop svg {
      animation: none;
    }
  }

  .wtl__btn :deep(svg),
  .wtl__chip :deep(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* ── CLOSED leftover chip: the dark-marked colour box for this row ───────── */

  .wtl__chip {
    position: relative;
    top: -1px;
    width: 1.3rem;
    height: 1.3rem;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .wtl__chip[disabled] {
    cursor: default;
  }

  /* Loser row's "change pick" chip — same checkmark but dimmed so it reads as
     "tap to change" rather than "this is your pick". The winner row's chip
     stays at full opacity as the confirmed selection. */
  .wtl__chip--loser {
    opacity: 0.35;
  }

  .wtl__chip--loser:hover {
    opacity: 0.65;
  }

  /* ── PLACEHOLDER: semi-transparent checkmark hinting where to pick ─────────
     Fills the same 1.3rem footprint as the real chip so it lands in the EXACT
     spot the picked icon will occupy. Pointer events pass through to the team
     row beneath so a hover/tap reveals the live picker as usual. The icon's
     own opacity (0.5) is dialled down a touch more here so it reads clearly as
     a placeholder rather than a real selection. */
  .wtl__placeholder {
    width: 1.3rem;
    height: 1.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    opacity: 0.85;
    transition: opacity 0.15s ease;
  }

  .wtl__placeholder :deep(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* Loser-row placeholder is a button — reset button chrome and enable pointer events. */
  .wtl__placeholder--btn {
    border: none;
    background: transparent;
    cursor: pointer;
    pointer-events: auto;
  }

  /* Brighten slightly when the user hovers the row so the affordance reads as
     "click here". The row's :hover bubbles down to this child. */
  .wtl:hover .wtl__placeholder {
    opacity: 1;
  }

  /* ── "PICK ONE" label — appears to the left of the picker when open ─────────
     Sits inside the picker flex row, before the caret, with a gap separating
     it from the toggle. */
  .wtl__pick-one {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 75,
      'wght' 300;
    font-size: 1rem;
    line-height: 1;
    letter-spacing: 0.13em;
    color: hsl(0deg 0% 74.63%);
    text-align: right;
    white-space: nowrap;
    flex-shrink: 0;
    margin-right: 0.15rem;
    pointer-events: none;
    padding-top: 0.17rem;
  }

  /* Right-side inside label (caret-right variant) */
  .wtl__pick-one--right {
    text-align: left;
    margin-right: 0;
    margin-left: 0.15rem;
  }

  /* ── Knockout "PICK ▶" triangle — tiny right-pointing arrow after "PICK" ───
     Matches the label text color. Sits inline, vertically centered. */
  .wtl__pick-tri {
    display: inline-block;
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 5px solid hsl(0deg 0% 74.63%);
    vertical-align: middle;
    margin-left: 0.2em;
    flex-shrink: 0;
  }

  /* Left-pointing variant (for caret-right / right-side label: "◀ PICK") */
  .wtl__pick-tri--left {
    border-left: none;
    border-right: 5px solid hsl(0deg 0% 74.63%);
    margin-left: 0;
    margin-right: 0.2em;
  }

  /* ── Outside "PICK ONE" label ────────────────────────────────────────────────
     Sits as a flex sibling inside wtl__picker, outside the grey wtl__btns bar.
     For pop-left it appears before the caret+btns (leftmost in the row);
     for pop-right it appears after the caret+btns (rightmost in the row).
     A gap separates it from the grey bar. */
  .wtl__pick-one-outside {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 75,
      'wght' 300;
    font-size: 1rem;
    line-height: 1;
    letter-spacing: 0.13em;
    color: hsl(0deg 0% 74.63%);
    white-space: nowrap;
    flex-shrink: 0;
    pointer-events: none;
    padding-top: 0.17rem;
  }

  /* Pop-left: label is the first child, add gap on its right */
  .wtl--caret-right .wtl__pick-one-outside {
    margin-right: 0.4rem;
  }

  /* Pop-right: label is the last child, add gap on its left */
  .wtl--caret-left .wtl__pick-one-outside {
    margin-left: 0.4rem;
  }

  /* Mobile/short text toggle */
  .wtl__pick-one-text--full {
    display: inline;
  }

  .wtl__pick-one-text--short {
    display: none;
  }

  @media (max-width: 480px) {
    .wtl__pick-one-text--full {
      display: none;
    }

    .wtl__pick-one-text--short {
      display: inline;
    }
  }

  /* ── Pulsing background on Win/Draw buttons when picker first opens ──────────
     A subtle glow-pulse on the button background draws the eye to the
     interactive slots the moment the picker appears. Fades out after ~2s so
     it doesn't become annoying on repeated opens. */
  @keyframes wtl-btn-pulse {
    0% {
      background-color: transparent;
    }
    25% {
      background-color: rgb(255 255 255 / 0.12);
    }
    55% {
      background-color: transparent;
    }
    75% {
      background-color: rgb(255 255 255 / 0.08);
    }
    100% {
      background-color: transparent;
    }
  }

  .wtl--open .wtl__btn {
    animation: wtl-btn-pulse 1.6s ease-out forwards;
    border-radius: 0.15rem;
  }

  /* Stagger the away/second button slightly so they don't pulse in lockstep */
  .wtl--open .wtl__btn:nth-child(2) {
    animation-delay: 0.12s;
  }

  @media (prefers-reduced-motion: reduce) {
    .wtl--open .wtl__btn {
      animation: none;
    }
  }
</style>
