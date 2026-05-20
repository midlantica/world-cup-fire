import type { RouterConfig } from '@nuxt/schema'

// #standings, #stats, and #scores are tab identifiers managed via window.history.pushState,
// not real DOM anchors. Returning false for these hashes prevents Vue Router from
// trying (and failing) to find matching elements, which would otherwise log warnings.
const TAB_HASHES = new Set(['standings', 'stats', 'scores'])

export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash && TAB_HASHES.has(to.hash.slice(1))) return false
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
}
