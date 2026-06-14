'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getFlagUrl } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import type { Match } from '@/lib/types'

interface NextMatchCountdownProps {
  matches: Match[]
}

function diffToParts(ms: number): { d: number; h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}

export function NextMatchCountdown({ matches }: NextMatchCountdownProps) {
  const [now, setNow] = useState<number>(() => Date.now())

  // Don't render if there's already a live match — the LiveBanner takes that slot
  const live = matches.some(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')

  useEffect(() => {
    if (live) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [live])

  if (live) return null

  const upcoming = matches
    .filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED')
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0]

  if (!upcoming) return null

  const ms = new Date(upcoming.utcDate).getTime() - now
  const parts = diffToParts(ms)
  const homeFlag = getFlagUrl(upcoming.homeTeam.tla)
  const awayFlag = getFlagUrl(upcoming.awayTeam.tla)

  // Hide if more than 14 days away — too far to be interesting
  if (parts.d > 14) return null

  const label = parts.d > 0
    ? `En ${parts.d}d ${parts.h}h ${String(parts.m).padStart(2, '0')}m`
    : parts.h > 0
      ? `En ${parts.h}h ${String(parts.m).padStart(2, '0')}m ${String(parts.s).padStart(2, '0')}s`
      : parts.m > 0
        ? `En ${parts.m}m ${String(parts.s).padStart(2, '0')}s`
        : `En ${parts.s}s`

  return (
    <section>
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span>⏰</span>
        Próximo partido
      </h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-3 py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Link href={`/equipo/${upcoming.homeTeam.tla}`} className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-80">
            {homeFlag
              ? <Image src={homeFlag} alt="" width={22} height={16} unoptimized className="rounded-sm" />
              : <IconFlagFallback width={22} height={16} />}
            <span className="text-xs font-bold text-slate-800 truncate">{upcoming.homeTeam.shortName}</span>
          </Link>
          <span className="text-[10px] font-bold text-slate-400 shrink-0">vs</span>
          <Link href={`/equipo/${upcoming.awayTeam.tla}`} className="flex items-center gap-1.5 flex-1 min-w-0 justify-end hover:opacity-80">
            <span className="text-xs font-bold text-slate-800 truncate text-right">{upcoming.awayTeam.shortName}</span>
            {awayFlag
              ? <Image src={awayFlag} alt="" width={22} height={16} unoptimized className="rounded-sm" />
              : <IconFlagFallback width={22} height={16} />}
          </Link>
        </div>
        <p className="text-center text-sm font-black text-[#c8102e] tabular-nums">
          {label}
        </p>
      </div>
    </section>
  )
}
