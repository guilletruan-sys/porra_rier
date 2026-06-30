'use client'
import { useState } from 'react'
import Image from 'next/image'
import { getFlagUrl, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { computeKnockoutJourney, ELIM_LABEL, type PointState } from '@/lib/knockout-journey'
import { deriveActualOutcomes } from '@/lib/scoring'
import type { Match, ParticipantPredictions } from '@/lib/types'

interface Props {
  preds: ParticipantPredictions
  matches: Match[]
}

const STATE_TEXT: Record<PointState, string> = {
  locked: 'text-green-600 dark:text-green-400',
  inplay: 'text-amber-600 dark:text-amber-400',
  lost: 'text-slate-300 dark:text-slate-600 line-through',
}
const STATE_WORD: Record<PointState, string> = {
  locked: 'asegurado',
  inplay: 'en juego',
  lost: 'perdido',
}

export function KnockoutJourneyList({ preds, matches }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const journey = computeKnockoutJourney(preds, matches, deriveActualOutcomes(matches))
  if (journey.teams.length === 0) return null

  const toggle = (tla: string) =>
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(tla)) next.delete(tla)
      else next.add(tla)
      return next
    })

  return (
    <section>
      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Eliminatorias</p>

      {/* Resumen: asegurado / en juego / perdido */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <Summary label="Asegurado" value={journey.locked} className="text-green-600 dark:text-green-400" />
        <Summary label="En juego" value={journey.inPlay} className="text-amber-600 dark:text-amber-400" />
        <Summary label="Perdido" value={journey.lost} className="text-slate-400 dark:text-slate-500" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800 overflow-hidden">
        {journey.teams.map(t => {
          const teamName = TLA_TO_EXCEL_NAME[t.tla] ?? t.tla
          const flagUrl = getFlagUrl(t.tla)
          const isOpen = open.has(t.tla)
          const elim = t.eliminatedRound ? (ELIM_LABEL[t.eliminatedRound] ?? '') : ''
          return (
            <div key={t.tla}>
              <button
                type="button"
                onClick={() => toggle(t.tla)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                aria-expanded={isOpen}
              >
                {/* estado vivo/eliminado */}
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.alive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  title={t.alive ? 'Vivo' : 'Eliminado'}
                />
                {flagUrl && <Image src={flagUrl} alt="" width={14} height={10} unoptimized className="rounded-sm shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{teamName}</span>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 truncate">
                    {t.deepestLabel}
                    {!t.alive && elim && <span className="text-red-400 dark:text-red-500"> · fuera en {elim}</span>}
                  </span>
                </span>
                {/* puntos */}
                <span className="text-right shrink-0 leading-tight">
                  {t.locked > 0 && (
                    <span className="block text-xs font-black text-green-600 dark:text-green-400 tabular-nums">+{t.locked}</span>
                  )}
                  {t.inPlay > 0 && (
                    <span className="block text-[9px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">+{t.inPlay} en juego</span>
                  )}
                  {t.locked === 0 && t.inPlay === 0 && (
                    <span className="block text-[9px] font-bold text-slate-300 dark:text-slate-600">0</span>
                  )}
                </span>
                <svg
                  className={`text-slate-300 dark:text-slate-600 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* cascada por ronda */}
              {isOpen && (
                <div className="bg-slate-50/60 dark:bg-slate-950/40 px-3 pb-2">
                  {t.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{it.label}</span>
                      <span className={`text-[10px] font-bold tabular-nums ${STATE_TEXT[it.state]}`}>
                        {it.state === 'lost' ? '' : '+'}{it.points}
                        <span className="ml-1 text-[8px] font-semibold uppercase tracking-wide opacity-70">{STATE_WORD[it.state]}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Summary({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm px-2 py-2 text-center">
      <p className={`text-base font-black tabular-nums ${className}`}>{value}</p>
      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}
