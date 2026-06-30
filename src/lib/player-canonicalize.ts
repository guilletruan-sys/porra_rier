// Maps free-text player-name predictions (e.g. "MBAPPE", "Vinicius Jr", "Kane")
// to a canonical full name from the official WC 2026 squads when possible.
// Falls back to the raw text if no confident match is found.
import squadsRaw from '@/data/squads-2026.json'

interface RawPlayer { number: number; position: string; name: string }
interface RawSquad { name: string; players: RawPlayer[] }
const squads = squadsRaw as Record<string, RawSquad>

function norm(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

interface IndexedPlayer {
  canonical: string
  norm: string
  firstNorm: string
  lastNorm: string
}

const PLAYERS: IndexedPlayer[] = []
for (const team of Object.values(squads)) {
  for (const p of team.players) {
    const parts = p.name.trim().split(/\s+/)
    PLAYERS.push({
      canonical: p.name,
      norm: norm(p.name),
      firstNorm: norm(parts[0] ?? ''),
      lastNorm: norm(parts[parts.length - 1] ?? ''),
    })
  }
}

export function canonicalizePlayer(raw: string): string {
  if (!raw) return raw
  const r = norm(raw)
  if (!r) return raw.trim()

  // 1) Exact full-name match
  const exact = PLAYERS.find(p => p.norm === r)
  if (exact) return exact.canonical

  // 2) Surname exact match — prediction is just a last name (e.g. "Kane")
  const surnameHits = PLAYERS.filter(p => p.lastNorm === r)
  if (surnameHits.length === 1) return surnameHits[0].canonical

  // 3) First-name exact match — prediction is just a first name (e.g. "Pedri", "Vinicius")
  const firstHits = PLAYERS.filter(p => p.firstNorm === r)
  if (firstHits.length === 1) return firstHits[0].canonical

  // 4) First-word fallback — handles "Vinicius Jr" → "Vinicius Júnior"
  const firstWord = norm(raw.split(/\s+/)[0] ?? '')
  if (firstWord && firstWord !== r) {
    const firstWordHits = PLAYERS.filter(p => p.firstNorm === firstWord)
    if (firstWordHits.length === 1) return firstWordHits[0].canonical
  }

  // 5) Last-word fallback — handles "K. Mbappé" → "Kylian Mbappé"
  const lastWord = norm(raw.split(/\s+/).pop() ?? '')
  if (lastWord && lastWord !== r) {
    const lastWordHits = PLAYERS.filter(p => p.lastNorm === lastWord)
    if (lastWordHits.length === 1) return lastWordHits[0].canonical
  }

  // 6) Substring match — prediction is contained inside player name
  const substr = PLAYERS.filter(p => p.norm.includes(r))
  if (substr.length === 1) return substr[0].canonical
  if (substr.length > 1) {
    // Multiple matches → pick the shortest (more specific) canonical
    return substr.sort((a, b) => a.canonical.length - b.canonical.length)[0].canonical
  }

  // 7) Reverse substring — player name fully contained in prediction
  const reverse = PLAYERS.filter(p => p.norm && r.includes(p.norm))
  if (reverse.length >= 1) {
    return reverse.sort((a, b) => b.canonical.length - a.canonical.length)[0].canonical
  }

  // No confident match → keep the raw text as-is (trimmed)
  return raw.trim()
}
