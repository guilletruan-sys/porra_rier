// src/lib/football-api.ts
import type { Match, MatchDetails, Stage, Team } from './types'

const BASE_URL = 'https://api.football-data.org/v4'
const WC_CODE = 'WC'

// football-data.org uses non-standard TLAs for some teams; normalize to FIFA codes
const TLA_NORMALIZE: Record<string, string> = {
  URY: 'URU',
}

// football-data.org names the early knockout rounds LAST_32 / LAST_16; the app
// uses the FIFA-style ROUND_OF_32 / ROUND_OF_16. The later rounds already match.
const STAGE_NORMALIZE: Record<string, Stage> = {
  LAST_32: 'ROUND_OF_32',
  LAST_16: 'ROUND_OF_16',
}

function normalizeTeam(team: Team): Team {
  const tla = TLA_NORMALIZE[team.tla] ?? team.tla
  return tla === team.tla ? team : { ...team, tla }
}

function normalizeMatch(m: Match): Match {
  const stage = STAGE_NORMALIZE[m.stage] ?? m.stage
  return { ...m, stage, homeTeam: normalizeTeam(m.homeTeam), awayTeam: normalizeTeam(m.awayTeam) }
}

function headers() {
  return { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY ?? '' }
}

interface ApiMatchesResponse {
  matches: Match[]
}

export async function fetchAllMatches(): Promise<Match[]> {
  const res = await fetch(`${BASE_URL}/competitions/${WC_CODE}/matches`, {
    headers: headers(),
    next: { revalidate: 10 },
  })
  if (!res.ok) throw new Error(`football-data.org error: ${res.status} ${res.statusText}`)
  const data: ApiMatchesResponse = await res.json()
  return data.matches.map(normalizeMatch)
}

export async function fetchTodayMatches(): Promise<Match[]> {
  const today = new Date().toISOString().split('T')[0]
  const res = await fetch(
    `${BASE_URL}/competitions/${WC_CODE}/matches?dateFrom=${today}&dateTo=${today}`,
    { headers: headers(), next: { revalidate: 30 } },
  )
  if (!res.ok) throw new Error(`football-data.org error: ${res.status}`)
  const data: ApiMatchesResponse = await res.json()
  return data.matches.map(normalizeMatch)
}

export async function fetchMatchDetails(id: number): Promise<MatchDetails> {
  const res = await fetch(`${BASE_URL}/matches/${id}`, {
    headers: headers(),
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`football-data.org error: ${res.status}`)
  const data = await res.json()
  return {
    ...normalizeMatch(data as Match),
    goals: data.goals ?? [],
    bookings: data.bookings ?? [],
    substitutions: data.substitutions ?? [],
    venue: data.venue,
    attendance: data.attendance,
    referees: data.referees ?? [],
    homeFormation: data.homeTeam?.formation,
    homeLineup: data.homeTeam?.lineup ?? [],
    homeBench: data.homeTeam?.bench ?? [],
    awayFormation: data.awayTeam?.formation,
    awayLineup: data.awayTeam?.lineup ?? [],
    awayBench: data.awayTeam?.bench ?? [],
  }
}
