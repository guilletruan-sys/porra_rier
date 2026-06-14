'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Scorer {
  player: { id: number; name: string }
  team: { tla: string; shortName: string }
  playedMatches: number
  goals: number
  assists: number | null
}

interface TeamScorersProps {
  tla: string
}

export function TeamScorers({ tla }: TeamScorersProps) {
  const [scorers, setScorers] = useState<Scorer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scorers')
      .then(r => r.json())
      .then(d => {
        const teamScorers = (d.scorers ?? []).filter((s: Scorer) => s.team.tla === tla)
        setScorers(teamScorers)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tla])

  if (loading || scorers.length === 0) return null

  return (
    <section className="mb-4">
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
        Goleadores del equipo
      </h2>
      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-50">
        {scorers.map((s, i) => (
          <Link
            key={s.player.id}
            href={`/jugador/${s.player.id}`}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors"
          >
            <span className="text-xs font-black text-slate-400 w-5 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{s.player.name}</p>
              <p className="text-[10px] text-slate-400">{s.playedMatches} PJ · {s.assists ?? 0} asist.</p>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-[#c8102e]">{s.goals}</span>
              <span className="text-[9px] text-slate-400 block">goles</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
