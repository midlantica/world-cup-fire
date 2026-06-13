<script setup lang="ts">
  import { useGroupDetail } from '~/composables/useGroupDetail'
  import { useCountryDetail } from '~/composables/useCountryDetail'
  import { useMatchDetail } from '~/composables/useMatchDetail'

  const route = useRoute()
  const router = useRouter()
  const groupLetter = computed(() => String(route.params.id).toUpperCase())

  useHead(
    computed(() => ({
      title: `Group ${groupLetter.value} — World Cup Fire 🔥`,
    }))
  )

  // ── Empty-page fallback ────────────────────────────────────────────────────
  // The /group/:id route renders ONLY modal containers (no standalone page
  // content). If every modal closes while we're still on this route — which can
  // happen after a chain of Match → Team → Group → Team navigations where the
  // history stack gets exhausted, router.back() lands on another /group/ route,
  // or a backdrop click closes the last modal — the user would be stranded on a
  // blank, dark page (with accrued backdrops).
  //
  // Guarantee: we NEVER end on an empty page. Whenever all modals are closed
  // while on a /group/ route, redirect Home (the Matches tab).
  const { groupModalOpen } = useGroupDetail()
  const { modalOpen: countryModalOpen } = useCountryDetail()
  const { modalOpen: matchModalOpen } = useMatchDetail()

  const anyModalOpen = computed(
    () => groupModalOpen.value || countryModalOpen.value || matchModalOpen.value
  )

  if (import.meta.client) {
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null

    function clearFallback() {
      if (fallbackTimer !== null) {
        clearTimeout(fallbackTimer)
        fallbackTimer = null
      }
    }

    // Schedule a redirect Home if, after a brief settle window, we're still on
    // a /group/ route with no modal open. The delay gives any legitimate
    // in-flight transition (closing one modal while opening another, or
    // router.back() landing on a sibling /group/ route that re-opens a modal)
    // time to set a modal-open flag and cancel the fallback.
    function scheduleFallbackCheck() {
      clearFallback()
      if (anyModalOpen.value) return
      if (!route.path.startsWith('/group/')) return
      fallbackTimer = setTimeout(() => {
        fallbackTimer = null
        if (!anyModalOpen.value && route.path.startsWith('/group/')) {
          router.replace('/')
        }
      }, 80)
    }

    // React to BOTH the modal-open state and the route path. Either changing
    // could leave us stranded (e.g. router.back() swaps the path between two
    // /group/ routes without re-opening a modal).
    watch(
      [anyModalOpen, () => route.path],
      ([open]) => {
        if (open) {
          // A modal is open — nothing to fall back from; cancel any pending check.
          clearFallback()
        } else {
          scheduleFallbackCheck()
        }
      },
      { flush: 'post' }
    )

    // Also check once on mount: if we arrive on /group/:id (or land here via
    // router.back) and no modal ends up open, fall back Home.
    onMounted(() => {
      scheduleFallbackCheck()
    })

    onBeforeUnmount(clearFallback)
  }
</script>

<template>
  <div class="group-route">
    <!-- GroupDetailModal opens automatically via useGroupDetail route watcher -->
    <GroupDetailModal />
    <GameDetailModal />
    <FlagModal />
    <CountryDetailModal />
  </div>
</template>

<style scoped>
  .group-route {
    flex: 1;
  }
</style>
