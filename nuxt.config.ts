import tailwindcss from '@tailwindcss/vite'

const ignoredBrokenSourceMapPlugins = new Set([
  '@tailwindcss/vite:generate:build',
  'nuxt:module-preload-polyfill',
])

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  future: {
    compatibilityVersion: 4,
  },

  // No error-tracking service uploads source maps, so do not generate them.
  sourcemap: false,

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (
            warning.code === 'SOURCEMAP_BROKEN' &&
            warning.plugin &&
            ignoredBrokenSourceMapPlugins.has(warning.plugin)
          ) {
            return
          }
          warn(warning)
        },
      },
    },
    $server: {
      build: {
        rollupOptions: {
          onwarn(warning, warn) {
            if (
              warning.code === 'SOURCEMAP_BROKEN' &&
              warning.plugin &&
              ignoredBrokenSourceMapPlugins.has(warning.plugin)
            ) {
              return
            }
            warn(warning)
          },
        },
      },
    },
    server: {
      // Auto-open the browser when the dev server starts
      open: true,
      hmr: {
        // Disable the intrusive full-screen error overlay; check the console instead
        overlay: false,
      },
    },
  },

  // Register the default components dir plus a `common/` subdir whose names are
  // NOT path-prefixed — so shared shell components (AppHeader, AppFooter,
  // TzPicker, CountryFlag) keep their bare names instead of becoming
  // <CommonAppHeader> etc.
  components: [
    { path: '~/components/common', pathPrefix: false },
    '~/components',
  ],

  css: ['~/assets/css/main.css', '~/assets/css/scrollbar.css'],

  // Use the netlify preset so server/api routes become Netlify Functions
  nitro: {
    preset: 'netlify',
  },

  routeRules: {
    // The old "Coming Soon" knockout page — the real bracket lives in Predictor
    '/knockout': { redirect: '/predictor' },
  },

  // SSR enabled for Netlify Functions; hydration mismatches suppressed via client-only wrappers
  ssr: true,

  app: {
    head: {
      script: [
        {
          // Blocking inline script — runs synchronously before first paint.
          // Reads the persisted nation accent from localStorage and applies all
          // CSS custom properties directly on <html> so there is zero flash of
          // the un-themed background on page load / refresh.
          innerHTML: `(function(){try{var a=localStorage.getItem('wc-my-nation-accent');if(!a)return;var bg='#0c0a09';var r=document.documentElement;r.style.setProperty('--nation-accent',a);r.style.setProperty('--nation-accent-soft','color-mix(in srgb, '+a+' 40%, transparent)');r.style.setProperty('--nation-glow','color-mix(in srgb, '+a+' 55%, transparent)');r.style.setProperty('--nation-tint','color-mix(in srgb, '+a+' 12%, transparent)');r.style.setProperty('--nation-bg','color-mix(in srgb, '+a+' 12%, '+bg+')');r.style.setProperty('--nation-bg-header','color-mix(in srgb, '+a+' 18%, '+bg+')');r.style.setProperty('--nation-card','color-mix(in srgb, '+a+' 10%, #1d1d1d)');r.style.setProperty('--nation-card-hover','color-mix(in srgb, '+a+' 13%, #252525)');r.style.setProperty('--nation-card-mine','color-mix(in srgb, '+a+' 18%, #1d1d1d)');r.classList.add('has-nation-theme');}catch(e){}})();`,
          tagPosition: 'head',
          tagPriority: 0,
        },
      ],
      title: 'World Cup Fire 🔥',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'FIFA World Cup 2026 live scores, groups, standings, and schedule — updated in real time.',
        },
        // Open Graph — tagPriority 'critical' forces these before inline styles/scripts
        { property: 'og:type', content: 'website', tagPriority: 'critical' },
        {
          property: 'og:url',
          content: 'https://worldcupfire.com/',
          tagPriority: 'critical',
        },
        {
          property: 'og:title',
          content: 'World Cup Fire 🔥',
          tagPriority: 'critical',
        },
        {
          property: 'og:description',
          content:
            'FIFA World Cup 2026 live scores, groups, standings, and schedule — updated in real time.',
          tagPriority: 'critical',
        },
        {
          property: 'og:image',
          content: 'https://worldcupfire.com/og-image.png',
          tagPriority: 'critical',
        },
        {
          property: 'og:image:width',
          content: '1200',
          tagPriority: 'critical',
        },
        {
          property: 'og:image:height',
          content: '630',
          tagPriority: 'critical',
        },
        {
          property: 'og:image:type',
          content: 'image/png',
          tagPriority: 'critical',
        },
        {
          property: 'og:site_name',
          content: 'World Cup Fire',
          tagPriority: 'critical',
        },
        // Twitter / X Card
        {
          name: 'twitter:card',
          content: 'summary_large_image',
          tagPriority: 'critical',
        },
        {
          name: 'twitter:title',
          content: 'World Cup Fire 🔥',
          tagPriority: 'critical',
        },
        {
          name: 'twitter:description',
          content:
            'FIFA World Cup 2026 live scores, groups, standings, and schedule — updated in real time.',
          tagPriority: 'critical',
        },
        {
          name: 'twitter:image',
          content: 'https://worldcupfire.com/og-image.png',
          tagPriority: 'critical',
        },
      ],
      link: [
        {
          rel: 'icon',
          href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚽</text></svg>',
        },
      ],
    },
  },

  devtools: {
    enabled: false,
  },
})
