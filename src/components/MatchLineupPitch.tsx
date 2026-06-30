import Link from 'next/link'
import type { MatchPlayer } from '@/lib/types'

interface MatchLineupPitchProps {
  homeFormation?: string
  homeLineup?: MatchPlayer[]
  awayFormation?: string
  awayLineup?: MatchPlayer[]
  homeName: string
  awayName: string
}

type SimplePos = 'GK' | 'DEF' | 'MID' | 'FWD'

function simplePos(p: string): SimplePos {
  const s = p.toLowerCase()
  if (s.includes('goalkeeper')) return 'GK'
  if (s.includes('back') || s.includes('defence')) return 'DEF'
  if (s.includes('midfield')) return 'MID'
  return 'FWD'
}

// Parses "4-3-3" / "4-2-3-1" / "3-5-2" into row counts (excluding GK)
function parseFormation(f: string | undefined): number[] {
  if (!f) return [4, 3, 3]
  const parts = f.split(/[-–]/).map(p => parseInt(p, 10)).filter(n => !isNaN(n) && n > 0)
  if (parts.reduce((a, b) => a + b, 0) !== 10) return [4, 3, 3]
  return parts
}

// Generates evenly-spaced x coordinates (in %) for `n` players within a pitch row.
function rowXs(n: number): number[] {
  // Spread across full width with 10% margins on each side
  if (n === 1) return [50]
  const left = 12
  const right = 88
  const step = (right - left) / (n - 1)
  return Array.from({ length: n }, (_, i) => left + step * i)
}

interface PositionedPlayer {
  player: MatchPlayer
  x: number
  y: number
}

// Place a team's 11 by formation. `side` = 'bottom' (home, GK at y=92, attacks up) or 'top' (away, GK at y=8, attacks down)
function placeTeam(
  lineup: MatchPlayer[],
  formation: string | undefined,
  side: 'bottom' | 'top',
): PositionedPlayer[] {
  if (lineup.length === 0) return []

  // Sort by simple position: GK first, then DEF, MID, FWD
  const order: Record<SimplePos, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 }
  const sorted = [...lineup].sort((a, b) => order[simplePos(a.position)] - order[simplePos(b.position)])

  const rows = parseFormation(formation)
  const gk = sorted.find(p => simplePos(p.position) === 'GK') ?? sorted[0]
  const outfield = sorted.filter(p => p !== gk).slice(0, 10)

  // Distribute outfield across rows (def → mid → fwd)
  const groups: MatchPlayer[][] = []
  let idx = 0
  for (const count of rows) {
    groups.push(outfield.slice(idx, idx + count))
    idx += count
  }

  const result: PositionedPlayer[] = []
  // Each team stays inside its own half (50% pitch each side)
  // bottom (home):  GK at y=93,  rows go from y=80 (defence) down to y=55 (forwards, near halfway)
  // top    (away):  GK at y=7,   rows go from y=20 (defence) down to y=45 (forwards, near halfway)
  // The 10-point gap at the halfway line prevents the two teams' chips from overlapping.
  const isBottom = side === 'bottom'
  const gkY = isBottom ? 93 : 7
  result.push({ player: gk, x: 50, y: gkY })

  const bandStart = isBottom ? 80 : 20
  const bandEnd = isBottom ? 55 : 45
  const bandStep = groups.length > 1 ? (bandEnd - bandStart) / (groups.length - 1) : 0

  groups.forEach((group, gi) => {
    const y = bandStart + bandStep * gi
    const xs = rowXs(group.length)
    group.forEach((player, pi) => {
      result.push({ player, x: xs[pi], y })
    })
  })
  return result
}

export function MatchLineupPitch({
  homeFormation, homeLineup, awayFormation, awayLineup, homeName, awayName,
}: MatchLineupPitchProps) {
  const hasHome = (homeLineup ?? []).length === 11
  const hasAway = (awayLineup ?? []).length === 11
  if (!hasHome && !hasAway) return null

  const homePositioned = hasHome ? placeTeam(homeLineup!, homeFormation, 'bottom') : []
  const awayPositioned = hasAway ? placeTeam(awayLineup!, awayFormation, 'top') : []

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="inline-block w-2 h-2 rounded-full bg-[#c8102e]" />
          <span className="text-slate-700 dark:text-slate-200 truncate max-w-[80px]">{homeName}</span>
          <span className="text-slate-400 dark:text-slate-500">{homeFormation ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="text-slate-400 dark:text-slate-500">{awayFormation ?? '—'}</span>
          <span className="text-slate-700 dark:text-slate-200 truncate max-w-[80px]">{awayName}</span>
          <span className="inline-block w-2 h-2 rounded-full bg-[#1d4ed8]" />
        </div>
      </div>
      <div className="relative aspect-[3/4] bg-gradient-to-b from-green-600 to-green-700">
        {/* Pitch markings */}
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

        {/* Home (bottom) */}
        {homePositioned.map(({ player, x, y }) => (
          <PlayerChip key={`h-${player.id}`} id={player.id} x={x} y={y} number={player.shirtNumber} name={player.name} color="home" />
        ))}
        {/* Away (top) */}
        {awayPositioned.map(({ player, x, y }) => (
          <PlayerChip key={`a-${player.id}`} id={player.id} x={x} y={y} number={player.shirtNumber} name={player.name} color="away" />
        ))}
      </div>
    </div>
  )
}

function PlayerChip({ id, x, y, number, name, color }: {
  id: number; x: number; y: number; number: number; name: string; color: 'home' | 'away'
}) {
  const isHome = color === 'home'
  return (
    <Link
      href={`/jugador/${id}`}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center active:scale-95 transition-transform"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`w-7 h-7 rounded-full shadow-md flex items-center justify-center text-[10px] font-black border-2 ${isHome ? 'bg-white dark:bg-slate-900 border-[#c8102e] text-[#c8102e]' : 'bg-[#1d4ed8] border-white text-white'}`}>
        {number}
      </div>
      <span
        className="mt-0.5 text-[8px] font-bold text-white px-1 py-0.5 rounded leading-tight max-w-[70px] truncate"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      >
        {name}
      </span>
    </Link>
  )
}
