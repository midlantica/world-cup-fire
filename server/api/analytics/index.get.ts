// Analytics API stub — returns a message when not configured.
// To enable real analytics, implement this endpoint with your analytics provider.

export default defineEventHandler(() => {
  return {
    message:
      'Analytics not configured. Set up your analytics provider to see data here.',
    days: [],
    totals: { pageViews: 0, uniqueVisitors: 0, sessions: 0 },
    topPages: [],
  }
})
