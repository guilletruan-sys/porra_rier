'use client'
import Image from 'next/image'
import { getFlagUrl } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import { Spoiler } from '@/components/Spoiler'

export interface LiveMatchSummary {
  id: number
  homeTeam: { tla: string; shortName: string }
  awayTeam: { tla: string; shortName: string }
  score: { home: number; away: number }
  minute: number | null
  injuryTime: number | null
  status: string
}

interface LiveRankingBannerProps {
  matches: LiveMatchSummary[]
  compact?: boolean   // versión reducida para la mini-ranking de la home
}

function formatMinute(m: LiveMatchSummary): string {
  if (m.minute == null) return 'EN VIVO'
  return m.injuryTime ? `${m.minute}+${m.injuryTime}'` : `${m.minute}'`
}

export function LiveRankingBanner({ matches, compact }: LiveRankingBannerProps) {
  if (matches.length === 0) return null

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-xl ${compact ? 'px-3 py-2' : 'px-3 py-3'} mb-3`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
        <span className={`font-black uppercase tracking-widest text-red-600 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          EN DIRECTO · ranking provisional
        </span>
      </div>
      <div className="space-y-1.5">
        {matches.map(m => (
          <LiveMatchRow key={m.id} match={m} compact={compact} />
        ))}
      </div>
    </div>
  )
}

function LiveMatchRow({ match, compact }: { match: LiveMatchSummary; compact?: boolean }) {
  const homeFlag = getFlagUrl(match.homeTeam.tla)
  const awayFlag = getFlagUrl(match.awayTeam.tla)
  const minuteLabel = formatMinute(match)

  return (
    <div className="flex items-center gap-2">
      {/* Home */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {homeFlag
          ? <Image src={homeFlag} alt="" width={16} height={11} unoptimized className="rounded-sm shrink-0" />
          : <IconFlagFallback width={16} height={11} />}
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-slate-700 dark:text-slate-200 truncate`}>
          {match.homeTeam.shortName}
        </span>
      </div>

      {/* Score */}
      <Spoiler>
        <span className={`${compact ? 'text-xs' : 'text-sm'} font-black text-slate-800 dark:text-slate-100 tabular-nums shrink-0`}>
          {match.score.home}–{match.score.away}
        </span>
      </Spoiler>

      {/* Away */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-slate-700 dark:text-slate-200 truncate text-right`}>
          {match.awayTeam.shortName}
        </span>
        {awayFlag
          ? <Image src={awayFlag} alt="" width={16} height={11} unoptimized className="rounded-sm shrink-0" />
          : <IconFlagFallback width={16} height={11} />}
      </div>

      {/* Minute */}
      <span className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-black text-orange-700 tabular-nums shrink-0 ml-1`}>
        {minuteLabel}
      </span>
    </div>
  )
}
