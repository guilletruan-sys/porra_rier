'use client'
import { useEffect } from 'react'
import Image from 'next/image'
import { getFlagUrl, TLA_TO_EXCEL_NAME, getMatchKey } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import { PredictionGrid } from '@/components/PredictionGrid'
import participants from '@/data/participants.json'
import predictionsRaw from '@/data/predictions.json'
import type { Match, PredictionsData, PickResult } from '@/lib/types'

const predictions = predictionsRaw as PredictionsData

interface MatchPreviewSheetProps {
  match: Match
  onClose: () => void
}

const STAGE_LABEL: Record<string, string> = {
  GROUP_STAGE: 'Fase de grupos',
  ROUND_OF_32: 'Dieciseisavos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semifinales',
  THIRD_PLACE: '3er puesto',
  FINAL: 'Final',
}

function formatFullDate(utcDate: string): string {
  const d = new Date(utcDate)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
  })
}

export function MatchPreviewSheet({ match, onClose }: MatchPreviewSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const { homeTeam, awayTeam, utcDate, stage, group } = match
  const homeFlag = getFlagUrl(homeTeam.tla)
  const awayFlag = getFlagUrl(awayTeam.tla)
  const homeName = TLA_TO_EXCEL_NAME[homeTeam.tla] ?? homeTeam.shortName
  const awayName = TLA_TO_EXCEL_NAME[awayTeam.tla] ?? awayTeam.shortName
  const stageLabel = STAGE_LABEL[stage] ?? stage
  const groupLabel = group ? ` · Grupo ${group.replace('GROUP_', '')}` : ''

  // Aggregate predicted scores for this match across participants
  const matchKey = getMatchKey(homeTeam.tla, awayTeam.tla)
  const picks: { name: string; pick: PickResult; home: number; away: number }[] = []
  for (const name of participants as string[]) {
    const p = predictions[name]?.groupStage[matchKey]
    if (!p) continue
    picks.push({ name, pick: p.pick, home: p.homeGoals, away: p.awayGoals })
  }
  const totalPicks = picks.length
  const counts = { home: 0, draw: 0, away: 0 }
  let sumHome = 0, sumAway = 0
  const scoreFrequency = new Map<string, number>()
  for (const p of picks) {
    counts[p.pick]++
    sumHome += p.home
    sumAway += p.away
    const k = `${p.home}-${p.away}`
    scoreFrequency.set(k, (scoreFrequency.get(k) ?? 0) + 1)
  }
  const avgGoals = totalPicks > 0 ? ((sumHome + sumAway) / totalPicks).toFixed(1) : '—'
  const topScores = [...scoreFrequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
  const winningPick = totalPicks > 0
    ? (Object.entries(counts) as [PickResult, number][]).sort((a, b) => b[1] - a[1])[0]
    : null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:max-h-[90vh] max-h-[90dvh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-2 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {stageLabel}{groupLabel}
          </p>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 text-xl leading-none w-6 h-6 flex items-center justify-center hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* Teams */}
        <div className="px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="flex-1 flex flex-col items-center gap-2">
            {homeFlag
              ? <Image src={homeFlag} alt="" width={48} height={34} unoptimized className="rounded-sm shadow-sm" />
              : <IconFlagFallback width={48} height={34} />}
            <span className="text-xs font-bold text-slate-800 text-center">{homeName}</span>
          </div>
          <div className="flex flex-col items-center shrink-0 gap-1">
            <span className="text-xl font-black text-slate-300">vs</span>
            <span className="text-[10px] text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full whitespace-nowrap">
              Por jugar
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-2">
            {awayFlag
              ? <Image src={awayFlag} alt="" width={48} height={34} unoptimized className="rounded-sm shadow-sm" />
              : <IconFlagFallback width={48} height={34} />}
            <span className="text-xs font-bold text-slate-800 text-center">{awayName}</span>
          </div>
        </div>

        {/* Scrollable middle */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Date */}
          <div className="px-4 py-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 capitalize">{formatFullDate(utcDate)}</p>
          </div>

          {/* Aggregate predictions stats */}
          {totalPicks > 0 && (
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Lo que dice la porra
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-base font-black text-slate-800">{totalPicks}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Predicciones</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-black text-[#c8102e]">{avgGoals}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Media goles</p>
                </div>
                <div className="text-center">
                  {winningPick && (
                    <>
                      <p className="text-base font-black text-slate-800">
                        {winningPick[0] === 'home' ? '1' : winningPick[0] === 'draw' ? 'X' : '2'}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mayoría</p>
                    </>
                  )}
                </div>
              </div>

              {/* Most popular scores */}
              {topScores.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 mb-1">Marcadores más predichos</p>
                  <div className="flex gap-2 flex-wrap">
                    {topScores.map(([score, count]) => (
                      <span key={score} className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-lg">
                        {score} · {count} {count === 1 ? 'voto' : 'votos'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Per-participant predictions (reuses 1X2 bar + grid) */}
          {totalPicks > 0 && (
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Predicciones de cada uno
              </p>
              <PredictionGrid match={match} predictions={predictions} participants={participants as string[]} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
