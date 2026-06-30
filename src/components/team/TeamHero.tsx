'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getFlagUrl, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import type { PublicTeam } from '@/app/api/wc-teams/route'

interface TeamHeroProps {
  tla: string
  group: string | null
  position: number | null  // 1-based
  totalTeams: number | null
}

export function TeamHero({ tla, group, position, totalTeams }: TeamHeroProps) {
  const [coach, setCoach] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/wc-teams')
      .then(r => r.json())
      .then(d => {
        const t: PublicTeam | undefined = d.teams?.[tla]
        setCoach(t?.coach?.name ?? null)
      })
      .catch(() => {})
  }, [tla])

  const flagUrl = getFlagUrl(tla)
  const name = TLA_TO_EXCEL_NAME[tla] ?? tla
  const groupLabel = group ? `Grupo ${group.replace('GROUP_', '')}` : '—'
  const positionLabel = position && totalTeams
    ? `${position}º / ${totalTeams}`
    : null

  return (
    <div className="bg-gradient-to-br from-[#c8102e] to-[#006341] text-white px-4 py-5 -mx-3 mb-3">
      <div className="flex items-center gap-4">
        <div className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm rounded-xl p-2 shrink-0">
          {flagUrl
            ? <Image src={flagUrl} alt="" width={60} height={42} unoptimized className="rounded-sm shadow-lg" />
            : <IconFlagFallback width={60} height={42} className="rounded-sm" />}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black tracking-tight truncate">{name}</h1>
          <p className="text-xs font-semibold text-white/80 mt-0.5">{groupLabel}</p>
          {positionLabel && (
            <p className="text-[10px] text-white/70 mt-1">Posición: {positionLabel}</p>
          )}
          {coach && (
            <p className="text-[10px] text-white/70 mt-1 truncate">DT: {coach}</p>
          )}
        </div>
      </div>
    </div>
  )
}
