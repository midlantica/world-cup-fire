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
    // Update URL query param (replace so back button closes modal)
    router.replace({ query: { ...route.query, team: name } })
  }

  function closeCountry() {
    modalOpen.value = false
    // Remove team param from URL
    const query = { ...route.query }
    delete query.team
    router.replace({ query })
  }

  // On mount: open modal if ?team= is in the URL
  if (import.meta.client) {
    onMounted(() => {
      const teamParam = route.query.team as string | undefined
      if (teamParam && TEAM_BY_NAME.has(teamParam)) {
        selectedCountry.value = teamParam
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
