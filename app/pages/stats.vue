<script setup lang="ts">
  useHead({
    title: 'Stats — World Cup Fire 🔥',
    meta: [
      {
        name: 'description',
        content:
          'World Cup history, records, fun facts and all-time stats — from Pelé to Mbappé.',
      },
    ],
  })

  // ── All-time World Cup winners ─────────────────────────────────────────────
  const allTimeWinners = [
    {
      country: 'Brazil',
      iso2: 'BR',
      titles: 5,
      years: [1958, 1962, 1970, 1994, 2002],
    },
    {
      country: 'Germany',
      iso2: 'DE',
      titles: 4,
      years: [1954, 1974, 1990, 2014],
    },
    {
      country: 'Italy',
      iso2: 'IT',
      titles: 4,
      years: [1934, 1938, 1982, 2006],
    },
    { country: 'Argentina', iso2: 'AR', titles: 3, years: [1978, 1986, 2022] },
    { country: 'France', iso2: 'FR', titles: 2, years: [1998, 2018] },
    { country: 'Uruguay', iso2: 'UY', titles: 2, years: [1930, 1950] },
    { country: 'England', iso2: 'GB-ENG', titles: 1, years: [1966] },
    { country: 'Spain', iso2: 'ES', titles: 1, years: [2010] },
  ]

  // ── All-time top scorers ───────────────────────────────────────────────────
  const allTimeScorers = [
    {
      name: 'Miroslav Klose',
      country: 'Germany',
      iso2: 'DE',
      goals: 16,
      tournaments: '2002–2014',
    },
    {
      name: 'Ronaldo',
      country: 'Brazil',
      iso2: 'BR',
      goals: 15,
      tournaments: '1994–2006',
    },
    {
      name: 'Gerd Müller',
      country: 'Germany',
      iso2: 'DE',
      goals: 14,
      tournaments: '1970–1974',
    },
    {
      name: 'Just Fontaine',
      country: 'France',
      iso2: 'FR',
      goals: 13,
      tournaments: '1958',
    },
    {
      name: 'Pelé',
      country: 'Brazil',
      iso2: 'BR',
      goals: 12,
      tournaments: '1958–1970',
    },
    {
      name: 'Kylian Mbappé',
      country: 'France',
      iso2: 'FR',
      goals: 12,
      tournaments: '2018–2022',
    },
    {
      name: 'Sándor Kocsis',
      country: 'Hungary',
      iso2: 'HU',
      goals: 11,
      tournaments: '1954',
    },
    {
      name: 'Jürgen Klinsmann',
      country: 'Germany',
      iso2: 'DE',
      goals: 11,
      tournaments: '1990–1998',
    },
    {
      name: 'Helmut Rahn',
      country: 'Germany',
      iso2: 'DE',
      goals: 10,
      tournaments: '1954–1958',
    },
    {
      name: 'Teófilo Cubillas',
      country: 'Peru',
      iso2: 'PE',
      goals: 10,
      tournaments: '1970–1978',
    },
  ]

  // ── Most appearances ──────────────────────────────────────────────────────
  const mostAppearances = [
    {
      name: 'Lothar Matthäus',
      country: 'Germany',
      iso2: 'DE',
      apps: 25,
      tournaments: '1982–1998',
    },
    {
      name: 'Paolo Maldini',
      country: 'Italy',
      iso2: 'IT',
      apps: 23,
      tournaments: '1990–2002',
    },
    {
      name: 'Wladyslaw Zmuda',
      country: 'Poland',
      iso2: 'PL',
      apps: 21,
      tournaments: '1974–1986',
    },
    {
      name: 'Diego Maradona',
      country: 'Argentina',
      iso2: 'AR',
      apps: 21,
      tournaments: '1982–1994',
    },
    {
      name: 'Uwe Seeler',
      country: 'Germany',
      iso2: 'DE',
      apps: 21,
      tournaments: '1958–1970',
    },
    {
      name: 'Grzegorz Lato',
      country: 'Poland',
      iso2: 'PL',
      apps: 20,
      tournaments: '1974–1982',
    },
    {
      name: 'Cafu',
      country: 'Brazil',
      iso2: 'BR',
      apps: 20,
      tournaments: '1994–2006',
    },
    {
      name: 'Lionel Messi',
      country: 'Argentina',
      iso2: 'AR',
      apps: 26,
      tournaments: '2006–2022',
    },
  ]

  // ── Tournament records ─────────────────────────────────────────────────────
  const tournamentRecords = [
    {
      emoji: '⚽',
      label: 'Most goals in one tournament',
      value: '27 goals',
      detail: 'Hungary, 1954 — averaging 5.4 per game',
    },
    {
      emoji: '🏆',
      label: 'Most finals appearances',
      value: '8 finals',
      detail: 'Germany/West Germany — won 4, lost 4',
    },
    {
      emoji: '🔥',
      label: 'Biggest ever win',
      value: '10–1',
      detail: 'Hungary beat El Salvador, 1982',
    },
    {
      emoji: '😱',
      label: 'Biggest upset',
      value: 'USA 1–0 England',
      detail: "1950 — one of football's greatest shocks",
    },
    {
      emoji: '⚡',
      label: 'Fastest goal ever',
      value: '11 seconds',
      detail: 'Hakan Şükür (Turkey) vs South Korea, 2002',
    },
    {
      emoji: '🧤',
      label: 'Most saves in a tournament',
      value: '27 saves',
      detail: 'Ricardo (Portugal), 2006',
    },
    {
      emoji: '🎯',
      label: 'Most goals in a single match',
      value: '12 goals',
      detail: 'Austria 7–5 Switzerland, 1954',
    },
    {
      emoji: '🌍',
      label: 'Most teams in one tournament',
      value: '48 teams',
      detail: 'FIFA World Cup 2026 — first ever 48-team edition',
    },
  ]

  // ── Fun facts ──────────────────────────────────────────────────────────────
  const funFacts = [
    {
      emoji: '👶',
      fact: 'Youngest ever scorer',
      detail:
        'Pelé scored at age 17 years, 239 days in the 1958 final — a record that still stands.',
    },
    {
      emoji: '👴',
      fact: 'Oldest ever scorer',
      detail:
        'Roger Milla (Cameroon) scored at age 42 years, 39 days against Russia in 1994.',
    },
    {
      emoji: '🎩',
      fact: 'Fastest hat-trick',
      detail:
        'László Kiss (Hungary) scored a hat-trick in just 7 minutes against El Salvador in 1982.',
    },
    {
      emoji: '🤝',
      fact: 'The "Hand of God"',
      detail:
        "Maradona's infamous handball goal vs England in 1986 is the most controversial moment in World Cup history.",
    },
    {
      emoji: '🇧🇷',
      fact: "Brazil's unbeaten run",
      detail:
        'Brazil went 13 consecutive World Cup matches unbeaten from 1958 to 1966 — a record that stood for decades.',
    },
    {
      emoji: '🏟️',
      fact: 'Biggest crowd ever',
      detail:
        '199,854 fans packed the Maracanã for the 1950 final between Uruguay and Brazil — the largest crowd in football history.',
    },
    {
      emoji: '🔴',
      fact: 'First red card',
      detail:
        'Carlos Caszely (Chile) received the first ever World Cup red card in 1974 against West Germany.',
    },
    {
      emoji: '🥅',
      fact: 'Own goal record',
      detail:
        'The 2018 World Cup had 12 own goals — more than any previous tournament in history.',
    },
    {
      emoji: '🌟',
      fact: "Ronaldo's golden boot",
      detail:
        'Ronaldo (Brazil) won the Golden Boot in 2002 with 8 goals — the most by any player in a single tournament since 1970.',
    },
    {
      emoji: '🇩🇪',
      fact: "Germany's consistency",
      detail:
        'Germany/West Germany have never been eliminated in the group stage — the only nation with a 100% knockout stage record.',
    },
    {
      emoji: '🇫🇷',
      fact: "Just Fontaine's record",
      detail:
        "13 goals in a single tournament (1958) — Just Fontaine's record has stood for 68 years and counting.",
    },
    {
      emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      fact: "England's only title",
      detail:
        'England have won the World Cup exactly once — in 1966, on home soil, beating West Germany 4–2 in the final.',
    },
  ]

  // ── 2026 host cities ───────────────────────────────────────────────────────
  const hostCities = [
    {
      city: 'New York / New Jersey',
      country: 'USA',
      flag: '🇺🇸',
      matches: 8,
      venue: 'MetLife Stadium',
      capacity: 82_500,
    },
    {
      city: 'Los Angeles',
      country: 'USA',
      flag: '🇺🇸',
      matches: 8,
      venue: 'SoFi Stadium',
      capacity: 70_240,
    },
    {
      city: 'Dallas',
      country: 'USA',
      flag: '🇺🇸',
      matches: 9,
      venue: 'AT&T Stadium',
      capacity: 80_000,
    },
    {
      city: 'San Francisco Bay Area',
      country: 'USA',
      flag: '🇺🇸',
      matches: 8,
      venue: "Levi's Stadium",
      capacity: 68_500,
    },
    {
      city: 'Miami',
      country: 'USA',
      flag: '🇺🇸',
      matches: 8,
      venue: 'Hard Rock Stadium',
      capacity: 65_326,
    },
    {
      city: 'Atlanta',
      country: 'USA',
      flag: '🇺🇸',
      matches: 8,
      venue: 'Mercedes-Benz Stadium',
      capacity: 71_000,
    },
    {
      city: 'Seattle',
      country: 'USA',
      flag: '🇺🇸',
      matches: 8,
      venue: 'Lumen Field',
      capacity: 69_000,
    },
    {
      city: 'Houston',
      country: 'USA',
      flag: '🇺🇸',
      matches: 8,
      venue: 'NRG Stadium',
      capacity: 72_220,
    },
    {
      city: 'Kansas City',
      country: 'USA',
      flag: '🇺🇸',
      matches: 8,
      venue: 'Arrowhead Stadium',
      capacity: 76_416,
    },
    {
      city: 'Boston',
      country: 'USA',
      flag: '🇺🇸',
      matches: 8,
      venue: 'Gillette Stadium',
      capacity: 65_878,
    },
    {
      city: 'Philadelphia',
      country: 'USA',
      flag: '🇺🇸',
      matches: 8,
      venue: 'Lincoln Financial Field',
      capacity: 69_796,
    },
    {
      city: 'Mexico City',
      country: 'Mexico',
      flag: '🇲🇽',
      matches: 5,
      venue: 'Estadio Azteca',
      capacity: 87_523,
    },
    {
      city: 'Guadalajara',
      country: 'Mexico',
      flag: '🇲🇽',
      matches: 5,
      venue: 'Estadio Akron',
      capacity: 49_850,
    },
    {
      city: 'Monterrey',
      country: 'Mexico',
      flag: '🇲🇽',
      matches: 5,
      venue: 'Estadio BBVA',
      capacity: 53_500,
    },
    {
      city: 'Toronto',
      country: 'Canada',
      flag: '🇨🇦',
      matches: 7,
      venue: 'BMO Field',
      capacity: 30_000,
    },
    {
      city: 'Vancouver',
      country: 'Canada',
      flag: '🇨🇦',
      matches: 7,
      venue: 'BC Place',
      capacity: 54_500,
    },
  ]

  // ── World Cup by the numbers ───────────────────────────────────────────────
  const byTheNumbers = [
    { number: '22', label: 'Tournaments held', sub: '1930 to 2022' },
    {
      number: '80',
      label: 'Nations have qualified',
      sub: 'across all editions',
    },
    {
      number: '2,548',
      label: 'Total goals scored',
      sub: 'across all tournaments',
    },
    { number: '900+', label: 'Matches played', sub: 'in World Cup history' },
    { number: '48', label: 'Teams in 2026', sub: 'biggest ever field' },
    { number: '104', label: 'Matches in 2026', sub: 'up from 64 in 2022' },
    { number: '16', label: 'Host cities in 2026', sub: 'across 3 countries' },
    { number: '5B+', label: 'Viewers in 2022', sub: 'global TV audience' },
  ]

  // ── Active section for filter tabs ────────────────────────────────────────
  const sections = ['Winners', 'Scorers', 'Records', 'Facts', 'Venues'] as const
  type Section = (typeof sections)[number]
  const activeSection = ref<Section>('Winners')

  function flagUrl(iso2: string): string {
    if (iso2 === 'GB-ENG') return '/flags/GB-ENG.svg'
    if (iso2 === 'GB-SCT') return '/flags/GB-SCT.svg'
    return `https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${iso2.toLowerCase()}.svg`
  }
</script>

<template>
  <div class="stats-page">
    <div class="stats-page__inner">
      <!-- ── Hero ──────────────────────────────────────────────────────────── -->
      <div class="stats-hero">
        <h1 class="stats-hero__title">World Cup Stats</h1>
        <p class="stats-hero__sub">
          History, records &amp; fun facts — from 1930 to 2026
        </p>
      </div>

      <!-- ── By the numbers ────────────────────────────────────────────────── -->
      <div class="stats-numbers">
        <div
          v-for="item in byTheNumbers"
          :key="item.label"
          class="stats-numbers__card"
        >
          <span class="stats-numbers__value">{{ item.number }}</span>
          <span class="stats-numbers__label">{{ item.label }}</span>
          <span class="stats-numbers__sub">{{ item.sub }}</span>
        </div>
      </div>

      <!-- ── Section filter tabs ────────────────────────────────────────────── -->
      <div class="stats-tabs">
        <button
          v-for="s in sections"
          :key="s"
          class="stats-tabs__btn"
          :class="{ 'stats-tabs__btn--active': activeSection === s }"
          @click="activeSection = s"
        >
          {{ s }}
        </button>
      </div>

      <!-- ══════════════════════════════════════════════════════════════════════
           WINNERS
           ══════════════════════════════════════════════════════════════════ -->
      <section v-if="activeSection === 'Winners'" class="stats-section">
        <h2 class="stats-section__heading">🏆 All-Time World Cup Winners</h2>
        <p class="stats-section__intro">
          Only 8 nations have ever lifted the FIFA World Cup trophy. Brazil lead
          the way with 5 titles — no other country comes close.
        </p>

        <div class="winners-grid">
          <div
            v-for="(w, i) in allTimeWinners"
            :key="w.country"
            class="winner-card"
            :class="{ 'winner-card--gold': i === 0 }"
          >
            <div class="winner-card__rank">#{{ i + 1 }}</div>
            <img
              :src="flagUrl(w.iso2)"
              :alt="w.country"
              class="winner-card__flag"
            />
            <div class="winner-card__info">
              <span class="winner-card__country">{{ w.country }}</span>
              <div class="winner-card__stars">
                <span v-for="n in w.titles" :key="n" class="winner-card__star"
                  >⭐</span
                >
              </div>
              <span class="winner-card__years">{{ w.years.join(' · ') }}</span>
            </div>
            <div class="winner-card__titles">
              <span class="winner-card__titles-num">{{ w.titles }}</span>
              <span class="winner-card__titles-label">{{
                w.titles === 1 ? 'title' : 'titles'
              }}</span>
            </div>
          </div>
        </div>

        <!-- Most appearances -->
        <h2 class="stats-section__heading" style="margin-top: 2.5rem">
          👟 Most World Cup Appearances (Players)
        </h2>
        <p class="stats-section__intro">
          These legends played in more World Cup matches than anyone else in
          history.
        </p>
        <div class="leaderboard">
          <div
            v-for="(p, i) in mostAppearances.sort((a, b) => b.apps - a.apps)"
            :key="p.name"
            class="leaderboard__row"
          >
            <span class="leaderboard__rank">{{ i + 1 }}</span>
            <img
              :src="flagUrl(p.iso2)"
              :alt="p.country"
              class="leaderboard__flag"
            />
            <div class="leaderboard__info">
              <span class="leaderboard__name">{{ p.name }}</span>
              <span class="leaderboard__meta"
                >{{ p.country }} · {{ p.tournaments }}</span
              >
            </div>
            <span class="leaderboard__value"
              >{{ p.apps }} <span class="leaderboard__unit">apps</span></span
            >
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           SCORERS
           ══════════════════════════════════════════════════════════════════ -->
      <section v-if="activeSection === 'Scorers'" class="stats-section">
        <h2 class="stats-section__heading">⚽ All-Time Top Scorers</h2>
        <p class="stats-section__intro">
          Miroslav Klose's record of 16 World Cup goals may never be beaten.
          Mbappé at just 23 is already level with Pelé on 12.
        </p>

        <div class="leaderboard">
          <div
            v-for="(p, i) in allTimeScorers"
            :key="p.name"
            class="leaderboard__row"
            :class="{ 'leaderboard__row--top3': i < 3 }"
          >
            <span
              class="leaderboard__rank"
              :class="{
                'leaderboard__rank--gold': i === 0,
                'leaderboard__rank--silver': i === 1,
                'leaderboard__rank--bronze': i === 2,
              }"
            >
              {{ i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1 }}
            </span>
            <img
              :src="flagUrl(p.iso2)"
              :alt="p.country"
              class="leaderboard__flag"
            />
            <div class="leaderboard__info">
              <span class="leaderboard__name">{{ p.name }}</span>
              <span class="leaderboard__meta"
                >{{ p.country }} · {{ p.tournaments }}</span
              >
            </div>
            <div class="leaderboard__bar-wrap">
              <div
                class="leaderboard__bar"
                :style="{ width: `${(p.goals / 16) * 100}%` }"
              />
            </div>
            <span class="leaderboard__value"
              >{{ p.goals }} <span class="leaderboard__unit">goals</span></span
            >
          </div>
        </div>

        <!-- Klose spotlight -->
        <div class="spotlight">
          <div class="spotlight__emoji">🇩🇪</div>
          <div class="spotlight__body">
            <h3 class="spotlight__title">Miroslav Klose — The Record Holder</h3>
            <p class="spotlight__text">
              Klose scored 16 goals across four World Cups (2002, 2006, 2010,
              2014), surpassing Ronaldo's record of 15 in the 2014 semi-final
              against Brazil. He scored in every tournament he played in and won
              the Golden Boot in 2006. His record has stood for 12 years and
              counting.
            </p>
          </div>
        </div>

        <!-- Just Fontaine spotlight -->
        <div class="spotlight spotlight--amber">
          <div class="spotlight__emoji">🇫🇷</div>
          <div class="spotlight__body">
            <h3 class="spotlight__title">
              Just Fontaine — 13 Goals in One Tournament
            </h3>
            <p class="spotlight__text">
              In 1958, Just Fontaine scored 13 goals in just 6 matches — a
              single-tournament record that has stood for 68 years. He scored in
              every game, including a hat-trick in the third-place play-off.
              Remarkably, he only played in one World Cup due to injury.
            </p>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           RECORDS
           ══════════════════════════════════════════════════════════════════ -->
      <section v-if="activeSection === 'Records'" class="stats-section">
        <h2 class="stats-section__heading">📊 Tournament Records</h2>
        <p class="stats-section__intro">
          The World Cup has produced some extraordinary moments and numbers
          across its 96-year history.
        </p>

        <div class="records-grid">
          <div
            v-for="r in tournamentRecords"
            :key="r.label"
            class="record-card"
          >
            <span class="record-card__emoji">{{ r.emoji }}</span>
            <div class="record-card__body">
              <span class="record-card__label">{{ r.label }}</span>
              <span class="record-card__value">{{ r.value }}</span>
              <span class="record-card__detail">{{ r.detail }}</span>
            </div>
          </div>
        </div>

        <!-- 2026 spotlight -->
        <div class="spotlight spotlight--green" style="margin-top: 2rem">
          <div class="spotlight__emoji">🌎</div>
          <div class="spotlight__body">
            <h3 class="spotlight__title">2026 — A Tournament of Firsts</h3>
            <p class="spotlight__text">
              The 2026 World Cup is the first to feature 48 teams (up from 32),
              the first co-hosted by three nations (USA, Canada, Mexico), and
              the first to use 16 host cities. With 104 matches, it's the
              biggest World Cup ever staged. The final will be played at MetLife
              Stadium in New Jersey on July 19, 2026.
            </p>
          </div>
        </div>

        <!-- Biggest scorelines -->
        <h2 class="stats-section__heading" style="margin-top: 2.5rem">
          💥 Biggest Scorelines in History
        </h2>
        <div class="scorelines">
          <div class="scoreline">
            <span class="scoreline__teams"
              >Hungary <strong>10</strong> – <strong>1</strong> El
              Salvador</span
            >
            <span class="scoreline__year">1982</span>
          </div>
          <div class="scoreline">
            <span class="scoreline__teams"
              >Hungary <strong>9</strong> – <strong>0</strong> South Korea</span
            >
            <span class="scoreline__year">1954</span>
          </div>
          <div class="scoreline">
            <span class="scoreline__teams"
              >Yugoslavia <strong>9</strong> – <strong>0</strong> Zaire</span
            >
            <span class="scoreline__year">1974</span>
          </div>
          <div class="scoreline">
            <span class="scoreline__teams"
              >Germany <strong>8</strong> – <strong>0</strong> Saudi
              Arabia</span
            >
            <span class="scoreline__year">2002</span>
          </div>
          <div class="scoreline">
            <span class="scoreline__teams"
              >Germany <strong>7</strong> – <strong>1</strong> Brazil</span
            >
            <span class="scoreline__year">2014 SF</span>
          </div>
          <div class="scoreline">
            <span class="scoreline__teams"
              >Austria <strong>7</strong> – <strong>5</strong> Switzerland</span
            >
            <span class="scoreline__year">1954</span>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           FUN FACTS
           ══════════════════════════════════════════════════════════════════ -->
      <section v-if="activeSection === 'Facts'" class="stats-section">
        <h2 class="stats-section__heading">🤩 Fun Facts &amp; Did You Know?</h2>
        <p class="stats-section__intro">
          96 years of World Cup football has produced some truly wild moments,
          records, and stories. Here are some of our favourites.
        </p>

        <div class="facts-grid">
          <div v-for="f in funFacts" :key="f.fact" class="fact-card">
            <span class="fact-card__emoji">{{ f.emoji }}</span>
            <div class="fact-card__body">
              <h3 class="fact-card__title">{{ f.fact }}</h3>
              <p class="fact-card__text">{{ f.detail }}</p>
            </div>
          </div>
        </div>

        <!-- Trivia callout -->
        <div class="trivia-strip">
          <span class="trivia-strip__label">🎲 Quick Trivia</span>
          <ul class="trivia-strip__list">
            <li>
              The Jules Rimet Trophy was stolen in England in 1966 — and found
              by a dog named Pickles.
            </li>
            <li>
              Italy and Brazil are the only nations to have won back-to-back
              World Cups (Italy 1934 &amp; 1938, Brazil 1958 &amp; 1962).
            </li>
            <li>
              The 1950 World Cup had no final — Uruguay won via a round-robin
              group stage.
            </li>
            <li>
              Pelé is the only player to have won three World Cups (1958, 1962,
              1970).
            </li>
            <li>The USA finished third in the very first World Cup in 1930.</li>
            <li>
              North Korea beat Italy 1–0 in 1966 — one of the biggest upsets in
              history.
            </li>
          </ul>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════════════════
           VENUES
           ══════════════════════════════════════════════════════════════════ -->
      <section v-if="activeSection === 'Venues'" class="stats-section">
        <h2 class="stats-section__heading">🏟️ 2026 Host Venues</h2>
        <p class="stats-section__intro">
          16 cities across the USA, Mexico, and Canada will host the 104 matches
          of the 2026 World Cup — the most venues ever used in a single
          tournament.
        </p>

        <div class="venues-grid">
          <div v-for="v in hostCities" :key="v.city" class="venue-card">
            <div class="venue-card__header">
              <span class="venue-card__flag">{{ v.flag }}</span>
              <div class="venue-card__city-wrap">
                <span class="venue-card__city">{{ v.city }}</span>
                <span class="venue-card__country">{{ v.country }}</span>
              </div>
              <span class="venue-card__matches"
                >{{ v.matches }}
                <span class="venue-card__matches-label">matches</span></span
              >
            </div>
            <div class="venue-card__footer">
              <span class="venue-card__venue">{{ v.venue }}</span>
              <span class="venue-card__capacity"
                >{{ v.capacity.toLocaleString() }} cap.</span
              >
            </div>
          </div>
        </div>

        <!-- Final spotlight -->
        <div class="spotlight spotlight--gold" style="margin-top: 2rem">
          <div class="spotlight__emoji">🏆</div>
          <div class="spotlight__body">
            <h3 class="spotlight__title">
              The Final — MetLife Stadium, New Jersey
            </h3>
            <p class="spotlight__text">
              The 2026 World Cup Final will be played at MetLife Stadium in East
              Rutherford, New Jersey on <strong>July 19, 2026</strong>. With a
              capacity of 82,500, it will be one of the largest crowds ever to
              watch a World Cup Final. The stadium is home to both the New York
              Giants and New York Jets NFL teams.
            </p>
          </div>
        </div>
      </section>

      <!-- ── Coming soon banner ─────────────────────────────────────────────── -->
      <div class="coming-soon">
        <span class="coming-soon__icon">📡</span>
        <div class="coming-soon__body">
          <h3 class="coming-soon__title">Live Stats Coming June 11</h3>
          <p class="coming-soon__text">
            Once the tournament kicks off, this page will fill up with live
            goals, assists, cards, saves, and real-time leaderboards from every
            match. Check back on opening day!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  /* ── Page shell ──────────────────────────────────────────────────────────── */
  .stats-page {
    flex: 1;
  }

  .stats-page__inner {
    @apply mx-auto max-w-7xl;
    padding: 0 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  .stats-hero {
    text-align: center;
    padding: 1.5rem 0 0.5rem;
  }

  .stats-hero__title {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 900;
    font-size: clamp(2rem, 5vw, 3.5rem);
    color: oklab(0.72 0.17 0.16 / 0.8);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    line-height: 1;
    text-shadow: 0 2px 12px rgb(0 0 0 / 0.6);
  }

  .stats-hero__sub {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 1.1rem;
    color: rgb(255 255 255 / 0.7);
    margin-top: 0.4rem;
    letter-spacing: 0.08em;
  }

  /* ── By the numbers ──────────────────────────────────────────────────────── */
  .stats-numbers {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    .stats-numbers {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 400px) {
    .stats-numbers {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
  }

  .stats-numbers__card {
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(255 255 255 / 0.08);
    /* border-radius: 12px; */
    padding: 0.75rem 0.5rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    text-align: center;
  }

  .stats-numbers__value {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 900;
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    color: oklab(0.73 0.16 0.16 / 0.8);
    line-height: 1.1;
    letter-spacing: 0.07em;
  }

  .stats-numbers__label {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 600;
    font-size: 0.72rem;
    color: rgb(255 255 255 / 0.7);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    line-height: 1.2;
  }

  .stats-numbers__sub {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.85rem;
    color: oklab(1 0 0 / 0.7);
    letter-spacing: 0.07em;
  }

  /* ── Section filter tabs ─────────────────────────────────────────────────── */
  .stats-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .stats-tabs__btn {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.45rem 1rem 0.35rem;
    /* border-radius: 8px; */
    border: 1px solid rgb(255 255 255 / 0.1);
    background: oklab(0.72 0.17 0.16 / 0.8);
    color: rgb(255 255 255);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .stats-tabs__btn:hover {
    color: rgb(255 255 255 / 1);
    background: oklab(0.72 0.16 0.17 / 0.7);
  }

  .stats-tabs__btn--active {
    background: oklab(0.72 0.17 0.16 / 0.8);
    color: #ffffff;
    border-color: rgb(255 255 255 / 0.2);
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.8);
  }

  /* ── Section wrapper ─────────────────────────────────────────────────────── */
  .stats-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stats-section__heading {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    font-size: 1.3rem;
    color: oklab(0.72 0.17 0.16 / 0.8);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    padding-bottom: 0.5rem;
  }

  .stats-section__intro {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 1rem;
    color: rgb(255 255 255 / 0.65);
    line-height: 1.6;
    letter-spacing: 0.05em;
    /* max-width: 70ch; */
  }

  /* ── Winners grid ────────────────────────────────────────────────────────── */
  .winners-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .winner-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.07);
    border-radius: 0;
    padding: 0.85rem 1rem;
    transition: background 0.15s ease;
  }

  .winner-card:hover {
    background: rgb(255 255 255 / 0.07);
  }

  .winner-card--gold {
    background: linear-gradient(
      135deg,
      rgb(234 179 8 / 0.12),
      rgb(234 179 8 / 0.04)
    );
    border-color: rgb(234 179 8 / 0.25);
  }

  .winner-card__rank {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 0.8rem;
    color: rgb(255 255 255 / 0.3);
    width: 2rem;
    text-align: center;
    flex-shrink: 0;
  }

  .winner-card__flag {
    width: 2.5rem;
    height: 1.875rem;
    object-fit: cover;
    border-radius: 0;
    flex-shrink: 0;
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.4);
  }

  .winner-card__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .winner-card__country {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 1rem;
    color: #ffffff;
    letter-spacing: 0.04em;
  }

  .winner-card__stars {
    display: flex;
    gap: 0.1rem;
    font-size: 0.75rem;
  }

  .winner-card__years {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.72rem;
    color: rgb(255 255 255 / 0.4);
    letter-spacing: 0.05em;
  }

  .winner-card__titles {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }

  .winner-card__titles-num {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 900;
    font-size: 2rem;
    color: #ffffff;
    line-height: 1;
  }

  .winner-card__titles-label {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.65rem;
    color: rgb(255 255 255 / 0.4);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* ── Leaderboard ─────────────────────────────────────────────────────────── */
  .leaderboard {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .leaderboard__row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.06);
    border-radius: 0;
    padding: 0.65rem 0.85rem;
    transition: background 0.15s ease;
  }

  .leaderboard__row:hover {
    background: rgb(255 255 255 / 0.07);
  }

  .leaderboard__row--top3 {
    border-color: rgb(234 179 8 / 0.2);
    background: rgb(234 179 8 / 0.05);
  }

  .leaderboard__rank {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.35);
    width: 1.8rem;
    text-align: center;
    flex-shrink: 0;
  }

  .leaderboard__flag {
    width: 2rem;
    height: 1.5rem;
    object-fit: cover;
    border-radius: 0;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
  }

  .leaderboard__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .leaderboard__name {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 600;
    font-size: 0.9rem;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .leaderboard__meta {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.7rem;
    color: rgb(255 255 255 / 0.4);
    letter-spacing: 0.04em;
  }

  .leaderboard__bar-wrap {
    width: 5rem;
    height: 4px;
    background: rgb(255 255 255 / 0.08);
    border-radius: 0;
    overflow: hidden;
    flex-shrink: 0;
  }

  @media (max-width: 500px) {
    .leaderboard__bar-wrap {
      display: none;
    }
  }

  .leaderboard__bar {
    height: 100%;
    background: linear-gradient(90deg, #f59e0b, #ef4444);
    border-radius: 0;
    transition: width 0.6s ease;
  }

  .leaderboard__value {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    font-size: 1.1rem;
    color: #ffffff;
    flex-shrink: 0;
    text-align: right;
    min-width: 4rem;
  }

  .leaderboard__unit {
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.65rem;
    color: rgb(255 255 255 / 0.4);
    letter-spacing: 0.05em;
  }

  /* ── Spotlight cards ─────────────────────────────────────────────────────── */
  .spotlight {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.1);
    /* border-radius: 14px; */
    padding: 1.25rem;
  }

  .spotlight--amber {
    background: rgb(245 158 11 / 0.07);
    border-color: rgb(245 158 11 / 0.2);
  }

  .spotlight--green {
    background: rgb(34 197 94 / 0.07);
    border-color: rgb(34 197 94 / 0.2);
  }

  .spotlight--gold {
    background: linear-gradient(
      135deg,
      rgb(234 179 8 / 0.1),
      rgb(234 179 8 / 0.03)
    );
    border-color: rgb(234 179 8 / 0.25);
  }

  .spotlight__emoji {
    font-size: 2.5rem;
    flex-shrink: 0;
    line-height: 1;
  }

  .spotlight__body {
    flex: 1;
    min-width: 0;
  }

  .spotlight__title {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 1rem;
    color: #ffffff;
    letter-spacing: 0.04em;
    margin-bottom: 0.4rem;
  }

  .spotlight__text {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.9rem;
    color: rgb(255 255 255 / 0.7);
    line-height: 1.65;
    letter-spacing: 0.08em;
  }

  /* ── Records grid ────────────────────────────────────────────────────────── */
  .records-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 600px) {
    .records-grid {
      grid-template-columns: 1fr;
    }
  }

  .record-card {
    display: flex;
    gap: 0.85rem;
    align-items: flex-start;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.07);
    border-radius: 0;
    padding: 1rem;
    transition: background 0.15s ease;
  }

  .record-card:hover {
    background: rgb(255 255 255 / 0.07);
  }

  .record-card__emoji {
    font-size: 1.75rem;
    flex-shrink: 0;
    line-height: 1;
  }

  .record-card__body {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .record-card__label {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 400;
    font-size: 0.72rem;
    color: rgb(255 255 255 / 0.45);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .record-card__value {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    font-size: 1.1rem;
    color: #ffffff;
    letter-spacing: 0.02em;
  }

  .record-card__detail {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.78rem;
    color: rgb(255 255 255 / 0.5);
    line-height: 1.4;
    letter-spacing: 0.04em;
  }

  /* ── Scorelines ──────────────────────────────────────────────────────────── */
  .scorelines {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .scoreline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.06);
    border-radius: 0;
    padding: 0.6rem 1rem;
  }

  .scoreline__teams {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.9rem;
    color: rgb(255 255 255 / 0.8);
    letter-spacing: 0.04em;
  }

  .scoreline__teams strong {
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    color: #ffffff;
    font-size: 1rem;
  }

  .scoreline__year {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.75rem;
    color: rgb(255 255 255 / 0.35);
    letter-spacing: 0.06em;
    flex-shrink: 0;
  }

  /* ── Fun facts grid ──────────────────────────────────────────────────────── */
  .facts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 600px) {
    .facts-grid {
      grid-template-columns: 1fr;
    }
  }

  .fact-card {
    display: flex;
    gap: 0.85rem;
    align-items: flex-start;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.07);
    border-radius: 0;
    padding: 1rem;
    transition: background 0.15s ease;
  }

  .fact-card:hover {
    background: rgb(255 255 255 / 0.07);
  }

  .fact-card__emoji {
    font-size: 1.75rem;
    flex-shrink: 0;
    line-height: 1;
  }

  .fact-card__body {
    flex: 1;
    min-width: 0;
  }

  .fact-card__title {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 0.85rem;
    color: #ffffff;
    letter-spacing: 0.04em;
    margin-bottom: 0.3rem;
    text-transform: uppercase;
  }

  .fact-card__text {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.82rem;
    color: rgb(255 255 255 / 0.65);
    line-height: 1.55;
    letter-spacing: 0.04em;
  }

  /* ── Trivia strip ────────────────────────────────────────────────────────── */
  .trivia-strip {
    background: rgb(99 102 241 / 0.08);
    border: 1px solid rgb(99 102 241 / 0.2);
    border-radius: 0;
    padding: 1.25rem;
  }

  .trivia-strip__label {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 0.8rem;
    color: rgb(165 180 252 / 0.9);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: block;
    margin-bottom: 0.75rem;
  }

  .trivia-strip__list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .trivia-strip__list li {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.7);
    line-height: 1.5;
    letter-spacing: 0.04em;
    padding-left: 1.2rem;
    position: relative;
  }

  .trivia-strip__list li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: rgb(165 180 252 / 0.6);
    font-size: 0.75rem;
  }

  /* ── Venues grid ─────────────────────────────────────────────────────────── */
  .venues-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }

  @media (max-width: 600px) {
    .venues-grid {
      grid-template-columns: 1fr;
    }
  }

  .venue-card {
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.07);
    /* border-radius: 12px; */
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: background 0.15s ease;
  }

  .venue-card:hover {
    background: rgb(255 255 255 / 0.07);
  }

  .venue-card__header {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .venue-card__flag {
    font-size: 1.4rem;
    flex-shrink: 0;
    line-height: 1;
  }

  .venue-card__city-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
  }

  .venue-card__city {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 700;
    font-size: 0.9rem;
    color: #ffffff;
    letter-spacing: 0.03em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .venue-card__country {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.75);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .venue-card__matches {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    font-size: 1.2rem;
    color: #ffffff;
    flex-shrink: 0;
    text-align: right;
  }

  .venue-card__matches-label {
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.6rem;
    color: rgb(255 255 255 / 0.35);
    letter-spacing: 0.06em;
    display: block;
    text-align: right;
    margin-top: -0.1rem;
  }

  .venue-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgb(255 255 255 / 0.06);
    padding-top: 0.4rem;
  }

  .venue-card__venue {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 400;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.85);
    letter-spacing: 0.08em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .venue-card__capacity {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.85rem;
    color: rgb(255 255 255 / 0.85);
    letter-spacing: 0.04em;
    flex-shrink: 0;
    margin-left: 0.5rem;
  }

  /* ── Coming soon banner ──────────────────────────────────────────────────── */
  .coming-soon {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    background: linear-gradient(
      135deg,
      rgb(234 179 8 / 0.08),
      rgb(239 68 68 / 0.06)
    );
    border: 1px solid rgb(234 179 8 / 0.2);
    /* border-radius: 16px; */
    padding: 1.5rem;
    margin-top: 0.5rem;
  }

  .coming-soon__icon {
    font-size: 2.5rem;
    flex-shrink: 0;
    line-height: 1;
  }

  .coming-soon__body {
    flex: 1;
    min-width: 0;
  }

  .coming-soon__title {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 100,
      'wght' 800;
    font-size: 1.1rem;
    color: #ffffff;
    letter-spacing: 0.04em;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
  }

  .coming-soon__text {
    font-family: 'Anybody', sans-serif;
    font-variation-settings:
      'wdth' 87.5,
      'wght' 300;
    font-size: 0.88rem;
    color: rgb(255 255 255 / 0.7);
    line-height: 1.65;
    letter-spacing: 0.08em;
  }
</style>
