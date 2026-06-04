interface GroupDetailState {
  open: boolean
  letter: string | null
}

const state = reactive<GroupDetailState>({
  open: false,
  letter: null,
})

export function useGroupDetail() {
  const router = useRouter()
  const route = useRoute()

  function openGroup(letter: string) {
    const upper = letter.toUpperCase()
    state.letter = upper
    state.open = true
    // Update URL to /group/:letter
    router.push(`/group/${upper.toLowerCase()}`)
  }

  /**
   * Switch the displayed group WITHOUT a router navigation. Vue Router push
   * would remount the /group/[id] page (and the modal), killing any
   * in-progress swipe animation. Instead we update state and sync the URL via
   * history.replaceState so the address bar stays correct but nothing remounts.
   */
  function switchGroup(letter: string) {
    const upper = letter.toUpperCase()
    state.letter = upper
    state.open = true
    if (import.meta.client) {
      window.history.replaceState(
        window.history.state,
        '',
        `/group/${upper.toLowerCase()}`
      )
    }
  }

  /** Close the modal and navigate back if we pushed a /group/ route to open it */
  function closeGroup() {
    state.open = false
    state.letter = null
    if (route.path.startsWith('/group/')) {
      router.back()
    }
  }

  /** Close modal state only — no routing side-effect (used by route watcher) */
  function closeGroupSilent() {
    state.open = false
    state.letter = null
  }

  /** Open modal state only — no routing side-effect (used by route watcher) */
  function openGroupSilent(letter: string) {
    state.letter = letter.toUpperCase()
    state.open = true
  }

  // Restore modal state from route on mount
  if (import.meta.client) {
    onMounted(() => {
      const match = route.path.match(/^\/group\/([a-z])$/i)
      if (match?.[1]) {
        state.letter = match[1].toUpperCase()
        state.open = true
      }
    })
  }

  return {
    groupModalOpen: computed(() => state.open),
    selectedGroupLetter: computed(() => state.letter),
    openGroup,
    switchGroup,
    closeGroup,
    closeGroupSilent,
    openGroupSilent,
  }
}
