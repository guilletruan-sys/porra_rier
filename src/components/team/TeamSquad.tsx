'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PublicTeam, PublicPlayer } from '@/app/api/wc-teams/route'

interface TeamSquadProps {
  tla: string
}

const POSITION_LABEL: Record<PublicPlayer['position'], string> = {
  GK: 'Portero',
  DF: 'Defensas',
  MF: 'Mediocentros',
  FW: 'Delanteros',
}

const POSITION_ORDER: PublicPlayer['position'][] = ['GK', 'DF', 'MF', 'FW']

export function TeamSquad({ tla }: TeamSquadProps) {
  const [team, setTeam] = useState<PublicTeam | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wc-teams')
      .then(r => r.json())
      .then(d => { setTeam(d.teams?.[tla] ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tla])

  if (loading || !team || team.players.length === 0) return null

  const byPos = new Map<PublicPlayer['position'], PublicPlayer[]>()
  for (const p of team.players) {
    if (!byPos.has(p.position)) byPos.set(p.position, [])
    byPos.get(p.position)!.push(p)
  }
  for (const list of byPos.values()) list.sort((a, b) => a.number - b.number)

  return (
    <section className="mb-4">
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
        <span>Plantilla</span>
        <span className="text-[10px] font-bold text-slate-300">{team.players.length} jugadores</span>
      </h2>
      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-50 overflow-hidden">
        {POSITION_ORDER.filter(p => byPos.has(p)).map(pos => {
          const players = byPos.get(pos)!
          return (
            <div key={pos}>
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {POSITION_LABEL[pos]} · {players.length}
                </span>
              </div>
              {players.map((p) => (
                <Link
                  href={`/jugador/${p.id}`}
                  key={`${p.id}-${p.name}`}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors"
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#c8102e]/10 text-[10px] font-black text-[#c8102e] shrink-0">
                    {p.number || '–'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 flex-1 truncate">{p.name}</span>
                  {p.age != null && (
                    <span className="text-[10px] text-slate-400 shrink-0">{p.age}a</span>
                  )}
                </Link>
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}
