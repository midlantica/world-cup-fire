// ── Mock match-detail data ────────────────────────────────────────────────────
// Fake ESPN summary API responses for each mock match.
// Shape mirrors the real ESPN fifa.world/summary endpoint so StatsTab,
// LeadersTab, H2hTab, and the keyEvents scorers row all render correctly.
//
// Keyed by mock match ID (matches schedule.mock.ts).
// Only finished/live matches need detail — NS matches show "no data yet".
//
// To disable mock data: set USE_MOCK = false in server/api/match-detail.ts

function mkStats(
  fouls: number,
  yellows: number,
  reds: number,
  offsides: number,
  corners: number,
  saves: number,
  possession: number,
  shots: number,
  onTarget: number,
  passes: number,
  tackles: number,
  clearances: number
) {
  const poss2 = Math.round((100 - possession) * 10) / 10
  const poss1 = Math.round(possession * 10) / 10
  return [
    { name: 'foulsCommitted', label: 'Fouls', displayValue: String(fouls), value: fouls },
    { name: 'yellowCards', label: 'Yellow Cards', displayValue: String(yellows), value: yellows },
    { name: 'redCards', label: 'Red Cards', displayValue: String(reds), value: reds },
    { name: 'offsides', label: 'Offsides', displayValue: String(offsides), value: offsides },
    { name: 'wonCorners', label: 'Corner Kicks', displayValue: String(corners), value: corners },
    { name: 'saves', label: 'Saves', displayValue: String(saves), value: saves },
    { name: 'possessionPct', label: 'Possession', displayValue: String(poss1), value: poss1 },
    { name: 'totalShots', label: 'SHOTS', displayValue: String(shots), value: shots },
    { name: 'shotsOnTarget', label: 'ON GOAL', displayValue: String(onTarget), value: onTarget },
    { name: 'shotPct', label: 'On Target %', displayValue: String(Math.round((onTarget / Math.max(shots, 1)) * 100) / 100), value: Math.round((onTarget / Math.max(shots, 1)) * 100) / 100 },
    { name: 'totalPasses', label: 'Passes', displayValue: String(passes), value: passes },
    { name: 'effectiveTackles', label: 'Effective Tackles', displayValue: String(tackles), value: tackles },
    { name: 'effectiveClearance', label: 'Effective Clearances', displayValue: String(clearances), value: clearances },
  ]
}

function mkAwayStats(
  fouls: number,
  yellows: number,
  reds: number,
  offsides: number,
  corners: number,
  saves: number,
  homePossession: number,
  shots: number,
  onTarget: number,
  passes: number,
  tackles: number,
  clearances: number
) {
  const poss = Math.round((100 - homePossession) * 10) / 10
  return [
    { name: 'foulsCommitted', label: 'Fouls', displayValue: String(fouls), value: fouls },
    { name: 'yellowCards', label: 'Yellow Cards', displayValue: String(yellows), value: yellows },
    { name: 'redCards', label: 'Red Cards', displayValue: String(reds), value: reds },
    { name: 'offsides', label: 'Offsides', displayValue: String(offsides), value: offsides },
    { name: 'wonCorners', label: 'Corner Kicks', displayValue: String(corners), value: corners },
    { name: 'saves', label: 'Saves', displayValue: String(saves), value: saves },
    { name: 'possessionPct', label: 'Possession', displayValue: String(poss), value: poss },
    { name: 'totalShots', label: 'SHOTS', displayValue: String(shots), value: shots },
    { name: 'shotsOnTarget', label: 'ON GOAL', displayValue: String(onTarget), value: onTarget },
    { name: 'shotPct', label: 'On Target %', displayValue: String(Math.round((onTarget / Math.max(shots, 1)) * 100) / 100), value: Math.round((onTarget / Math.max(shots, 1)) * 100) / 100 },
    { name: 'totalPasses', label: 'Passes', displayValue: String(passes), value: passes },
    { name: 'effectiveTackles', label: 'Effective Tackles', displayValue: String(tackles), value: tackles },
    { name: 'effectiveClearance', label: 'Effective Clearances', displayValue: String(clearances), value: clearances },
  ]
}

export const MOCK_DETAILS: Record<string, Record<string, unknown>> = {

  // ── mock-001: Mexico 2–1 South Korea ─────────────────────────────────────────
  'mock-001': {
    boxscore: {
      teams: [
        {
          team: { displayName: 'Mexico' },
          statistics: mkStats(14, 2, 0, 2, 6, 1, 54, 14, 5, 412, 18, 12),
        },
        {
          team: { displayName: 'South Korea' },
          statistics: mkAwayStats(11, 1, 0, 3, 4, 3, 54, 9, 3, 338, 14, 16),
        },
      ],
    },
    keyEvents: [
      { clock: { displayValue: "23'" }, team: { displayName: 'Mexico' }, text: "Goal! Mexico 1, South Korea 0. Raúl Jiménez (Mexico) heads home from a corner kick.", type: { text: 'Goal' } },
      { clock: { displayValue: "38'" }, team: { displayName: 'South Korea' }, text: "Hwang In-beom (South Korea) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "51'" }, team: { displayName: 'South Korea' }, text: "Goal! Mexico 1, South Korea 1. Son Heung-min (South Korea) curls a brilliant free kick into the top corner.", type: { text: 'Goal' } },
      { clock: { displayValue: "67'" }, team: { displayName: 'Mexico' }, text: "Hirving Lozano (Mexico) is shown the yellow card for simulation.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "78'" }, team: { displayName: 'Mexico' }, text: "Goal! Mexico 2, South Korea 1. Edson Álvarez (Mexico) fires home from the edge of the box.", type: { text: 'Goal' } },
      { clock: { displayValue: "85'" }, team: { displayName: 'South Korea' }, text: "Kim Min-jae (South Korea) is shown the red card for a last-man foul.", type: { text: 'Red Card' } },
    ],
    leaders: [
      { displayName: 'Goals', leaders: [{ athlete: { displayName: 'Raúl Jiménez' }, team: { displayName: 'Mexico' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Edson Álvarez' }, team: { displayName: 'Mexico' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Son Heung-min' }, team: { displayName: 'South Korea' }, displayValue: '1', value: 1 }] },
      { displayName: 'Shots', leaders: [{ athlete: { displayName: 'Raúl Jiménez' }, team: { displayName: 'Mexico' }, displayValue: '4', value: 4 }, { athlete: { displayName: 'Son Heung-min' }, team: { displayName: 'South Korea' }, displayValue: '3', value: 3 }] },
      { displayName: 'Passes', leaders: [{ athlete: { displayName: 'Edson Álvarez' }, team: { displayName: 'Mexico' }, displayValue: '68', value: 68 }, { athlete: { displayName: 'Hwang In-beom' }, team: { displayName: 'South Korea' }, displayValue: '54', value: 54 }] },
      { displayName: 'Saves', leaders: [{ athlete: { displayName: 'Guillermo Ochoa' }, team: { displayName: 'Mexico' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Kim Seung-gyu' }, team: { displayName: 'South Korea' }, displayValue: '3', value: 3 }] },
    ],
    h2h: {
      events: [
        { date: '2022-11-26T00:00Z', name: 'South Korea vs Mexico', competitions: [{ competitors: [{ homeAway: 'home', score: '2', team: { displayName: 'South Korea' } }, { homeAway: 'away', score: '1', team: { displayName: 'Mexico' } }] }], season: { displayName: '2022 FIFA World Cup' } },
        { date: '2018-06-23T00:00Z', name: 'Mexico vs South Korea', competitions: [{ competitors: [{ homeAway: 'home', score: '2', team: { displayName: 'Mexico' } }, { homeAway: 'away', score: '1', team: { displayName: 'South Korea' } }] }], season: { displayName: '2018 FIFA World Cup' } },
      ],
    },
  },

  // ── mock-002: Switzerland 3–0 Qatar ──────────────────────────────────────────
  'mock-002': {
    boxscore: {
      teams: [
        {
          team: { displayName: 'Switzerland' },
          statistics: mkStats(10, 1, 0, 1, 7, 0, 61, 16, 8, 487, 22, 8),
        },
        {
          team: { displayName: 'Qatar' },
          statistics: mkAwayStats(16, 3, 0, 4, 2, 5, 61, 5, 1, 298, 11, 22),
        },
      ],
    },
    keyEvents: [
      { clock: { displayValue: "14'" }, team: { displayName: 'Switzerland' }, text: "Goal! Switzerland 1, Qatar 0. Granit Xhaka (Switzerland) drives a low shot into the bottom corner.", type: { text: 'Goal' } },
      { clock: { displayValue: "29'" }, team: { displayName: 'Qatar' }, text: "Assim Madibo (Qatar) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "44'" }, team: { displayName: 'Switzerland' }, text: "Goal! Switzerland 2, Qatar 0. Breel Embolo (Switzerland) taps in from close range.", type: { text: 'Goal' } },
      { clock: { displayValue: "58'" }, team: { displayName: 'Qatar' }, text: "Boualem Khoukhi (Qatar) is shown the yellow card for dissent.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "71'" }, team: { displayName: 'Qatar' }, text: "Karim Boudiaf (Qatar) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "83'" }, team: { displayName: 'Switzerland' }, text: "Goal! Switzerland 3, Qatar 0. Ruben Vargas (Switzerland) finishes a swift counter-attack.", type: { text: 'Goal' } },
    ],
    leaders: [
      { displayName: 'Goals', leaders: [{ athlete: { displayName: 'Granit Xhaka' }, team: { displayName: 'Switzerland' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Breel Embolo' }, team: { displayName: 'Switzerland' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Ruben Vargas' }, team: { displayName: 'Switzerland' }, displayValue: '1', value: 1 }] },
      { displayName: 'Shots', leaders: [{ athlete: { displayName: 'Breel Embolo' }, team: { displayName: 'Switzerland' }, displayValue: '5', value: 5 }, { athlete: { displayName: 'Granit Xhaka' }, team: { displayName: 'Switzerland' }, displayValue: '3', value: 3 }] },
      { displayName: 'Passes', leaders: [{ athlete: { displayName: 'Granit Xhaka' }, team: { displayName: 'Switzerland' }, displayValue: '82', value: 82 }, { athlete: { displayName: 'Assim Madibo' }, team: { displayName: 'Qatar' }, displayValue: '51', value: 51 }] },
      { displayName: 'Saves', leaders: [{ athlete: { displayName: 'Yann Sommer' }, team: { displayName: 'Switzerland' }, displayValue: '0', value: 0 }, { athlete: { displayName: 'Meshaal Barsham' }, team: { displayName: 'Qatar' }, displayValue: '5', value: 5 }] },
    ],
    h2h: { events: [] },
  },

  // ── mock-003: Brazil 4–1 Scotland ────────────────────────────────────────────
  'mock-003': {
    boxscore: {
      teams: [
        {
          team: { displayName: 'Brazil' },
          statistics: mkStats(9, 1, 0, 3, 8, 1, 65, 19, 10, 521, 16, 6),
        },
        {
          team: { displayName: 'Scotland' },
          statistics: mkAwayStats(13, 2, 0, 2, 3, 6, 65, 7, 2, 278, 19, 24),
        },
      ],
    },
    keyEvents: [
      { clock: { displayValue: "11'" }, team: { displayName: 'Brazil' }, text: "Goal! Brazil 1, Scotland 0. Vinicius Jr. (Brazil) cuts inside and fires into the far corner.", type: { text: 'Goal' } },
      { clock: { displayValue: "27'" }, team: { displayName: 'Brazil' }, text: "Goal! Brazil 2, Scotland 0. Rodrygo (Brazil) converts a penalty after a handball in the box.", type: { text: 'Penalty - Scored' } },
      { clock: { displayValue: "34'" }, team: { displayName: 'Scotland' }, text: "Ryan Christie (Scotland) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "52'" }, team: { displayName: 'Scotland' }, text: "Goal! Brazil 2, Scotland 1. Scott McTominay (Scotland) heads home from a corner.", type: { text: 'Goal' } },
      { clock: { displayValue: "63'" }, team: { displayName: 'Brazil' }, text: "Goal! Brazil 3, Scotland 1. Endrick (Brazil) rounds the keeper and slots home.", type: { text: 'Goal' } },
      { clock: { displayValue: "74'" }, team: { displayName: 'Scotland' }, text: "John McGinn (Scotland) is shown the yellow card for a late challenge.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "88'" }, team: { displayName: 'Brazil' }, text: "Goal! Brazil 4, Scotland 1. Vinicius Jr. (Brazil) completes his brace with a clinical finish.", type: { text: 'Goal' } },
    ],
    leaders: [
      { displayName: 'Goals', leaders: [{ athlete: { displayName: 'Vinicius Jr.' }, team: { displayName: 'Brazil' }, displayValue: '2', value: 2 }, { athlete: { displayName: 'Rodrygo' }, team: { displayName: 'Brazil' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Scott McTominay' }, team: { displayName: 'Scotland' }, displayValue: '1', value: 1 }] },
      { displayName: 'Shots', leaders: [{ athlete: { displayName: 'Vinicius Jr.' }, team: { displayName: 'Brazil' }, displayValue: '6', value: 6 }, { athlete: { displayName: 'Endrick' }, team: { displayName: 'Brazil' }, displayValue: '4', value: 4 }] },
      { displayName: 'Passes', leaders: [{ athlete: { displayName: 'Casemiro' }, team: { displayName: 'Brazil' }, displayValue: '91', value: 91 }, { athlete: { displayName: 'Andy Robertson' }, team: { displayName: 'Scotland' }, displayValue: '47', value: 47 }] },
      { displayName: 'Saves', leaders: [{ athlete: { displayName: 'Alisson' }, team: { displayName: 'Brazil' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Angus Gunn' }, team: { displayName: 'Scotland' }, displayValue: '6', value: 6 }] },
    ],
    h2h: { events: [] },
  },

  // ── mock-004: USA 2–0 Australia ───────────────────────────────────────────────
  'mock-004': {
    boxscore: {
      teams: [
        {
          team: { displayName: 'United States' },
          statistics: mkStats(11, 1, 0, 2, 5, 2, 56, 13, 6, 398, 17, 9),
        },
        {
          team: { displayName: 'Australia' },
          statistics: mkAwayStats(14, 2, 0, 3, 4, 4, 56, 8, 2, 312, 15, 18),
        },
      ],
    },
    keyEvents: [
      { clock: { displayValue: "19'" }, team: { displayName: 'United States' }, text: "Goal! United States 1, Australia 0. Christian Pulisic (United States) slots home after a brilliant run.", type: { text: 'Goal' } },
      { clock: { displayValue: "33'" }, team: { displayName: 'Australia' }, text: "Harry Souttar (Australia) is shown the yellow card for a foul on Pulisic.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "48'" }, team: { displayName: 'Australia' }, text: "Mathew Leckie (Australia) is shown the yellow card for dissent.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "72'" }, team: { displayName: 'United States' }, text: "Goal! United States 2, Australia 0. Weston McKennie (United States) fires home from 20 yards.", type: { text: 'Goal' } },
    ],
    leaders: [
      { displayName: 'Goals', leaders: [{ athlete: { displayName: 'Christian Pulisic' }, team: { displayName: 'United States' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Weston McKennie' }, team: { displayName: 'United States' }, displayValue: '1', value: 1 }] },
      { displayName: 'Shots', leaders: [{ athlete: { displayName: 'Christian Pulisic' }, team: { displayName: 'United States' }, displayValue: '5', value: 5 }, { athlete: { displayName: 'Mathew Leckie' }, team: { displayName: 'Australia' }, displayValue: '3', value: 3 }] },
      { displayName: 'Passes', leaders: [{ athlete: { displayName: 'Tyler Adams' }, team: { displayName: 'United States' }, displayValue: '74', value: 74 }, { athlete: { displayName: 'Aaron Mooy' }, team: { displayName: 'Australia' }, displayValue: '58', value: 58 }] },
      { displayName: 'Saves', leaders: [{ athlete: { displayName: 'Matt Turner' }, team: { displayName: 'United States' }, displayValue: '2', value: 2 }, { athlete: { displayName: 'Mathew Ryan' }, team: { displayName: 'Australia' }, displayValue: '4', value: 4 }] },
    ],
    h2h: { events: [] },
  },

  // ── mock-005: Germany 2–2 Ivory Coast ────────────────────────────────────────
  'mock-005': {
    boxscore: {
      teams: [
        {
          team: { displayName: 'Germany' },
          statistics: mkStats(12, 2, 0, 2, 6, 2, 58, 15, 7, 456, 14, 10),
        },
        {
          team: { displayName: 'Ivory Coast' },
          statistics: mkAwayStats(10, 1, 0, 3, 5, 5, 58, 12, 5, 362, 16, 14),
        },
      ],
    },
    keyEvents: [
      { clock: { displayValue: "17'" }, team: { displayName: 'Germany' }, text: "Goal! Germany 1, Ivory Coast 0. Florian Wirtz (Germany) curls a stunning effort into the top corner.", type: { text: 'Goal' } },
      { clock: { displayValue: "31'" }, team: { displayName: 'Ivory Coast' }, text: "Goal! Germany 1, Ivory Coast 1. Sébastien Haller (Ivory Coast) heads home from a cross.", type: { text: 'Goal' } },
      { clock: { displayValue: "44'" }, team: { displayName: 'Germany' }, text: "Toni Kroos (Germany) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "59'" }, team: { displayName: 'Germany' }, text: "Goal! Germany 2, Ivory Coast 1. Jamal Musiala (Germany) dribbles past two defenders and finishes.", type: { text: 'Goal' } },
      { clock: { displayValue: "76'" }, team: { displayName: 'Ivory Coast' }, text: "Franck Kessié (Ivory Coast) is shown the yellow card for a late tackle.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "89'" }, team: { displayName: 'Ivory Coast' }, text: "Goal! Germany 2, Ivory Coast 2. Wilfried Zaha (Ivory Coast) equalises with a powerful header in stoppage time.", type: { text: 'Goal' } },
    ],
    leaders: [
      { displayName: 'Goals', leaders: [{ athlete: { displayName: 'Florian Wirtz' }, team: { displayName: 'Germany' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Jamal Musiala' }, team: { displayName: 'Germany' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Sébastien Haller' }, team: { displayName: 'Ivory Coast' }, displayValue: '1', value: 1 }] },
      { displayName: 'Shots', leaders: [{ athlete: { displayName: 'Florian Wirtz' }, team: { displayName: 'Germany' }, displayValue: '5', value: 5 }, { athlete: { displayName: 'Sébastien Haller' }, team: { displayName: 'Ivory Coast' }, displayValue: '4', value: 4 }] },
      { displayName: 'Passes', leaders: [{ athlete: { displayName: 'Toni Kroos' }, team: { displayName: 'Germany' }, displayValue: '88', value: 88 }, { athlete: { displayName: 'Franck Kessié' }, team: { displayName: 'Ivory Coast' }, displayValue: '67', value: 67 }] },
      { displayName: 'Saves', leaders: [{ athlete: { displayName: 'Manuel Neuer' }, team: { displayName: 'Germany' }, displayValue: '2', value: 2 }, { athlete: { displayName: 'Yahia Fofana' }, team: { displayName: 'Ivory Coast' }, displayValue: '5', value: 5 }] },
    ],
    h2h: { events: [] },
  },

  // ── mock-006: Netherlands 1–1 Japan ──────────────────────────────────────────
  'mock-006': {
    boxscore: {
      teams: [
        {
          team: { displayName: 'Netherlands' },
          statistics: mkStats(13, 2, 0, 1, 5, 3, 55, 12, 4, 421, 15, 11),
        },
        {
          team: { displayName: 'Japan' },
          statistics: mkAwayStats(11, 1, 0, 4, 6, 3, 55, 11, 5, 378, 18, 13),
        },
      ],
    },
    keyEvents: [
      { clock: { displayValue: "36'" }, team: { displayName: 'Netherlands' }, text: "Goal! Netherlands 1, Japan 0. Cody Gakpo (Netherlands) heads home from a corner.", type: { text: 'Goal' } },
      { clock: { displayValue: "41'" }, team: { displayName: 'Japan' }, text: "Wataru Endo (Japan) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "55'" }, team: { displayName: 'Netherlands' }, text: "Virgil van Dijk (Netherlands) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "68'" }, team: { displayName: 'Japan' }, text: "Goal! Netherlands 1, Japan 1. Ritsu Doan (Japan) fires a low shot into the corner after a quick counter-attack.", type: { text: 'Goal' } },
    ],
    leaders: [
      { displayName: 'Goals', leaders: [{ athlete: { displayName: 'Cody Gakpo' }, team: { displayName: 'Netherlands' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Ritsu Doan' }, team: { displayName: 'Japan' }, displayValue: '1', value: 1 }] },
      { displayName: 'Shots', leaders: [{ athlete: { displayName: 'Cody Gakpo' }, team: { displayName: 'Netherlands' }, displayValue: '4', value: 4 }, { athlete: { displayName: 'Takefusa Kubo' }, team: { displayName: 'Japan' }, displayValue: '4', value: 4 }] },
      { displayName: 'Passes', leaders: [{ athlete: { displayName: 'Frenkie de Jong' }, team: { displayName: 'Netherlands' }, displayValue: '79', value: 79 }, { athlete: { displayName: 'Wataru Endo' }, team: { displayName: 'Japan' }, displayValue: '71', value: 71 }] },
      { displayName: 'Saves', leaders: [{ athlete: { displayName: 'Bart Verbruggen' }, team: { displayName: 'Netherlands' }, displayValue: '3', value: 3 }, { athlete: { displayName: 'Shuichi Gonda' }, team: { displayName: 'Japan' }, displayValue: '3', value: 3 }] },
    ],
    h2h: { events: [] },
  },

  // ── mock-007: Belgium 3–1 Egypt ───────────────────────────────────────────────
  'mock-007': {
    boxscore: {
      teams: [
        {
          team: { displayName: 'Belgium' },
          statistics: mkStats(10, 1, 0, 2, 7, 1, 62, 17, 8, 498, 19, 7),
        },
        {
          team: { displayName: 'Egypt' },
          statistics: mkAwayStats(15, 3, 1, 3, 3, 5, 62, 8, 2, 301, 12, 21),
        },
      ],
    },
    keyEvents: [
      { clock: { displayValue: "22'" }, team: { displayName: 'Belgium' }, text: "Goal! Belgium 1, Egypt 0. Kevin De Bruyne (Belgium) scores with a precise low drive.", type: { text: 'Goal' } },
      { clock: { displayValue: "35'" }, team: { displayName: 'Egypt' }, text: "Ahmed Hegazi (Egypt) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "47'" }, team: { displayName: 'Egypt' }, text: "Goal! Belgium 1, Egypt 1. Mohamed Salah (Egypt) converts a penalty with a cool finish.", type: { text: 'Penalty - Scored' } },
      { clock: { displayValue: "61'" }, team: { displayName: 'Belgium' }, text: "Goal! Belgium 2, Egypt 1. Romelu Lukaku (Belgium) powers home a header from a corner.", type: { text: 'Goal' } },
      { clock: { displayValue: "73'" }, team: { displayName: 'Egypt' }, text: "Omar Marmoush (Egypt) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "79'" }, team: { displayName: 'Egypt' }, text: "Mahmoud Trezeguet (Egypt) is shown the red card for a dangerous tackle.", type: { text: 'Red Card' } },
      { clock: { displayValue: "86'" }, team: { displayName: 'Belgium' }, text: "Goal! Belgium 3, Egypt 1. Dodi Lukebakio (Belgium) finishes a swift break to seal the win.", type: { text: 'Goal' } },
    ],
    leaders: [
      { displayName: 'Goals', leaders: [{ athlete: { displayName: 'Kevin De Bruyne' }, team: { displayName: 'Belgium' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Romelu Lukaku' }, team: { displayName: 'Belgium' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Mohamed Salah' }, team: { displayName: 'Egypt' }, displayValue: '1', value: 1 }] },
      { displayName: 'Shots', leaders: [{ athlete: { displayName: 'Romelu Lukaku' }, team: { displayName: 'Belgium' }, displayValue: '5', value: 5 }, { athlete: { displayName: 'Mohamed Salah' }, team: { displayName: 'Egypt' }, displayValue: '4', value: 4 }] },
      { displayName: 'Passes', leaders: [{ athlete: { displayName: 'Kevin De Bruyne' }, team: { displayName: 'Belgium' }, displayValue: '94', value: 94 }, { athlete: { displayName: 'Mohamed Salah' }, team: { displayName: 'Egypt' }, displayValue: '52', value: 52 }] },
      { displayName: 'Saves', leaders: [{ athlete: { displayName: 'Koen Casteels' }, team: { displayName: 'Belgium' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Mohamed El-Shenawy' }, team: { displayName: 'Egypt' }, displayValue: '5', value: 5 }] },
    ],
    h2h: { events: [] },
  },

  // ── mock-008: Spain 2–0 Uruguay ───────────────────────────────────────────────
  'mock-008': {
    boxscore: {
      teams: [
        {
          team: { displayName: 'Spain' },
          statistics: mkStats(8, 1, 0, 1, 6, 0, 67, 16, 7, 534, 21, 5),
        },
        {
          team: { displayName: 'Uruguay' },
          statistics: mkAwayStats(14, 2, 0, 3, 3, 5, 67, 7, 1, 267, 13, 22),
        },
      ],
    },
    keyEvents: [
      { clock: { displayValue: "28'" }, team: { displayName: 'Spain' }, text: "Goal! Spain 1, Uruguay 0. Lamine Yamal (Spain) cuts inside and fires into the far corner.", type: { text: 'Goal' } },
      { clock: { displayValue: "39'" }, team: { displayName: 'Uruguay' }, text: "José María Giménez (Uruguay) is shown the yellow card for a foul on Yamal.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "53'" }, team: { displayName: 'Uruguay' }, text: "Darwin Núñez (Uruguay) is shown the yellow card for dissent.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "71'" }, team: { displayName: 'Spain' }, text: "Goal! Spain 2, Uruguay 0. Nico Williams (Spain) slots home after a brilliant team move.", type: { text: 'Goal' } },
    ],
    leaders: [
      { displayName: 'Goals', leaders: [{ athlete: { displayName: 'Lamine Yamal' }, team: { displayName: 'Spain' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Nico Williams' }, team: { displayName: 'Spain' }, displayValue: '1', value: 1 }] },
      { displayName: 'Shots', leaders: [{ athlete: { displayName: 'Lamine Yamal' }, team: { displayName: 'Spain' }, displayValue: '5', value: 5 }, { athlete: { displayName: 'Darwin Núñez' }, team: { displayName: 'Uruguay' }, displayValue: '3', value: 3 }] },
      { displayName: 'Passes', leaders: [{ athlete: { displayName: 'Pedri' }, team: { displayName: 'Spain' }, displayValue: '97', value: 97 }, { athlete: { displayName: 'Rodrigo Bentancur' }, team: { displayName: 'Uruguay' }, displayValue: '44', value: 44 }] },
      { displayName: 'Saves', leaders: [{ athlete: { displayName: 'Unai Simón' }, team: { displayName: 'Spain' }, displayValue: '0', value: 0 }, { athlete: { displayName: 'Sergio Rochet' }, team: { displayName: 'Uruguay' }, displayValue: '5', value: 5 }] },
    ],
    h2h: { events: [] },
  },

  // ── mock-009: Czechia 1–1 South Africa (LIVE 67') ────────────────────────────
  'mock-009': {
    boxscore: {
      teams: [
        {
          team: { displayName: 'Czechia' },
          statistics: mkStats(9, 1, 0, 2, 4, 2, 52, 9, 3, 312, 13, 8),
        },
        {
          team: { displayName: 'South Africa' },
          statistics: mkAwayStats(11, 2, 0, 3, 3, 2, 52, 7, 3, 288, 14, 12),
        },
      ],
    },
    keyEvents: [
      { clock: { displayValue: "32'" }, team: { displayName: 'Czechia' }, text: "Goal! Czechia 1, South Africa 0. Tomáš Souček (Czechia) heads home from a corner.", type: { text: 'Goal' } },
      { clock: { displayValue: "44'" }, team: { displayName: 'South Africa' }, text: "Themba Zwane (South Africa) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
      { clock: { displayValue: "58'" }, team: { displayName: 'South Africa' }, text: "Goal! Czechia 1, South Africa 1. Percy Tau (South Africa) equalises with a cool finish.", type: { text: 'Goal' } },
      { clock: { displayValue: "64'" }, team: { displayName: 'Czechia' }, text: "Vladimír Coufal (Czechia) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
    ],
    leaders: [
      { displayName: 'Goals', leaders: [{ athlete: { displayName: 'Tomáš Souček' }, team: { displayName: 'Czechia' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Percy Tau' }, team: { displayName: 'South Africa' }, displayValue: '1', value: 1 }] },
      { displayName: 'Shots', leaders: [{ athlete: { displayName: 'Tomáš Souček' }, team: { displayName: 'Czechia' }, displayValue: '3', value: 3 }, { athlete: { displayName: 'Percy Tau' }, team: { displayName: 'South Africa' }, displayValue: '3', value: 3 }] },
      { displayName: 'Passes', leaders: [{ athlete: { displayName: 'Tomáš Souček' }, team: { displayName: 'Czechia' }, displayValue: '58', value: 58 }, { athlete: { displayName: 'Themba Zwane' }, team: { displayName: 'South Africa' }, displayValue: '52', value: 52 }] },
      { displayName: 'Saves', leaders: [{ athlete: { displayName: 'Jiří Staněk' }, team: { displayName: 'Czechia' }, displayValue: '2', value: 2 }, { athlete: { displayName: 'Ronwen Williams' }, team: { displayName: 'South Africa' }, displayValue: '2', value: 2 }] },
    ],
    h2h: { events: [] },
  },

  // ── mock-010: Canada 1–0 Bosnia-Herzegovina (HT) ─────────────────────────────
  'mock-010': {
    boxscore: {
      teams: [
        {
          team: { displayName: 'Canada' },
          statistics: mkStats(7, 1, 0, 1, 3, 1, 53, 7, 3, 298, 11, 6),
        },
        {
          team: { displayName: 'Bosnia-Herzegovina' },
          statistics: mkAwayStats(9, 1, 0, 2, 2, 2, 53, 5, 1, 271, 12, 9),
        },
      ],
    },
    keyEvents: [
      { clock: { displayValue: "38'" }, team: { displayName: 'Canada' }, text: "Goal! Canada 1, Bosnia-Herzegovina 0. Alphonso Davies (Canada) fires home from the edge of the box.", type: { text: 'Goal' } },
      { clock: { displayValue: "42'" }, team: { displayName: 'Bosnia-Herzegovina' }, text: "Edin Džeko (Bosnia-Herzegovina) is shown the yellow card for a foul.", type: { text: 'Yellow Card' } },
    ],
    leaders: [
      { displayName: 'Goals', leaders: [{ athlete: { displayName: 'Alphonso Davies' }, team: { displayName: 'Canada' }, displayValue: '1', value: 1 }] },
      { displayName: 'Shots', leaders: [{ athlete: { displayName: 'Alphonso Davies' }, team: { displayName: 'Canada' }, displayValue: '3', value: 3 }, { athlete: { displayName: 'Edin Džeko' }, team: { displayName: 'Bosnia-Herzegovina' }, displayValue: '2', value: 2 }] },
      { displayName: 'Passes', leaders: [{ athlete: { displayName: 'Jonathan David' }, team: { displayName: 'Canada' }, displayValue: '44', value: 44 }, { athlete: { displayName: 'Miralem Pjanić' }, team: { displayName: 'Bosnia-Herzegovina' }, displayValue: '48', value: 48 }] },
      { displayName: 'Saves', leaders: [{ athlete: { displayName: 'Maxime Crépeau' }, team: { displayName: 'Canada' }, displayValue: '1', value: 1 }, { athlete: { displayName: 'Kenan Pirić' }, team: { displayName: 'Bosnia-Herzegovina' }, displayValue: '2', value: 2 }] },
    ],
    h2h: { events: [] },
  },
}
