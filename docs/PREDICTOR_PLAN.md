# Predictor & Knockout — Design Plan (Banked)

> Status: **Parked / brainstorm banked.** Not yet started. Picked back up later.
> Last updated: 2026-05-29

The "Big Kahuna": turn `/predictor` into a fun, low-friction game that leans on
groups-of-friends competitive instincts — "just pick a winner" like a dating app
swipe. Start as a **single individual**, add multiplayer later. Also build the
real **Knockout** bracket (originally we just wanted to flag the exciting "Fire
Games").

---

## What the codebase already gives us (findings)

- **Matches** flow through `useScores()` → `/api/schedule` (a thin ESPN FIFA
  proxy). Each match is normalised to a `Match` with a **stable `id`**, team
  names, `homeIso2`/`awayIso2` (flags), brand colors (`homeColor`/`altColor`),
  `group`, `status` (`ns|live|ht|ft`), scores, and a `qualityScore` + `badge`
  (`'fire' | 'wild' | null`). → Perfect data to feed a swipe deck.
- **Persistence with NO database / NO login is already possible:** the app ships
  `@netlify/blobs` (`getStore`) — used by the old analytics code. That's a free,
  zero-config KV store on Netlify. We can store shared/group predictions there.
- **Client state pattern** to mirror: `useMyNation.ts` = `useState` +
  `localStorage` (key `wc-my-nation`). Same approach for "who am I" + solo picks.
- **Nav:** `/predictor` link exists in `AppHeader.vue` but is disabled via
  `app-header__nav-link--soon` (pointer-events:none, opacity .35). Un-disable
  when ready.
- **Pages:** `app/pages/predictor.vue` and `app/pages/knockout.vue` are both
  "Coming Soon" placeholders today.
- **No auth anywhere.** Decision leaning: probably don't need full auth; a
  name + localStorage token is enough for friend pools.
- **Styling conventions:** scoped CSS with `@reference "~/assets/css/main.css"`,
  Tailwind v4 utilities via `@apply`, BEM-ish class names, `CountryFlag`
  component takes `:iso2` + `:size`. Mirror these for the swipe UI.

---

## Recommended phased approach

### Phase 1 — Solo Predictor (local-only, ship first)

- `/predictor` = a **Tinder-style swipe deck**, one card per upcoming match.
  - Big team badges/flags + colors.
  - Swipe right = home wins, swipe left = away wins, tap a **Draw** pill
    (group stage only — knockout has no draws).
  - Big "winner" tap targets too (not everyone swipes).
- Save picks to **`localStorage`**, keyed by match `id`. Instant, no backend.
- Progress ring ("18 / 72 picked").
- Once games go `ft`, show **you vs actual result** + a personal score
  (we already have final scores from the schedule feed).

### Phase 2 — Knockout bracket builder (also fills the real `/knockout` page)

- Group results seed R32. Build a **bracket predictor**: pick group
  winners/runners-up → auto-advance teams through R32 → R16 → QF → SF → Final.
- Same swipe/tap interaction per tie.
- Show "Group Winners / Best 32, 16, 8, 4, 2" progression the user described.
- Note: the bracket seeding map (which group slots feed which R32 fixtures) is
  fixed by FIFA — encode it as a constant.

### Phase 3 — Groups of Friends (shared, still no login)

- "Create a pool" → generate a short code/URL, e.g. `/predictor/pool/AB12`.
- Friends open the link, set a **display name** (no password), make picks.
- Picks stored in **Netlify Blobs** keyed by pool code.
- **Leaderboard** ripples across the group; lightweight identity = name + a
  random token saved in localStorage. No auth.

---

## Open decision (the one fork in the road)

**How social should the FIRST shippable version be?**

1. Phase 1 only — solo, local-only. Add the pool layer later. _(recommended start)_
2. Solo **+** shared friend pools (Netlify Blobs, no login) together now.
3. Skip predictor for now — do the real Knockout bracket page first.
4. Keep discussing / different idea.

> User response on 2026-05-29: "Let's bank this for now and come back to it" —
> found other issues to address first. **No option chosen yet.**

---

## Implementation notes for later (so we don't re-derive)

- New composable `usesPredictions.ts` (solo): `useState` + `localStorage`,
  `setPick(matchId, 'home'|'away'|'draw')`, `getPick(matchId)`, `picks` map,
  `scoreVsActual` computed.
- Reuse `Match` type + `normaliseEvent` from `useScores.ts`; don't duplicate.
- Reuse `CountryFlag`; build a new `PredictorCard.vue` for the swipe card
  (mirror `MatchCard.vue` props/styling).
- For swipe gestures: a small pointer/touch handler is enough (drag + threshold
  - spring-back); avoid heavy deps unless needed.
- For pools (Phase 3): new server routes under `server/api/predictor/`
  using `getStore('predictions')`; gate on `process.env.NETLIFY` like the old
  analytics handler did.
- Un-disable the `/predictor` nav link in `AppHeader.vue` when Phase 1 ships.
