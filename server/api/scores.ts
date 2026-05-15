// Server-side API route: proxies ESPN's MLS scoreboard API
// Supports ?week=last|this|next (defaults to 'this')
// or ?date=YYYYMMDD for a single day
// or ?from=YYYYMMDD&to=YYYYMMDD for a range

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function weekRange(offset: number): { from: string; to: string; label: string } {
  const now = new Date()
  // Find Monday of the current week (CT)
  const day = now.getDay() // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon + offset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const label = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' – '
    + sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return { from: toDateStr(monday), to: toDateStr(sunday), label }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  let from: string
  let to: string
  let label: string

  if (query.date) {
    from = to = query.date as string
    label = query.date as string
  } else if (query.from && query.to) {
    from = query.from as string
    to = query.to as string
    label = `${from}–${to}`
  } else {
    const weekOffset = query.week === 'last' ? -1 : query.week === 'next' ? 1 : 0
    const range = weekRange(weekOffset)
    from = range.from
    to = range.to
    label = range.label
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard?dates=${from}-${to}`

  try {
    const data = await $fetch<Record<string, unknown>>(url)
    return { ...data, _weekLabel: label, _from: from, _to: to }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 502, message: `ESPN API error: ${message}` })
  }
})
