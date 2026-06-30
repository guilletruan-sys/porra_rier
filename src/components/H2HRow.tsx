'use client'
import Image from 'next/image'
import { getFlagUrl } from '@/lib/team-map'

export type H2HRowWinner = 'p1' | 'p2' | 'draw' | 'pending'

interface H2HRowProps {
  /** Two-line title: top is the match teams (with flags) or a knockout slot label, bottom is real result / "pendiente". */
  homeTla?: string | null
  awayTla?: string | null
  slotLabel?: string                   // p.ej. "2A-2B (R32)" cuando aún es esqueleto KO
  actualResult?: string                // "2-1", "Pendiente", "FRA gana"
  /** Predicción de cada participante (texto libre: "2-1" / "ESP" / "Mbappé"). */
  p1Pred: string | null
  p2Pred: string | null
  p1Points?: number
  p2Points?: number
  winner: H2HRowWinner
  divergent: boolean
}

export function H2HRow({
  homeTla, awayTla, slotLabel, actualResult,
  p1Pred, p2Pred, p1Points, p2Points, winner, divergent,
}: H2HRowProps) {
  const homeFlag = homeTla ? getFlagUrl(homeTla) : null
  const awayFlag = awayTla ? getFlagUrl(awayTla) : null
  return (
    <div className={`px-3 py-2 ${winner === 'p1' ? 'bg-blue-50/40' : winner === 'p2' ? 'bg-violet-50/40' : ''}`}>
      {/* Header: equipos / slot + resultado real */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {homeFlag && <Image src={homeFlag} alt="" width={12} height={9} unoptimized className="rounded-sm shrink-0" />}
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">
            {slotLabel ?? `${homeTla ?? '?'} − ${awayTla ?? '?'}`}
          </span>
          {awayFlag && <Image src={awayFlag} alt="" width={12} height={9} unoptimized className="rounded-sm shrink-0" />}
        </div>
        {actualResult && (
          <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0">{actualResult}</span>
        )}
      </div>

      {/* Comparativa */}
      <div className="flex items-stretch gap-1">
        <Side label={p1Pred ?? '—'} points={p1Points} side="left" highlight={winner === 'p1'} />
        <div className="flex items-center justify-center w-6">
          <WinnerMark winner={winner} divergent={divergent} />
        </div>
        <Side label={p2Pred ?? '—'} points={p2Points} side="right" highlight={winner === 'p2'} />
      </div>
    </div>
  )
}

function Side({ label, points, side, highlight }: { label: string; points?: number; side: 'left' | 'right'; highlight: boolean }) {
  const align = side === 'left' ? 'text-left items-start' : 'text-right items-end'
  const colorTeam = side === 'left' ? 'text-blue-700' : 'text-violet-700'
  return (
    <div className={`flex-1 flex flex-col ${align}`}>
      <span className={`text-[11px] font-black ${highlight ? colorTeam : 'text-slate-700 dark:text-slate-200'} truncate w-full ${side === 'right' ? 'text-right' : ''}`}>
        {label}
      </span>
      {typeof points === 'number' && (
        <span className={`text-[9px] font-bold ${
          points > 0 ? (highlight ? colorTeam : 'text-slate-500 dark:text-slate-400 ') : 'text-slate-400 dark:text-slate-500'
        }`}>
          {points > 0 ? `+${points}` : '0'} pts
        </span>
      )}
    </div>
  )
}

function WinnerMark({ winner, divergent }: { winner: H2HRowWinner; divergent: boolean }) {
  if (winner === 'p1') return <span className="text-[10px] font-black text-blue-600">◀</span>
  if (winner === 'p2') return <span className="text-[10px] font-black text-violet-600">▶</span>
  if (winner === 'draw') return <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{divergent ? '=' : '≡'}</span>
  return <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
}
