// ── Shared context between the Predictor parent layout and its two nested
// route pages (/predictor/group and /predictor/bracket) ──────────────────
//
// The parent `pages/predictor.vue` owns all data-fetching and prediction
// logic (it fetches the schedule once and wraps usePredictions()), then
// `provide()`s this context so the child route pages can `inject()` just
// the pieces they need without re-fetching or duplicating logic.

import type { ComputedRef, InjectionKey } from 'vue'
import type {
  BracketMatch,
  GroupMatch,
  PredictedStandingEntry,
  PredictOutcome,
} from './usePredictions'

export interface PredictorContext {
  matchesByGroup: ComputedRef<Map<string, GroupMatch[]>>
  standingsByGroup: ComputedRef<Map<string, PredictedStandingEntry[]>>
  bracket: ComputedRef<BracketMatch[]>
  getPrediction: (id: string) => PredictOutcome | null
  onGroupPick: (matchId: string, outcome: PredictOutcome) => void
  onBracketPick: (slotId: string, side: 'home' | 'away') => void
  matchKickoffLabel: (date: string | undefined) => string
  matchTimeLabel: (date: string | undefined) => string
}

export const PREDICTOR_CONTEXT_KEY: InjectionKey<PredictorContext> =
  Symbol('predictor-context')
