// World Cup 2026 constants — all 48 teams, groups, FIFA rankings, rivalry pairs

/** Tournament start date */
export const WC_START = new Date('2026-06-11')

/** Group stage ends */
const WC_GROUP_END = new Date('2026-06-27')

/** Knockout stage starts */
const WC_KNOCKOUT_START = new Date('2026-06-28')

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
  /** Short bio shown in the Info tab of the match detail modal */
  bio?: string
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
    color: '006847',
    altColor: 'ce1126',
    textColor: 'ffffff',
    bio: "El Tri are one of CONCACAF's most storied sides, with seven consecutive World Cup round-of-16 appearances between 1994 and 2018. Powered by creative midfielder Edson Álvarez and striker Raúl Jiménez, Mexico play a high-energy pressing game and will be buoyed by co-hosting the tournament on home soil.",
  },
  {
    id: '451',
    name: 'South Korea',
    shortName: 'Korea',
    abbrev: 'KOR',
    iso2: 'KR',
    fifaRank: 22,
    group: 'A',
    color: 'c60c30',
    altColor: '003478',
    textColor: 'ffffff',
    bio: "The Taeguk Warriors are Asia's most consistent World Cup performers, famously reaching the semi-finals on home soil in 2002. Son Heung-min, one of the world's most lethal forwards, leads a disciplined, counter-attacking side capable of upsetting any opponent.",
  },
  {
    id: '450',
    name: 'Czechia',
    abbrev: 'CZE',
    iso2: 'CZ',
    fifaRank: 37,
    group: 'A',
    color: 'd7141a',
    altColor: '11457e',
    textColor: 'ffffff',
    bio: "Making their first World Cup appearance as Czechia (formerly Czechoslovakia reached the final twice), this technically gifted side is built around Slavia Prague's core and Bundesliga exports. Midfielder Tomáš Souček provides power and goals from deep, while the team relies on compact defending and quick transitions.",
  },
  {
    id: '467',
    name: 'South Africa',
    shortName: 'S. Africa',
    abbrev: 'RSA',
    iso2: 'ZA',
    fifaRank: 60,
    group: 'A',
    color: '007a4d',
    altColor: 'ffb612',
    textColor: 'ffb612',
    bio: 'Bafana Bafana return to the World Cup for the first time since hosting in 2010, riding a wave of national excitement. Known for their physical, direct style, South Africa qualified through a strong AFCON campaign and will look to Percy Tau and Themba Zwane to provide the creative spark.',
  },
  // Group B
  {
    id: '206',
    name: 'Canada',
    abbrev: 'CAN',
    iso2: 'CA',
    fifaRank: 47,
    group: 'B',
    color: 'ff0000',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: "Canada's golden generation qualified for their first World Cup in 36 years in 2022 and are back again as co-hosts. Alphonso Davies — one of the fastest players on the planet — anchors a young, athletic squad that presses relentlessly and plays without fear.",
  },
  {
    id: '452',
    name: 'Bosnia-Herzegovina',
    shortName: 'Bosnia-Herz.',
    abbrev: 'BIH',
    iso2: 'BA',
    fifaRank: 65,
    group: 'B',
    color: '002395',
    altColor: 'fecb00',
    textColor: 'fecb00',
    bio: "The Dragons made their only World Cup appearance in 2014, where they showed real quality despite an early exit. Built around a core of Bundesliga and Serie A players, Bosnia rely on physicality and set-piece threat, with Edin Džeko's legacy inspiring a new generation of strikers.",
  },
  {
    id: '475',
    name: 'Switzerland',
    abbrev: 'SUI',
    iso2: 'CH',
    fifaRank: 19,
    group: 'B',
    color: 'ff0000',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: 'Switzerland are the ultimate overachievers — consistently punching above their weight at major tournaments. Granit Xhaka marshals a disciplined, well-organised midfield, and the Swiss have a knack for grinding out results against bigger nations. They reached the quarter-finals at Euro 2024.',
  },
  {
    id: '4398',
    name: 'Qatar',
    abbrev: 'QAT',
    iso2: 'QA',
    fifaRank: 58,
    group: 'B',
    color: '8d1b3d',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: 'Qatar became the first host nation to be eliminated in the group stage at their own 2022 World Cup, but the experience has hardened this young squad. Built through the Aspire Academy system, they play a possession-based game and will be motivated to prove themselves on the bigger stage.',
  },
  // Group C
  {
    id: '205',
    name: 'Brazil',
    abbrev: 'BRA',
    iso2: 'BR',
    fifaRank: 5,
    group: 'C',
    color: '009c3b',
    altColor: 'ffdf00',
    textColor: 'ffdf00',
    bio: 'The Seleção are the most successful nation in World Cup history with five titles, though the trophy has eluded them since 2002. Vinicius Jr. — electric, unpredictable, and devastating in the final third — leads a squad bursting with attacking talent including Rodrygo and Endrick. Brazil play with flair and intensity.',
  },
  {
    id: '580',
    name: 'Scotland',
    abbrev: 'SCO',
    iso2: 'GB-SCT',
    fifaRank: 39,
    group: 'C',
    color: '003078',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: 'Scotland return to the World Cup for the first time since 1998, ending a painful 28-year absence. The Tartan Army are known for their passionate support and a never-say-die attitude. Andy Robertson provides world-class quality at left-back, while Scott McTominay has emerged as a goal-scoring force from midfield.',
  },
  {
    id: '2654',
    name: 'Haiti',
    abbrev: 'HAI',
    iso2: 'HT',
    fifaRank: 83,
    group: 'C',
    color: '00209f',
    altColor: 'd21034',
    textColor: 'ffffff',
    bio: 'Haiti are making only their second World Cup appearance, having debuted in 1974. Qualifying through CONCACAF was a remarkable achievement for a nation that has overcome enormous adversity. The Grenadiers play with heart and pace, and their passionate fanbase will make them a crowd favourite.',
  },
  {
    id: '2869',
    name: 'Morocco',
    abbrev: 'MAR',
    iso2: 'MA',
    fifaRank: 14,
    group: 'C',
    color: 'c1272d',
    altColor: '006233',
    textColor: 'ffffff',
    bio: 'Morocco stunned the world at the 2022 World Cup, becoming the first African nation to reach the semi-finals. Achraf Hakimi is one of the best right-backs on the planet, and Sofyan Amrabat anchors a ferocious midfield. The Atlas Lions are compact, organised, and dangerous on the counter.',
  },
  // Group D
  {
    id: '210',
    name: 'Paraguay',
    abbrev: 'PAR',
    iso2: 'PY',
    fifaRank: 62,
    group: 'D',
    color: 'd52b1e',
    altColor: '0038a8',
    textColor: 'ffffff',
    bio: 'Los Guaraníes are a tough, physical South American side with a proud World Cup history — they reached the quarter-finals in 2010. Known for their defensive resilience and set-piece threat, Paraguay qualified through a competitive CONMEBOL campaign and will be difficult to break down.',
  },
  {
    id: '465',
    name: 'Türkiye',
    abbrev: 'TUR',
    iso2: 'TR',
    fifaRank: 26,
    group: 'D',
    color: 'e30a17',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: "Turkey are back at the World Cup for the first time since their remarkable third-place finish in 2002. Hakan Çalhanoğlu — one of Europe's best deep-lying playmakers — controls the tempo from midfield, while Arda Güler has emerged as one of the most exciting young talents in world football.",
  },
  {
    id: '628',
    name: 'Australia',
    abbrev: 'AUS',
    iso2: 'AU',
    fifaRank: 23,
    group: 'D',
    color: '00843d',
    altColor: 'ffcd00',
    textColor: 'ffcd00',
    bio: 'The Socceroos reached the quarter-finals at the 2022 World Cup, their best result since 2006, and arrive with growing confidence. Mathew Ryan is a reliable goalkeeper, while the squad blends experienced A-League players with European-based talent. Australia are hard-working, well-organised, and dangerous from set pieces.',
  },
  {
    id: '660',
    name: 'United States',
    shortName: 'USA',
    abbrev: 'USA',
    iso2: 'US',
    fifaRank: 11,
    group: 'D',
    color: '0099ff',
    altColor: 'b22234',
    textColor: 'ffffff',
    bio: 'The USMNT are co-hosting the tournament and arrive with their most talented generation in history. Christian Pulisic leads a squad packed with Premier League and Champions League regulars. Weston McKennie, Tyler Adams, and Gio Reyna give the US genuine quality in every area of the pitch.',
  },
  // Group E
  {
    id: '209',
    name: 'Ecuador',
    abbrev: 'ECU',
    iso2: 'EC',
    fifaRank: 44,
    group: 'E',
    color: 'ffd100',
    altColor: '003087',
    textColor: '003087',
    bio: "La Tri opened the 2022 World Cup with a win over hosts Qatar and are building on that momentum. Enner Valencia — Ecuador's all-time top scorer — remains a constant threat, and the team plays a direct, physical style that makes them difficult to contain. They qualified comfortably through CONMEBOL.",
  },
  {
    id: '481',
    name: 'Germany',
    abbrev: 'GER',
    iso2: 'DE',
    fifaRank: 12,
    group: 'E',
    color: '000000',
    altColor: 'dd0000',
    textColor: 'ffffff',
    bio: "Die Mannschaft are four-time world champions hungry to end a recent run of early exits. Florian Wirtz — arguably the most gifted young player in Europe — pulls the strings in a revamped attacking system under Julian Nagelsmann. Jamal Musiala adds electric dribbling, and Germany's depth across the squad is formidable.",
  },
  {
    id: '4789',
    name: 'Ivory Coast',
    abbrev: 'CIV',
    iso2: 'CI',
    fifaRank: 29,
    group: 'E',
    color: 'f77f00',
    altColor: '009a44',
    textColor: 'ffffff',
    bio: "The Elephants are reigning African champions after winning AFCON 2024 on home soil. Sébastien Haller has overcome a serious illness to lead the attack, while Franck Kessié provides power and goals from midfield. Ivory Coast play an expansive, attacking game and are one of Africa's most dangerous sides.",
  },
  {
    id: '11678',
    name: 'Curaçao',
    abbrev: 'CUW',
    iso2: 'CW',
    fifaRank: 88,
    group: 'E',
    color: '002b7f',
    altColor: 'f9e814',
    textColor: 'f9e814',
    bio: 'Curaçao are making their first-ever World Cup appearance, a stunning achievement for the small Caribbean island nation. Leandro Bacuna and Cuco Martina have been stalwarts of the squad, and the team qualified through a spirited CONCACAF campaign. Their debut on the world stage is a historic moment for the island.',
  },
  // Group F
  {
    id: '449',
    name: 'Netherlands',
    abbrev: 'NED',
    iso2: 'NL',
    fifaRank: 7,
    group: 'F',
    color: 'ff6600',
    altColor: '003087',
    textColor: 'ffffff',
    bio: "Three-time World Cup finalists, the Oranje are always dangerous. Virgil van Dijk is one of the world's best defenders, while Cody Gakpo and Memphis Depay provide firepower up front. The Dutch reached the quarter-finals in 2022 and have the quality to go deep in this tournament.",
  },
  {
    id: '466',
    name: 'Sweden',
    abbrev: 'SWE',
    iso2: 'SE',
    fifaRank: 25,
    group: 'F',
    color: '006aa7',
    altColor: 'fecc02',
    textColor: 'fecc02',
    bio: "Sweden are a model of consistency — well-organised, physically imposing, and difficult to beat. Alexander Isak has emerged as one of Europe's most clinical strikers at Newcastle United, and Dejan Kulusevski adds creativity from wide areas. Sweden reached the quarter-finals in 2018 and will be competitive again.",
  },
  {
    id: '627',
    name: 'Japan',
    abbrev: 'JPN',
    iso2: 'JP',
    fifaRank: 15,
    group: 'F',
    color: 'bc002d',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: 'Japan are Asia\'s most exciting team, having topped a group containing Germany and Spain at the 2022 World Cup. Takefusa Kubo — the "Japanese Messi" — dazzles with his dribbling, while Ritsu Doan and Kaoru Mitoma provide pace and goals from wide. The Samurai Blue press relentlessly and play without fear.',
  },
  {
    id: '659',
    name: 'Tunisia',
    abbrev: 'TUN',
    iso2: 'TN',
    fifaRank: 30,
    group: 'F',
    color: 'e70013',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: "The Eagles of Carthage are one of Africa's most experienced World Cup nations, making their sixth appearance. Youssef Msakni and Wahbi Khazri have been the creative heartbeat of the team, and Tunisia are known for their defensive solidity and ability to frustrate bigger opponents.",
  },
  // Group G
  {
    id: '459',
    name: 'Belgium',
    abbrev: 'BEL',
    iso2: 'BE',
    fifaRank: 3,
    group: 'G',
    color: 'ef3340',
    altColor: 'ffd900',
    textColor: 'ffd900',
    bio: 'Belgium\'s "golden generation" may be fading, but the Red Devils remain a formidable force. Kevin De Bruyne — widely regarded as the best midfielder in the world — can unlock any defence, while Romelu Lukaku\'s physical presence up front is a constant threat. Belgium finished third at the 2018 World Cup.',
  },
  {
    id: '469',
    name: 'Iran',
    abbrev: 'IRN',
    iso2: 'IR',
    fifaRank: 21,
    group: 'G',
    color: '239f40',
    altColor: 'da0000',
    textColor: 'ffffff',
    bio: 'Team Melli are Asia\'s most consistent qualifiers and have improved significantly under Carlos Queiroz. Sardar Azmoun — the "Iranian Messi" — is a technically gifted striker who plays in Europe\'s top leagues. Iran are defensively disciplined and capable of causing upsets on the counter-attack.',
  },
  {
    id: '2620',
    name: 'Egypt',
    abbrev: 'EGY',
    iso2: 'EG',
    fifaRank: 34,
    group: 'G',
    color: 'ce1126',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: "The Pharaohs are back at the World Cup for the first time since 1990, powered by the brilliance of Mohamed Salah. One of the world's best players, Salah carries enormous responsibility for Egypt's attacking play. The team is defensively solid and will look to Salah to produce moments of magic when it matters most.",
  },
  {
    id: '2666',
    name: 'New Zealand',
    abbrev: 'NZL',
    iso2: 'NZ',
    fifaRank: 97,
    group: 'G',
    color: '000000',
    altColor: 'cc142b',
    textColor: 'ffffff',
    bio: 'The All Whites are making only their third World Cup appearance, having famously gone unbeaten in 2010. A compact, hard-working side, New Zealand qualified through the OFC and will look to Chris Wood — a proven Premier League striker — to provide the goals. They will be competitive underdogs in every match.',
  },
  // Group H
  {
    id: '164',
    name: 'Spain',
    abbrev: 'ESP',
    iso2: 'ES',
    fifaRank: 2,
    group: 'H',
    color: 'aa151b',
    altColor: 'f1bf00',
    textColor: 'f1bf00',
    bio: 'La Roja are reigning European champions after their stunning Euro 2024 triumph, playing some of the most beautiful football in the world. Lamine Yamal — a teenager of extraordinary talent — and Nico Williams terrorise defences from wide, while Pedri and Rodri control the midfield. Spain are genuine title contenders.',
  },
  {
    id: '212',
    name: 'Uruguay',
    abbrev: 'URU',
    iso2: 'UY',
    fifaRank: 17,
    group: 'H',
    color: '5aaaa8',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: 'La Celeste are two-time world champions with a proud tradition of producing world-class strikers. Darwin Núñez brings explosive pace and power up front, while Federico Valverde is one of the most complete midfielders in world football. Uruguay are always competitive and never easy to beat.',
  },
  {
    id: '655',
    name: 'Saudi Arabia',
    shortName: 'Saudi Arabia',
    abbrev: 'KSA',
    iso2: 'SA',
    fifaRank: 56,
    group: 'H',
    color: '006c35',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: 'Saudi Arabia produced one of the greatest World Cup upsets in 2022, defeating Argentina in the group stage. The Green Falcons are well-organised and dangerous on the counter, and the influx of world-class players into the Saudi Pro League has raised the profile and quality of the national team.',
  },
  {
    id: '2597',
    name: 'Cape Verde',
    abbrev: 'CPV',
    iso2: 'CV',
    fifaRank: 71,
    group: 'H',
    color: '003893',
    altColor: 'cf2027',
    textColor: 'ffffff',
    bio: "Cape Verde are making their first World Cup appearance, a remarkable achievement for an island nation of just 600,000 people. The Blue Sharks qualified through a strong AFCON campaign and are known for their energetic, pressing style. Several players ply their trade in Portugal's Primeira Liga.",
  },
  // Group I
  {
    id: '464',
    name: 'Norway',
    abbrev: 'NOR',
    iso2: 'NO',
    fifaRank: 20,
    group: 'I',
    color: 'ef2b2d',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: 'Norway return to the World Cup for the first time since 2002, and the reason is simple: Erling Haaland. The Manchester City striker is arguably the most lethal finisher in world football, and his presence alone makes Norway a dangerous proposition. Martin Ødegaard provides the creativity to supply him.',
  },
  {
    id: '478',
    name: 'France',
    abbrev: 'FRA',
    iso2: 'FR',
    fifaRank: 1,
    group: 'I',
    color: '002395',
    altColor: 'ed2939',
    textColor: 'ffffff',
    bio: "Les Bleus are the reigning world champions and the top-ranked team in the world. Kylian Mbappé — the most expensive player in history — leads an attack of frightening depth, while N'Golo Kanté and Aurélien Tchouaméni provide steel in midfield. France are the team to beat at every major tournament.",
  },
  {
    id: '654',
    name: 'Senegal',
    abbrev: 'SEN',
    iso2: 'SN',
    fifaRank: 18,
    group: 'I',
    color: '00853f',
    altColor: 'fdef42',
    textColor: 'fdef42',
    bio: "Senegal are reigning African champions and one of the continent's most complete teams. Sadio Mané — a Champions League winner and African Player of the Year — leads by example, while Kalidou Koulibaly anchors a formidable defence. The Lions of Teranga reached the quarter-finals in 2002 and have the quality to go further.",
  },
  {
    id: '4375',
    name: 'Iraq',
    abbrev: 'IRQ',
    iso2: 'IQ',
    fifaRank: 63,
    group: 'I',
    color: 'ce1126',
    altColor: '007a3d',
    textColor: 'ffffff',
    bio: 'Iraq are making their second World Cup appearance, having debuted in 1986. The Lions of Mesopotamia qualified through the AFC and have been improving steadily under a new generation of players. Aymen Hussein is their most dangerous attacker, and the team plays with passion and physicality.',
  },
  // Group J
  {
    id: '202',
    name: 'Argentina',
    abbrev: 'ARG',
    iso2: 'AR',
    fifaRank: 4,
    group: 'J',
    color: '74acdf',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: 'Argentina are the reigning world champions, having ended their 36-year wait for the title in Qatar 2022. Lionel Messi — widely considered the greatest player of all time — leads a squad that also features Julián Álvarez and Rodrigo De Paul. La Albiceleste are defending champions and will be desperate to retain the trophy.',
  },
  {
    id: '474',
    name: 'Austria',
    abbrev: 'AUT',
    iso2: 'AT',
    fifaRank: 24,
    group: 'J',
    color: 'ed2939',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: 'Austria are making their first World Cup appearance since 1998, ending a long absence. David Alaba — a Champions League winner with Real Madrid — is the heartbeat of the team, while Marcel Sabitzer provides energy and goals from midfield. Austria qualified impressively through UEFA and will be no pushover.',
  },
  {
    id: '624',
    name: 'Algeria',
    abbrev: 'ALG',
    iso2: 'DZ',
    fifaRank: 35,
    group: 'J',
    color: '006233',
    altColor: 'd21034',
    textColor: 'ffffff',
    bio: "The Desert Foxes are one of Africa's most talented nations, with a squad packed with Ligue 1 and Serie A players. Riyad Mahrez — a Premier League champion with Manchester City — is their most dangerous player, capable of producing moments of brilliance. Algeria play attractive, attacking football.",
  },
  {
    id: '2917',
    name: 'Jordan',
    abbrev: 'JOR',
    iso2: 'JO',
    fifaRank: 74,
    group: 'J',
    color: '007a3d',
    altColor: 'ce1126',
    textColor: 'ffffff',
    bio: 'Jordan are making their first-ever World Cup appearance, having qualified through the AFC. The Nashama — meaning "brave ones" — are a disciplined, well-organised side that reached the final of the 2023 Asian Cup. Musa Al-Taamari is their most creative player, and the team will draw on enormous national pride.',
  },
  // Group K
  {
    id: '208',
    name: 'Colombia',
    abbrev: 'COL',
    iso2: 'CO',
    fifaRank: 9,
    group: 'K',
    color: 'fcd116',
    altColor: '003087',
    textColor: '003087',
    bio: "Los Cafeteros are one of South America's most exciting teams, playing fast, attacking football with flair. Luis Díaz — Liverpool's electric winger — is their standout player, while James Rodríguez continues to pull the strings in midfield. Colombia reached the Copa América final in 2024 and are a genuine dark horse.",
  },
  {
    id: '482',
    name: 'Portugal',
    abbrev: 'POR',
    iso2: 'PT',
    fifaRank: 6,
    group: 'K',
    color: '006600',
    altColor: 'ff0000',
    textColor: 'ffffff',
    bio: 'Portugal have never won the World Cup but possess one of the most talented squads in the tournament. Cristiano Ronaldo — the all-time top scorer in international football — leads the attack, while Bruno Fernandes and Bernardo Silva provide world-class quality in midfield. Portugal play attractive, attacking football.',
  },
  {
    id: '2570',
    name: 'Uzbekistan',
    abbrev: 'UZB',
    iso2: 'UZ',
    fifaRank: 69,
    group: 'K',
    color: '1eb53a',
    altColor: 'ffffff',
    textColor: 'ffffff',
    bio: "Uzbekistan are making their first World Cup appearance, a historic milestone for Central Asian football. The White Wolves qualified through the AFC and have been one of Asia's most improved sides in recent years. Eldor Shomurodov — who plays in Serie A — is their most dangerous attacker.",
  },
  {
    id: '2850',
    name: 'Congo DR',
    abbrev: 'COD',
    iso2: 'CD',
    fifaRank: 55,
    group: 'K',
    color: '007fff',
    altColor: 'f7d618',
    textColor: 'f7d618',
    bio: 'The Leopards of DR Congo are making their first World Cup appearance since 1974, when they were known as Zaire. A physically imposing side with pace throughout, Congo DR qualified through a competitive AFCON campaign. Chancel Mbemba provides experience at the back, and the team plays with intensity and directness.',
  },
  // Group L
  {
    id: '448',
    name: 'England',
    abbrev: 'ENG',
    iso2: 'GB-ENG',
    fifaRank: 8,
    group: 'L',
    color: 'ffffff',
    altColor: 'cf081f',
    textColor: 'cf081f',
    bio: "England reached the final of Euro 2024 and are desperate to end their 60-year wait for a major trophy. Jude Bellingham — one of the most complete midfielders in the world — is the heartbeat of the team, while Harry Kane's goalscoring record is extraordinary. England have the squad depth to win the tournament.",
  },
  {
    id: '477',
    name: 'Croatia',
    abbrev: 'CRO',
    iso2: 'HR',
    fifaRank: 10,
    group: 'L',
    color: 'ff0000',
    altColor: '0000ff',
    textColor: 'ffffff',
    bio: 'Croatia are one of the great overachievers in World Cup history — runners-up in 2018 and third place in 2022. Luka Modrić, widely regarded as one of the greatest midfielders of all time, continues to defy age and lead by example. Ivan Perišić and Mateo Kovačić provide quality throughout the squad.',
  },
  {
    id: '2659',
    name: 'Panama',
    abbrev: 'PAN',
    iso2: 'PA',
    fifaRank: 79,
    group: 'L',
    color: 'da121a',
    altColor: '005293',
    textColor: 'ffffff',
    bio: 'Panama are making their second World Cup appearance, having debuted memorably in 2018. Los Canaleros are a physical, well-organised side that qualified through CONCACAF with grit and determination. Rolando Blackburn provides pace and goals up front, and Panama will be difficult to beat for any opponent.',
  },
  {
    id: '4469',
    name: 'Ghana',
    abbrev: 'GHA',
    iso2: 'GH',
    fifaRank: 66,
    group: 'L',
    color: '006b3f',
    altColor: 'fcd116',
    textColor: 'fcd116',
    bio: "The Black Stars are one of Africa's most storied World Cup nations, famously reaching the quarter-finals in 2010. Mohammed Kudus — Ajax's dynamic attacking midfielder — is their most exciting player, capable of producing moments of brilliance. Ghana play with energy and flair and are always capable of an upset.",
  },
]

// Map from ESPN display name → WCTeam for quick lookup
export const TEAM_BY_NAME = new Map<string, WCTeam>(
  WC_TEAMS.map((t) => [t.name, t])
)

// Map from ESPN display name → ISO2 code
const ISO2_BY_NAME = new Map<string, string>(
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
type WCGroup = (typeof WC_GROUPS)[number]

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

// ---------------------------------------------------------------------------
// Country name → ISO-3166-1 alpha-2 code.
// Used to resolve a flag for teams that aren't in WC_TEAMS (e.g. opponents
// appearing in a team's recent-form/results that didn't qualify for WC 2026).
// Names are matched case-insensitively; common ESPN spellings are included.
// ---------------------------------------------------------------------------
const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  afghanistan: 'AF',
  albania: 'AL',
  algeria: 'DZ',
  andorra: 'AD',
  angola: 'AO',
  argentina: 'AR',
  armenia: 'AM',
  australia: 'AU',
  austria: 'AT',
  azerbaijan: 'AZ',
  bahrain: 'BH',
  bangladesh: 'BD',
  belarus: 'BY',
  belgium: 'BE',
  belize: 'BZ',
  benin: 'BJ',
  bermuda: 'BM',
  bolivia: 'BO',
  'bosnia and herzegovina': 'BA',
  bosnia: 'BA',
  botswana: 'BW',
  brazil: 'BR',
  bulgaria: 'BG',
  'burkina faso': 'BF',
  burundi: 'BI',
  cambodia: 'KH',
  cameroon: 'CM',
  canada: 'CA',
  'cape verde': 'CV',
  'cabo verde': 'CV',
  'central african republic': 'CF',
  chad: 'TD',
  chile: 'CL',
  china: 'CN',
  'china pr': 'CN',
  colombia: 'CO',
  comoros: 'KM',
  congo: 'CG',
  'congo dr': 'CD',
  'dr congo': 'CD',
  'democratic republic of the congo': 'CD',
  'costa rica': 'CR',
  'ivory coast': 'CI',
  "cote d'ivoire": 'CI',
  croatia: 'HR',
  cuba: 'CU',
  curacao: 'CW',
  curaçao: 'CW',
  cyprus: 'CY',
  czechia: 'CZ',
  'czech republic': 'CZ',
  denmark: 'DK',
  djibouti: 'DJ',
  dominica: 'DM',
  'dominican republic': 'DO',
  ecuador: 'EC',
  egypt: 'EG',
  'el salvador': 'SV',
  'equatorial guinea': 'GQ',
  eritrea: 'ER',
  estonia: 'EE',
  eswatini: 'SZ',
  swaziland: 'SZ',
  ethiopia: 'ET',
  'faroe islands': 'FO',
  fiji: 'FJ',
  finland: 'FI',
  france: 'FR',
  gabon: 'GA',
  gambia: 'GM',
  'the gambia': 'GM',
  georgia: 'GE',
  germany: 'DE',
  ghana: 'GH',
  gibraltar: 'GI',
  greece: 'GR',
  grenada: 'GD',
  guatemala: 'GT',
  guinea: 'GN',
  'guinea-bissau': 'GW',
  guyana: 'GY',
  haiti: 'HT',
  honduras: 'HN',
  'hong kong': 'HK',
  hungary: 'HU',
  iceland: 'IS',
  india: 'IN',
  indonesia: 'ID',
  iran: 'IR',
  iraq: 'IQ',
  ireland: 'IE',
  'republic of ireland': 'IE',
  israel: 'IL',
  italy: 'IT',
  jamaica: 'JM',
  japan: 'JP',
  jordan: 'JO',
  kazakhstan: 'KZ',
  kenya: 'KE',
  kosovo: 'XK',
  kuwait: 'KW',
  kyrgyzstan: 'KG',
  laos: 'LA',
  latvia: 'LV',
  lebanon: 'LB',
  lesotho: 'LS',
  liberia: 'LR',
  libya: 'LY',
  liechtenstein: 'LI',
  lithuania: 'LT',
  luxembourg: 'LU',
  madagascar: 'MG',
  malawi: 'MW',
  malaysia: 'MY',
  maldives: 'MV',
  mali: 'ML',
  malta: 'MT',
  mauritania: 'MR',
  mauritius: 'MU',
  mexico: 'MX',
  moldova: 'MD',
  mongolia: 'MN',
  montenegro: 'ME',
  morocco: 'MA',
  mozambique: 'MZ',
  myanmar: 'MM',
  namibia: 'NA',
  nepal: 'NP',
  netherlands: 'NL',
  'new zealand': 'NZ',
  nicaragua: 'NI',
  niger: 'NE',
  nigeria: 'NG',
  'north korea': 'KP',
  'korea dpr': 'KP',
  'north macedonia': 'MK',
  macedonia: 'MK',
  'northern ireland': 'GB',
  norway: 'NO',
  oman: 'OM',
  pakistan: 'PK',
  palestine: 'PS',
  panama: 'PA',
  'papua new guinea': 'PG',
  paraguay: 'PY',
  peru: 'PE',
  philippines: 'PH',
  poland: 'PL',
  portugal: 'PT',
  qatar: 'QA',
  romania: 'RO',
  russia: 'RU',
  rwanda: 'RW',
  'saudi arabia': 'SA',
  scotland: 'GB',
  senegal: 'SN',
  serbia: 'RS',
  'sierra leone': 'SL',
  singapore: 'SG',
  slovakia: 'SK',
  slovenia: 'SI',
  somalia: 'SO',
  'south africa': 'ZA',
  'south korea': 'KR',
  'korea republic': 'KR',
  'south sudan': 'SS',
  spain: 'ES',
  'sri lanka': 'LK',
  sudan: 'SD',
  suriname: 'SR',
  sweden: 'SE',
  switzerland: 'CH',
  syria: 'SY',
  taiwan: 'TW',
  'chinese taipei': 'TW',
  tajikistan: 'TJ',
  tanzania: 'TZ',
  thailand: 'TH',
  togo: 'TG',
  'trinidad and tobago': 'TT',
  tunisia: 'TN',
  turkey: 'TR',
  türkiye: 'TR',
  turkmenistan: 'TM',
  uganda: 'UG',
  ukraine: 'UA',
  'united arab emirates': 'AE',
  'united states': 'US',
  usa: 'US',
  uruguay: 'UY',
  uzbekistan: 'UZ',
  venezuela: 'VE',
  vietnam: 'VN',
  wales: 'GB-WLS',
  yemen: 'YE',
  zambia: 'ZM',
  zimbabwe: 'ZW',
  england: 'GB-ENG',
}

/** Resolve a country flag ISO2 code from a (full) country/team name.
 *  Falls back to the WC team map first, then the broader country lookup. */
export function nameToIso2(name: string | null | undefined): string {
  if (!name) return ''
  const fromTeam = TEAM_BY_NAME.get(name)?.iso2
  if (fromTeam) return fromTeam
  return COUNTRY_NAME_TO_ISO2[name.trim().toLowerCase()] ?? ''
}

// ---------------------------------------------------------------------------
// World Cup titles — number of times each nation has won the men's World Cup.
// Used to render a "star" per title next to the team name (à la football kits).
// Keyed by the team's `name` as used in WC_TEAMS.
// ---------------------------------------------------------------------------
const WC_TITLES: Record<string, number> = {
  Brazil: 5,
  Germany: 4,
  Italy: 4,
  Argentina: 3,
  France: 2,
  Uruguay: 2,
  England: 1,
  Spain: 1,
}

/** Returns the number of World Cup titles a nation has won (0 if none). */
export function wcTitles(teamName: string): number {
  return WC_TITLES[teamName] ?? 0
}

// ---------------------------------------------------------------------------
// WC 2026 venue → location lookup
// Keyed by the venue's fullName as returned by ESPN.
// Used as a bulletproof fallback so venue + location never disappear.
// ---------------------------------------------------------------------------
const VENUE_LOCATIONS: Record<string, string> = {
  'SoFi Stadium': 'Los Angeles, CA',
  'Rose Bowl Stadium': 'Pasadena, CA',
  "Levi's Stadium": 'Santa Clara, CA',
  'AT&T Stadium': 'Arlington, TX',
  'NRG Stadium': 'Houston, TX',
  'GEHA Field at Arrowhead Stadium': 'Kansas City, MO',
  'Arrowhead Stadium': 'Kansas City, MO',
  'Empower Field at Mile High': 'Denver, CO',
  'Lumen Field': 'Seattle, WA',
  'MetLife Stadium': 'East Rutherford, NJ',
  'Gillette Stadium': 'Foxborough, MA',
  'Lincoln Financial Field': 'Philadelphia, PA',
  'Hard Rock Stadium': 'Miami Gardens, FL',
  'Mercedes-Benz Stadium': 'Atlanta, GA',
  'Estadio Akron': 'Guadalajara, Mexico',
  'Estadio BBVA': 'Monterrey, Mexico',
  'Estadio Azteca': 'Mexico City, Mexico',
  'Estadio Banorte': 'Guadalajara, Mexico',
  'BC Place': 'Vancouver, Canada',
  'BMO Field': 'Toronto, Canada',
}

/** Look up the city/state location for a venue name. */
export function venueLocation(
  venueName: string | null | undefined
): string | null {
  if (!venueName) return null
  return VENUE_LOCATIONS[venueName] ?? null
}

// ---------------------------------------------------------------------------
// Static match ID → venue name lookup (all 104 WC 2026 matches)
// This is the ultimate fallback — used when both the match-detail summary API
// and the schedule API fail to return a venue (e.g. pre-tournament UTC offset
// issues or API gaps). Keyed by ESPN event ID as a string.
// ---------------------------------------------------------------------------
const MATCH_VENUE: Record<string, string> = {
  '760414': 'Estadio Banorte',
  '760415': 'Estadio Azteca',
  '760416': 'BMO Field',
  '760417': 'SoFi Stadium',
  '760418': 'Gillette Stadium',
  '760419': 'MetLife Stadium',
  '760420': "Levi's Stadium",
  '760421': 'BC Place',
  '760422': 'NRG Stadium',
  '760423': 'Lincoln Financial Field',
  '760424': 'Estadio BBVA',
  '760425': 'AT&T Stadium',
  '760426': 'Lumen Field',
  '760427': 'SoFi Stadium',
  '760428': 'Mercedes-Benz Stadium',
  '760429': 'Hard Rock Stadium',
  '760430': 'Gillette Stadium',
  '760431': "Levi's Stadium",
  '760432': 'MetLife Stadium',
  '760433': 'GEHA Field at Arrowhead Stadium',
  '760434': 'BMO Field',
  '760435': 'NRG Stadium',
  '760436': 'Estadio Banorte',
  '760437': 'AT&T Stadium',
  '760438': 'Mercedes-Benz Stadium',
  '760439': 'SoFi Stadium',
  '760440': 'BC Place',
  '760441': 'Estadio Banorte',
  '760442': 'Lumen Field',
  '760443': "Levi's Stadium",
  '760444': 'Lincoln Financial Field',
  '760445': 'Gillette Stadium',
  '760446': 'GEHA Field at Arrowhead Stadium',
  '760447': 'NRG Stadium',
  '760448': 'BMO Field',
  '760449': 'Estadio BBVA',
  '760450': 'Hard Rock Stadium',
  '760451': 'SoFi Stadium',
  '760452': 'BC Place',
  '760453': 'Mercedes-Benz Stadium',
  '760454': 'MetLife Stadium',
  '760455': "Levi's Stadium",
  '760456': 'AT&T Stadium',
  '760457': 'Lincoln Financial Field',
  '760458': 'Gillette Stadium',
  '760459': 'Estadio Banorte',
  '760460': 'BMO Field',
  '760461': 'NRG Stadium',
  '760462': 'Lumen Field',
  '760463': 'BC Place',
  '760464': 'Mercedes-Benz Stadium',
  '760465': 'Hard Rock Stadium',
  '760466': 'Estadio BBVA',
  '760467': 'Estadio Banorte',
  '760468': 'MetLife Stadium',
  '760469': "Levi's Stadium",
  '760470': 'SoFi Stadium',
  '760471': 'AT&T Stadium',
  '760472': 'GEHA Field at Arrowhead Stadium',
  '760473': 'Lincoln Financial Field',
  '760474': 'BMO Field',
  '760475': 'Gillette Stadium',
  '760476': 'Lumen Field',
  '760477': 'BC Place',
  '760478': 'NRG Stadium',
  '760479': 'Estadio Banorte',
  '760480': 'Lincoln Financial Field',
  '760481': 'Hard Rock Stadium',
  '760482': 'Mercedes-Benz Stadium',
  '760483': 'AT&T Stadium',
  '760484': 'GEHA Field at Arrowhead Stadium',
  '760485': 'MetLife Stadium',
  '760486': 'SoFi Stadium',
  '760487': 'NRG Stadium',
  '760488': 'Estadio BBVA',
  '760489': 'Gillette Stadium',
  '760490': 'AT&T Stadium',
  '760491': 'Estadio Banorte',
  '760492': 'MetLife Stadium',
  '760493': 'Lumen Field',
  '760494': "Levi's Stadium",
  '760495': 'Mercedes-Benz Stadium',
  '760496': 'BMO Field',
  '760497': 'SoFi Stadium',
  '760498': 'BC Place',
  '760499': 'AT&T Stadium',
  '760500': 'Hard Rock Stadium',
  '760501': 'GEHA Field at Arrowhead Stadium',
  '760502': 'NRG Stadium',
  '760503': 'Lincoln Financial Field',
  '760504': 'MetLife Stadium',
  '760505': 'Estadio Banorte',
  '760506': 'AT&T Stadium',
  '760507': 'Lumen Field',
  '760508': 'BC Place',
  '760509': 'Mercedes-Benz Stadium',
  '760510': 'Gillette Stadium',
  '760511': 'SoFi Stadium',
  '760512': 'Hard Rock Stadium',
  '760513': 'GEHA Field at Arrowhead Stadium',
  '760514': 'AT&T Stadium',
  '760515': 'Mercedes-Benz Stadium',
  '760516': 'Hard Rock Stadium',
  '760517': 'MetLife Stadium',
}

/**
 * Look up the authoritative venue name for a match by its ESPN event ID.
 * Use this as an OVERRIDE — our static map is more reliable than the ESPN API
 * for known-wrong venues (e.g. ESPN returning 'Estadio Banorte' for a match
 * that FIFA confirms is at Estadio Azteca).
 */
export function matchVenueOverride(
  eventId: string | null | undefined
): string | null {
  if (!eventId) return null
  return MATCH_VENUE[eventId] ?? null
}

// ---------------------------------------------------------------------------
// ESPN event ID → FIFA official match number (knockout rounds only, 73–104)
//
// Used by the Predictor to key ftResults by match number rather than team
// names, making the lookup immune to ESPN display-name mismatches and
// unresolved bracket slot descriptors.
// ---------------------------------------------------------------------------
const MATCH_NUMBER_BY_EVENT_ID: Record<string, number> = {
  // ── Round of 32 (Jun 28 – Jul 4) ─────────────────────────────────────────
  '760486': 73, // South Africa vs Canada
  '760489': 74, // Germany vs Paraguay
  '760488': 75, // Netherlands vs Morocco
  '760487': 76, // Brazil vs Japan
  '760490': 77, // Ivory Coast vs Norway
  '760492': 78, // France vs Sweden
  '760491': 79, // Mexico vs Ecuador
  '760495': 80, // England vs Congo DR
  '760493': 82, // Belgium vs Senegal
  '760494': 81, // United States vs Bosnia-Herzegovina
  '760497': 83, // Spain vs Austria
  '760496': 84, // Portugal vs Croatia
  '760498': 85, // Switzerland vs Algeria
  '760499': 86, // Australia vs Egypt
  '760500': 87, // Argentina vs Cape Verde
  '760501': 88, // Colombia vs Ghana
  // ── Round of 16 (Jul 4 – Jul 8) ──────────────────────────────────────────
  '760502': 89, // W74 vs W77
  '760503': 90, // W73 vs W75
  '760504': 91, // W76 vs W78
  '760505': 92, // W79 vs W80
  '760506': 93, // W83 vs W84
  '760507': 94, // W81 vs W82
  '760508': 95, // W86 vs W88
  '760509': 96, // W85 vs W87
  // ── Quarterfinals (Jul 9 – Jul 11) ───────────────────────────────────────
  '760510': 97, // W89 vs W90
  '760511': 98, // W93 vs W94
  '760512': 99, // W91 vs W92
  '760513': 100, // W95 vs W96
  // ── Semifinals (Jul 14 – Jul 15) ─────────────────────────────────────────
  '760514': 101, // W97 vs W98
  '760515': 102, // W99 vs W100
  // ── Third Place Playoff (Jul 18) ─────────────────────────────────────────
  '760516': 103,
  // ── Final (Jul 19) ───────────────────────────────────────────────────────
  '760517': 104,
}

/** Look up the FIFA official match number for a knockout match by ESPN event ID. */
export function matchNumberByEventId(
  eventId: string | null | undefined
): number | null {
  if (!eventId) return null
  return MATCH_NUMBER_BY_EVENT_ID[eventId] ?? null
}

// ---------------------------------------------------------------------------
// WC 2026 Bracket Seeding — the fixed FIFA knockout bracket map
//
// Encodes which group slot feeds which R32 fixture, and how winners cascade
// through R16 → QF → SF → Final. This is a constant — it never changes.
//
// Slot descriptors:
//   '1A'        = Winner of Group A
//   '2B'        = Runner-up of Group B
//   '3rd-ABCDF' = Best 3rd-place team from groups A/B/C/D/F
//   'W-R32-1'   = Winner of R32 match 1 (i.e. Match 73)
//   'L-SF-1'    = Loser of SF match 1 (for 3rd place playoff)
//
// Match numbers follow FIFA's official numbering (73–104).
// ---------------------------------------------------------------------------

export interface BracketSlot {
  /** Unique slot id used as the prediction key */
  slotId: string
  /** Round this match belongs to */
  round: 'R32' | 'R16' | 'QF' | 'SF' | '3rd' | 'F'
  /** Home slot descriptor */
  home: string
  /** Away slot descriptor */
  away: string
  /** FIFA official match number */
  matchNumber: number
}

export const WC_2026_BRACKET_SEEDING: BracketSlot[] = [
  // ── Round of 32 (Matches 73–88) ──────────────────────────────────────────
  // Match 73: 2A vs 2B
  { slotId: 'R32-1', round: 'R32', home: '2A', away: '2B', matchNumber: 73 },
  // Match 74: 1E vs 3rd-ABCDF
  {
    slotId: 'R32-2',
    round: 'R32',
    home: '1E',
    away: '3rd-ABCDF',
    matchNumber: 74,
  },
  // Match 75: 1F vs 2C
  { slotId: 'R32-3', round: 'R32', home: '1F', away: '2C', matchNumber: 75 },
  // Match 76: 1C vs 2F
  { slotId: 'R32-4', round: 'R32', home: '1C', away: '2F', matchNumber: 76 },
  // Match 77: 1I vs 3rd-CDFGH
  {
    slotId: 'R32-5',
    round: 'R32',
    home: '1I',
    away: '3rd-CDFGH',
    matchNumber: 77,
  },
  // Match 78: 2E vs 2I
  { slotId: 'R32-6', round: 'R32', home: '2E', away: '2I', matchNumber: 78 },
  // Match 79: 1A vs 3rd-CEFHI
  {
    slotId: 'R32-7',
    round: 'R32',
    home: '1A',
    away: '3rd-CEFHI',
    matchNumber: 79,
  },
  // Match 80: 1L vs 3rd-EHIJK
  {
    slotId: 'R32-8',
    round: 'R32',
    home: '1L',
    away: '3rd-EHIJK',
    matchNumber: 80,
  },
  // Match 81: 1D vs 3rd-BEFIJ
  {
    slotId: 'R32-9',
    round: 'R32',
    home: '1D',
    away: '3rd-BEFIJ',
    matchNumber: 81,
  },
  // Match 82: 1G vs 3rd-AEHIJ
  {
    slotId: 'R32-10',
    round: 'R32',
    home: '1G',
    away: '3rd-AEHIJ',
    matchNumber: 82,
  },
  // Match 83: 2K vs 2L
  { slotId: 'R32-11', round: 'R32', home: '2K', away: '2L', matchNumber: 83 },
  // Match 84: 1H vs 2J
  { slotId: 'R32-12', round: 'R32', home: '1H', away: '2J', matchNumber: 84 },
  // Match 85: 1B vs 3rd-EFGIJ
  {
    slotId: 'R32-13',
    round: 'R32',
    home: '1B',
    away: '3rd-EFGIJ',
    matchNumber: 85,
  },
  // Match 86: 1J vs 2H
  { slotId: 'R32-14', round: 'R32', home: '1J', away: '2H', matchNumber: 86 },
  // Match 87: 1K vs 3rd-DEIJL
  {
    slotId: 'R32-15',
    round: 'R32',
    home: '1K',
    away: '3rd-DEIJL',
    matchNumber: 87,
  },
  // Match 88: 2D vs 2G
  { slotId: 'R32-16', round: 'R32', home: '2D', away: '2G', matchNumber: 88 },

  // ── Round of 16 (Matches 89–96) ──────────────────────────────────────────
  // Match 89: W74 vs W77
  {
    slotId: 'R16-1',
    round: 'R16',
    home: 'W-R32-2',
    away: 'W-R32-5',
    matchNumber: 89,
  },
  // Match 90: W73 vs W75
  {
    slotId: 'R16-2',
    round: 'R16',
    home: 'W-R32-1',
    away: 'W-R32-3',
    matchNumber: 90,
  },
  // Match 91: W76 vs W78
  {
    slotId: 'R16-3',
    round: 'R16',
    home: 'W-R32-4',
    away: 'W-R32-6',
    matchNumber: 91,
  },
  // Match 92: W79 vs W80
  {
    slotId: 'R16-4',
    round: 'R16',
    home: 'W-R32-7',
    away: 'W-R32-8',
    matchNumber: 92,
  },
  // Match 93: W83 vs W84
  {
    slotId: 'R16-5',
    round: 'R16',
    home: 'W-R32-11',
    away: 'W-R32-12',
    matchNumber: 93,
  },
  // Match 94: W81 vs W82
  {
    slotId: 'R16-6',
    round: 'R16',
    home: 'W-R32-9',
    away: 'W-R32-10',
    matchNumber: 94,
  },
  // Match 95: W86 vs W88
  {
    slotId: 'R16-7',
    round: 'R16',
    home: 'W-R32-14',
    away: 'W-R32-16',
    matchNumber: 95,
  },
  // Match 96: W85 vs W87
  {
    slotId: 'R16-8',
    round: 'R16',
    home: 'W-R32-13',
    away: 'W-R32-15',
    matchNumber: 96,
  },

  // ── Quarterfinals (Matches 97–100) ───────────────────────────────────────
  // Match 97: W89 vs W90
  {
    slotId: 'QF-1',
    round: 'QF',
    home: 'W-R16-1',
    away: 'W-R16-2',
    matchNumber: 97,
  },
  // Match 98: W93 vs W94
  {
    slotId: 'QF-2',
    round: 'QF',
    home: 'W-R16-5',
    away: 'W-R16-6',
    matchNumber: 98,
  },
  // Match 99: W91 vs W92
  {
    slotId: 'QF-3',
    round: 'QF',
    home: 'W-R16-3',
    away: 'W-R16-4',
    matchNumber: 99,
  },
  // Match 100: W95 vs W96
  {
    slotId: 'QF-4',
    round: 'QF',
    home: 'W-R16-7',
    away: 'W-R16-8',
    matchNumber: 100,
  },

  // ── Semifinals (Matches 101–102) ─────────────────────────────────────────
  // Match 101: W97 vs W98
  {
    slotId: 'SF-1',
    round: 'SF',
    home: 'W-QF-1',
    away: 'W-QF-2',
    matchNumber: 101,
  },
  // Match 102: W99 vs W100
  {
    slotId: 'SF-2',
    round: 'SF',
    home: 'W-QF-3',
    away: 'W-QF-4',
    matchNumber: 102,
  },

  // ── Third Place Playoff (Match 103) ──────────────────────────────────────
  {
    slotId: '3rd',
    round: '3rd',
    home: 'L-SF-1',
    away: 'L-SF-2',
    matchNumber: 103,
  },

  // ── Final (Match 104) ────────────────────────────────────────────────────
  { slotId: 'F', round: 'F', home: 'W-SF-1', away: 'W-SF-2', matchNumber: 104 },
]
