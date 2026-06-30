// src/app/partidos/page.tsx
'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MatchCard, type MatchCardOdds } from '@/components/MatchCard'
import { GroupStandings } from '@/components/GroupStandings'
import { MatchesCalendarSheet } from '@/components/MatchesCalendarSheet'
import { getMatchKey } from '@/lib/team-map'
import type { Match, Stage } from '@/lib/types'

const STAGES: { key: Stage | 'ALL'; label: string }[] = [
  { key: 'GROUP_STAGE', label: 'Grupos' },
  { key: 'ROUND_OF_32', label: 'R32' },
  { key: 'ROUND_OF_16', label: 'Octavos' },
  { key: 'QUARTER_FINALS', label: 'Cuartos' },
  { key: 'SEMI_FINALS', label: 'Semis' },
  { key: 'FINAL', label: 'Final' },
]

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

function PartidosBody() {
  const params = useSearchParams()
  const groupParam = params.get('group')
  const initialGroup = groupParam && GROUPS.includes(groupParam) ? groupParam : 'A'

  const [matches, setMatches] = useState<Match[]>([])
  const [odds, setOdds] = useState<Record<string, MatchCardOdds>>({})
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState<Stage | 'ALL'>('GROUP_STAGE')
  const [group, setGroup] = useState<string>(initialGroup)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Si el querystring `?group=X` cambia (navegación dentro de la app), sincronizamos.
  useEffect(() => {
    if (groupParam && GROUPS.includes(groupParam) && groupParam !== group) {
      setStage('GROUP_STAGE')
      setGroup(groupParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupParam])

  useEffect(() => {
    fetch('/api/odds').then(r => r.json()).then(d => setOdds(d.odds ?? {})).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    let interval: ReturnType<typeof setInterval> | null = null
    const load = (initial: boolean) =>
      fetch('/api/matches', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ matches: [] })).then(d => {
        if (cancelled) return
        const m: Match[] = d.matches ?? []
        setMatches(m)
        if (initial) setLoading(false)
        const hasLive = m.some(x => x.status === 'IN_PLAY' || x.status === 'PAUSED')
        if (hasLive && !interval) interval = setInterval(() => load(false), 10_000)
        else if (!hasLive && interval) { clearInterval(interval); interval = null }
      })
    load(true)
    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [])

  const stageMatches = matches.filter(m => stage === 'ALL' || m.stage === stage)
  const filteredMatches = stage === 'GROUP_STAGE'
    ? stageMatches.filter(m => m.group === `GROUP_${group}`)
    : stageMatches

  return (
    <div className="p-3">
      {/* Stage tabs + calendar button */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
          {STAGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStage(key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                stage === key
                  ? 'bg-[#c8102e] text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400  shadow-sm'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCalendarOpen(true)}
          aria-label="Calendario"
          title="Calendario"
          className="shrink-0 w-9 h-9 rounded-full bg-white dark:bg-slate-900 text-[#c8102e] shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {/* Group selector (only for group stage) */}
      {stage === 'GROUP_STAGE' && (
        <div className="flex gap-1 overflow-x-auto pb-1 mb-3 no-scrollbar">
          {GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`shrink-0 w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                group === g ? 'bg-slate-800 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400  shadow-sm'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">Cargando partidos…</div>}

      {stage === 'GROUP_STAGE' && !loading && (
        <GroupStandings matches={matches} group={group} />
      )}

      <div className="space-y-2">
        {filteredMatches.length === 0 && !loading && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center text-sm text-slate-400 dark:text-slate-500 shadow-sm">
            No hay partidos en esta fase todavía
          </div>
        )}
        {filteredMatches.map(m => (
          <MatchCard
            key={m.id}
            match={m}
            odds={m.homeTeam?.tla && m.awayTeam?.tla
              ? odds[getMatchKey(m.homeTeam.tla, m.awayTeam.tla)]
              : undefined}
          />
        ))}
      </div>

      {calendarOpen && (
        <MatchesCalendarSheet
          matches={matches}
          odds={odds}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  )
}

export default function PartidosPage() {
  return (
    <Suspense fallback={<div className="p-3 text-center text-sm text-slate-400 dark:text-slate-500 py-8">Cargando…</div>}>
      <PartidosBody />
    </Suspense>
  )
}
