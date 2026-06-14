'use client'
import Link from 'next/link'
import type { Match, PredictionsData, PickResult } from '@/lib/types'
import { getMatchKey } from '@/lib/team-map'
import { scoreGroupMatch } from '@/lib/scoring'
import { useSpoiler } from '@/contexts/SpoilerContext'
import { Spoiler } from '@/components/Spoiler'

interface PredictionGridProps {
  match: Match
  predictions: PredictionsData
  participants: string[]
}

const PICK_LABEL: Record<PickResult, string> = { home: '1', draw: 'X', away: '2' }
const PICK_CLS: Record<PickResult, string> = {
  home: 'bg-blue-100 text-blue-700',
  draw: 'bg-amber-100 text-amber-700',
  away: 'bg-violet-100 text-violet-700',
}
const BAR_CLS: Record<PickResult, string> = {
  home: 'bg-blue-400',
  draw: 'bg-amber-400',
  away: 'bg-violet-400',
}

export function PredictionGrid({ match, predictions, participants }: PredictionGridProps) {
  const matchKey = getMatchKey(match.homeTeam.tla, match.awayTeam.tla)
  const { hidden } = useSpoiler()
  const reallyFinished = match.status === 'FINISHED' || match.status === 'IN_PLAY'
  const isFinished = reallyFinished && !hidden

  const rows = participants.map(name => {
    const pred = predictions[name]?.groupStage[matchKey]
    if (!pred) return { name, pick: null as PickResult | null, display: '—', points: 0, reason: 'pending' as const }
    const { points, reason } = scoreGroupMatch(pred, match)
    return { name, pick: pred.pick, display: `${pred.homeGoals}–${pred.awayGoals}`, points, reason }
  })

  const counts = { home: 0, draw: 0, away: 0 }
  for (const r of rows) if (r.pick) counts[r.pick]++
  const total = counts.home + counts.draw + counts.away

  const bgClass = (reason: string) => {
    if (!isFinished) return 'bg-white'
    if (reason === 'exact') return 'bg-green-50'
    if (reason === 'result') return 'bg-yellow-50'
    if (reason === 'miss') return 'bg-red-50'
    return 'bg-white'
  }

  const ptsBadge = (reason: string, points: number) => {
    if (!isFinished || reason === 'pending') return null
    const cls = reason === 'exact'
      ? 'bg-green-100 text-green-700'
      : reason === 'result'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-500'
    return (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cls}`}>
        {points > 0 ? `+${points}` : '0'} pts
      </span>
    )
  }

  return (
    <div className="space-y-2">
      {/* 1X2 distribution bar */}
      {total > 0 && (
        <div className="bg-white rounded-xl shadow-sm px-3 py-2.5 space-y-1.5">
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            {(['home', 'draw', 'away'] as PickResult[]).map(pick =>
              counts[pick] > 0 ? (
                <div
                  key={pick}
                  className={`${BAR_CLS[pick]} transition-all`}
                  style={{ width: `${(counts[pick] / total) * 100}%` }}
                />
              ) : null
            )}
          </div>
          <div className="flex gap-3">
            {(['home', 'draw', 'away'] as PickResult[]).map(pick => (
              <div key={pick} className="flex items-center gap-1">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${PICK_CLS[pick]}`}>
                  {PICK_LABEL[pick]}
                </span>
                <span className="text-[9px] font-semibold text-slate-500">{counts[pick]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participant rows */}
      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-50">
        {rows.map(({ name, pick, display, points, reason }) => (
          <div key={name} className={`flex items-center gap-2 px-3 py-2.5 ${bgClass(reason)}`}>
            <Link href={`/predicciones/${encodeURIComponent(name)}`} className="flex-1 text-xs font-semibold text-slate-700 underline decoration-dotted underline-offset-2">
              {name}
            </Link>
            {pick && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${PICK_CLS[pick]}`}>
                {PICK_LABEL[pick]}
              </span>
            )}
            <span className="text-xs font-bold text-slate-500">{display}</span>
            {ptsBadge(reason, points)}
          </div>
        ))}
      </div>
    </div>
  )
}
