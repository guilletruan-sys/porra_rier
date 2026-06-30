'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getFlagUrl } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import { MatchDetailsSheet } from '@/components/MatchDetailsSheet'
import { MatchPreviewSheet } from '@/components/MatchPreviewSheet'
import { Spoiler } from '@/components/Spoiler'
import { ScoreText } from '@/components/ScoreText'
import type { Match } from '@/lib/types'

export interface MatchCardOdds {
  home: number
  draw: number
  away: number
}

interface MatchCardProps {
  match: Match
  odds?: MatchCardOdds
}

function formatDateTime(utcDate: string): { date: string; time: string } {
  const d = new Date(utcDate)
  if (isNaN(d.getTime())) return { date: '??', time: '??:??' }
  const date = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
  return { date, time }
}

const STAGE_SHORT: Record<string, string> = {
  GROUP_STAGE: '',
  ROUND_OF_32: 'Dieciseisavos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semis',
  THIRD_PLACE: '3er puesto',
  FINAL: 'Final',
}

export function MatchCard({ match, odds }: MatchCardProps) {
  const [open, setOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { homeTeam, awayTeam, score, status, utcDate } = match
  const isLive = status === 'IN_PLAY' || status === 'PAUSED'
  const isFinished = status === 'FINISHED'
  const hasScore = isLive || isFinished
  const { date, time } = formatDateTime(utcDate)

  const scoreBadge = (
    <span className="bg-[#c8102e] text-white text-sm font-black px-3 py-1 rounded-md">
      <ScoreText score={score} />
    </span>
  )

  // Pre-bracket knockouts: teams not yet determined. Render a placeholder card.
  if (!homeTeam?.tla || !awayTeam?.tla) {
    const stageLabel = STAGE_SHORT[match.stage] ?? 'Por determinar'
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-800 border-dashed">
        <div className="flex items-center justify-between gap-2">
          <span className="flex-1 text-xs font-semibold text-slate-400 dark:text-slate-500 italic">Por determinar</span>
          <div className="flex flex-col items-center shrink-0">
            <span className="text-slate-500 dark:text-slate-400  text-xs font-semibold">{time}</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">{date}</span>
            {stageLabel && (
              <span className="text-[9px] text-slate-300 dark:text-slate-600 mt-0.5">{stageLabel}</span>
            )}
          </div>
          <span className="flex-1 text-xs font-semibold text-slate-400 dark:text-slate-500 italic text-right">Por determinar</span>
        </div>
      </div>
    )
  }

  const groupLetter = match.stage === 'GROUP_STAGE' && match.group
    ? match.group.replace('GROUP_', '')
    : null

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          {/* Home team */}
          <Link href={`/equipo/${homeTeam.tla}`} className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-80">
            <TeamFlag tla={homeTeam.tla} name={homeTeam.shortName} />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{homeTeam.shortName}</span>
          </Link>

          {/* Score / Time */}
          <div className="flex flex-col items-center shrink-0">
            {hasScore ? (
              <Spoiler>
                <button
                  onClick={() => setOpen(true)}
                  aria-label="Ver detalles del partido"
                  className="active:scale-95 transition-transform"
                >
                  {scoreBadge}
                </button>
              </Spoiler>
            ) : (
              <button
                onClick={() => setPreviewOpen(true)}
                aria-label="Ver predicciones para este partido"
                className="flex flex-col items-center active:scale-95 transition-transform"
              >
                <span className="text-slate-500 dark:text-slate-400  text-xs font-semibold underline decoration-dotted decoration-slate-300 underline-offset-2">{time}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">{date}</span>
                {odds && (
                  <div className="flex gap-1 mt-1 tabular-nums">
                    <span className="bg-blue-100 text-blue-700 text-[8px] font-bold px-1 py-0.5 rounded">
                      1 {odds.home.toFixed(2)}
                    </span>
                    <span className="bg-amber-100 text-amber-700 text-[8px] font-bold px-1 py-0.5 rounded">
                      X {odds.draw.toFixed(2)}
                    </span>
                    <span className="bg-violet-100 text-violet-700 text-[8px] font-bold px-1 py-0.5 rounded">
                      2 {odds.away.toFixed(2)}
                    </span>
                  </div>
                )}
              </button>
            )}
            {isLive && (
              <span className="text-[9px] font-bold text-green-600 mt-0.5 animate-pulse">
                {match.minute != null
                  ? `${match.minute}'${match.injuryTime ? `+${match.injuryTime}` : ''}`
                  : 'EN VIVO'}
              </span>
            )}
            {isFinished && (
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">FIN</span>
            )}
          </div>

          {/* Away team */}
          <Link href={`/equipo/${awayTeam.tla}`} className="flex items-center gap-1.5 flex-1 min-w-0 justify-end hover:opacity-80">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate text-right">{awayTeam.shortName}</span>
            <TeamFlag tla={awayTeam.tla} name={awayTeam.shortName} />
          </Link>
        </div>
        {groupLetter && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <Link
              href={`/partidos?group=${groupLetter}`}
              onClick={e => e.stopPropagation()}
              className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 rounded-full transition-colors"
            >
              Grupo {groupLetter}
            </Link>
          </div>
        )}
      </div>

      {open && <MatchDetailsSheet match={match} onClose={() => setOpen(false)} />}
      {previewOpen && <MatchPreviewSheet match={match} onClose={() => setPreviewOpen(false)} />}
    </>
  )
}

function TeamFlag({ tla, name }: { tla: string; name: string }) {
  const url = getFlagUrl(tla)
  if (!url) return <IconFlagFallback width={20} height={14} />

  return (
    <Image src={url} alt={name} width={20} height={14} className="rounded-sm object-cover" unoptimized />
  )
}
