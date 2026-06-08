// Shared venue data for 2026 World Cup host cities.
// Used by: app/pages/stats.vue, app/components/VenueDetail/Modal.vue

export interface VenueInfo {
  city: string
  country: string
  flag: string
  matches: number
  venue: string
  capacity: number
  isFinal?: boolean
  image: string
  bio: string
}

export const HOST_CITIES: VenueInfo[] = [
  {
    city: 'New York / New Jersey',
    country: 'USA',
    flag: '🇺🇸',
    matches: 8,
    venue: 'MetLife Stadium',
    capacity: 82_500,
    isFinal: true,
    image: '/venues/metlife.jpg',
    bio: 'The largest stadium in the NFL, MetLife is home to both the New York Giants and New York Jets. Opened in 2010 in East Rutherford, NJ, it sits just 8 miles from Midtown Manhattan. It will host the 2026 World Cup Final on July 19 — the most-watched sporting event on the planet.',
  },
  {
    city: 'Los Angeles',
    country: 'USA',
    flag: '🇺🇸',
    matches: 8,
    venue: 'SoFi Stadium',
    capacity: 70_240,
    image: '/venues/sofi.jpg',
    bio: 'One of the most technologically advanced stadiums ever built, SoFi opened in 2020 in Inglewood and is home to the LA Rams and LA Chargers. Its iconic translucent roof and 70,000-seat bowl make it one of the most visually stunning venues in world sport. It hosted Super Bowl LVI in 2022.',
  },
  {
    city: 'Dallas',
    country: 'USA',
    flag: '🇺🇸',
    matches: 9,
    venue: 'AT&T Stadium',
    capacity: 80_000,
    image: '/venues/att.jpg',
    bio: "Known as 'Jerry World' after Cowboys owner Jerry Jones, AT&T Stadium in Arlington is one of the most famous sports venues in America. Home to the Dallas Cowboys, it features the world's largest column-free interior and a retractable roof. Dallas hosts more matches (9) than any other 2026 city.",
  },
  {
    city: 'San Francisco Bay Area',
    country: 'USA',
    flag: '🇺🇸',
    matches: 8,
    venue: "Levi's Stadium",
    capacity: 68_500,
    image: '/venues/levis.jpg',
    bio: "Home to the San Francisco 49ers since 2014, Levi's Stadium sits in Santa Clara at the heart of Silicon Valley. The stadium is renowned for its sustainability credentials — it generates more solar energy than it consumes on non-event days. It hosted Super Bowl 50 in 2016.",
  },
  {
    city: 'Miami',
    country: 'USA',
    flag: '🇺🇸',
    matches: 8,
    venue: 'Hard Rock Stadium',
    capacity: 65_326,
    image: '/venues/hardrock.jpg',
    bio: 'Home to the Miami Dolphins and the annual Formula 1 Miami Grand Prix, Hard Rock Stadium has undergone a $550 million renovation to become one of the most modern venues in the NFL. Located in Miami Gardens, it has hosted five Super Bowls and the College Football Playoff National Championship.',
  },
  {
    city: 'Atlanta',
    country: 'USA',
    flag: '🇺🇸',
    matches: 8,
    venue: 'Mercedes-Benz Stadium',
    capacity: 71_000,
    image: '/venues/mercedesbenz.jpg',
    bio: 'Opened in 2017, Mercedes-Benz Stadium is widely regarded as the finest multi-purpose stadium in North America. Home to the Atlanta Falcons (NFL) and Atlanta United (MLS), its retractable roof opens like a camera aperture. It hosted the 2019 Super Bowl and the 2018 College Football Playoff National Championship.',
  },
  {
    city: 'Seattle',
    country: 'USA',
    flag: '🇺🇸',
    matches: 8,
    venue: 'Lumen Field',
    capacity: 69_000,
    image: '/venues/lumen.jpg',
    bio: 'Lumen Field is home to the Seattle Seahawks (NFL) and Seattle Sounders FC (MLS), one of the most successful clubs in American soccer history. Opened in 2002, it is famous for its deafening crowd noise — the Seahawks fans once set a world record for crowd noise at a sporting event. The open design funnels sound back onto the field.',
  },
  {
    city: 'Houston',
    country: 'USA',
    flag: '🇺🇸',
    matches: 8,
    venue: 'NRG Stadium',
    capacity: 72_220,
    image: '/venues/nrg.jpg',
    bio: 'NRG Stadium was the first NFL venue with a retractable roof, opening in 2002 as the home of the Houston Texans. It famously served as a shelter for thousands of Hurricane Katrina evacuees in 2005. The stadium has hosted two Super Bowls and sits adjacent to the legendary Astrodome.',
  },
  {
    city: 'Kansas City',
    country: 'USA',
    flag: '🇺🇸',
    matches: 8,
    venue: 'Arrowhead Stadium',
    capacity: 76_416,
    image: '/venues/arrowhead.jpg',
    bio: 'Arrowhead Stadium has been home to the Kansas City Chiefs since 1972 and is one of the most iconic venues in American football. The Chiefs have won four Super Bowls in the Patrick Mahomes era, making Arrowhead one of the most celebrated stadiums in the country. It holds the Guinness World Record for loudest outdoor stadium.',
  },
  {
    city: 'Boston',
    country: 'USA',
    flag: '🇺🇸',
    matches: 8,
    venue: 'Gillette Stadium',
    capacity: 65_878,
    image: '/venues/gillette.jpg',
    bio: 'Home to the New England Patriots (NFL) and New England Revolution (MLS), Gillette Stadium opened in 2002 in Foxborough, Massachusetts. The Patriots have won six Super Bowls in the Bill Belichick era, cementing Gillette as one of the most successful venues in NFL history. It sits 25 miles south of Boston.',
  },
  {
    city: 'Philadelphia',
    country: 'USA',
    flag: '🇺🇸',
    matches: 8,
    venue: 'Lincoln Financial Field',
    capacity: 69_796,
    image: '/venues/lincoln.jpg',
    bio: "Known as 'The Linc', Lincoln Financial Field has been home to the Philadelphia Eagles since 2003. The Eagles are one of the NFL's most passionate fanbases, and the stadium is famous for its electric atmosphere. Philadelphia is one of America's great sports cities, and the Linc sits in the heart of its sports complex.",
  },
  {
    city: 'Mexico City',
    country: 'Mexico',
    flag: '🇲🇽',
    matches: 5,
    venue: 'Estadio Azteca',
    capacity: 87_523,
    image: '/venues/azteca.jpg',
    bio: "The Azteca is the most storied football stadium in the world. It hosted the 1970 and 1986 World Cup Finals, and was the stage for Maradona's 'Hand of God' and 'Goal of the Century' in 1986. Home to Club América and the Mexican national team, it will become the first stadium to host three World Cup tournaments in 2026.",
  },
  {
    city: 'Guadalajara',
    country: 'Mexico',
    flag: '🇲🇽',
    matches: 5,
    venue: 'Estadio Akron',
    capacity: 49_850,
    image: '/venues/akron.jpg',
    bio: "Opened in 2010, Estadio Akron is the modern home of Club Deportivo Guadalajara — known as Chivas — one of Mexico's most beloved clubs. Located in Zapopan on the outskirts of Guadalajara, the stadium's distinctive wave-shaped roof is an architectural landmark. Guadalajara is Mexico's second-largest city and a passionate football town.",
  },
  {
    city: 'Monterrey',
    country: 'Mexico',
    flag: '🇲🇽',
    matches: 5,
    venue: 'Estadio BBVA',
    capacity: 53_500,
    image: '/venues/bbva.jpg',
    bio: "Estadio BBVA opened in 2015 and is widely considered one of the most beautiful stadiums in Latin America. Home to CF Monterrey, it is set against the dramatic backdrop of the Cerro de la Silla mountain. The stadium's steep stands create an intense atmosphere, and Monterrey is one of Mexico's most football-mad cities.",
  },
  {
    city: 'Toronto',
    country: 'Canada',
    flag: '🇨🇦',
    matches: 7,
    venue: 'BMO Field',
    capacity: 30_000,
    image: '/venues/bmo.jpg',
    bio: "BMO Field is Canada's premier football-specific stadium, home to Toronto FC of MLS since 2007. Located on the waterfront at Exhibition Place, it has undergone several expansions and hosted the 2016 MLS Cup Final. Toronto is one of the world's most multicultural cities, and its diverse fanbase will create a unique World Cup atmosphere.",
  },
  {
    city: 'Vancouver',
    country: 'Canada',
    flag: '🇨🇦',
    matches: 7,
    venue: 'BC Place',
    capacity: 54_500,
    image: '/venues/bcplace.jpg',
    bio: "BC Place is Canada's largest stadium and home to the Vancouver Whitecaps (MLS) and BC Lions (CFL). Its retractable roof — the largest air-supported roof in the world when it opened in 1983 — was replaced with a modern cable-supported version in 2011. Vancouver hosted matches at the 2015 FIFA Women's World Cup.",
  },
]

/** Look up venue info by venue name (case-insensitive, partial match for
 *  variants like "GEHA Field at Arrowhead Stadium" → Arrowhead Stadium). */
export function getVenueInfo(
  venueName: string | null | undefined
): VenueInfo | null {
  if (!venueName) return null
  const lower = venueName.toLowerCase()
  // Exact match first
  const exact = HOST_CITIES.find((v) => v.venue.toLowerCase() === lower)
  if (exact) return exact
  // Partial: ESPN sometimes uses "GEHA Field at Arrowhead Stadium"
  const partial = HOST_CITIES.find(
    (v) =>
      lower.includes(v.venue.toLowerCase()) ||
      v.venue.toLowerCase().includes(lower)
  )
  return partial ?? null
}
