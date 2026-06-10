import type { Match } from './useScores'

const LIVE_POLL_INTERVAL_MS = 10_000 // 10 s client-side polling during live matches

// ── Singleton polling state ────────────────────────────────────────────────
// useMatchDetail() is called by multiple components (app.vue, Modal.vue, etc.)
// but they all share the same useState refs. We keep the timer at module level
// so only ONE interval ever runs, regardless of how many components mount.
//
// executeRef always points to the most-recently-mounted instance's execute fn.
// Since useLazyFetch deduplicates by URL+query key, all instances share the
// same underlying fetch state — any execute() call refreshes the shared data.
let liveTimer: ReturnType<typeof setInterval> | null = null
let watcherStopHandle: (() => void) | null = null
let instanceCount = 0
let executeRef: (() => void) | null = null

function stopLivePolling() {
  if (liveTimer) {
    clearInterval(liveTimer)
    liveTimer = null
  }
}

function startLivePolling(modalOpen: Ref<boolean>, isMatchLive: Ref<boolean>) {
  if (liveTimer) return
  liveTimer = setInterval(() => {
    if (modalOpen.value && isMatchLive.value) {
      executeRef?.()
    } else {
      stopLivePolling()
    }
  }, LIVE_POLL_INTERVAL_MS)
}

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

  const { data, pending, error, execute } = useLazyFetch<
    Record<string, unknown>
  >('/api/match-detail', {
    query: computed(() => ({
      eventId: selectedMatch.value?.id ?? '',
    })),
    watch: false,
    immediate: false,
  })

  // Always keep executeRef pointing to the latest instance's execute fn.
  // All instances share the same underlying fetch (same URL+query key),
  // so any one of them can trigger the refresh.
  executeRef = execute

  // Watch the match ID and re-fetch whenever it changes (covers URL-driven opens)
  watch(
    () => selectedMatch.value?.id,
    (id) => {
      if (id) execute()
    }
  )

  // Auto-refresh match detail every 10 s when the modal is open and the match
  // is live or at half-time. Stops automatically when the match ends or closes.
  // The server caches live match-detail for 30 s, so ESPN is hit at most once
  // per 30 s regardless of how many clients are polling.
  //
  // The watcher and timer are module-level singletons — only set up once even
  // though multiple components call useMatchDetail().
  const isMatchLive = computed(() => {
    const code = selectedMatch.value?.status.code
    return code === 'live' || code === 'ht'
  })

  // Only set up timers/watchers on the client — SSR has no setInterval and
  // module-level variables persist across requests on the server, so counting
  // SSR instances would permanently block the client-side singleton guard.
  if (import.meta.client) {
    instanceCount++
    if (instanceCount === 1) {
      // First client instance: set up the singleton watcher
      watcherStopHandle = watch([modalOpen, isMatchLive], ([open, live]) => {
        if (open && live) startLivePolling(modalOpen, isMatchLive)
        else stopLivePolling()
      })
    }

    onUnmounted(() => {
      instanceCount--
      if (instanceCount === 0) {
        // Last client instance unmounted — tear down everything
        stopLivePolling()
        watcherStopHandle?.()
        watcherStopHandle = null
        executeRef = null
      }
    })
  }

  return {
    selectedMatch,
    modalOpen,
    openMatch,
    closeMatch,
    detail: data,
    pending,
    error,
    execute,
  }
}
