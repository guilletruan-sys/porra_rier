'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getFlagUrl } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import { MatchDetailsSheet } from '@/components/MatchDetailsSheet'
import { MatchPreviewSheet } from '@/components/MatchPreviewSheet'
import { Spoiler } from '@/components/Spoiler'
import { useLite } from '@/contexts/LiteContext'
import { usePaywall } from '@/contexts/PaywallContext'
import type { Match } from '@/lib/types'

interface MatchCardProps {
  match: Match
}

function formatDateTime(utcDate: string): { date: string; time: string } {
  const d = new Date(utcDate)
  if (isNaN(d.getTime())) return { date: '??', time: '??:??' }
  const date = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
  return { date, time }
}

export function MatchCard({ match }: MatchCardProps) {
  const [open, setOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { isPremium } = useLite()
  const { showPaywall } = usePaywall()
  const { homeTeam, awayTeam, score, status, utcDate } = match
  const isLive = status === 'IN_PLAY' || status === 'PAUSED'
  const isFinished = status === 'FINISHED'
  const hasScore = isLive || isFinished
  const { date, time } = formatDateTime(utcDate)

  const scoreBadge = (
    <span className="bg-[#c8102e] text-white text-sm font-black px-3 py-1 rounded-md">
      {score.fullTime.home ?? 0} – {score.fullTime.away ?? 0}
    </span>
  )

  const onScoreClick = () => {
    if (!isPremium) { showPaywall('los detalles del partido'); return }
    setOpen(true)
  }
  const onTimeClick = () => {
    if (!isPremium) { showPaywall('las predicciones del partido'); return }
    setPreviewOpen(true)
  }
  const onFlagClick = (e: React.MouseEvent) => {
    if (!isPremium) { e.preventDefault(); showPaywall('la página del equipo') }
  }

  return (
    <>
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between gap-2">
          {/* Home team */}
          <Link
            href={`/equipo/${homeTeam.tla}`}
            onClick={onFlagClick}
            className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-80"
          >
            <TeamFlag tla={homeTeam.tla} name={homeTeam.shortName} />
            <span className="text-xs font-semibold text-slate-800 truncate">{homeTeam.shortName}</span>
          </Link>

          {/* Score / Time */}
          <div className="flex flex-col items-center shrink-0">
            {hasScore ? (
              isFinished ? (
                <Spoiler>
                  <button
                    onClick={onScoreClick}
                    aria-label="Ver detalles del partido"
                    className="active:scale-95 transition-transform"
                  >
                    {scoreBadge}
                  </button>
                </Spoiler>
              ) : <Spoiler>{scoreBadge}</Spoiler>
            ) : (
              <button
                onClick={onTimeClick}
                aria-label="Ver predicciones para este partido"
                className="flex flex-col items-center active:scale-95 transition-transform"
              >
                <span className="text-slate-500 text-xs font-semibold underline decoration-dotted decoration-slate-300 underline-offset-2">{time}</span>
                <span className="text-[9px] text-slate-400">{date}</span>
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
              <span className="text-[9px] text-slate-400 mt-0.5">FIN</span>
            )}
          </div>

          {/* Away team */}
          <Link
            href={`/equipo/${awayTeam.tla}`}
            onClick={onFlagClick}
            className="flex items-center gap-1.5 flex-1 min-w-0 justify-end hover:opacity-80"
          >
            <span className="text-xs font-semibold text-slate-800 truncate text-right">{awayTeam.shortName}</span>
            <TeamFlag tla={awayTeam.tla} name={awayTeam.shortName} />
          </Link>
        </div>
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
