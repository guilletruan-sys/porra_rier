import Link from 'next/link'
import type { RankingEntry } from '@/lib/types'
import { RankBadge } from '@/components/icons'

interface RankingRowProps {
  entry: RankingEntry
  highlight?: boolean
}

export function RankingRow({ entry, highlight }: RankingRowProps) {
  const { rank, name, totalPoints, groupStagePoints, knockoutPoints, rankDelta } = entry

  return (
    <Link href={`/predicciones/${encodeURIComponent(name)}`} className="block">
    <div className={`flex items-center gap-2 px-3 py-3 ${highlight ? 'bg-red-50' : ''}`}>
      {/* Rank */}
      <div className="w-7 flex justify-center shrink-0">
        <RankBadge rank={rank} />
      </div>

      {/* Name + breakdown */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 truncate">{name}</p>
        <p className="text-[9px] text-slate-400">
          Grupos: {groupStagePoints} pts · KO: {knockoutPoints} pts
        </p>
      </div>

      {/* Delta */}
      {rankDelta !== 0 && (
        <span className={`text-[9px] font-bold ${rankDelta > 0 ? 'text-green-500' : 'text-red-400'}`}>
          {rankDelta > 0 ? `↑${rankDelta}` : `↓${Math.abs(rankDelta)}`}
        </span>
      )}

      {/* Total points */}
      <div className="text-right shrink-0">
        <span className={`text-sm font-black ${rank === 1 ? 'text-[#c8102e]' : 'text-slate-600'}`}>
          {totalPoints}
        </span>
        <span className="text-[9px] text-slate-400 block">pts</span>
      </div>
    </div>
    </Link>
  )
}
