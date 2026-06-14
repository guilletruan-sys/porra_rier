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
  goals: number
}

export function PichichiCard() {
  const [top, setTop] = useState<Scorer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scorers')
      .then(r => r.json())
      .then(d => { setTop((d.scorers ?? []).slice(0, 3)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section>
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <IconBall size={13} className="text-[#c8102e]" />
        Pichichi
      </h2>
      {loading ? (
        <div className="bg-white rounded-xl p-4 text-center text-sm text-slate-400 shadow-sm">Cargando…</div>
      ) : top.length === 0 ? (
        <div className="bg-white rounded-xl p-4 text-center text-sm text-slate-400 shadow-sm">Sin goles todavía</div>
      ) : (
        <Spoiler blockMode label="Pichichi oculto · Toca para ver">
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-50">
          {top.map((s, i) => {
            const flagUrl = getFlagUrl(s.team.tla)
            return (
              <Link
                key={s.player.id}
                href={`/jugador/${s.player.id}`}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <RankBadge rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{s.player.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {flagUrl
                      ? <Image src={flagUrl} alt="" width={12} height={9} unoptimized className="rounded-sm" />
                      : <IconFlagFallback width={12} height={9} />}
                    <span className="text-[10px] text-slate-500">{s.team.shortName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-black leading-none ${i === 0 ? 'text-[#c8102e]' : 'text-slate-700'}`}>{s.goals}</span>
                  <span className="text-[9px] text-slate-400 block">goles</span>
                </div>
              </Link>
            )
          })}
        </div>
        </Spoiler>
      )}
    </section>
  )
}
