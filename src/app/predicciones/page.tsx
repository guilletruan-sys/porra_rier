'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { PredictionGrid } from '@/components/PredictionGrid'
import { Spoiler } from '@/components/Spoiler'
import { IconUsers } from '@/components/icons'
import { getFlagUrl } from '@/lib/team-map'
import type { Match, PredictionsData } from '@/lib/types'
import participants from '@/data/participants.json'
import predictionsRaw from '@/data/predictions.json'

const predictions = predictionsRaw as PredictionsData

function formatMatchLabel(utcDate: string): string {
  const d = new Date(utcDate)
  if (isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
  return `${date} · ${time}`
}

export default function PrediccionesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selected, setSelected] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const selectedRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => {
        const m: Match[] = d.matches ?? []
        setMatches(m)
        const live = m.find(x => x.status === 'IN_PLAY' || x.status === 'PAUSED')
        const next = m.filter(x => x.status === 'SCHEDULED' || x.status === 'TIMED')
          .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0]
        const lastFinished = [...m].filter(x => x.status === 'FINISHED')
          .sort((a, b) => b.utcDate.localeCompare(a.utcDate))[0]
        setSelected(live ?? next ?? lastFinished ?? m[0] ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selected?.id])

  const groupMatches = matches.filter(m => m.stage === 'GROUP_STAGE')

  return (
    <div className="p-3 space-y-3">
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        <IconUsers size={13} className="text-[#c8102e]" />
        Predicciones
      </h2>

      {loading && <div className="text-center text-sm text-slate-400 py-8">Cargando…</div>}

      {/* Match picker */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {groupMatches.map(m => {
          const isSelected = selected?.id === m.id
          const homeFlagUrl = getFlagUrl(m.homeTeam.tla)
          const awayFlagUrl = getFlagUrl(m.awayTeam.tla)
          return (
            <button
              key={m.id}
              ref={isSelected ? selectedRef : null}
              onClick={() => setSelected(m)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                isSelected ? 'bg-[#c8102e] text-white' : 'bg-white shadow-sm'
              }`}
            >
              {homeFlagUrl && <Image src={homeFlagUrl} alt="" width={16} height={11} unoptimized className="rounded-sm" />}
              <div className="flex flex-col flex-1 min-w-0 items-center text-center">
                <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                  {m.homeTeam.shortName} vs {m.awayTeam.shortName}
                </span>
                <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                  {formatMatchLabel(m.utcDate)}
                </span>
              </div>
              {awayFlagUrl && <Image src={awayFlagUrl} alt="" width={16} height={11} unoptimized className="rounded-sm" />}
              {(m.status === 'FINISHED' || m.status === 'IN_PLAY') && (
                <Spoiler>
                  <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-[#c8102e]'}`}>
                    {m.score.fullTime.home ?? 0}–{m.score.fullTime.away ?? 0}
                  </span>
                </Spoiler>
              )}
            </button>
          )
        })}
      </div>

      {/* Predictions for selected match */}
      {selected && (
        <div>
          <p className="text-[10px] text-slate-400 mb-2 font-semibold">
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
          />
        </div>
      )}
    </div>
  )
}
