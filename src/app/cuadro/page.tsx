'use client'
import { useEffect, useMemo, useState } from 'react'
import { BracketView } from '@/components/BracketView'
import { useParticipantRanks } from '@/lib/use-participant-ranks'
import { resolveRealBracket } from '@/lib/real-bracket'
import participants from '@/data/participants.json'
import predictionsRaw from '@/data/predictions.json'
import type { Match, PredictionsData } from '@/lib/types'

const predictions = predictionsRaw as PredictionsData
const REAL_VALUE = '__real__'

export default function CuadroPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>(REAL_VALUE)
  const ranks = useParticipantRanks()

  useEffect(() => {
    fetch('/api/matches', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setMatches(d.matches ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sortedParticipants = [...(participants as string[])].sort((a, b) => {
    const ra = ranks[a] ?? Infinity
    const rb = ranks[b] ?? Infinity
    if (ra !== rb) return ra - rb
    return a.localeCompare(b)
  })

  const realBracket = useMemo(() => resolveRealBracket(matches), [matches])

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <label htmlFor="cuadro-select" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
          Cuadro:
        </label>
        <div className="relative flex-1">
          <select
            id="cuadro-select"
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="appearance-none w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-bold px-3 py-2 pr-8 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c8102e]/40"
          >
            <option value={REAL_VALUE}>Real (cómo va el Mundial)</option>
            {sortedParticipants.map(name => (
              <option key={name} value={name}>
                {ranks[name] ? `${ranks[name]}º ${name}` : name}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">Cargando…</div>
      ) : (
        <BracketView
          matches={matches}
          participantName={selected === REAL_VALUE ? undefined : selected}
          predictions={selected === REAL_VALUE ? undefined : predictions}
          realBracket={selected === REAL_VALUE ? realBracket : undefined}
        />
      )}
    </div>
  )
}
