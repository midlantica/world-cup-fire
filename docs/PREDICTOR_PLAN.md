# Predictor & Knockout — Design Plan (Banked)

> Status: **Parked / brainstorm banked.** Not yet started. Picked back up later.
> Last updated: 2026-06-09

The "Big Kahuna": turn `/predictor` into a fun, low-friction game that leans on
groups-of-friends competitive instincts — "just pick a winner" like a dating app
swipe. Start as a **single individual**, add multiplayer later. Also build the
real **Knockout** bracket (originally we just wanted to flag the exciting "Fire
Games").

---

## 🆕 BIG IDEA BANKED 2026-06-09 — Predict All The Way To The Final

> **The core insight:** If we can already pick W/T/L for every group stage match,
> we can compute predicted group standings → predicted advancers → auto-seed the
> knockout bracket → pick all the way to the Final. We have ALL the logic and ALL
> the FIFA rules to do this end-to-end. Even when real results upset our
> predictions (and they will!), the predicted bracket is always valid as a
> "what we thought would happen" snapshot.

### The Logic Chain

**Step 1 — Group Stage picks (already half-built)**
`usePicks.ts` already lets you pick W/T/L for every group stage match. Once
you've picked all 3 matches per group (each team plays 3), we can compute a
**predicted group table** — points (3/1/0 for W/T/L), goal diff (if we add score
predictions) or just points-based ranking — and therefore **predicted 1st and
2nd place** for each of the 12 groups.

**Step 2 — The FIFA 2026 bracket seeding map (the key piece to encode)**
FIFA has a fixed bracket. The 32 teams that advance from the group stage slot
into the Round of 32 in a specific, pre-determined pattern. For example:

- **1A vs 2B** (Winner of Group A plays Runner-up of Group B)
- **1C vs 2D**, **1E vs 2F**, etc.

This is a **constant** — it doesn't change. We encode it once as a lookup table
in `worldcup.ts`. Once we know our predicted 1st/2nd from each group, we can
auto-populate the entire R32 bracket.

**Step 3 — Cascade through the bracket**
Once R32 is seeded, the user picks each R32 match → winners advance to R16 →
pick those → QF → SF → 3rd place play-off → **Final**. Every pick cascades
forward. The whole tournament bracket is predictable from group stage picks
forward.

### The 2026 Nuance: 48 teams → Round of 32

WC 2026 is bigger than previous editions:

- 48 teams, 12 groups of 4
- Top 2 from each group = 24 teams advance automatically
- **8 best 3rd-place teams** also advance (32 total in R32)
- FIFA has a formula for which 3rd-place slots go where in the bracket

The 3rd-place wildcard seeding is the trickiest bit — FIFA pre-defines which
bracket slots the 3rd-place teams fill depending on which groups they came from.
We need to encode this lookup table too, but it's fully deterministic and public.

### What We'd Build

#### New composable: `usePredictions.ts`

Extends the existing `usePicks.ts` concept but adds:

- **Score predictions** (optional — even just W/T/L is enough to compute group
  standings via points)
- **`predictedGroupStandings(groupLetter)`** — computed from your group stage
  picks (points: 3/1/0, tiebreakers: goal diff if scores entered, else
  alphabetical as stable fallback)
- **`predictedAdvancers()`** — the 32 teams (top 2 from each of 12 groups + 8
  best 3rd-place) you think go through
- **`predictedBracket()`** — the full R32→R16→QF→SF→Final tree, auto-seeded
  from your group predictions, then filled in as you pick each KO match

#### New constant: `WC_2026_BRACKET_SEEDING` (in `worldcup.ts`)

The fixed FIFA bracket map — which group slot feeds which R32 fixture. Public
FIFA info, encoded once as a constant. Also the 3rd-place wildcard seeding map.

#### `/predictor` page (Phase 1 + Phase 2 merged into one flow)

- **Tab 1: Group Stage** — pick W/T/L for all 48 group games (already works via
  `usePicks`). Shows predicted group table updating live as you pick.
- **Tab 2: My Bracket** — shows the predicted bracket, auto-populated from your
  group picks, with KO match picks cascading forward all the way to the Final.
- Progress tracker: "48/48 group picks · 16/16 R32 picks · 8/8 R16 picks ..."

#### `/knockout` page (the real bracket viewer)

- Once the group stage is actually over (July 2), show the **real bracket**
  populated with actual results from the ESPN API
- Before that (or alongside), show YOUR predicted bracket from the predictor

### Why This Is Exciting

- You can fill out your entire tournament prediction in one session
- As real results come in, you can see where your bracket "broke" and how far
  your predicted teams actually went
- Scoring: award points for correct group picks, bonus points for correct R32,
  R16, QF, SF, Final picks — classic bracket scoring
- This is the foundation for the friend pools (Phase 3) — everyone fills out
  their full bracket, leaderboard updates as the tournament progresses

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
- **`useStandings.ts`** already implements FIFA group-stage tiebreaker sorting
  (points → goal diff → goals for → goals against → alphabetical). We can reuse
  this exact logic for predicted standings.

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

### Phase 2 — Full Tournament Bracket Predictor (the new big idea!)

- Group picks → auto-compute predicted group standings → predicted advancers
- Encode `WC_2026_BRACKET_SEEDING` constant (R32 seeding map + 3rd-place
  wildcard map)
- Build bracket UI: R32 → R16 → QF → SF → Final, pick each match, cascade
  forward
- Show predicted bracket on `/predictor` (Tab 2) and real bracket on `/knockout`
- Scoring system: points for correct picks at each stage (more points for later
  rounds)

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
4. Phase 1 + Phase 2 together — full bracket predictor, solo only.

> User response on 2026-05-29: "Let's bank this for now and come back to it" —
> found other issues to address first. **No option chosen yet.**
>
> User response on 2026-06-09: Confirmed the full-tournament prediction idea is
> the right direction — "Do we not have all the logic and all of the FIFA WC
> rules of the tournament to pick all games all the way to the final??" YES WE DO.
> **Revisit tomorrow to start building.**

---

## Implementation notes for later (so we don't re-derive)

- New composable `usePredictions.ts` (solo): `useState` + `localStorage`,
  `setPick(matchId, 'home'|'away'|'draw')`, `getPick(matchId)`, `picks` map,
  `scoreVsActual` computed.
- **`predictedGroupStandings()`**: reuse the FIFA sort logic already in
  `useStandings.ts` — apply it to picks-derived points instead of live API data.
- **`WC_2026_BRACKET_SEEDING`**: encode the R32 seeding map as a constant array
  of `{ slot: string, home: GroupSlot, away: GroupSlot }` where `GroupSlot` is
  e.g. `'1A'` (winner of Group A) or `'2B'` (runner-up of Group B) or
  `'3rd-ABCD'` (best 3rd from groups A/B/C/D).
- Reuse `Match` type + `normaliseEvent` from `useScores.ts`; don't duplicate.
- Reuse `CountryFlag`; build a new `PredictorCard.vue` for the swipe card
  (mirror `MatchCard.vue` props/styling).
- For swipe gestures: a small pointer/touch handler is enough (drag + threshold
  - spring-back); avoid heavy deps unless needed.
- For pools (Phase 3): new server routes under `server/api/predictor/`
  using `getStore('predictions')`; gate on `process.env.NETLIFY` like the old
  analytics handler did.
- Un-disable the `/predictor` nav link in `AppHeader.vue` when Phase 1 ships.
