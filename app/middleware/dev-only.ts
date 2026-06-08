/**
 * dev-only middleware — redirects to 404 in production.
 * Pages that use `definePageMeta({ middleware: 'dev-only' })` are only
 * accessible during local development (`pnpm dev`).
 */
export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
})
