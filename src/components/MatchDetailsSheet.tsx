'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getFlagUrl, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import { MatchLineupPitch } from '@/components/MatchLineupPitch'
import type { Match, MatchDetails, MatchGoal, MatchBooking, MatchSubstitution } from '@/lib/types'

interface MatchDetailsSheetProps {
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

type TimelineEvent =
  | { kind: 'goal'; minute: number; data: MatchGoal; teamId: number }
  | { kind: 'booking'; minute: number; data: MatchBooking; teamId: number }
  | { kind: 'sub'; minute: number; data: MatchSubstitution; teamId: number }

function buildTimeline(details: MatchDetails): TimelineEvent[] {
  const events: TimelineEvent[] = []
  for (const g of details.goals) {
    const m = (g.minute ?? 0) + (g.injuryTime ?? 0)
    events.push({ kind: 'goal', minute: m, data: g, teamId: g.team.id })
  }
  for (const b of details.bookings) {
    events.push({ kind: 'booking', minute: b.minute ?? 0, data: b, teamId: b.team.id })
  }
  for (const s of details.substitutions ?? []) {
    events.push({ kind: 'sub', minute: s.minute ?? 0, data: s, teamId: s.team.id })
  }
  return events.sort((a, b) => a.minute - b.minute)
}

export function MatchDetailsSheet({ match, onClose }: MatchDetailsSheetProps) {
  const [details, setDetails] = useState<MatchDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  useEffect(() => {
    fetch(`/api/match/${match.id}`)
      .then(r => r.json())
      .then(d => { setDetails(d.match ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [match.id])

  const { homeTeam, awayTeam, score, utcDate, stage, group } = match
  const homeFlag = getFlagUrl(homeTeam.tla)
  const awayFlag = getFlagUrl(awayTeam.tla)
  const homeName = TLA_TO_EXCEL_NAME[homeTeam.tla] ?? homeTeam.shortName
  const awayName = TLA_TO_EXCEL_NAME[awayTeam.tla] ?? awayTeam.shortName
  const stageLabel = STAGE_LABEL[stage] ?? stage
  const groupLabel = group ? ` · Grupo ${group.replace('GROUP_', '')}` : ''

  const ytQuery = encodeURIComponent(`resumen ${homeName} ${awayName} mundial 2026`)
  const ytUrl = `https://www.youtube.com/results?search_query=${ytQuery}`

  const timeline = details ? buildTimeline(details) : []
  const hasEvents = timeline.length > 0

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

        {/* Teams + score */}
        <div className="px-4 py-4 flex items-center gap-3 shrink-0">
          <div className="flex-1 flex flex-col items-center gap-2">
            {homeFlag
              ? <Image src={homeFlag} alt="" width={48} height={34} unoptimized className="rounded-sm shadow-sm" />
              : <IconFlagFallback width={48} height={34} />}
            <span className="text-xs font-bold text-slate-800 text-center">{homeName}</span>
          </div>
          <div className="flex flex-col items-center shrink-0">
            <span className="text-3xl font-black text-slate-800 tabular-nums">
              {score.fullTime.home ?? 0} – {score.fullTime.away ?? 0}
            </span>
            {(score.halfTime.home != null || score.halfTime.away != null) && (
              <span className="text-[10px] text-slate-400 mt-1">
                Descanso: {score.halfTime.home ?? 0}–{score.halfTime.away ?? 0}
              </span>
            )}
          </div>
          <div className="flex-1 flex flex-col items-center gap-2">
            {awayFlag
              ? <Image src={awayFlag} alt="" width={48} height={34} unoptimized className="rounded-sm shadow-sm" />
              : <IconFlagFallback width={48} height={34} />}
            <span className="text-xs font-bold text-slate-800 text-center">{awayName}</span>
          </div>
        </div>

        {/* Scrollable middle: meta + timeline */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-2 border-t border-slate-100 space-y-0.5">
            <p className="text-[11px] text-slate-500 capitalize">{formatFullDate(utcDate)}</p>
            {details?.venue && (
              <p className="text-[10px] text-slate-400">
                🏟 {details.venue}
                {details.attendance ? ` · ${details.attendance.toLocaleString('es-ES')} espectadores` : ''}
              </p>
            )}
            {details?.referees && details.referees.length > 0 && (() => {
              const main = details.referees.find(r => r.type === 'REFEREE')
              return main ? (
                <p className="text-[10px] text-slate-400">🟨 Árbitro: {main.name} ({main.nationality})</p>
              ) : null
            })()}
          </div>

          {loading && (
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">Cargando eventos…</p>
            </div>
          )}
          {!loading && hasEvents && (
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Resumen del partido
              </p>
              <ul className="space-y-1.5">
                {timeline.map((ev, i) => (
                  <TimelineRow
                    key={i}
                    event={ev}
                    homeTeamId={homeTeam.id}
                    homeFlag={homeFlag}
                    awayFlag={awayFlag}
                  />
                ))}
              </ul>
            </div>
          )}
          {!loading && details && (details.homeLineup?.length === 11 || details.awayLineup?.length === 11) && (
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Alineaciones
              </p>
              <MatchLineupPitch
                homeName={homeName}
                awayName={awayName}
                homeFormation={details.homeFormation}
                homeLineup={details.homeLineup}
                awayFormation={details.awayFormation}
                awayLineup={details.awayLineup}
              />
            </div>
          )}
        </div>

        {/* YouTube CTA — sticky bottom */}
        <div
          className="px-4 py-3 border-t border-slate-100 shrink-0"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        >
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#ff0000] text-white text-sm font-bold py-2.5 rounded-xl hover:bg-[#cc0000] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Ver resumen en YouTube
          </a>
        </div>
      </div>
    </div>
  )
}

function TimelineRow({
  event, homeTeamId, homeFlag, awayFlag,
}: {
  event: TimelineEvent
  homeTeamId: number
  homeFlag: string | null
  awayFlag: string | null
}) {
  const isHome = event.teamId === homeTeamId
  const flagUrl = isHome ? homeFlag : awayFlag
  const minute = event.minute > 0 ? `${event.minute}'` : "—"

  let icon: React.ReactNode = null
  let main = ''
  let detail = ''

  if (event.kind === 'goal') {
    const g = event.data
    const typeLabel = g.type === 'PENALTY' ? ' (pen.)' : g.type === 'OWN' ? ' (p.p.)' : ''
    icon = <span className="text-base leading-none">⚽</span>
    main = (g.scorer?.name ?? '—') + typeLabel
    detail = g.assist ? `Asist. ${g.assist.name} · ${g.score.home}–${g.score.away}` : `${g.score.home}–${g.score.away}`
  } else if (event.kind === 'booking') {
    const b = event.data
    if (b.card === 'YELLOW') {
      icon = <span className="inline-block w-2.5 h-3.5 bg-yellow-400 rounded-sm" />
    } else if (b.card === 'RED') {
      icon = <span className="inline-block w-2.5 h-3.5 bg-red-600 rounded-sm" />
    } else {
      icon = (
        <span className="relative inline-block w-3 h-3.5">
          <span className="absolute inset-0 bg-yellow-400 rounded-sm" />
          <span className="absolute right-0 top-0 bottom-0 w-1/2 bg-red-600 rounded-r-sm" />
        </span>
      )
    }
    main = b.player.name
    detail = b.card === 'YELLOW' ? 'Amarilla' : b.card === 'RED' ? 'Roja' : 'Doble amarilla'
  } else {
    const s = event.data
    icon = (
      <span className="inline-flex items-center justify-center w-3.5 h-3.5">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9" stroke="#16a34a"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14" stroke="#16a34a"/>
          <polyline points="7 23 3 19 7 15" stroke="#dc2626"/>
          <path d="M21 13v2a4 4 0 0 1-4 4H3" stroke="#dc2626"/>
        </svg>
      </span>
    )
    main = s.playerIn.name
    detail = `Por ${s.playerOut.name}`
  }

  return (
    <li className="flex items-center gap-2 py-1.5">
      <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0 tabular-nums">{minute}</span>
      <span className="w-5 flex justify-center shrink-0">{icon}</span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {flagUrl
          ? <Image src={flagUrl} alt="" width={12} height={9} unoptimized className="rounded-sm shrink-0" />
          : <IconFlagFallback width={12} height={9} />}
        <span className="text-xs font-semibold text-slate-700 truncate">{main}</span>
      </div>
      <span className="text-[10px] text-slate-400 shrink-0">{detail}</span>
    </li>
  )
}
