import type { Match } from './useScores'

export function useMatchDetail() {
  const route = useRoute()
  const router = useRouter()

  const selectedMatch = useState<Match | null>('selected-match', () => null)
  const modalOpen = useState<boolean>('match-modal-open', () => false)

  function openMatch(match: Match) {
    selectedMatch.value = match
    modalOpen.value = true
    // Update URL: set match id and mark this modal as active
    router.replace({
      query: { ...route.query, match: match.id, modal: 'match' },
    })
  }

  function closeMatch() {
    modalOpen.value = false
    // Remove match, team, and modal params from URL (full close)
    // If navigating to a country next, openCountry() will re-add team+modal
    const query = { ...route.query }
    delete query.match
    delete query.team
    delete query.modal
    router.replace({ query })
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
