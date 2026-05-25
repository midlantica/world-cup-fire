import type { Match } from './useScores'

export function useMatchDetail() {
  const selectedMatch = useState<Match | null>('selected-match', () => null)
  const modalOpen = useState<boolean>('match-modal-open', () => false)

  function openMatch(match: Match) {
    selectedMatch.value = match
    modalOpen.value = true
  }

  function closeMatch() {
    modalOpen.value = false
    // Keep selectedMatch so modal can animate out
  }

  const { data, pending, error } = useLazyFetch<Record<string, unknown>>(
    '/api/match-detail',
    {
      query: computed(() => ({
        eventId: selectedMatch.value?.id ?? '',
      })),
      watch: [selectedMatch],
      immediate: false,
    }
  )

  return {
    selectedMatch,
    modalOpen,
    openMatch,
    closeMatch,
    detail: data,
    pending,
    error,
  }
}
