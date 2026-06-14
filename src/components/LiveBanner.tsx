'use client'
import Image from 'next/image'
import Link from 'next/link'
import { getFlagUrl } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import { Spoiler } from '@/components/Spoiler'
import type { Match } from '@/lib/types'

interface LiveBannerProps {
  matches: Match[]
}

export function LiveBanner({ matches }: LiveBannerProps) {
  const live = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
  if (live.length === 0) return null

  return (
    <section>
      <h2 className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-500">EN DIRECTO</span>
      </h2>
      <div className="space-y-2">
        {live.map(m => <LiveCard key={m.id} match={m} />)}
      </div>
    </section>
  )
}

function LiveCard({ match }: { match: Match }) {
  const { homeTeam, awayTeam, score, minute, injuryTime } = match
  const homeFlag = getFlagUrl(homeTeam.tla)
  const awayFlag = getFlagUrl(awayTeam.tla)
  const minuteLabel = minute != null
    ? `${minute}'${injuryTime ? `+${injuryTime}` : ''}`
    : 'EN VIVO'

  return (
    <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-md p-3 text-white relative overflow-hidden">
      <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        {minuteLabel}
      </div>

      <div className="flex items-center justify-between gap-3 mt-1">
        {/* Home */}
        <Link href={`/equipo/${homeTeam.tla}`} className="flex flex-col items-center gap-1.5 flex-1 min-w-0 hover:opacity-80">
          {homeFlag
            ? <Image src={homeFlag} alt="" width={40} height={28} unoptimized className="rounded-sm shadow" />
            : <IconFlagFallback width={40} height={28} />}
          <span className="text-xs font-bold truncate w-full text-center">{homeTeam.shortName}</span>
        </Link>

        {/* Score */}
        <Spoiler>
          <div className="flex items-center gap-2 shrink-0 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg">
            <span className="text-3xl font-black tabular-nums">{score.fullTime.home ?? 0}</span>
            <span className="text-xl opacity-50">–</span>
            <span className="text-3xl font-black tabular-nums">{score.fullTime.away ?? 0}</span>
          </div>
        </Spoiler>

        {/* Away */}
        <Link href={`/equipo/${awayTeam.tla}`} className="flex flex-col items-center gap-1.5 flex-1 min-w-0 hover:opacity-80">
          {awayFlag
            ? <Image src={awayFlag} alt="" width={40} height={28} unoptimized className="rounded-sm shadow" />
            : <IconFlagFallback width={40} height={28} />}
          <span className="text-xs font-bold truncate w-full text-center">{awayTeam.shortName}</span>
        </Link>
      </div>

      <a
        href="https://www.cope.es/programas/tiempo-de-juego"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-lg py-1.5 text-[10px] font-bold transition-colors"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z"/>
        </svg>
        Escuchar en COPE
      </a>
    </div>
  )
}
