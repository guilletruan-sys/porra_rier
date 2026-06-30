'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getFlagUrl } from '@/lib/team-map'
import { IconBall, IconFlagFallback, RankBadge } from '@/components/icons'
import { Spoiler } from '@/components/Spoiler'

interface Scorer {
  player: { id: number; name: string }
  team: { tla: string; shortName: string }
  playedMatches: number
  goals: number
  assists: number | null
  penalties: number | null
}

export default function GoleadoresPage() {
  const [scorers, setScorers] = useState<Scorer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scorers')
      .then(r => r.json())
      .then(d => { setScorers(d.scorers ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-3">
      <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <IconBall size={13} className="text-[#c8102e]" />
        Tabla de goleadores
      </h2>

      {loading && (
        <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">Cargando goleadores…</div>
      )}

      {!loading && scorers.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center text-sm text-slate-400 dark:text-slate-500 shadow-sm">
          Sin datos todavía
        </div>
      )}

      {scorers.length > 0 && (
        <Spoiler blockMode label="Goleadores ocultos · Toca para ver">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-slate-50 dark:border-slate-800">
                <th className="pl-3 py-2 text-left w-6">#</th>
                <th className="py-2 text-left">Jugador</th>
                <th className="py-2 text-center w-8">PJ</th>
                <th className="py-2 text-center w-10 text-[#c8102e]">Goles</th>
                <th className="pr-3 py-2 text-center w-8">Asist.</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((s, i) => {
                const flagUrl = getFlagUrl(s.team.tla)
                const isTop = i === 0
                return (
                  <tr key={s.player.id} className={`border-t border-slate-50 dark:border-slate-800 ${isTop ? 'bg-amber-50/60' : ''}`}>
                    <td className="pl-3 py-2.5">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="py-2.5 pr-2">
                      <Link href={`/jugador/${s.player.id}`} className="block hover:opacity-80">
                        <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100 truncate underline decoration-dotted underline-offset-2">{s.player.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {flagUrl
                            ? <Image src={flagUrl} alt="" width={12} height={9} unoptimized className="rounded-sm shrink-0" />
                            : <IconFlagFallback width={12} height={9} />
                          }
                          <span className="text-[9px] text-slate-400 dark:text-slate-500">{s.team.shortName}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="py-2.5 text-center text-[10px] text-slate-500 dark:text-slate-400 ">{s.playedMatches}</td>
                    <td className="py-2.5 text-center">
                      <span className={`text-sm font-black ${isTop ? 'text-[#c8102e]' : 'text-slate-700 dark:text-slate-200'}`}>
                        {s.goals}
                      </span>
                    </td>
                    <td className="pr-3 py-2.5 text-center text-[10px] text-slate-500 dark:text-slate-400 ">
                      {s.assists ?? 0}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </Spoiler>
      )}

      {scorers.length > 0 && (
        <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-4">
          Actualizado cada 60 segundos
        </p>
      )}
    </div>
  )
}
