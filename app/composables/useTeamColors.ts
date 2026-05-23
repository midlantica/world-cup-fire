// MLS team colors — two-color system: primary (accent) + secondary (background base).
// primary:   the team's signature accent color (used for highlights, tabs, accents)
// secondary: the background base color (used for dark panel backgrounds)
//
// Keys match ESPN's team.displayName exactly (after normalizeTeamName).

export interface TeamColorPair {
  primary: string
  secondary: string
}

export const TEAM_COLOR_PAIRS: Record<string, TeamColorPair> = {
  'Atlanta United FC': { primary: '#9d2235', secondary: '#231f20' }, // red / near-black
  'Austin FC': { primary: '#00b140', secondary: '#101820' }, // verde / dark
  'CF Montréal': { primary: '#003da6', secondary: '#0a0f1e' }, // blue / dark navy
  'Charlotte FC': { primary: '#1a85c8', secondary: '#0d1b2a' }, // sky blue / dark navy
  'Chicago Fire FC': { primary: '#cc0000', secondary: '#0a0a0a' }, // red / black
  'Colorado Rapids': { primary: '#8a2432', secondary: '#0d1117' }, // burgundy / dark
  'Columbus Crew': { primary: '#fedd00', secondary: '#0a0a0a' }, // gold / black
  'D.C. United': { primary: '#d61018', secondary: '#0a0a0a' }, // red / black
  'FC Cincinnati': { primary: '#f05323', secondary: '#001a57' }, // orange / navy
  'FC Dallas': { primary: '#c6093b', secondary: '#0d1117' }, // red / dark
  'Houston Dynamo FC': { primary: '#ff6b03', secondary: '#0a0a0a' }, // orange / black
  'Inter Miami CF': { primary: '#f7b5cd', secondary: '#0a0a0a' }, // pink / black
  'LA Galaxy': { primary: '#ffd700', secondary: '#00235d' }, // gold / navy
  LAFC: { primary: '#c7a36f', secondary: '#0a0a0a' }, // gold / black
  'Minnesota United FC': { primary: '#9bcde4', secondary: '#231f20' }, // light blue / dark
  'Nashville SC': { primary: '#ece83a', secondary: '#0a0a0a' }, // yellow / black
  'New England Revolution': { primary: '#0a2240', secondary: '#0a1628' }, // navy / dark navy
  'New York City FC': { primary: '#6cace4', secondary: '#003087' }, // sky blue / navy
  'Orlando City SC': { primary: '#60269e', secondary: '#1a0a2e' }, // purple / dark purple
  'Philadelphia Union': { primary: '#b19b69', secondary: '#051f31' }, // gold / dark navy
  'Portland Timbers': { primary: '#4d9e3f', secondary: '#1a2e1a' }, // green / dark green
  'Real Salt Lake': { primary: '#b81137', secondary: '#013474' }, // red / navy
  'Red Bull New York': { primary: '#d40f2f', secondary: '#0a0a0a' }, // red / black
  'San Diego FC': { primary: '#6ab0c8', secondary: '#1a2a35' }, // teal-blue / dark
  'San Jose Earthquakes': { primary: '#003da6', secondary: '#0a1628' }, // blue / dark navy
  'Seattle Sounders FC': { primary: '#4fb84f', secondary: '#236192' }, // green / dark teal
  'Sporting Kansas City': { primary: '#93b6e0', secondary: '#002b5c' }, // light blue / navy
  'St. Louis City SC': { primary: '#ec1458', secondary: '#0a0a0a' }, // red-pink / black
  'St. Louis CITY SC': { primary: '#ec1458', secondary: '#0a0a0a' }, // ESPN standings casing
  'Toronto FC': { primary: '#e31837', secondary: '#0a0a0a' }, // red / black
  'Vancouver Whitecaps': { primary: '#9bc4e2', secondary: '#12284c' }, // light blue / navy
}

// Legacy single-color map — kept for backward compat with any code that still
// imports TEAM_COLORS directly (e.g. GameBlock color dots).
export const TEAM_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_COLOR_PAIRS).map(([k, v]) => [k, v.primary])
)

/** Return the primary accent color for a team name, falling back to a neutral grey. */
export function getTeamColor(teamName: string): string {
  return TEAM_COLOR_PAIRS[teamName]?.primary ?? '#6b7280'
}

/** Return the secondary background color for a team name, falling back to near-black. */
export function getTeamSecondaryColor(teamName: string): string {
  return TEAM_COLOR_PAIRS[teamName]?.secondary ?? '#0f172a'
}
