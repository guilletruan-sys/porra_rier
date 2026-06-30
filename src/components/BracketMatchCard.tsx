'use client'
import Image from 'next/image'
import { getFlagUrl, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'

interface BracketTeam {
  tla: string | null
  label: string          // p. ej. "España" o "1A" si TBD
}

export type BracketPredictionOutcome = 'correct' | 'wrong' | 'pending'

export interface BracketMatchCardProps {
  home: BracketTeam
  away: BracketTeam
  score?: { home: number; away: number }
  pens?: { home: number; away: number }  // tanda de penaltis, si se decidió así
  status?: string        // 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED'
  winnerTla?: string | null     // marcamos al ganador en negrita / con flecha
  predictedAdvanceTla?: string  // en modo participante: equipo que él predijo a avanzar
  predictionOutcome?: BracketPredictionOutcome  // ✓ acierto / ✗ fallo / ▶ aún en juego
  onTap?: () => void
}

function shortName(tla: string | null, fallback: string): string {
  if (!tla) return fallback
  const full = TLA_TO_EXCEL_NAME[tla]
  if (!full) return tla
  // Pasamos a un short más legible: "United States" → "USA"; resto se queda con full hasta 12 chars.
  if (full.length > 12) return tla
  return full
}

export function BracketMatchCard({
  home,
  away,
  score,
  pens,
  status,
  winnerTla,
  predictedAdvanceTla,
  predictionOutcome,
  onTap,
}: BracketMatchCardProps) {
  const isFinished = status === 'FINISHED'
  const isLive = status === 'IN_PLAY' || status === 'PAUSED'

  const homeWon = winnerTla && winnerTla === home.tla
  const awayWon = winnerTla && winnerTla === away.tla
  const homePredicted = predictedAdvanceTla === home.tla
  const awayPredicted = predictedAdvanceTla === away.tla

  const borderClass =
    predictionOutcome === 'correct' ? 'border-emerald-300 ring-1 ring-emerald-200/60'
    : predictionOutcome === 'wrong' ? 'border-red-200'
    : isLive ? 'border-red-200'
    : 'border-slate-100 dark:border-slate-800'

  return (
    <button
      onClick={onTap}
      disabled={!onTap}
      className={`w-full bg-white dark:bg-slate-900 rounded-lg shadow-sm border ${borderClass} overflow-hidden text-left transition-transform ${onTap ? 'active:scale-[0.98]' : ''}`}
    >
      <TeamLine
        team={home}
        score={score?.home}
        pen={pens?.home}
        won={!!homeWon}
        lost={isFinished && !!winnerTla && !homeWon}
        predicted={homePredicted}
        predictionOutcome={homePredicted ? predictionOutcome : undefined}
      />
      <div className="border-t border-slate-50 dark:border-slate-800" />
      <TeamLine
        team={away}
        score={score?.away}
        pen={pens?.away}
        won={!!awayWon}
        lost={isFinished && !!winnerTla && !awayWon}
        predicted={awayPredicted}
        predictionOutcome={awayPredicted ? predictionOutcome : undefined}
      />
      {isLive && (
        <div className="bg-red-50 text-[8px] font-black text-red-600 px-2 py-0.5 text-center uppercase tracking-widest border-t border-red-100">
          ● En vivo
        </div>
      )}
      {predictionOutcome === 'correct' && (
        <div className="bg-emerald-50 text-[8px] font-black text-emerald-700 px-2 py-0.5 text-center uppercase tracking-widest border-t border-emerald-100">
          ✓ Acierto
        </div>
      )}
      {predictionOutcome === 'wrong' && (
        <div className="bg-red-50 text-[8px] font-black text-red-600 px-2 py-0.5 text-center uppercase tracking-widest border-t border-red-100">
          ✗ Fallo
        </div>
      )}
    </button>
  )
}

function TeamLine({
  team, score, pen, won, lost, predicted, predictionOutcome,
}: {
  team: BracketTeam
  score?: number
  pen?: number
  won: boolean
  lost: boolean
  predicted: boolean
  predictionOutcome?: BracketPredictionOutcome
}) {
  const flagUrl = team.tla ? getFlagUrl(team.tla) : null
  const isTbd = !team.tla

  const marker = predictionOutcome === 'correct'
    ? <span className="text-[10px] leading-none text-emerald-600" title="Acierto">✓</span>
    : predictionOutcome === 'wrong'
      ? <span className="text-[10px] leading-none text-red-500" title="Fallo">✗</span>
      : null

  const nameClass = isTbd
    ? 'italic text-slate-400 dark:text-slate-500'
    : predictionOutcome === 'correct'
      ? 'font-black text-emerald-700'
      : predictionOutcome === 'wrong'
        ? 'font-semibold text-red-500 line-through'
        : won || predicted
          ? 'font-black text-slate-800 dark:text-slate-100'
          : 'font-semibold text-slate-400 dark:text-slate-500'

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 ${lost ? 'opacity-50' : ''}`}>
      {marker}
      {flagUrl
        ? <Image src={flagUrl} alt="" width={12} height={9} unoptimized className="rounded-sm shrink-0" />
        : isTbd
          ? <IconFlagFallback width={12} height={9} />
          : <IconFlagFallback width={12} height={9} />
      }
      <span className={`flex-1 truncate text-[10px] ${nameClass}`}>
        {shortName(team.tla, team.label)}
      </span>
      {score != null && (
        <span className={`text-[10px] tabular-nums shrink-0 ${won ? 'font-black text-[#c8102e]' : 'text-slate-500 dark:text-slate-400 '}`}>
          {score}{pen != null && <span className="text-[0.7em] font-bold align-sub ml-px">({pen})</span>}
        </span>
      )}
    </div>
  )
}
