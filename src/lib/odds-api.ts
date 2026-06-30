// src/lib/odds-api.ts
// Aggregates 1-X-2 decimal odds across European bookmakers from The Odds API
// (free tier). Returns a map keyed by our standard matchKey (e.g. "MEX_RSA").
import { EXCEL_NAME_TO_TLA, getMatchKey } from './team-map'

// Mapeos extra para nombres que The Odds API usa distinto a EXCEL_NAME_TO_TLA.
const ODDS_NAME_OVERRIDES: Record<string, string> = {
  'Korea Republic': 'KOR',
  'IR Iran': 'IRN',
  'Türkiye': 'TUR',
  'Cabo Verde': 'CPV',
  "Côte d'Ivoire": 'CIV',
  'Ivory Coast': 'CIV',
  'DR Congo': 'COD',
  'Democratic Republic of the Congo': 'COD',
  'Czechia': 'CZE',
  'Curacao': 'CUW',
}

function nameToTla(name: string): string | null {
  if (!name) return null
  return ODDS_NAME_OVERRIDES[name] ?? EXCEL_NAME_TO_TLA[name] ?? null
}

interface OddsOutcome { name: string; price: number }
interface OddsMarket { key: string; outcomes: OddsOutcome[] }
interface OddsBookmaker { key: string; title: string; markets: OddsMarket[] }
interface OddsEvent {
  home_team: string
  away_team: string
  commence_time: string
  bookmakers: OddsBookmaker[]
}

export interface DecimalOdds {
  home: number
  draw: number
  away: number
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function round2(x: number): number {
  return Math.round(x * 100) / 100
}

export async function fetchWcOdds(): Promise<Record<string, DecimalOdds>> {
  const key = process.env.ODDS_API_KEY
  if (!key) return {}
  const url =
    'https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds' +
    `?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${key}`
  const res = await fetch(url, { next: { revalidate: 7200 } })
  if (!res.ok) throw new Error(`Odds API ${res.status}`)
  const events: OddsEvent[] = await res.json()

  const result: Record<string, DecimalOdds> = {}
  for (const ev of events) {
    const homeTla = nameToTla(ev.home_team)
    const awayTla = nameToTla(ev.away_team)
    if (!homeTla || !awayTla) continue

    const acc = { home: [] as number[], draw: [] as number[], away: [] as number[] }
    for (const bm of ev.bookmakers) {
      const m = bm.markets.find(mk => mk.key === 'h2h')
      if (!m) continue
      for (const o of m.outcomes) {
        if (o.name === ev.home_team) acc.home.push(o.price)
        else if (o.name === ev.away_team) acc.away.push(o.price)
        else acc.draw.push(o.price)
      }
    }
    const h = median(acc.home)
    const d = median(acc.draw)
    const a = median(acc.away)
    if (!h || !d || !a) continue

    result[getMatchKey(homeTla, awayTla)] = {
      home: round2(h),
      draw: round2(d),
      away: round2(a),
    }
  }
  return result
}
