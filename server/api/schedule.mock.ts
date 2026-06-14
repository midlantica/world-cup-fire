// Mock Week 1 schedule — uses REAL ESPN match IDs so pool picks (which were
// made against the live ESPN schedule) resolve correctly against this data.
// All Week 1 matches are marked STATUS_FINAL with plausible scores so the
// leaderboard can be tested before the real tournament begins.

export const MOCK_EVENTS = [
  // ── Thursday Jun 11 ──────────────────────────────────────────────────────────

  // 760415 — Mexico vs South Africa  (FT 2-0)
  {
    id: '760415',
    date: '2026-06-11T19:00:00Z',
    name: 'South Africa at Mexico',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'AT&T Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Mexico', abbreviation: 'MEX' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'South Africa', abbreviation: 'RSA' },
          },
        ],
      },
    ],
  },

  // ── Friday Jun 12 ────────────────────────────────────────────────────────────

  // 760414 — South Korea vs Czechia  (FT 1-1 draw)
  {
    id: '760414',
    date: '2026-06-12T02:00:00Z',
    name: 'Czechia at South Korea',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'SoFi Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'South Korea', abbreviation: 'KOR' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Czechia', abbreviation: 'CZE' },
          },
        ],
      },
    ],
  },

  // 760416 — Canada vs Bosnia-Herzegovina  (FT 3-1)
  {
    id: '760416',
    date: '2026-06-12T19:00:00Z',
    name: 'Bosnia-Herzegovina at Canada',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'BC Place' },
        competitors: [
          {
            homeAway: 'home',
            score: '3',
            team: { displayName: 'Canada', abbreviation: 'CAN' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Bosnia-Herzegovina', abbreviation: 'BIH' },
          },
        ],
      },
    ],
  },

  // ── Saturday Jun 13 ──────────────────────────────────────────────────────────

  // 760417 — United States vs Paraguay  (FT 4-0)
  {
    id: '760417',
    date: '2026-06-13T01:00:00Z',
    name: 'Paraguay at United States',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'MetLife Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '4',
            team: { displayName: 'United States', abbreviation: 'USA' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Paraguay', abbreviation: 'PAR' },
          },
        ],
      },
    ],
  },

  // 760420 — Qatar vs Switzerland  (FT 0-3)
  {
    id: '760420',
    date: '2026-06-13T19:00:00Z',
    name: 'Switzerland at Qatar',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: "Levi's Stadium" },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'Qatar', abbreviation: 'QAT' },
          },
          {
            homeAway: 'away',
            score: '3',
            team: { displayName: 'Switzerland', abbreviation: 'SUI' },
          },
        ],
      },
    ],
  },

  // 760419 — Brazil vs Morocco  (FT 2-1)
  {
    id: '760419',
    date: '2026-06-13T22:00:00Z',
    name: 'Morocco at Brazil',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Hard Rock Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Brazil', abbreviation: 'BRA' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Morocco', abbreviation: 'MAR' },
          },
        ],
      },
    ],
  },

  // ── Sunday Jun 14 ────────────────────────────────────────────────────────────

  // 760418 — Haiti vs Scotland  (FT 0-2)
  {
    id: '760418',
    date: '2026-06-14T01:00:00Z',
    name: 'Scotland at Haiti',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Estadio Azteca' },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'Haiti', abbreviation: 'HAI' },
          },
          {
            homeAway: 'away',
            score: '2',
            team: { displayName: 'Scotland', abbreviation: 'SCO' },
          },
        ],
      },
    ],
  },

  // 760421 — Australia vs Türkiye  (FT 1-2)
  {
    id: '760421',
    date: '2026-06-14T04:00:00Z',
    name: 'Türkiye at Australia',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Stadium Australia' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'Australia', abbreviation: 'AUS' },
          },
          {
            homeAway: 'away',
            score: '2',
            team: { displayName: 'Türkiye', abbreviation: 'TUR' },
          },
        ],
      },
    ],
  },

  // 760422 — Germany vs Curaçao  (FT 5-0)
  {
    id: '760422',
    date: '2026-06-14T17:00:00Z',
    name: 'Curaçao at Germany',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Allianz Arena' },
        competitors: [
          {
            homeAway: 'home',
            score: '5',
            team: { displayName: 'Germany', abbreviation: 'GER' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Curaçao', abbreviation: 'CUW' },
          },
        ],
      },
    ],
  },

  // 760425 — Netherlands vs Japan  (FT 2-2 draw)
  {
    id: '760425',
    date: '2026-06-14T20:00:00Z',
    name: 'Japan at Netherlands',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Johan Cruyff Arena' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Netherlands', abbreviation: 'NED' },
          },
          {
            homeAway: 'away',
            score: '2',
            team: { displayName: 'Japan', abbreviation: 'JPN' },
          },
        ],
      },
    ],
  },

  // 760423 — Ivory Coast vs Ecuador  (FT 1-0)
  {
    id: '760423',
    date: '2026-06-14T23:00:00Z',
    name: 'Ecuador at Ivory Coast',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Stade Félix Houphouët-Boigny' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'Ivory Coast', abbreviation: 'CIV' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Ecuador', abbreviation: 'ECU' },
          },
        ],
      },
    ],
  },

  // 760424 — Sweden vs Tunisia  (FT 3-0)
  {
    id: '760424',
    date: '2026-06-15T02:00:00Z',
    name: 'Tunisia at Sweden',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Friends Arena' },
        competitors: [
          {
            homeAway: 'home',
            score: '3',
            team: { displayName: 'Sweden', abbreviation: 'SWE' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Tunisia', abbreviation: 'TUN' },
          },
        ],
      },
    ],
  },

  // ── Week 2: Monday Jun 15 ─────────────────────────────────────────────────

  // 760428 — Spain vs Cape Verde  (FT 3-0)
  {
    id: '760428',
    date: '2026-06-15T16:00:00Z',
    name: 'Cape Verde at Spain',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Mercedes-Benz Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '3',
            team: { displayName: 'Spain', abbreviation: 'ESP' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Cape Verde', abbreviation: 'CPV' },
          },
        ],
      },
    ],
  },

  // 760426 — Belgium vs Egypt  (FT 2-1)
  {
    id: '760426',
    date: '2026-06-15T19:00:00Z',
    name: 'Egypt at Belgium',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Lumen Field' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Belgium', abbreviation: 'BEL' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Egypt', abbreviation: 'EGY' },
          },
        ],
      },
    ],
  },

  // 760429 — Saudi Arabia vs Uruguay  (FT 0-2)
  {
    id: '760429',
    date: '2026-06-15T22:00:00Z',
    name: 'Uruguay at Saudi Arabia',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Hard Rock Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'Saudi Arabia', abbreviation: 'KSA' },
          },
          {
            homeAway: 'away',
            score: '2',
            team: { displayName: 'Uruguay', abbreviation: 'URU' },
          },
        ],
      },
    ],
  },

  // 760427 — Iran vs New Zealand  (FT 1-0)
  {
    id: '760427',
    date: '2026-06-16T01:00:00Z',
    name: 'New Zealand at Iran',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'SoFi Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'Iran', abbreviation: 'IRN' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'New Zealand', abbreviation: 'NZL' },
          },
        ],
      },
    ],
  },

  // ── Week 2: Tuesday Jun 16 ────────────────────────────────────────────────

  // 760432 — France vs Senegal  (FT 2-0)
  {
    id: '760432',
    date: '2026-06-16T19:00:00Z',
    name: 'Senegal at France',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'MetLife Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'France', abbreviation: 'FRA' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Senegal', abbreviation: 'SEN' },
          },
        ],
      },
    ],
  },

  // 760430 — Norway vs Iraq  (FT 4-0)
  {
    id: '760430',
    date: '2026-06-16T22:00:00Z',
    name: 'Iraq at Norway',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Gillette Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '4',
            team: { displayName: 'Norway', abbreviation: 'NOR' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Iraq', abbreviation: 'IRQ' },
          },
        ],
      },
    ],
  },

  // ── Week 2: Wednesday Jun 17 ──────────────────────────────────────────────

  // 760433 — Argentina vs Algeria  (FT 3-1)
  {
    id: '760433',
    date: '2026-06-17T19:00:00Z',
    name: 'Algeria at Argentina',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'AT&T Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '3',
            team: { displayName: 'Argentina', abbreviation: 'ARG' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Algeria', abbreviation: 'ALG' },
          },
        ],
      },
    ],
  },

  // 760431 — Austria vs Jordan  (FT 2-0)
  {
    id: '760431',
    date: '2026-06-17T19:00:00Z',
    name: 'Jordan at Austria',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: "Levi's Stadium" },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Austria', abbreviation: 'AUT' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Jordan', abbreviation: 'JOR' },
          },
        ],
      },
    ],
  },

  // 760435 — Portugal vs Congo DR  (FT 4-0)
  {
    id: '760435',
    date: '2026-06-17T22:00:00Z',
    name: 'Congo DR at Portugal',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Lincoln Financial Field' },
        competitors: [
          {
            homeAway: 'home',
            score: '4',
            team: { displayName: 'Portugal', abbreviation: 'POR' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Congo DR', abbreviation: 'COD' },
          },
        ],
      },
    ],
  },

  // 760437 — England vs Croatia  (FT 2-0)
  {
    id: '760437',
    date: '2026-06-17T22:00:00Z',
    name: 'Croatia at England',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'SoFi Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'England', abbreviation: 'ENG' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Croatia', abbreviation: 'CRO' },
          },
        ],
      },
    ],
  },

  // 760434 — Ghana vs Panama  (FT 1-1)
  {
    id: '760434',
    date: '2026-06-17T22:00:00Z',
    name: 'Panama at Ghana',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'NRG Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'Ghana', abbreviation: 'GHA' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Panama', abbreviation: 'PAN' },
          },
        ],
      },
    ],
  },

  // ── Week 2: Thursday Jun 18 ───────────────────────────────────────────────

  // 760436 — Colombia vs Uzbekistan  (FT 3-0)
  {
    id: '760436',
    date: '2026-06-18T19:00:00Z',
    name: 'Uzbekistan at Colombia',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'BC Place' },
        competitors: [
          {
            homeAway: 'home',
            score: '3',
            team: { displayName: 'Colombia', abbreviation: 'COL' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Uzbekistan', abbreviation: 'UZB' },
          },
        ],
      },
    ],
  },

  // 760438 — Czechia vs South Africa  (FT 2-1)
  {
    id: '760438',
    date: '2026-06-18T19:00:00Z',
    name: 'South Africa at Czechia',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Estadio Azteca' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Czechia', abbreviation: 'CZE' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'South Africa', abbreviation: 'RSA' },
          },
        ],
      },
    ],
  },

  // 760439 — Switzerland vs Bosnia-Herzegovina  (FT 2-0)
  {
    id: '760439',
    date: '2026-06-18T22:00:00Z',
    name: 'Bosnia-Herzegovina at Switzerland',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Allegiant Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Switzerland', abbreviation: 'SUI' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Bosnia-Herzegovina', abbreviation: 'BIH' },
          },
        ],
      },
    ],
  },

  // 760440 — Canada vs Qatar  (FT 3-0)
  {
    id: '760440',
    date: '2026-06-18T22:00:00Z',
    name: 'Qatar at Canada',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'BMO Field' },
        competitors: [
          {
            homeAway: 'home',
            score: '3',
            team: { displayName: 'Canada', abbreviation: 'CAN' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Qatar', abbreviation: 'QAT' },
          },
        ],
      },
    ],
  },

  // ── Week 2: Friday Jun 19 ─────────────────────────────────────────────────

  // 760441 — Mexico vs South Korea  (FT 1-1)
  {
    id: '760441',
    date: '2026-06-19T19:00:00Z',
    name: 'South Korea at Mexico',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'AT&T Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'Mexico', abbreviation: 'MEX' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'South Korea', abbreviation: 'KOR' },
          },
        ],
      },
    ],
  },

  // 760442 — United States vs Australia  (FT 2-0)
  {
    id: '760442',
    date: '2026-06-19T22:00:00Z',
    name: 'Australia at United States',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'MetLife Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'United States', abbreviation: 'USA' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Australia', abbreviation: 'AUS' },
          },
        ],
      },
    ],
  },

  // 760445 — Scotland vs Morocco  (FT 0-2)
  {
    id: '760445',
    date: '2026-06-19T22:00:00Z',
    name: 'Morocco at Scotland',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Lumen Field' },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'Scotland', abbreviation: 'SCO' },
          },
          {
            homeAway: 'away',
            score: '2',
            team: { displayName: 'Morocco', abbreviation: 'MAR' },
          },
        ],
      },
    ],
  },

  // ── Week 2: Saturday Jun 20 ───────────────────────────────────────────────

  // 760444 — Brazil vs Haiti  (FT 4-0)
  {
    id: '760444',
    date: '2026-06-20T19:00:00Z',
    name: 'Haiti at Brazil',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'SoFi Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '4',
            team: { displayName: 'Brazil', abbreviation: 'BRA' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Haiti', abbreviation: 'HAI' },
          },
        ],
      },
    ],
  },

  // 760443 — Türkiye vs Paraguay  (FT 2-1)
  {
    id: '760443',
    date: '2026-06-20T19:00:00Z',
    name: 'Paraguay at Türkiye',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Estadio Akron' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Türkiye', abbreviation: 'TUR' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Paraguay', abbreviation: 'PAR' },
          },
        ],
      },
    ],
  },

  // 760446 — Germany vs Curaçao  (FT 5-0) — mock ID based on ESPN pattern
  {
    id: '760446',
    date: '2026-06-20T22:00:00Z',
    name: 'Curaçao at Germany',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Gillette Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '5',
            team: { displayName: 'Germany', abbreviation: 'GER' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Curaçao', abbreviation: 'CUW' },
          },
        ],
      },
    ],
  },

  // 760447 — Netherlands vs Japan  (FT 2-1) — mock ID
  {
    id: '760447',
    date: '2026-06-20T22:00:00Z',
    name: 'Japan at Netherlands',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Hard Rock Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Netherlands', abbreviation: 'NED' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Japan', abbreviation: 'JPN' },
          },
        ],
      },
    ],
  },

  // ── Week 2: Sunday Jun 21 — SCHEDULED (not yet played) ───────────────────
  // Mock "now" = Jun 20 23:30 UTC, so these games are tomorrow → picks still open

  // 760448 — Ivory Coast vs Ecuador  (scheduled)
  {
    id: '760448',
    date: '2026-06-21T16:00:00Z',
    name: 'Ecuador at Ivory Coast',
    status: {
      type: {
        id: '1',
        name: 'STATUS_SCHEDULED',
        state: 'pre',
        completed: false,
        description: 'Scheduled',
        detail: 'Sun, Jun 21',
        shortDetail: '6/21',
      },
      displayClock: '0:00',
    },
    competitions: [
      {
        venue: { fullName: 'BC Place' },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'Ivory Coast', abbreviation: 'CIV' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Ecuador', abbreviation: 'ECU' },
          },
        ],
      },
    ],
  },

  // 760449 — Saudi Arabia vs Spain  (scheduled)
  {
    id: '760449',
    date: '2026-06-21T19:00:00Z',
    name: 'Spain at Saudi Arabia',
    status: {
      type: {
        id: '1',
        name: 'STATUS_SCHEDULED',
        state: 'pre',
        completed: false,
        description: 'Scheduled',
        detail: 'Sun, Jun 21',
        shortDetail: '6/21',
      },
      displayClock: '0:00',
    },
    competitions: [
      {
        venue: { fullName: "Levi's Stadium" },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'Saudi Arabia', abbreviation: 'KSA' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Spain', abbreviation: 'ESP' },
          },
        ],
      },
    ],
  },

  // 760450 — Uruguay vs Belgium  (scheduled)
  {
    id: '760450',
    date: '2026-06-21T19:00:00Z',
    name: 'Belgium at Uruguay',
    status: {
      type: {
        id: '1',
        name: 'STATUS_SCHEDULED',
        state: 'pre',
        completed: false,
        description: 'Scheduled',
        detail: 'Sun, Jun 21',
        shortDetail: '6/21',
      },
      displayClock: '0:00',
    },
    competitions: [
      {
        venue: { fullName: 'Allegiant Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'Uruguay', abbreviation: 'URU' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Belgium', abbreviation: 'BEL' },
          },
        ],
      },
    ],
  },

  // 760451 — New Zealand vs France  (scheduled)
  {
    id: '760451',
    date: '2026-06-21T22:00:00Z',
    name: 'France at New Zealand',
    status: {
      type: {
        id: '1',
        name: 'STATUS_SCHEDULED',
        state: 'pre',
        completed: false,
        description: 'Scheduled',
        detail: 'Sun, Jun 21',
        shortDetail: '6/21',
      },
      displayClock: '0:00',
    },
    competitions: [
      {
        venue: { fullName: 'BMO Field' },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'New Zealand', abbreviation: 'NZL' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'France', abbreviation: 'FRA' },
          },
        ],
      },
    ],
  },

  // ── Week 3: Jun 22–28 (remaining group stage games) ──────────────────────
  // These are plausible group stage matchday 2 & 3 results to fill out the
  // bracket so the Round of 32 has realistic qualifiers.

  // 760452 — Mexico vs Canada  (FT 1-2)
  {
    id: '760452',
    date: '2026-06-22T19:00:00Z',
    name: 'Canada at Mexico',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Estadio Azteca' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'Mexico', abbreviation: 'MEX' },
          },
          {
            homeAway: 'away',
            score: '2',
            team: { displayName: 'Canada', abbreviation: 'CAN' },
          },
        ],
      },
    ],
  },

  // 760453 — United States vs Germany  (FT 1-1)
  {
    id: '760453',
    date: '2026-06-22T22:00:00Z',
    name: 'Germany at United States',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'MetLife Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'United States', abbreviation: 'USA' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Germany', abbreviation: 'GER' },
          },
        ],
      },
    ],
  },

  // 760454 — Argentina vs England  (FT 2-1)
  {
    id: '760454',
    date: '2026-06-23T19:00:00Z',
    name: 'England at Argentina',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'AT&T Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Argentina', abbreviation: 'ARG' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'England', abbreviation: 'ENG' },
          },
        ],
      },
    ],
  },

  // 760455 — Brazil vs Portugal  (FT 2-0)
  {
    id: '760455',
    date: '2026-06-23T22:00:00Z',
    name: 'Portugal at Brazil',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Hard Rock Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Brazil', abbreviation: 'BRA' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Portugal', abbreviation: 'POR' },
          },
        ],
      },
    ],
  },

  // 760456 — Spain vs Netherlands  (FT 3-1)
  {
    id: '760456',
    date: '2026-06-24T19:00:00Z',
    name: 'Netherlands at Spain',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'SoFi Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '3',
            team: { displayName: 'Spain', abbreviation: 'ESP' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Netherlands', abbreviation: 'NED' },
          },
        ],
      },
    ],
  },

  // 760457 — France vs Norway  (FT 2-0)
  {
    id: '760457',
    date: '2026-06-24T22:00:00Z',
    name: 'Norway at France',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Lumen Field' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'France', abbreviation: 'FRA' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Norway', abbreviation: 'NOR' },
          },
        ],
      },
    ],
  },

  // 760458 — Colombia vs Austria  (FT 1-0)
  {
    id: '760458',
    date: '2026-06-25T19:00:00Z',
    name: 'Austria at Colombia',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'BC Place' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'Colombia', abbreviation: 'COL' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Austria', abbreviation: 'AUT' },
          },
        ],
      },
    ],
  },

  // 760459 — Morocco vs Switzerland  (FT 1-1)
  {
    id: '760459',
    date: '2026-06-25T22:00:00Z',
    name: 'Switzerland at Morocco',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Allegiant Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'Morocco', abbreviation: 'MAR' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Switzerland', abbreviation: 'SUI' },
          },
        ],
      },
    ],
  },

  // 760460 — Uruguay vs Türkiye  (FT 2-1)
  {
    id: '760460',
    date: '2026-06-26T19:00:00Z',
    name: 'Türkiye at Uruguay',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Gillette Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Uruguay', abbreviation: 'URU' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Türkiye', abbreviation: 'TUR' },
          },
        ],
      },
    ],
  },

  // 760461 — South Korea vs Japan  (FT 1-2)
  {
    id: '760461',
    date: '2026-06-26T22:00:00Z',
    name: 'Japan at South Korea',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Lincoln Financial Field' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'South Korea', abbreviation: 'KOR' },
          },
          {
            homeAway: 'away',
            score: '2',
            team: { displayName: 'Japan', abbreviation: 'JPN' },
          },
        ],
      },
    ],
  },

  // 760462 — Scotland vs Sweden  (FT 0-2)
  {
    id: '760462',
    date: '2026-06-27T19:00:00Z',
    name: 'Sweden at Scotland',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'NRG Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'Scotland', abbreviation: 'SCO' },
          },
          {
            homeAway: 'away',
            score: '2',
            team: { displayName: 'Sweden', abbreviation: 'SWE' },
          },
        ],
      },
    ],
  },

  // 760463 — Portugal vs England  (FT 1-1)
  {
    id: '760463',
    date: '2026-06-27T22:00:00Z',
    name: 'England at Portugal',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: "Levi's Stadium" },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'Portugal', abbreviation: 'POR' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'England', abbreviation: 'ENG' },
          },
        ],
      },
    ],
  },

  // 760464 — Netherlands vs Germany  (FT 1-2)
  {
    id: '760464',
    date: '2026-06-28T19:00:00Z',
    name: 'Germany at Netherlands',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Mercedes-Benz Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'Netherlands', abbreviation: 'NED' },
          },
          {
            homeAway: 'away',
            score: '2',
            team: { displayName: 'Germany', abbreviation: 'GER' },
          },
        ],
      },
    ],
  },

  // 760465 — Belgium vs Colombia  (FT 0-1)
  {
    id: '760465',
    date: '2026-06-28T22:00:00Z',
    name: 'Colombia at Belgium',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'BMO Field' },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'Belgium', abbreviation: 'BEL' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Colombia', abbreviation: 'COL' },
          },
        ],
      },
    ],
  },

  // ── Round of 32: Jun 29 – Jul 2 ──────────────────────────────────────────
  // 16 knockout games. Winners advance to Round of 16.
  // Using plausible matchups based on group stage results above.

  // R32 Match 1 — United States vs Japan  (FT 2-1)
  {
    id: '760500',
    date: '2026-06-29T19:00:00Z',
    name: 'Japan at United States',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'MetLife Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'United States', abbreviation: 'USA' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Japan', abbreviation: 'JPN' },
          },
        ],
      },
    ],
  },

  // R32 Match 2 — Brazil vs Morocco  (FT 3-0)
  {
    id: '760501',
    date: '2026-06-29T22:00:00Z',
    name: 'Morocco at Brazil',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Hard Rock Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '3',
            team: { displayName: 'Brazil', abbreviation: 'BRA' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Morocco', abbreviation: 'MAR' },
          },
        ],
      },
    ],
  },

  // R32 Match 3 — Argentina vs Sweden  (FT 2-0)
  {
    id: '760502',
    date: '2026-06-30T19:00:00Z',
    name: 'Sweden at Argentina',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'AT&T Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Argentina', abbreviation: 'ARG' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Sweden', abbreviation: 'SWE' },
          },
        ],
      },
    ],
  },

  // R32 Match 4 — Spain vs Uruguay  (FT 2-1)
  {
    id: '760503',
    date: '2026-06-30T22:00:00Z',
    name: 'Uruguay at Spain',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'SoFi Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Spain', abbreviation: 'ESP' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Uruguay', abbreviation: 'URU' },
          },
        ],
      },
    ],
  },

  // R32 Match 5 — France vs Colombia  (FT 1-0)
  {
    id: '760504',
    date: '2026-07-01T19:00:00Z',
    name: 'Colombia at France',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Lumen Field' },
        competitors: [
          {
            homeAway: 'home',
            score: '1',
            team: { displayName: 'France', abbreviation: 'FRA' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Colombia', abbreviation: 'COL' },
          },
        ],
      },
    ],
  },

  // R32 Match 6 — Germany vs Canada  (FT 2-0)
  {
    id: '760505',
    date: '2026-07-01T22:00:00Z',
    name: 'Canada at Germany',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Allegiant Stadium' },
        competitors: [
          {
            homeAway: 'home',
            score: '2',
            team: { displayName: 'Germany', abbreviation: 'GER' },
          },
          {
            homeAway: 'away',
            score: '0',
            team: { displayName: 'Canada', abbreviation: 'CAN' },
          },
        ],
      },
    ],
  },

  // R32 Match 7 — Portugal vs Switzerland  (FT 3-1)
  {
    id: '760506',
    date: '2026-07-02T19:00:00Z',
    name: 'Switzerland at Portugal',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Lincoln Financial Field' },
        competitors: [
          {
            homeAway: 'home',
            score: '3',
            team: { displayName: 'Portugal', abbreviation: 'POR' },
          },
          {
            homeAway: 'away',
            score: '1',
            team: { displayName: 'Switzerland', abbreviation: 'SUI' },
          },
        ],
      },
    ],
  },

  // R32 Match 8 — Mexico vs England  (FT 0-2)
  {
    id: '760507',
    date: '2026-07-02T22:00:00Z',
    name: 'England at Mexico',
    status: {
      type: {
        id: '3',
        name: 'STATUS_FINAL',
        state: 'post',
        completed: true,
        description: 'Final',
        detail: 'FT',
        shortDetail: 'FT',
      },
      displayClock: '90:00',
    },
    competitions: [
      {
        venue: { fullName: 'Estadio Azteca' },
        competitors: [
          {
            homeAway: 'home',
            score: '0',
            team: { displayName: 'Mexico', abbreviation: 'MEX' },
          },
          {
            homeAway: 'away',
            score: '2',
            team: { displayName: 'England', abbreviation: 'ENG' },
          },
        ],
      },
    ],
  },
]
