/**
 * Download last-match lineup data for all 48 WC 2026 teams.
 * Saves each team's roster as public/lineups/<teamId>.json
 *
 * Run: node scripts/download-lineups.mjs
 */

import { mkdir, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'lineups')

const TEAMS = [
  { id: '203', name: 'Mexico' },
  { id: '451', name: 'South Korea' },
  { id: '450', name: 'Czechia' },
  { id: '467', name: 'South Africa' },
  { id: '206', name: 'Canada' },
  { id: '452', name: 'Bosnia-Herzegovina' },
  { id: '475', name: 'Switzerland' },
  { id: '4398', name: 'Qatar' },
  { id: '205', name: 'Brazil' },
  { id: '580', name: 'Scotland' },
  { id: '2654', name: 'Haiti' },
  { id: '2869', name: 'Morocco' },
  { id: '210', name: 'Paraguay' },
  { id: '465', name: 'Türkiye' },
  { id: '628', name: 'Australia' },
  { id: '660', name: 'United States' },
  { id: '209', name: 'Ecuador' },
  { id: '481', name: 'Germany' },
  { id: '4789', name: 'Ivory Coast' },
  { id: '11678', name: 'Curacao' },
  { id: '449', name: 'Netherlands' },
  { id: '466', name: 'Sweden' },
  { id: '627', name: 'Japan' },
  { id: '659', name: 'Tunisia' },
  { id: '459', name: 'Belgium' },
  { id: '469', name: 'Iran' },
  { id: '2620', name: 'Egypt' },
  { id: '2666', name: 'New Zealand' },
  { id: '164', name: 'Spain' },
  { id: '212', name: 'Uruguay' },
  { id: '655', name: 'Saudi Arabia' },
  { id: '2597', name: 'Cape Verde' },
  { id: '464', name: 'Norway' },
  { id: '478', name: 'France' },
  { id: '654', name: 'Senegal' },
  { id: '4375', name: 'Iraq' },
  { id: '202', name: 'Argentina' },
  { id: '474', name: 'Austria' },
  { id: '624', name: 'Algeria' },
  { id: '2917', name: 'Jordan' },
  { id: '208', name: 'Colombia' },
  { id: '482', name: 'Portugal' },
  { id: '2570', name: 'Uzbekistan' },
  { id: '2850', name: 'Congo DR' },
  { id: '448', name: 'England' },
  { id: '477', name: 'Croatia' },
  { id: '2659', name: 'Panama' },
  { id: '4469', name: 'Ghana' },
]

const BASE_SCHEDULE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all'
const BASE_SUMMARY =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

function extractRoster(entry) {
  if (!entry) return []
  const list = entry.roster ?? entry.athletes ?? []
  return list.map((a) => ({
    name: a.athlete?.displayName ?? a.athlete?.shortName ?? '—',
    position: a.position?.abbreviation ?? '',
    jersey: a.athlete?.jersey ?? a.jersey ?? '',
    starter: a.starter ?? false,
  }))
}

async function getLastMatchRoster(team) {
  // Step 1: get team schedule, find most recent completed match
  let schedule
  try {
    schedule = await fetchJson(`${BASE_SCHEDULE}/teams/${team.id}/schedule`)
  } catch (e) {
    console.warn(`  ⚠ ${team.name}: schedule fetch failed — ${e.message}`)
    return null
  }

  const events = schedule.events ?? []
  // Filter completed matches, sort most recent first
  const completed = events
    .filter((ev) => {
      const statusType = ev.competitions?.[0]?.status?.type ?? {}
      return (
        statusType.completed === true || statusType.name === 'STATUS_FULL_TIME'
      )
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Try up to 5 recent matches to find one with roster data
  for (let i = 0; i < Math.min(5, completed.length); i++) {
    const ev = completed[i]
    const eventId = String(ev.id ?? '')
    if (!eventId) continue

    let detail
    try {
      detail = await fetchJson(`${BASE_SUMMARY}?event=${eventId}`)
    } catch (e) {
      console.warn(
        `  ⚠ ${team.name}: summary fetch failed for ${eventId} — ${e.message}`
      )
      continue
    }

    const rosters = detail.rosters ?? []
    // Find this team's roster entry
    const entry =
      rosters.find((r) => {
        const dn = r?.team?.displayName ?? ''
        return (
          dn.toLowerCase().includes(team.name.toLowerCase()) ||
          team.name.toLowerCase().includes(dn.toLowerCase())
        )
      }) ?? rosters[0]

    const players = extractRoster(entry)
    if (players.length > 0) {
      // Find opponent name
      const opponent = rosters.find((r) => {
        const dn = r?.team?.displayName ?? ''
        return (
          !dn.toLowerCase().includes(team.name.toLowerCase()) &&
          !team.name.toLowerCase().includes(dn.toLowerCase())
        )
      })
      const opponentName = opponent?.team?.displayName ?? 'last match'

      return {
        teamId: team.id,
        teamName: team.name,
        matchId: eventId,
        matchDate: ev.date ?? '',
        opponentName,
        players,
        fetchedAt: new Date().toISOString(),
      }
    }
  }

  console.warn(`  ⚠ ${team.name}: no roster data found in last 5 matches`)
  return null
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  console.log(`Downloading lineups for ${TEAMS.length} teams...\n`)

  let success = 0
  let failed = 0

  for (const team of TEAMS) {
    process.stdout.write(`  ${team.name} (${team.id})... `)
    try {
      const data = await getLastMatchRoster(team)
      if (data) {
        const path = join(OUT_DIR, `${team.id}.json`)
        await writeFile(path, JSON.stringify(data, null, 2))
        console.log(`✓ ${data.players.length} players vs ${data.opponentName}`)
        success++
      } else {
        console.log('✗ no data')
        failed++
      }
    } catch (e) {
      console.log(`✗ error: ${e.message}`)
      failed++
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed`)
}

main().catch(console.error)
