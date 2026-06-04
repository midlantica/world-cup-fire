import type { RouterConfig } from '@nuxt/schema'

// fallow-ignore-file unused-file
export default <RouterConfig>{
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
}
