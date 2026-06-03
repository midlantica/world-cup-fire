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
  // Only the WINNER (✓) or a TIE (T) is ever shown — the losing row shows null.
  const leftoverSlot = computed<Slot | null>(() => {
    const o = props.outcome
    if (o === null) return null
    if (o === 'tie') return 'tie'
    const thisRowWon = side.value === 'home' ? o === 'win' : o === 'lose'
    return thisRowWon ? 'check' : null
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

  const slots = computed<Slot[]>(() =>
    props.allowTie ? ['check', 'tie'] : ['check']
  )

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
    }"
  >
    <!-- OPEN: the exact grey picker bar with integrated caret + coloured slots.
         The caret sits on the side facing this row's team name (`caretDir`) and
         points back at it. In stacked layouts the name is on the same side the
         picker pops toward; in the modal header it's on the opposite side, so
         `caretDir` is decoupled from `popoutDir`. -->
    <span v-if="open" class="wtl__picker">
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
          @click.stop="onSlot(slot)"
        >
          <svg
            :key="poppedSlot === slot ? popKey : 0"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15.6494 0C16.1874 0 16.6488 0.19178 17.0322 0.575195C17.4155 0.958521 17.607 1.41893 17.6064 1.95605V15.6494C17.6064 16.1874 17.415 16.6488 17.0322 17.0322C16.6495 17.4156 16.188 17.6061 15.6494 17.6055H1.95605C1.41833 17.6054 0.957845 17.4148 0.575195 17.0322C0.192432 16.6495 0.000652067 16.188 0 15.6494V1.95605C5.04213e-05 1.41822 0.191866 0.957898 0.575195 0.575195C0.958535 0.192507 1.41889 0.000727135 1.95605 0H15.6494Z"
              class="wtl__box"
            />
            <!-- check -->
            <path
              v-if="slot === 'check'"
              d="M7.43362 10.1848L5.3307 8.08188C5.15138 7.90256 4.92316 7.8129 4.64603 7.8129C4.3689 7.8129 4.14068 7.90256 3.96136 8.08188C3.78204 8.2612 3.69238 8.48942 3.69238 8.76655C3.69238 9.04368 3.78204 9.2719 3.96136 9.45122L6.74895 12.2388C6.94457 12.4344 7.17279 12.5322 7.43362 12.5322C7.69445 12.5322 7.92267 12.4344 8.11829 12.2388L13.6446 6.71254C13.8239 6.53322 13.9135 6.305 13.9135 6.02787C13.9135 5.75074 13.8239 5.52251 13.6446 5.34319C13.4652 5.16387 13.237 5.07422 12.9599 5.07422C12.6828 5.07422 12.4545 5.16387 12.2752 5.34319L7.43362 10.1848Z"
              class="wtl__mark"
            />
            <!-- tie (T) -->
            <path
              v-else
              d="M4.85303 3.84961C4.57609 3.84971 4.34379 3.94414 4.15674 4.13184C3.96974 4.31959 3.87614 4.55175 3.87549 4.82812C3.87484 5.1045 3.96844 5.33698 4.15674 5.52539C4.34509 5.71374 4.5774 5.80785 4.85303 5.80664H7.82471V12.7783C7.82479 13.0553 7.91922 13.2879 8.10694 13.4756C8.29469 13.6633 8.52685 13.7565 8.80323 13.7559C9.0796 13.7552 9.31208 13.6616 9.50049 13.4746C9.68886 13.2875 9.78296 13.0553 9.78174 12.7783V5.80664H12.7534C13.0304 5.80658 13.263 5.71214 13.4507 5.52441C13.6384 5.33664 13.7316 5.10453 13.731 4.82812C13.7303 4.55172 13.6368 4.31961 13.4497 4.13184C13.2626 3.94411 13.0304 3.84967 12.7534 3.84961H4.85303Z"
              class="wtl__mark"
            />
          </svg>
        </button>
      </span>
      <span v-if="caretDir === 'right'" class="wtl__caret" aria-hidden="true" />
    </span>

    <!-- CLOSED + a pick exists: the single dark-marked leftover icon for this row -->

    <button
      v-else-if="hasPick && leftoverSlot"
      type="button"
      class="wtl__chip"
      :class="`wtl__chip--${leftoverSlot}`"
      :title="readonly ? 'Your pick' : 'Change pick'"
      :disabled="readonly"
      @click.stop="readonly ? null : onSlot(leftoverSlot)"
    >
      <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M15.6494 0C16.1874 0 16.6488 0.19178 17.0322 0.575195C17.4155 0.958521 17.607 1.41893 17.6064 1.95605V15.6494C17.6064 16.1874 17.415 16.6488 17.0322 17.0322C16.6495 17.4156 16.188 17.6061 15.6494 17.6055H1.95605C1.41833 17.6054 0.957845 17.4148 0.575195 17.0322C0.192432 16.6495 0.000652067 16.188 0 15.6494V1.95605C5.04213e-05 1.41822 0.191866 0.957898 0.575195 0.575195C0.958535 0.192507 1.41889 0.000727135 1.95605 0H15.6494Z"
          class="wtl__box"
        />
        <path
          v-if="leftoverSlot === 'check'"
          d="M7.43362 10.1848L5.3307 8.08188C5.15138 7.90256 4.92316 7.8129 4.64603 7.8129C4.3689 7.8129 4.14068 7.90256 3.96136 8.08188C3.78204 8.2612 3.69238 8.48942 3.69238 8.76655C3.69238 9.04368 3.78204 9.2719 3.96136 9.45122L6.74895 12.2388C6.94457 12.4344 7.17279 12.5322 7.43362 12.5322C7.69445 12.5322 7.92267 12.4344 8.11829 12.2388L13.6446 6.71254C13.8239 6.53322 13.9135 6.305 13.9135 6.02787C13.9135 5.75074 13.8239 5.52251 13.6446 5.34319C13.4652 5.16387 13.237 5.07422 12.9599 5.07422C12.6828 5.07422 12.4545 5.16387 12.2752 5.34319L7.43362 10.1848Z"
          class="wtl__mark"
        />
        <!-- tie (T) — shown on BOTH rows for a draw -->
        <path
          v-else
          d="M4.85303 3.84961C4.57609 3.84971 4.34379 3.94414 4.15674 4.13184C3.96974 4.31959 3.87614 4.55175 3.87549 4.82812C3.87484 5.1045 3.96844 5.33698 4.15674 5.52539C4.34509 5.71374 4.5774 5.80785 4.85303 5.80664H7.82471V12.7783C7.82479 13.0553 7.91922 13.2879 8.10694 13.4756C8.29469 13.6633 8.52685 13.7565 8.80323 13.7559C9.0796 13.7552 9.31208 13.6616 9.50049 13.4746C9.68886 13.2875 9.78296 13.0553 9.78174 12.7783V5.80664H12.7534C13.0304 5.80658 13.263 5.71214 13.4507 5.52441C13.6384 5.33664 13.7316 5.10453 13.731 4.82812C13.7303 4.55172 13.6368 4.31961 13.4497 4.13184C13.2626 3.94411 13.0304 3.84967 12.7534 3.84961H4.85303Z"
          class="wtl__mark"
        />
      </svg>
    </button>
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

  .wtl__btns {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 3px;
    border-radius: 4px;
    background: #424242;
    box-shadow: 0 2px 2px 0 rgb(0 0 0 / 0.5);
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
     Expands to 115% with a slight clockwise→counter-clockwise wobble, then
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
    35% {
      transform: scale(1.15) rotate(20deg);
    }
    65% {
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

  .wtl__btn svg,
  .wtl__chip svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* Coloured boxes + WHITE marks (open picker = the vivid, actionable state). */
  .wtl__btn--check .wtl__box {
    fill: #009f13;
  }

  .wtl__btn--tie .wtl__box {
    fill: #666666;
  }

  .wtl__btn .wtl__mark {
    fill: #ffffff;
  }

  /* ── CLOSED leftover chip: the dark-marked colour box for this row ───────── */

  .wtl__chip {
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

  .wtl__chip--check .wtl__box {
    fill: #009f13;
  }

  .wtl__chip--tie .wtl__box {
    fill: #666666;
  }

  /* Dark marks (#272727) on the leftover icons, per the supplied SVGs. */

  .wtl__chip .wtl__mark {
    fill: #272727;
  }
</style>
