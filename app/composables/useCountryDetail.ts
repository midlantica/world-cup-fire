import { WC_TEAMS, TEAM_BY_NAME, espnLogoUrl } from '../constants/worldcup'
import type { WCTeam } from '../constants/worldcup'

export function useCountryDetail() {
  const route = useRoute()
  const router = useRouter()

  // The country name currently being viewed in the modal
  const selectedCountry = useState<string | null>(
    'country-detail-name',
    () => null
  )
  const modalOpen = useState<boolean>('country-detail-open', () => false)

  const countryData = computed<WCTeam | null>(() => {
    if (!selectedCountry.value) return null
    return TEAM_BY_NAME.get(selectedCountry.value) ?? null
  })

  function openCountry(name: string) {
    selectedCountry.value = name
    modalOpen.value = true
    // Update URL: set team name and mark this modal as active
    router.replace({ query: { ...route.query, team: name, modal: 'team' } })
  }

  /**
   * Close the country modal.
   * Pass `silent: true` when immediately navigating to another modal —
   * the next openMatch/openCountry call will update the URL correctly,
   * keeping ?team= in the URL for back-navigation context.
   */
  function closeCountry({ silent = false }: { silent?: boolean } = {}) {
    modalOpen.value = false
    if (!silent) {
      // Full close: remove team param and modal marker from URL
      const query = { ...route.query }
      delete query.team
      delete query.modal
      router.replace({ query })
    }
  }

  // On mount: open modal if ?team= is in the URL AND it is the active modal
  // (i.e. modal=team, or no modal param and no match param)
  if (import.meta.client) {
    onMounted(() => {
      const teamParam = route.query.team as string | undefined
      const modalParam = route.query.modal as string | undefined
      const matchParam = route.query.match as string | undefined
      // Only restore the country modal if it was the top modal on last visit
      const shouldOpen =
        teamParam &&
        TEAM_BY_NAME.has(teamParam) &&
        (modalParam === 'team' || (!modalParam && !matchParam))
      if (shouldOpen) {
        selectedCountry.value = teamParam!
        modalOpen.value = true
      }
    })
  }

  return {
    selectedCountry,
    countryData,
    modalOpen,
    openCountry,
    closeCountry,
    espnLogoUrl,
    allTeams: WC_TEAMS,
  }
}
