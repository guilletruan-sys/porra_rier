'use client'
import { useEffect, useState } from 'react'
import squadsRaw from '@/data/squads-2026.json'
import type { Match, MatchDetails, MatchPlayer } from '@/lib/types'

interface SquadPlayer { number: number; position: string; name: string }
interface Squad { name: string; players: SquadPlayer[] }
const wikiSquads = squadsRaw as Record<string, Squad>

interface LineupPitchProps {
  tla: string
}

type SimplePos = 'GK' | 'DF' | 'MF' | 'FW'

function simplePos(p: string): SimplePos {
  const s = (p ?? '').toLowerCase()
  if (s.includes('goalkeeper') || s === 'gk') return 'GK'
  if (s.includes('back') || s.includes('defence') || s === 'df') return 'DF'
  if (s.includes('midfield') || s === 'mf') return 'MF'
  return 'FW'
}

function parseFormation(f: string | undefined): number[] {
  if (!f) return [4, 3, 3]
  const parts = f.split(/[-–]/).map(p => parseInt(p, 10)).filter(n => !isNaN(n) && n > 0)
  if (parts.reduce((a, b) => a + b, 0) !== 10) return [4, 3, 3]
  return parts
}

function rowXs(n: number): number[] {
  if (n === 1) return [50]
  const left = 12, right = 88
  const step = (right - left) / (n - 1)
  return Array.from({ length: n }, (_, i) => left + step * i)
}

interface Positioned { number: number; name: string; x: number; y: number }

function placeXI(players: { number: number; name: string; position: SimplePos }[], formation: string | undefined): Positioned[] {
  const order: Record<SimplePos, number> = { GK: 0, DF: 1, MF: 2, FW: 3 }
  const sorted = [...players].sort((a, b) => order[a.position] - order[b.position])
  const rows = parseFormation(formation)
  const gk = sorted.find(p => p.position === 'GK') ?? sorted[0]
  const outfield = sorted.filter(p => p !== gk).slice(0, 10)
  const groups: typeof sorted[] = []
  let idx = 0
  for (const count of rows) {
    groups.push(outfield.slice(idx, idx + count))
    idx += count
  }
  const result: Positioned[] = [{ number: gk.number, name: gk.name, x: 50, y: 92 }]
  const bandStart = 76, bandEnd = 22
  const bandStep = groups.length > 1 ? (bandEnd - bandStart) / (groups.length - 1) : 0
  groups.forEach((group, gi) => {
    const y = bandStart + bandStep * gi
    const xs = rowXs(group.length)
    group.forEach((p, pi) => result.push({ number: p.number, name: p.name, x: xs[pi], y }))
  })
  return result
}

function pickEleven(players: { number: number; name: string; position: SimplePos }[]) {
  const byPos = (pos: SimplePos) =>
    players.filter(p => p.position === pos).sort((a, b) => a.number - b.number)
  const xi = [
    ...byPos('GK').slice(0, 1),
    ...byPos('DF').slice(0, 4),
    ...byPos('MF').slice(0, 3),
    ...byPos('FW').slice(0, 3),
  ]
  if (xi.length < 11) {
    const extras = [...byPos('MF').slice(3), ...byPos('DF').slice(4), ...byPos('FW').slice(3)]
    while (xi.length < 11 && extras.length) xi.push(extras.shift()!)
  }
  return xi.slice(0, 11)
}

interface WcTeamsData {
  teams: Record<string, { name: string; players: { number: number; position: string; name: string }[] }>
}

interface LineupSource {
  positioned: Positioned[]
  formation: string
  source: 'last-match' | 'fd-squad' | 'wiki-squad'
}

export function LineupPitch({ tla }: LineupPitchProps) {
  const [source, setSource] = useState<LineupSource | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      // 1) Try real lineup from team's last finished match
      try {
        const matchesRes = await fetch('/api/matches')
        const matchesJson = await matchesRes.json()
        const matches: Match[] = matchesJson.matches ?? []
        const teamMatches = matches
          .filter(m => m.status === 'FINISHED' && (m.homeTeam.tla === tla || m.awayTeam.tla === tla))
          .sort((a, b) => b.utcDate.localeCompare(a.utcDate))

        for (const m of teamMatches) {
          const detRes = await fetch(`/api/match/${m.id}`)
          const detJson = await detRes.json()
          const det: MatchDetails | undefined = detJson.match
          if (!det) continue
          const isHome = det.homeTeam.tla === tla
          const lineup: MatchPlayer[] | undefined = isHome ? det.homeLineup : det.awayLineup
          const formation = isHome ? det.homeFormation : det.awayFormation
          if (lineup && lineup.length === 11) {
            const xi = lineup.map(p => ({
              number: p.shirtNumber, name: p.name, position: simplePos(p.position),
            }))
            if (!cancelled) {
              setSource({
                positioned: placeXI(xi, formation),
                formation: formation ?? '4-3-3',
                source: 'last-match',
              })
              setLoading(false)
            }
            return
          }
        }
      } catch {}

      // 2) Fallback: football-data official squad
      try {
        const res = await fetch('/api/wc-teams')
        const json = (await res.json()) as WcTeamsData
        const t = json.teams?.[tla]
        if (t && t.players.length >= 11) {
          const players = t.players.map(p => ({ ...p, position: simplePos(p.position) }))
          const xi = pickEleven(players)
          if (xi.length === 11 && !cancelled) {
            setSource({
              positioned: placeXI(xi, '4-3-3'),
              formation: '4-3-3',
              source: 'fd-squad',
            })
            setLoading(false)
            return
          }
        }
      } catch {}

      // 3) Fallback: Wikipedia squad
      const wiki = wikiSquads[tla]
      if (wiki) {
        const players = wiki.players.map(p => ({ ...p, position: simplePos(p.position) }))
        const xi = pickEleven(players)
        if (xi.length === 11 && !cancelled) {
          setSource({
            positioned: placeXI(xi, '4-3-3'),
            formation: '4-3-3',
            source: 'wiki-squad',
          })
        }
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [tla])

  if (loading) return null
  if (!source) return null

  const sourceLabel = {
    'last-match': 'Alineación del último partido oficial',
    'fd-squad': '11 tipo · plantilla oficial FIFA',
    'wiki-squad': '11 tipo aproximado · plantilla de Wikipedia',
  }[source.source]

  return (
    <section className="mb-4">
      <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
        <span>{source.source === 'last-match' ? 'Último 11' : '11 tipo'}</span>
        <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">{source.formation}</span>
      </h2>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
        <div className="relative aspect-[3/4] bg-gradient-to-b from-green-600 to-green-700">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" stroke="white" strokeWidth="0.4" fill="none" opacity="0.6">
            <rect x="2" y="2" width="96" height="96" />
            <line x1="2" y1="50" x2="98" y2="50" />
            <circle cx="50" cy="50" r="8" />
            <circle cx="50" cy="50" r="0.6" fill="white" />
            <rect x="22" y="2" width="56" height="14" />
            <rect x="38" y="2" width="24" height="6" />
            <circle cx="50" cy="10" r="0.6" fill="white" />
            <rect x="22" y="84" width="56" height="14" />
            <rect x="38" y="92" width="24" height="6" />
            <circle cx="50" cy="90" r="0.6" fill="white" />
            <path d="M 42 16 A 8 8 0 0 0 58 16" />
            <path d="M 42 84 A 8 8 0 0 1 58 84" />
          </svg>
          {source.positioned.map((p, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center text-[10px] font-black text-[#c8102e] border-2 border-[#c8102e]">
                {p.number}
              </div>
              <span
                className="mt-0.5 text-[8px] font-bold text-white px-1 py-0.5 rounded leading-tight max-w-[70px] truncate"
                style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
              >
                {p.name}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center py-2 px-3">
          {sourceLabel}
        </p>
      </div>
    </section>
  )
}
