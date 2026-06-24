// ── Mock time override ────────────────────────────────────────────────────────
// When MOCK_NOW_ISO is set, Date.now() is replaced with this timestamp for all
// pick-locking and deadline-alert logic. Set to '' to use real time.
//
// Example: '2026-06-20T23:30:00Z'  →  pretend it's June 20, 11:30 PM UTC
//          ''                       →  use real Date.now() (default / "Use Real Time")

export const MOCK_NOW_ISO = ''

/** Returns the current timestamp (ms). Uses MOCK_NOW_ISO when set. */
export function now(): number {
  if (MOCK_NOW_ISO) return new Date(MOCK_NOW_ISO).getTime()
  return Date.now()
}

/** Returns a Date representing "now" (mock or real). */
export function nowDate(): Date {
  return new Date(now())
}
