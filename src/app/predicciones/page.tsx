'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { PredictionGrid } from '@/components/PredictionGrid'
import { MatchStakes } from '@/components/MatchStakes'
import { ScoreText } from '@/components/ScoreText'
import { Spoiler } from '@/components/Spoiler'
import { IconUsers } from '@/components/icons'
import { getFlagUrl } from '@/lib/team-map'
import { useParticipantRanks } from '@/lib/use-participant-ranks'
import type { Match, PredictionsData } from '@/lib/types'
import participants from '@/data/participants.json'
import predictionsRaw from '@/data/predictions.json'

const predictions = predictionsRaw as PredictionsData

type Tab = 'ko' | 'grupos'

const ROUND_SHORT: Record<string, string> = {
  ROUND_OF_32: '16avos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semis',
  THIRD_PLACE: '3er puesto',
  FINAL: 'Final',
}

function formatMatchLabel(utcDate: string): string {
  const d = new Date(utcDate)
  if (isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
  return `${date} · ${time}`
}

function pickDefault(list: Match[]): Match | null {
  const live = list.find(x => x.status === 'IN_PLAY' || x.status === 'PAUSED')
  const next = list.filter(x => x.status === 'SCHEDULED' || x.status === 'TIMED')
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0]
  const lastFinished = [...list].filter(x => x.status === 'FINISHED')
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))[0]
  return live ?? next ?? lastFinished ?? list[0] ?? null
}

export default function PrediccionesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [tab, setTab] = useState<Tab>('ko')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const selectedRef = useRef<HTMLButtonElement | null>(null)
  const ranks = useParticipantRanks()

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => { setMatches(d.matches ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const groupMatches = useMemo(() => matches.filter(m => m.stage === 'GROUP_STAGE'), [matches])
  // KO reales con equipos ya conocidos (se van añadiendo según football-data los publica).
  const koMatches = useMemo(() => matches
    .filter(m => m.stage !== 'GROUP_STAGE' && m.homeTeam?.tla && m.awayTeam?.tla)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate)), [matches])

  const list = tab === 'ko' ? koMatches : groupMatches
  // `selected` se deriva: si la selección explícita no está en la lista actual
  // (p. ej. al cambiar de pestaña), cae al partido por defecto de esa lista.
  const selected = list.find(m => m.id === selectedId) ?? pickDefault(list)

  useEffect(() => {
    if (selectedRef.current) selectedRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected?.id])

  return (
    <div className="p-3 space-y-3">
      <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
        <IconUsers size={13} className="text-[#c8102e]" />
        Predicciones
      </h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
        <TabButton active={tab === 'ko'} onClick={() => setTab('ko')}>Eliminatorias</TabButton>
        <TabButton active={tab === 'grupos'} onClick={() => setTab('grupos')}>Grupos</TabButton>
      </div>

      {loading && <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">Cargando…</div>}

      {!loading && tab === 'ko' && koMatches.length === 0 && (
        <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
          Todavía no hay cruces de eliminatorias con equipos definidos.
        </div>
      )}

      {/* Match picker */}
      {!loading && list.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {list.map(m => {
            const isSelected = selected?.id === m.id
            const homeFlagUrl = getFlagUrl(m.homeTeam.tla)
            const awayFlagUrl = getFlagUrl(m.awayTeam.tla)
            const roundLabel = tab === 'ko' ? (ROUND_SHORT[m.stage] ?? '') : null
            return (
              <button
                key={m.id}
                ref={isSelected ? selectedRef : null}
                onClick={() => setSelectedId(m.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                  isSelected ? 'bg-[#c8102e] text-white' : 'bg-white dark:bg-slate-900 shadow-sm'
                }`}
              >
                {homeFlagUrl && <Image src={homeFlagUrl} alt="" width={16} height={11} unoptimized className="rounded-sm" />}
                <div className="flex flex-col flex-1 min-w-0 items-center text-center">
                  <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                    {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                  </span>
                  <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
                    {roundLabel ? `${roundLabel} · ` : ''}{formatMatchLabel(m.utcDate)}
                  </span>
                </div>
                {awayFlagUrl && <Image src={awayFlagUrl} alt="" width={16} height={11} unoptimized className="rounded-sm" />}
                {(m.status === 'FINISHED' || m.status === 'IN_PLAY') && (
                  <Spoiler>
                    <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-[#c8102e]'}`}>
                      <ScoreText score={m.score} sep="–" />
                    </span>
                  </Spoiler>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Detail for selected match */}
      {!loading && selected && (
        tab === 'ko' ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-3">
            <MatchStakes match={selected} />
          </div>
        ) : (
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 font-semibold">
              {selected.homeTeam.shortName} vs {selected.awayTeam.shortName}
              {selected.status === 'FINISHED' && (
                <>
                  {' · Resultado: '}
                  <Spoiler>
                    <span>{selected.score.fullTime.home ?? 0}-{selected.score.fullTime.away ?? 0}</span>
                  </Spoiler>
                </>
              )}
            </p>
            <PredictionGrid
              match={selected}
              predictions={predictions}
              participants={participants as string[]}
              ranks={ranks}
            />
          </div>
        )
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 text-[11px] font-bold py-1.5 rounded-full transition-colors ${
        active ? 'bg-white dark:bg-slate-900 text-[#c8102e] shadow-sm' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  )
}
