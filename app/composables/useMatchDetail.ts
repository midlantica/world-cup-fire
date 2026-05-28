import type { Match } from './useScores'

export function useMatchDetail() {
  const route = useRoute()
  const router = useRouter()

  const selectedMatch = useState<Match | null>('selected-match', () => null)
  const modalOpen = useState<boolean>('match-modal-open', () => false)

  function openMatch(match: Match) {
    selectedMatch.value = match
    modalOpen.value = true
    // Update URL query param
    router.replace({ query: { ...route.query, match: match.id } })
  }

  function closeMatch() {
    modalOpen.value = false
    // Remove match param from URL
    const query = { ...route.query }
    delete query.match
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
