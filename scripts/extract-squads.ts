// scripts/extract-squads.ts
// Fetch 2026 FIFA World Cup squads from Wikipedia and write src/data/squads-2026.json.
// Run with: npx ts-node --project tsconfig.scripts.json scripts/extract-squads.ts

import * as fs from 'fs'
import * as path from 'path'

const WIKI_URL =
  'https://en.wikipedia.org/w/api.php?action=parse&page=2026_FIFA_World_Cup_squads&format=json&prop=wikitext'

// Wikipedia section header → our TLA
const NAME_TO_TLA: Record<string, string> = {
  // Group A
  'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR',
  'Czech Republic': 'CZE', 'Czechia': 'CZE',
  // Group B
  'Canada': 'CAN', 'Bosnia and Herzegovina': 'BIH', 'Qatar': 'QAT', 'Switzerland': 'SUI',
  // Group C
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  // Group D
  'United States': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS',
  'Turkey': 'TUR', 'Türkiye': 'TUR',
  // Group E
  'Germany': 'GER', 'Curaçao': 'CUW', 'Curacao': 'CUW',
  'Ivory Coast': 'CIV', "Côte d'Ivoire": 'CIV', 'Ecuador': 'ECU',
  // Group F
  'Netherlands': 'NED', 'Japan': 'JPN', 'Sweden': 'SWE', 'Tunisia': 'TUN',
  // Group G
  'Belgium': 'BEL', 'Egypt': 'EGY', 'Iran': 'IRN', 'IR Iran': 'IRN', 'New Zealand': 'NZL',
  // Group H
  'Spain': 'ESP', 'Cape Verde': 'CPV', 'Cabo Verde': 'CPV',
  'Saudi Arabia': 'KSA', 'Uruguay': 'URU',
  // Group I
  'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
  // Group J
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  // Group K
  'Portugal': 'POR', 'DR Congo': 'COD', 'Democratic Republic of the Congo': 'COD',
  'Uzbekistan': 'UZB', 'Colombia': 'COL',
  // Group L
  'England': 'ENG', 'Croatia': 'CRO', 'Ghana': 'GHA', 'Panama': 'PAN',
}

interface Player {
  number: number
  position: 'GK' | 'DF' | 'MF' | 'FW' | string
  name: string
}

// Walk through `body` looking for `{{nat fs g player|...}}` templates,
// handling nested {{ ... }} (the age template) properly.
function extractPlayerTemplates(body: string): string[] {
  const results: string[] = []
  const marker = '{{nat fs g player'
  let i = 0
  while (true) {
    const start = body.indexOf(marker, i)
    if (start < 0) break
    let depth = 0
    let j = start
    while (j < body.length) {
      if (body[j] === '{' && body[j + 1] === '{') { depth++; j += 2; continue }
      if (body[j] === '}' && body[j + 1] === '}') {
        depth--; j += 2
        if (depth === 0) break
        continue
      }
      j++
    }
    // Strip outer {{ }} and the "nat fs g player" prefix
    const inner = body.slice(start + 2, j - 2).replace(/^nat fs g player\|?/, '')
    results.push(inner)
    i = j
  }
  return results
}

function unwrapWikiLink(s: string): string {
  // [[Page|Display]] → Display, [[Page]] → Page, otherwise s
  const m = s.match(/^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/)
  if (m) return (m[2] ?? m[1]).trim()
  return s.trim()
}

function parsePlayer(inner: string): Player | null {
  // Split by `|` but ignore those inside nested {{ }} or [[ ]]
  const parts: string[] = []
  let depthC = 0  // {{ }}
  let depthB = 0  // [[ ]]
  let buf = ''
  for (let k = 0; k < inner.length; k++) {
    const a = inner[k], b = inner[k + 1]
    if (a === '{' && b === '{') { depthC++; buf += a + b; k++; continue }
    if (a === '}' && b === '}') { depthC--; buf += a + b; k++; continue }
    if (a === '[' && b === '[') { depthB++; buf += a + b; k++; continue }
    if (a === ']' && b === ']') { depthB--; buf += a + b; k++; continue }
    if (a === '|' && depthC === 0 && depthB === 0) { parts.push(buf); buf = ''; continue }
    buf += a
  }
  if (buf) parts.push(buf)

  const params: Record<string, string> = {}
  for (const p of parts) {
    const eq = p.indexOf('=')
    if (eq < 0) continue
    params[p.slice(0, eq).trim()] = p.slice(eq + 1).trim()
  }
  if (!params.name || !params.no || !params.pos) return null
  const number = parseInt(params.no, 10)
  if (Number.isNaN(number)) return null
  return {
    number,
    position: params.pos.toUpperCase(),
    name: unwrapWikiLink(params.name),
  }
}

async function main() {
  const res = await fetch(WIKI_URL, { headers: { 'User-Agent': 'PorraTaladros/1.0 (extract-squads.ts)' } })
  if (!res.ok) throw new Error(`Wikipedia error: ${res.status}`)
  const data = await res.json() as { parse: { wikitext: { '*': string } } }
  const wikitext = data.parse.wikitext['*']

  // Sections by ==Name== headers. Wikipedia squads page has both ==Group A== headers
  // and ===Country=== headers. Match both depths.
  const headerRegex = /^=+\s*([^=\n]+?)\s*=+$/gm
  const matches: Array<{ name: string; idx: number; level: number }> = []
  let h: RegExpExecArray | null
  while ((h = headerRegex.exec(wikitext)) !== null) {
    const raw = h[0]
    const level = raw.match(/^=+/)![0].length
    matches.push({ name: h[1].trim(), idx: h.index + raw.length, level })
  }

  const result: Record<string, { name: string; players: Player[] }> = {}

  for (let mi = 0; mi < matches.length; mi++) {
    const cur = matches[mi]
    const tla = NAME_TO_TLA[cur.name]
    if (!tla) continue
    const next = matches[mi + 1]
    const body = wikitext.slice(cur.idx, next ? next.idx - next.name.length - 4 : wikitext.length)
    const players: Player[] = []
    for (const tmpl of extractPlayerTemplates(body)) {
      const p = parsePlayer(tmpl)
      if (p) players.push(p)
    }
    if (players.length > 0) {
      result[tla] = { name: cur.name, players }
    }
  }

  const outPath = path.join(__dirname, '..', 'src', 'data', 'squads-2026.json')
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2))
  console.log(`Saved ${Object.keys(result).length} teams to ${outPath}`)
  for (const tla of Object.keys(result)) {
    console.log(`  ${tla}: ${result[tla].players.length} players (${result[tla].name})`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
