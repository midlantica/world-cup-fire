# CLAUDE.md

This file documents conventions and context for AI-assisted development on this project.

## Project Overview

World Cup Fire (worldcupfire.com) — a Nuxt 4 (Vue 3) app for the FIFA World Cup 2026: live scores, group standings, tournament stats, an interactive knockout predictor, and server-synced pick-em pools. Deployed on Netlify. Match data sourced from ESPN's unofficial public API (`soccer/fifa.world`) via Nuxt server routes; pools/analytics persisted in Netlify Blobs (local `.data/` in dev).

## Tech Stack

- **Framework**: Nuxt 4, Vue 3, `<script setup lang="ts">`, SSR
- **Styling**: Tailwind CSS v4 + scoped component CSS. `oklab()` / `oklch()` color functions used throughout.
- **Package manager**: pnpm
- **Deployment**: Netlify (Nitro preset), Node 22
- **Tests**: Node's native test runner over `test/*.test.ts` (pools/analytics backend logic)

## Key Conventions

### Colors

All colors use `oklab()` or `oklch()` — do not introduce `rgb()`, `hsl()`, or hex colors. Nation accent theming is driven by `--nation-*` CSS custom properties, set pre-paint by an inline head script in `nuxt.config.ts` (reads `wc-my-nation-accent` from localStorage — anti-FOUC).

### Component structure

- `<script setup lang="ts">` only — no Options API, no `defineComponent`.
- Props typed with `defineProps<{...}>()`, emits with `defineEmits<{...}>()`.
- No comments unless the _why_ is non-obvious (hidden constraint, workaround, etc.).

### CSS

- All component styles are scoped (`<style scoped>`).
- Responsive breakpoints use `max-width` media queries, consistent thresholds: `425px`, `599px`, `768px`.
- `--modal-copy-size` CSS variable controls font size inside modals.
- Minimum readable text size is `0.85rem` (chart tick labels may go to `0.75rem`).

### Constants

- Shared tournament config (teams, groups, dates, venues, match numbers) lives in `app/constants/worldcup.ts` and `app/constants/venues.ts`, not hardcoded in components.

### API / data

- All ESPN API calls go through `server/api/` routes — never fetch ESPN directly from the client. Server routes use in-memory TTL caches with adaptive TTLs (shorter when matches are live/imminent) and stale-on-error fallback; preserve this pattern.
- Composables in `app/composables/` handle data fetching and expose typed reactive state. `useScores.ts` owns event normalization (`normaliseEvent`) and disciplined polling (instance-counted, pauses on `visibilitychange`, torn down on last unmount).
- Pools/picks are the write path: composables → `server/api/pools/*` → Netlify Blobs, with concurrency-safe updates in `server/utils/` (covered by the test suite).

## Structure Notes

### Pages (`app/pages/`)

- `index.vue` — live matches by tournament week
- `groups.vue` + `group/[id].vue` — group standings
- `stats.vue` — WC history/records + live tournament stats
- `predictor.vue` — group predictions + knockout bracket (`Predictor/Bracket.vue`); real FT results lock bracket slots, keyed by FIFA match number
- `pools.vue` — pick-em pools, leaderboards, cross-device sync
- `analytics.vue` — internal analytics dashboard (passphrase-gated, not a security boundary)
- `admin.vue` — dev-only mock-time controls (guarded by `app/middleware/dev-only.ts`)

### Component folders

Modal components live in subfolders; Nuxt auto-imports by path (e.g. `GameDetail/StatsTab.vue` → `GameDetailStatsTab`). `common/` is registered with `pathPrefix: false` (bare names like `AppHeader`).

- `GameDetail/` — match detail modal; `Modal.vue` orchestrates, tabs: Stats / Leaders / Lineups / H2h / Info
- `CountryDetail/`, `GroupDetail/`, `VenueDetail/` — drill-down modals
- `Predictor/Bracket.vue` — knockout bracket UI
- `Picks/` — pools UI (PoolModal, Leaderboard, WtlToggle, sync modals)
- `icons/` — single-purpose SVG components

### Mock time

`useMockTime.ts` and `server/api/dev/mock-time.ts` let dev simulate tournament progression. `MOCK_NOW_ISO` in `server/api/schedule.ts` must stay in sync with `useMockTime.ts` (hand-maintained invariant). Inert in production.

## Commands

```bash
pnpm dev        # dev server at localhost:3000
pnpm build      # production build
pnpm test       # node native test runner (test/*.test.ts)
pnpm format     # prettier
pnpm deploy     # netlify deploy --build --prod
```
