// World Cup 2026 constants — all 48 teams, groups, FIFA rankings, rivalry pairs

/** Tournament start date */
export const WC_START = new Date('2026-06-11')

/** Group stage ends */
export const WC_GROUP_END = new Date('2026-07-02')

/** Knockout stage starts */
export const WC_KNOCKOUT_START = new Date('2026-07-04')

/** Final */
export const WC_FINAL = new Date('2026-07-19')

// ---------------------------------------------------------------------------
// Teams — ESPN team ID, display name, ISO 3166-1 alpha-2 code, FIFA ranking
// ---------------------------------------------------------------------------
export interface WCTeam {
  id: string
  name: string
  shortName?: string // compact display name for tight spaces (falls back to name)
  abbrev: string
  iso2: string // for country-flag-icons
  fifaRank: number
  group: string
  color: string
  altColor: string
  /** Text color to use on top of `color` background — chosen for contrast */
  textColor: string
}

export const WC_TEAMS: WCTeam[] = [
  // Group A
  {
    id: '203',
    name: 'Mexico',
    abbrev: 'MEX',
    iso2: 'MX',
    fifaRank: 16,
    group: 'A',
    color: '006847', // green
    altColor: 'ce1126',
    textColor: 'ffffff', // white on green
  },
  {
    id: '451',
    name: 'South Korea',
    shortName: 'Korea',
    abbrev: 'KOR',
    iso2: 'KR',
    fifaRank: 22,
    group: 'A',
    color: 'c60c30', // red
    altColor: '003478',
    textColor: 'ffffff', // white on red
  },
  {
    id: '450',
    name: 'Czechia',
    abbrev: 'CZE',
    iso2: 'CZ',
    fifaRank: 37,
    group: 'A',
    color: 'd7141a', // red
    altColor: '11457e',
    textColor: 'ffffff', // white on red
  },
  {
    id: '467',
    name: 'South Africa',
    shortName: 'South Africa',
    abbrev: 'RSA',
    iso2: 'ZA',
    fifaRank: 60,
    group: 'A',
    color: '007a4d', // green
    altColor: 'ffb612',
    textColor: 'ffb612', // gold on green
  },
  // Group B
  {
    id: '206',
    name: 'Canada',
    abbrev: 'CAN',
    iso2: 'CA',
    fifaRank: 47,
    group: 'B',
    color: 'ff0000', // red
    altColor: 'ffffff',
    textColor: 'ffffff', // white on red
  },
  {
    id: '452',
    name: 'Bosnia-Herzegovina',
    shortName: 'Bosnia-Herz.',
    abbrev: 'BIH',
    iso2: 'BA',
    fifaRank: 65,
    group: 'B',
    color: '002395', // blue
    altColor: 'fecb00',
    textColor: 'fecb00', // yellow on blue
  },
  {
    id: '475',
    name: 'Switzerland',
    abbrev: 'SUI',
    iso2: 'CH',
    fifaRank: 19,
    group: 'B',
    color: 'ff0000', // red
    altColor: 'ffffff',
    textColor: 'ffffff', // white on red
  },
  {
    id: '4398',
    name: 'Qatar',
    abbrev: 'QAT',
    iso2: 'QA',
    fifaRank: 58,
    group: 'B',
    color: '8d1b3d', // maroon
    altColor: 'ffffff',
    textColor: 'ffffff', // white on maroon
  },
  // Group C
  {
    id: '205',
    name: 'Brazil',
    abbrev: 'BRA',
    iso2: 'BR',
    fifaRank: 5,
    group: 'C',
    color: '009c3b', // green
    altColor: 'ffdf00',
    textColor: 'ffdf00', // yellow on green
  },
  {
    id: '580',
    name: 'Scotland',
    abbrev: 'SCO',
    iso2: 'GB-SCT',
    fifaRank: 39,
    group: 'C',
    color: '003078', // dark blue
    altColor: 'ffffff',
    textColor: 'ffffff', // white on dark blue
  },
  {
    id: '2654',
    name: 'Haiti',
    abbrev: 'HAI',
    iso2: 'HT',
    fifaRank: 83,
    group: 'C',
    color: '00209f', // blue
    altColor: 'd21034',
    textColor: 'ffffff', // white on blue
  },
  {
    id: '2869',
    name: 'Morocco',
    abbrev: 'MAR',
    iso2: 'MA',
    fifaRank: 14,
    group: 'C',
    color: 'c1272d', // red
    altColor: '006233',
    textColor: 'ffffff', // white on red
  },
  // Group D
  {
    id: '210',
    name: 'Paraguay',
    abbrev: 'PAR',
    iso2: 'PY',
    fifaRank: 62,
    group: 'D',
    color: 'd52b1e', // red
    altColor: '0038a8',
    textColor: 'ffffff', // white on red
  },
  {
    id: '465',
    name: 'Türkiye',
    abbrev: 'TUR',
    iso2: 'TR',
    fifaRank: 26,
    group: 'D',
    color: 'e30a17', // red
    altColor: 'ffffff',
    textColor: 'ffffff', // white on red
  },
  {
    id: '628',
    name: 'Australia',
    abbrev: 'AUS',
    iso2: 'AU',
    fifaRank: 23,
    group: 'D',
    color: '00843d', // green
    altColor: 'ffcd00',
    textColor: 'ffcd00', // gold on green
  },
  {
    id: '660',
    name: 'United States',
    shortName: 'USA',
    abbrev: 'USA',
    iso2: 'US',
    fifaRank: 11,
    group: 'D',
    color: 'b22234', // red
    altColor: '3c3b6e',
    textColor: 'ffffff', // white on red
  },
  // Group E
  {
    id: '209',
    name: 'Ecuador',
    abbrev: 'ECU',
    iso2: 'EC',
    fifaRank: 44,
    group: 'E',
    color: 'ffd100', // yellow
    altColor: '003087',
    textColor: '003087', // navy on yellow
  },
  {
    id: '481',
    name: 'Germany',
    abbrev: 'GER',
    iso2: 'DE',
    fifaRank: 12,
    group: 'E',
    color: '000000', // black
    altColor: 'dd0000',
    textColor: 'ffffff', // white on black
  },
  {
    id: '4789',
    name: 'Ivory Coast',
    abbrev: 'CIV',
    iso2: 'CI',
    fifaRank: 29,
    group: 'E',
    color: 'f77f00', // orange
    altColor: '009a44',
    textColor: 'ffffff', // white on orange
  },
  {
    id: '11678',
    name: 'Curacao',
    abbrev: 'CUW',
    iso2: 'CW',
    fifaRank: 88,
    group: 'E',
    color: '002b7f', // blue
    altColor: 'f9e814',
    textColor: 'f9e814', // yellow on blue
  },
  // Group F
  {
    id: '449',
    name: 'Netherlands',
    abbrev: 'NED',
    iso2: 'NL',
    fifaRank: 7,
    group: 'F',
    color: 'ff6600', // orange
    altColor: '003087',
    textColor: 'ffffff', // white on orange
  },
  {
    id: '466',
    name: 'Sweden',
    abbrev: 'SWE',
    iso2: 'SE',
    fifaRank: 25,
    group: 'F',
    color: '006aa7', // blue
    altColor: 'fecc02',
    textColor: 'fecc02', // yellow on blue
  },
  {
    id: '627',
    name: 'Japan',
    abbrev: 'JPN',
    iso2: 'JP',
    fifaRank: 15,
    group: 'F',
    color: 'bc002d', // red
    altColor: 'ffffff',
    textColor: 'ffffff', // white on red
  },
  {
    id: '659',
    name: 'Tunisia',
    abbrev: 'TUN',
    iso2: 'TN',
    fifaRank: 30,
    group: 'F',
    color: 'e70013', // red
    altColor: 'ffffff',
    textColor: 'ffffff', // white on red
  },
  // Group G
  {
    id: '459',
    name: 'Belgium',
    abbrev: 'BEL',
    iso2: 'BE',
    fifaRank: 3,
    group: 'G',
    color: 'ef3340', // red
    altColor: 'ffd900',
    textColor: 'ffd900', // yellow on red
  },
  {
    id: '469',
    name: 'Iran',
    abbrev: 'IRN',
    iso2: 'IR',
    fifaRank: 21,
    group: 'G',
    color: '239f40', // green
    altColor: 'da0000',
    textColor: 'ffffff', // white on green
  },
  {
    id: '2620',
    name: 'Egypt',
    abbrev: 'EGY',
    iso2: 'EG',
    fifaRank: 34,
    group: 'G',
    color: 'ce1126', // red
    altColor: 'ffffff',
    textColor: 'ffffff', // white on red
  },
  {
    id: '2666',
    name: 'New Zealand',
    shortName: 'New Zealand',
    abbrev: 'NZL',
    iso2: 'NZ',
    fifaRank: 97,
    group: 'G',
    color: '000000', // black (All Blacks)
    altColor: 'cc142b',
    textColor: 'ffffff', // white on black
  },
  // Group H
  {
    id: '164',
    name: 'Spain',
    abbrev: 'ESP',
    iso2: 'ES',
    fifaRank: 2,
    group: 'H',
    color: 'aa151b', // red
    altColor: 'f1bf00',
    textColor: 'f1bf00', // gold on red
  },
  {
    id: '212',
    name: 'Uruguay',
    abbrev: 'URU',
    iso2: 'UY',
    fifaRank: 17,
    group: 'H',
    color: '5aaaa8', // sky blue
    altColor: 'ffffff',
    textColor: 'ffffff', // white on sky blue
  },
  {
    id: '655',
    name: 'Saudi Arabia',
    shortName: 'Saudi Arabia',
    abbrev: 'KSA',
    iso2: 'SA',
    fifaRank: 56,
    group: 'H',
    color: '006c35', // green
    altColor: 'ffffff',
    textColor: 'ffffff', // white on green
  },
  {
    id: '2597',
    name: 'Cape Verde',
    abbrev: 'CPV',
    iso2: 'CV',
    fifaRank: 71,
    group: 'H',
    color: '003893', // blue
    altColor: 'cf2027',
    textColor: 'ffffff', // white on blue
  },
  // Group I
  {
    id: '464',
    name: 'Norway',
    abbrev: 'NOR',
    iso2: 'NO',
    fifaRank: 20,
    group: 'I',
    color: 'ef2b2d', // red
    altColor: 'ffffff',
    textColor: 'ffffff', // white on red
  },
  {
    id: '478',
    name: 'France',
    abbrev: 'FRA',
    iso2: 'FR',
    fifaRank: 1,
    group: 'I',
    color: '002395', // blue
    altColor: 'ed2939',
    textColor: 'ffffff', // white on blue
  },
  {
    id: '654',
    name: 'Senegal',
    abbrev: 'SEN',
    iso2: 'SN',
    fifaRank: 18,
    group: 'I',
    color: '00853f', // green
    altColor: 'fdef42',
    textColor: 'fdef42', // yellow on green
  },
  {
    id: '4375',
    name: 'Iraq',
    abbrev: 'IRQ',
    iso2: 'IQ',
    fifaRank: 63,
    group: 'I',
    color: 'ce1126', // red
    altColor: '007a3d',
    textColor: 'ffffff', // white on red
  },
  // Group J
  {
    id: '202',
    name: 'Argentina',
    abbrev: 'ARG',
    iso2: 'AR',
    fifaRank: 4,
    group: 'J',
    color: '74acdf', // sky blue
    altColor: 'ffffff',
    textColor: 'ffffff', // white on sky blue
  },
  {
    id: '474',
    name: 'Austria',
    abbrev: 'AUT',
    iso2: 'AT',
    fifaRank: 24,
    group: 'J',
    color: 'ed2939', // red
    altColor: 'ffffff',
    textColor: 'ffffff', // white on red
  },
  {
    id: '624',
    name: 'Algeria',
    abbrev: 'ALG',
    iso2: 'DZ',
    fifaRank: 35,
    group: 'J',
    color: '006233', // green
    altColor: 'd21034',
    textColor: 'ffffff', // white on green
  },
  {
    id: '2917',
    name: 'Jordan',
    abbrev: 'JOR',
    iso2: 'JO',
    fifaRank: 74,
    group: 'J',
    color: '007a3d', // green
    altColor: 'ce1126',
    textColor: 'ffffff', // white on green
  },
  // Group K
  {
    id: '208',
    name: 'Colombia',
    abbrev: 'COL',
    iso2: 'CO',
    fifaRank: 9,
    group: 'K',
    color: 'fcd116', // yellow
    altColor: '003087',
    textColor: '003087', // navy on yellow
  },
  {
    id: '482',
    name: 'Portugal',
    abbrev: 'POR',
    iso2: 'PT',
    fifaRank: 6,
    group: 'K',
    color: '006600', // green
    altColor: 'ff0000',
    textColor: 'ffffff', // white on green
  },
  {
    id: '2570',
    name: 'Uzbekistan',
    abbrev: 'UZB',
    iso2: 'UZ',
    fifaRank: 69,
    group: 'K',
    color: '1eb53a', // green
    altColor: 'ffffff',
    textColor: 'ffffff', // white on green
  },
  {
    id: '2850',
    name: 'Congo DR',
    abbrev: 'COD',
    iso2: 'CD',
    fifaRank: 55,
    group: 'K',
    color: '007fff', // blue
    altColor: 'f7d618',
    textColor: 'f7d618', // yellow on blue
  },
  // Group L
  {
    id: '448',
    name: 'England',
    abbrev: 'ENG',
    iso2: 'GB-ENG',
    fifaRank: 8,
    group: 'L',
    color: 'ffffff', // white
    altColor: 'cf081f',
    textColor: 'cf081f', // red on white
  },
  {
    id: '477',
    name: 'Croatia',
    abbrev: 'CRO',
    iso2: 'HR',
    fifaRank: 10,
    group: 'L',
    color: 'ff0000', // red
    altColor: '0000ff',
    textColor: 'ffffff', // white on red
  },
  {
    id: '2659',
    name: 'Panama',
    abbrev: 'PAN',
    iso2: 'PA',
    fifaRank: 79,
    group: 'L',
    color: 'da121a', // red
    altColor: '005293',
    textColor: 'ffffff', // white on red
  },
  {
    id: '4469',
    name: 'Ghana',
    abbrev: 'GHA',
    iso2: 'GH',
    fifaRank: 66,
    group: 'L',
    color: '006b3f', // green
    altColor: 'fcd116',
    textColor: 'fcd116', // gold on green
  },
]

// Map from ESPN display name → WCTeam for quick lookup
export const TEAM_BY_NAME = new Map<string, WCTeam>(
  WC_TEAMS.map((t) => [t.name, t])
)

// Map from ESPN display name → ISO2 code
export const ISO2_BY_NAME = new Map<string, string>(
  WC_TEAMS.map((t) => [t.name, t.iso2])
)

// Groups A–L
export const WC_GROUPS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
] as const
export type WCGroup = (typeof WC_GROUPS)[number]

// Classic rivalries — these get a quality bonus
export const RIVALRY_PAIRS: [string, string][] = [
  ['Brazil', 'Argentina'],
  ['England', 'Germany'],
  ['Spain', 'Portugal'],
  ['United States', 'Mexico'],
  ['Netherlands', 'Belgium'],
  ['France', 'Spain'],
  ['France', 'Germany'],
  ['Brazil', 'France'],
  ['Argentina', 'France'],
  ['England', 'France'],
  ['Germany', 'Netherlands'],
  ['Spain', 'Germany'],
  ['Brazil', 'Germany'],
  ['Argentina', 'Germany'],
  ['England', 'Argentina'],
  ['Brazil', 'England'],
  ['Colombia', 'Argentina'],
  ['Uruguay', 'Argentina'],
  ['Uruguay', 'Brazil'],
  ['Mexico', 'United States'],
  ['Japan', 'South Korea'],
  ['Morocco', 'Algeria'],
  ['Senegal', 'Ivory Coast'],
  ['Egypt', 'Morocco'],
]

// ESPN country logo URL helper
export function espnLogoUrl(abbrev: string): string {
  return `https://a.espncdn.com/i/teamlogos/countries/500/${abbrev.toLowerCase()}.png`
}
