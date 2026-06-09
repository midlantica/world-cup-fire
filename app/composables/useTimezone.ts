// ── Timezone selector composable ──────────────────────────────────────────────
// Supports a broad set of international timezones (covering the World Cup host
// nations USA/Canada/Mexico plus major regions worldwide). Defaults to the
// user's browser timezone, mapped to the nearest supported zone, falling back
// to ET.

export type TzCode =
  // North America (host nations)
  | 'PT'
  | 'MT'
  | 'CT'
  | 'ET'
  | 'AT'
  // South America
  | 'BRT'
  | 'ART'
  // Europe / Africa
  | 'GMT'
  | 'CET'
  | 'EET'
  // Middle East
  | 'GST'
  // Asia
  | 'IST'
  | 'CST'
  | 'JST'
  // Oceania
  | 'AET'
  | 'NZT'

export interface TzOption {
  code: TzCode
  iana: string
  label: string
  region: string
}

export const TZ_OPTIONS: TzOption[] = [
  // North America
  {
    code: 'PT',
    iana: 'America/Los_Angeles',
    label: 'PT — Los Angeles',
    region: 'North America',
  },
  {
    code: 'MT',
    iana: 'America/Denver',
    label: 'MT — Denver',
    region: 'North America',
  },
  {
    code: 'CT',
    iana: 'America/Chicago',
    label: 'CT — Chicago / Mexico City',
    region: 'North America',
  },
  {
    code: 'ET',
    iana: 'America/New_York',
    label: 'ET — New York / Toronto',
    region: 'North America',
  },
  {
    code: 'AT',
    iana: 'America/Halifax',
    label: 'Halifax',
    region: 'North America',
  },
  // South America
  {
    code: 'BRT',
    iana: 'America/Sao_Paulo',
    label: 'São Paulo',
    region: 'South America',
  },
  {
    code: 'ART',
    iana: 'America/Argentina/Buenos_Aires',
    label: 'Buenos Aires',
    region: 'South America',
  },
  // Europe / Africa
  {
    code: 'GMT',
    iana: 'Europe/London',
    label: 'London / Lisbon',
    region: 'Europe',
  },
  {
    code: 'CET',
    iana: 'Europe/Paris',
    label: 'Paris / Madrid / Berlin',
    region: 'Europe',
  },
  {
    code: 'EET',
    iana: 'Europe/Athens',
    label: 'Athens / Cairo',
    region: 'Europe & Africa',
  },
  // Middle East
  { code: 'GST', iana: 'Asia/Dubai', label: 'Dubai', region: 'Middle East' },
  // Asia
  { code: 'IST', iana: 'Asia/Kolkata', label: 'India', region: 'Asia' },
  {
    code: 'CST',
    iana: 'Asia/Shanghai',
    label: 'Beijing / Singapore',
    region: 'Asia',
  },
  { code: 'JST', iana: 'Asia/Tokyo', label: 'Tokyo / Seoul', region: 'Asia' },
  // Oceania
  { code: 'AET', iana: 'Australia/Sydney', label: 'Sydney', region: 'Oceania' },
  {
    code: 'NZT',
    iana: 'Pacific/Auckland',
    label: 'Auckland',
    region: 'Oceania',
  },
]

/** Returns a formatted GMT offset string like "GMT−5" or "GMT+5:30" for an IANA timezone */
export function gmtOffsetLabel(iana: string): string {
  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      timeZoneName: 'shortOffset',
    }).formatToParts(now)
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
    // tzName is like "GMT-5", "GMT+5:30", "GMT"
    if (tzName === 'GMT') return 'GMT'
    const m = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
    if (m) {
      const sign = m[1] === '-' ? '−' : '+'
      const h = parseInt(m[2]!, 10)
      const min = m[3] ? parseInt(m[3], 10) : 0
      return min > 0
        ? `GMT${sign}${h}:${String(min).padStart(2, '0')}`
        : `GMT${sign}${h}`
    }
    return tzName
  } catch {
    return ''
  }
}

function detectTzCode(): TzCode {
  try {
    const iana = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Direct match against the supported list first.
    const direct = TZ_OPTIONS.find((t) => t.iana === iana)
    if (direct) return direct.code

    // Common aliases that map cleanly onto a supported zone.
    const aliases: Record<string, TzCode> = {
      'America/Detroit': 'ET',
      'America/Indiana/Indianapolis': 'ET',
      'America/Toronto': 'ET',
      'America/Menominee': 'CT',
      'America/Mexico_City': 'CT',
      'America/Winnipeg': 'CT',
      'America/Boise': 'MT',
      'America/Phoenix': 'MT',
      'America/Edmonton': 'MT',
      'America/Vancouver': 'PT',
      'America/Tijuana': 'PT',
      'Europe/Lisbon': 'GMT',
      'Europe/Dublin': 'GMT',
      'Europe/Madrid': 'CET',
      'Europe/Berlin': 'CET',
      'Europe/Rome': 'CET',
      'Europe/Amsterdam': 'CET',
      'Africa/Cairo': 'EET',
      'Europe/Istanbul': 'EET',
      'Asia/Singapore': 'CST',
      'Asia/Hong_Kong': 'CST',
      'Asia/Seoul': 'JST',
      'Pacific/Auckland': 'NZT',
    }
    if (aliases[iana]) return aliases[iana]!

    // Fallback: pick the supported zone whose current UTC offset is closest.
    const userOffset = -new Date().getTimezoneOffset() // minutes east of UTC
    let best: TzCode = 'ET'
    let bestDiff = Infinity
    for (const opt of TZ_OPTIONS) {
      const off = offsetMinutes(opt.iana)
      const diff = Math.abs(off - userOffset)
      if (diff < bestDiff) {
        bestDiff = diff
        best = opt.code
      }
    }
    return best
  } catch {
    return 'ET'
  }
}

/** Current UTC offset (minutes east of UTC) for an IANA timezone. */
function offsetMinutes(iana: string): number {
  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      timeZoneName: 'shortOffset',
    }).formatToParts(now)
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
    const m = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
    if (m) {
      const sign = m[1] === '-' ? -1 : 1
      const h = parseInt(m[2]!, 10)
      const min = m[3] ? parseInt(m[3], 10) : 0
      return sign * (h * 60 + min)
    }
    return 0
  } catch {
    return 0
  }
}

// Singleton state — shared across all component instances.
// Default to ET on the server; client will correct to the browser's timezone
// in onMounted (via useTimezone()) to avoid SSR/hydration mismatch.
const selectedTz = ref<TzCode>('ET')
let _tzDetected = false

export function useTimezone() {
  // On the client, detect the real browser timezone once after mount.
  // Guard with getCurrentInstance() so this is safe to call outside a
  // component setup context (e.g. from useScores or server utilities).
  if (import.meta.client && getCurrentInstance()) {
    onMounted(() => {
      // Only auto-detect if the user hasn't manually changed the timezone
      // (i.e. selectedTz is still the SSR default 'ET' and we haven't run yet).
      // We use a module-level flag so this only fires once across all instances.
      if (!_tzDetected) {
        _tzDetected = true
        selectedTz.value = detectTzCode()
      }
    })
  } else if (import.meta.client && !_tzDetected) {
    // Called outside a component (e.g. in a composable chain) — detect
    // immediately since we can't hook into onMounted.
    _tzDetected = true
    selectedTz.value = detectTzCode()
  }

  function setTz(code: TzCode) {
    _tzDetected = true // treat manual selection as "detected"
    selectedTz.value = code
  }

  function ianaForCode(code: TzCode): string {
    return TZ_OPTIONS.find((t) => t.code === code)?.iana ?? 'America/New_York'
  }

  const iana = computed(() => ianaForCode(selectedTz.value))

  /** Split a locale time string into [time, ampm] e.g. ["3:30", "PM"] */
  function splitAmPm(str: string): [string, string] {
    const match = str.match(/^([\d:]+)\s*(AM|PM)$/i)
    if (match) return [match[1]!, match[2]!.toUpperCase()]
    return [str, '']
  }

  /** Format an ISO date string as "3:30 PM" in the selected timezone */
  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: iana.value,
    })
  }

  /** Format an ISO date string as HTML with AM/PM in a smaller span */
  function formatTimeHtml(iso: string): string {
    const [time, ampm] = splitAmPm(formatTime(iso))
    return ampm ? `${time}&thinsp;<span class="ampm">${ampm}</span>` : time
  }

  /** Round ISO date to nearest 30-min slot label in the selected timezone */
  function kickoffKey(iso: string): string {
    const d = new Date(iso)
    const mins = d.getUTCMinutes()
    const rounded = mins < 15 ? 0 : mins < 45 ? 30 : 60
    const h = rounded === 60 ? d.getUTCHours() + 1 : d.getUTCHours()
    const m = rounded === 60 ? 0 : rounded
    const slot = new Date(d)
    slot.setUTCHours(h, m, 0, 0)
    return slot.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: iana.value,
    })
  }

  /** Round ISO date to nearest 30-min slot label as HTML with AM/PM in a smaller span */
  function kickoffKeyHtml(iso: string): string {
    const [time, ampm] = splitAmPm(kickoffKey(iso))
    return ampm ? `${time}<span class="ampm">${ampm}</span>` : time
  }

  return {
    selectedTz,
    setTz,
    iana,
    formatTime,
    formatTimeHtml,
    kickoffKey,
    kickoffKeyHtml,
  }
}
