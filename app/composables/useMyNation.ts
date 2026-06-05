import { WC_TEAMS, type WCTeam } from '../constants/worldcup'

const STORAGE_KEY = 'wc-my-nation'
export const STORAGE_ACCENT_KEY = 'wc-my-nation-accent'

export function useMyNation() {
  // Persisted nation name — initialised from localStorage on the client.
  // useState initializer only runs once (server-side it returns null), so we
  // also sync from localStorage in a client-only block after hydration.
  const myNation = useState<string | null>('my-nation', () => null)

  // On the client, restore from localStorage as soon as the composable is
  // first used (runs during component setup, before first render on client).
  if (import.meta.client && myNation.value === null) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) myNation.value = stored
  }

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
