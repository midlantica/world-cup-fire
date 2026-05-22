<script setup lang="ts">
  const route = useRoute()

  // Track SPA route changes for analytics.
  // We fire-and-forget a POST to /api/analytics/pageview so the server can
  // record which client-side routes (scores, standings, stats, team, game)
  // are actually being visited — the server middleware only ever sees '/'.
  function trackPageview(path: string) {
    // Use sendBeacon when available (non-blocking, survives page unload)
    const url = '/api/analytics/pageview'
    const body = JSON.stringify({ path })
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  }

  // Track SPA navigations only — skip the initial '/' load since the server
  // middleware already records that request. We only want to capture the
  // client-side route changes that the server never sees.
  let initialLoad = true

  onMounted(() => {
    // If the user landed directly on a non-root path (e.g. /standings),
    // the server middleware recorded '/' (the SSR entry), not the actual path.
    // So we track it here too.
    if (route.path !== '/') {
      trackPageview(route.path)
    }
    initialLoad = false
  })

  // Track subsequent navigations
  watch(
    () => route.path,
    (path) => {
      if (initialLoad) return
      trackPageview(path)
    }
  )
</script>

<template>
  <div class="min-h-screen text-gray-100">
    <NuxtPage />
  </div>
</template>
