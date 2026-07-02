export default defineEventHandler(async () => {
  const url =
    'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/statistics'

  const data = await $fetch<any>(url)

  const abbrevToIso2: Record<string, string> = {
    ALG: 'DZ',
    ARG: 'AR',
    AUS: 'AU',
    AUT: 'AT',
    BEL: 'BE',
    BIH: 'BA',
    BRA: 'BR',
    CAN: 'CA',
    CPV: 'CV',
    COD: 'CD',
    COL: 'CO',
    CRC: 'CR',
    CRO: 'HR',
    CZE: 'CZ',
    CUW: 'CW',
    ECU: 'EC',
    EGY: 'EG',
    ENG: 'GB-ENG',
    ESP: 'ES',
    FRA: 'FR',
    GER: 'DE',
    GHA: 'GH',
    HTI: 'HT',
    IRN: 'IR',
    IRQ: 'IQ',
    ITA: 'IT',
    CIV: 'CI',
    JAP: 'JP',
    JPN: 'JP',
    JOR: 'JO',
    KOR: 'KR',
    MAR: 'MA',
    MEX: 'MX',
    NED: 'NL',
    NOR: 'NO',
    NZL: 'NZ',
    PAN: 'PA',
    PAR: 'PY',
    POR: 'PT',
    QAT: 'QA',
    RSA: 'ZA',
    SAU: 'SA',
    SCO: 'GB-SCT',
    SEN: 'SN',
    SUI: 'CH',
    SWE: 'SE',
    TUN: 'TN',
    TUR: 'TR',
    URU: 'UY',
    USA: 'US',
    UZB: 'UZ',
  }

  type Leader = {
    name: string
    shortName: string
    teamName: string
    teamAbbrev: string
    iso2: string
    appearances: number
    goals: number
    assists: number
    ga: number
  }

  const allLeaders: Leader[] = []
  const seen = new Set<string>()

  for (const cat of data.stats ?? []) {
    for (const entry of cat.leaders ?? []) {
      const a = entry.athlete
      if (!a || seen.has(a.id)) continue
      seen.add(a.id)

      const abbrev = (a.team?.abbreviation ?? '').toUpperCase()
      const iso2 = abbrevToIso2[abbrev] ?? ''

      const stats = a.statistics ?? []
      const get = (name: string) =>
        stats.find((s: any) => s.name === name)?.value ?? 0

      allLeaders.push({
        name: a.displayName,
        shortName: a.shortName ?? a.displayName,
        teamName: a.team?.displayName ?? '',
        teamAbbrev: abbrev,
        iso2,
        appearances: get('appearances'),
        goals: get('totalGoals'),
        assists: get('goalAssists'),
        ga: get('totalGoals') + get('goalAssists'),
      })
    }
  }

  const topScorers = [...allLeaders]
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, 10)

  const topAssists = [...allLeaders]
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
    .slice(0, 10)

  return { topScorers, topAssists }
})
