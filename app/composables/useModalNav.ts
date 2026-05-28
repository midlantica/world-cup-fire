/**
 * Shared modal navigation history.
 * Supports back-navigation between GameDetail and CountryDetail modals.
 */
import type { Match } from './useScores'

export type ModalEntry =
  | { type: 'match'; match: Match }
  | { type: 'country'; name: string }

export function useModalNav() {
  // Stack of previously-open modals (most recent last)
  const history = useState<ModalEntry[]>('modal-nav-history', () => [])

  function pushHistory(entry: ModalEntry) {
    history.value = [...history.value, entry]
  }

  function popHistory(): ModalEntry | undefined {
    const stack = [...history.value]
    const entry = stack.pop()
    history.value = stack
    return entry
  }

  function clearHistory() {
    history.value = []
  }

  const canGoBack = computed(() => history.value.length > 0)

  return { history, pushHistory, popHistory, clearHistory, canGoBack }
}
