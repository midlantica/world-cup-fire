import { useMyNation, STORAGE_ACCENT_KEY } from './useMyNation'

// ---------------------------------------------------------------------------
// Nation color theme
//
// Derives a small set of contrast-safe CSS custom properties from the selected
// nation's flag colors. Uses the WCAG relative-luminance / contrast-ratio
// formula (plain JS, no dependencies) to:
//   1. Pick whichever of `color` / `altColor` reads best as an accent on the
//      near-black app background.
//   2. Lighten a too-dark accent until it clears a minimum contrast threshold
//      (so dark-navy / black flag colors never disappear on the dark bg).
//
// The result is applied as reactive CSS vars on <html>, so every component
// shares one consistent accent. Cleared when no nation is selected.
// ---------------------------------------------------------------------------

/** App background (stone-950-ish) that accents are measured against. */
const APP_BG = '#0c0a09'

/** Minimum contrast ratio an accent must have against the dark background. */
const MIN_ACCENT_CONTRAST = 2.6

interface Rgb {
  r: number
  g: number
  b: number
}

/** Parse a hex string (with or without leading #) into 0–255 RGB. */
function parseHex(hex: string): Rgb {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const int = parseInt(h, 16)
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}

function toHex({ r, g, b }: Rgb): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** sRGB channel → linear value, per WCAG. */
function linearize(channel: number): number {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance (0 = black, 1 = white). */
function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/** WCAG contrast ratio between two colors (1–21). */
function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a)
  const lb = luminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Blend `color` toward `target` by `amount` (0–1). */
function mix(color: Rgb, target: Rgb, amount: number): Rgb {
  return {
    r: color.r + (target.r - color.r) * amount,
    g: color.g + (target.g - color.g) * amount,
    b: color.b + (target.b - color.b) * amount,
  }
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 }

/**
 * Chroma (colorfulness) of an RGB color, 0–255. White / black / grey ≈ 0,
 * a vivid primary ≈ high. Used to prefer a flag's *colored* swatch over its
 * white/black swatch when choosing an accent.
 */
function chroma({ r, g, b }: Rgb): number {
  return Math.max(r, g, b) - Math.min(r, g, b)
}

/** A color counts as "colorful" (not near-white / near-black / grey) above this. */
const CHROMA_THRESHOLD = 40

/**
 * Given the two flag colors, return a contrast-safe accent hex string that
 * reads clearly on the dark app background.
 *
 * Selection prefers the team's PRIMARY flag color — that's the one most people
 * associate with the nation (Sweden → blue, Tunisia → red, Ecuador → yellow,
 * Brazil → green). The secondary (`altColor`) is only used when the primary is
 * achromatic (a white/black swatch), e.g. Japan's white → its red sun. A
 * too-dark chosen color is then lightened toward white until it clears the
 * minimum contrast threshold so it never disappears on the dark bg.
 */
function pickAccent(primary: string, alt: string): string {
  const bg = parseHex(APP_BG)
  const primaryRgb = parseHex(primary)
  const altRgb = parseHex(alt)

  // Prefer the primary unless it's achromatic (white/black/grey) AND the alt
  // is more colorful — then use the alt as the recognizable accent.
  let best = primaryRgb
  if (
    chroma(primaryRgb) < CHROMA_THRESHOLD &&
    chroma(altRgb) > chroma(primaryRgb)
  ) {
    best = altRgb
  }

  // If the chosen color is too dark/low-contrast on the dark bg, lighten it
  // toward white until it clears (keeps its hue, just brightens it).
  let accent = best
  let amount = 0.15
  while (contrastRatio(accent, bg) < MIN_ACCENT_CONTRAST && amount <= 0.9) {
    accent = mix(best, WHITE, amount)
    amount += 0.15
  }

  return toHex(accent)
}

export function useNationTheme() {
  const { myTeamData } = useMyNation()

  /** The contrast-safe accent hex for the current nation (or null). */
  const accent = computed<string | null>(() => {
    const team = myTeamData.value
    if (!team) return null
    return pickAccent(team.color, team.altColor)
  })

  // Apply / clear CSS vars on <html> reactively (client only).
  if (import.meta.client) {
    watchEffect(() => {
      const root = document.documentElement
      const a = accent.value
      if (a) {
        root.style.setProperty('--nation-accent', a)
        // Soft = accent at low alpha, for rings / glows.
        root.style.setProperty(
          '--nation-accent-soft',
          `color-mix(in srgb, ${a} 40%, transparent)`
        )
        // Glow = a stronger accent used for the top + bottom background bloom.
        root.style.setProperty(
          '--nation-glow',
          `color-mix(in srgb, ${a} 55%, transparent)`
        )
        // Tint = an overall wash for the page background.
        root.style.setProperty(
          '--nation-tint',
          `color-mix(in srgb, ${a} 12%, transparent)`
        )
        // Solid tinted backgrounds — these REPLACE the opaque base color on
        // <body> / .app-root / .app-header, so the nation color shows even
        // though those layers paint over the radial-glow ::before wash.
        // The accent is blended into the near-black base at a low %, so it
        // stays dark but visibly hued.
        root.style.setProperty(
          '--nation-bg',
          `color-mix(in srgb, ${a} 12%, ${APP_BG})`
        )
        root.style.setProperty(
          '--nation-bg-header',
          `color-mix(in srgb, ${a} 18%, ${APP_BG})`
        )
        // Card surface — the nation color bled into the standard card grey so
        // match cards read as part of the theme (stronger on the my-nation
        // card, which uses --nation-card-mine).
        root.style.setProperty(
          '--nation-card',
          `color-mix(in srgb, ${a} 10%, #1d1d1d)`
        )
        root.style.setProperty(
          '--nation-card-hover',
          `color-mix(in srgb, ${a} 13%, #252525)`
        )
        root.style.setProperty(
          '--nation-card-mine',
          `color-mix(in srgb, ${a} 18%, #1d1d1d)`
        )

        // Persist the computed accent so the blocking head script can restore
        // it on the next page load without any flash.
        localStorage.setItem(STORAGE_ACCENT_KEY, a)

        root.classList.add('has-nation-theme')
      } else {
        localStorage.removeItem(STORAGE_ACCENT_KEY)

        root.style.removeProperty('--nation-accent')
        root.style.removeProperty('--nation-accent-soft')
        root.style.removeProperty('--nation-glow')
        root.style.removeProperty('--nation-tint')
        root.style.removeProperty('--nation-bg')
        root.style.removeProperty('--nation-bg-header')
        root.style.removeProperty('--nation-card')
        root.style.removeProperty('--nation-card-hover')
        root.style.removeProperty('--nation-card-mine')
        root.classList.remove('has-nation-theme')
      }
    })
  }

  return { accent }
}
