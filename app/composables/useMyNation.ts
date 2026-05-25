import { WC_TEAMS, type WCTeam } from '../constants/worldcup'

const STORAGE_KEY = 'wc-my-nation'

export function useMyNation() {
  // Persisted nation name
  const myNation = useState<string | null>('my-nation', () => {
    if (import.meta.client) {
      return localStorage.getItem(STORAGE_KEY) ?? null
    }
    return null
  })

  const myTeamData = computed<WCTeam | null>(() => {
    if (!myNation.value) return null
    return WC_TEAMS.find((t) => t.name === myNation.value) ?? null
  })

  function setNation(name: string | null) {
    myNation.value = name
    if (import.meta.client) {
      if (name) localStorage.setItem(STORAGE_KEY, name)
      else localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Modal open state
  const modalOpen = useState<boolean>('my-nation-modal', () => false)

  function openModal() {
    modalOpen.value = true
  }
  function closeModal() {
    modalOpen.value = false
  }

  return {
    myNation,
    myTeamData,
    setNation,
    modalOpen,
    openModal,
    closeModal,
    allTeams: WC_TEAMS,
  }
}
