// composables/useAnalytics.ts
// Thin wrapper around the analytics pageview POST.
// Used by app.vue (route watcher) and index.vue (modal opens).
//
// Session ID: a random UUID stored in sessionStorage (cleared when the tab
// closes). This gives the server a 1-session-per-tab-visit signal without
// any cookies or persistent tracking.

function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr'
  const key = 'wc-session-id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = globalThis.crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

export function useAnalytics() {
  function trackPageview(path: string) {
    // Strip query strings — we only care about the path, not the specific game/team
    const cleanPath = path.split('?')[0] || '/'
    const url = '/api/analytics/pageview'
    const body = JSON.stringify({ path: cleanPath, sessionId: getSessionId() })
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

  return { trackPageview }
}
