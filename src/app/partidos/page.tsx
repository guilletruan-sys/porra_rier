// src/app/partidos/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { MatchCard } from '@/components/MatchCard'
import { GroupStandings } from '@/components/GroupStandings'
import { PremiumGate } from '@/components/PremiumGate'
import { useLite } from '@/contexts/LiteContext'
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

export default function PartidosPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState<Stage | 'ALL'>('GROUP_STAGE')
  const [group, setGroup] = useState<string>('A')
  const { isPremium, ready: liteReady } = useLite()

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
        if (hasLive && !interval && isPremium) interval = setInterval(() => load(false), 10_000)
        else if (!hasLive && interval) { clearInterval(interval); interval = null }
      })
    load(true)
    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [isPremium])

  // LITE mode: show today's matches only, then a paywall
  if (liteReady && !isPremium) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
    const todayMatches = matches.filter(m => {
      const d = new Date(m.utcDate)
      const k = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
      return k === today
    })
    return (
      <div className="p-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
          Partidos de hoy
        </h2>
        {loading && <div className="text-center text-sm text-slate-400 py-4">Cargando…</div>}
        {!loading && todayMatches.length === 0 && (
          <div className="bg-white rounded-xl p-4 text-center text-sm text-slate-400 shadow-sm mb-3">
            No hay partidos hoy
          </div>
        )}
        <div className="space-y-2 mb-4">
          {todayMatches.map(m => <MatchCard key={m.id} match={m} />)}
        </div>
        <PremiumGate
          mode="replace"
          feature="el calendario completo"
          title="📅 Calendario completo"
          description="Todos los partidos del Mundial por fase, grupos, octavos, cuartos, semifinales y final. Con tabla de clasificación por grupo."
        >
          <div />
        </PremiumGate>
      </div>
    )
  }

  const stageMatches = matches.filter(m => stage === 'ALL' || m.stage === stage)
  const filteredMatches = stage === 'GROUP_STAGE'
    ? stageMatches.filter(m => m.group === `GROUP_${group}`)
    : stageMatches

  return (
    <div className="p-3">
      {/* Stage tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 no-scrollbar">
        {STAGES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStage(key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              stage === key
                ? 'bg-[#c8102e] text-white'
                : 'bg-white text-slate-500 shadow-sm'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Group selector (only for group stage) */}
      {stage === 'GROUP_STAGE' && (
        <div className="flex gap-1 overflow-x-auto pb-1 mb-3 no-scrollbar">
          {GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`shrink-0 w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                group === g ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 shadow-sm'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="text-center text-sm text-slate-400 py-8">Cargando partidos…</div>}

      {stage === 'GROUP_STAGE' && !loading && (
        <GroupStandings matches={matches} group={group} />
      )}

      <div className="space-y-2">
        {filteredMatches.length === 0 && !loading && (
          <div className="bg-white rounded-xl p-4 text-center text-sm text-slate-400 shadow-sm">
            No hay partidos en esta fase todavía
          </div>
        )}
        {filteredMatches.map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </div>
  )
}
