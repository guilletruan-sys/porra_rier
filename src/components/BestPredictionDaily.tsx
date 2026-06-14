'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getMatchKey, getFlagUrl } from '@/lib/team-map'
import { scoreGroupMatch } from '@/lib/scoring'
import { Spoiler } from '@/components/Spoiler'
import { IconFlagFallback, RankBadge } from '@/components/icons'
import participants from '@/data/participants.json'
import predictionsRaw from '@/data/predictions.json'
import type { Match, PredictionsData } from '@/lib/types'

const predictions = predictionsRaw as PredictionsData

interface BestPredictionDailyProps {
  matches: Match[]
}

interface Score {
  name: string
  points: number
  display: string
  reason: 'exact' | 'result' | 'miss'
}

export function BestPredictionDaily({ matches }: BestPredictionDailyProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  // Re-render once a minute in case `now` changes — keeps "último partido jugado" fresh.
  useEffect(() => {
    const t = setInterval(() => setRefreshKey(k => k + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  // Latest finished group-stage match (knockouts use a different scoring model)
  const last = matches
    .filter(m => m.status === 'FINISHED' && m.stage === 'GROUP_STAGE')
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))[0]

  if (!last) return null
  // Force-use refreshKey so React doesn't optimize the deps away
  void refreshKey

  const matchKey = getMatchKey(last.homeTeam.tla, last.awayTeam.tla)
  const homeFlag = getFlagUrl(last.homeTeam.tla)
  const awayFlag = getFlagUrl(last.awayTeam.tla)

  const scores: Score[] = []
  for (const name of participants as string[]) {
    const pred = predictions[name]?.groupStage[matchKey]
    if (!pred) continue
    const { points, reason } = scoreGroupMatch(pred, last)
    if (reason === 'pending') continue
    scores.push({
      name,
      points,
      display: `${pred.homeGoals}-${pred.awayGoals}`,
      reason: reason as 'exact' | 'result' | 'miss',
    })
  }
  if (scores.length === 0) return null

  scores.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
  const max = scores[0].points
  const winners = scores.filter(s => s.points === max)
  const exactCount = scores.filter(s => s.reason === 'exact').length
  const resultCount = scores.filter(s => s.reason === 'result').length
  const missCount = scores.filter(s => s.reason === 'miss').length

  return (
    <section>
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span>🏆</span>
        Mejor predicción del último partido
      </h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Match header */}
        <div className="px-3 py-2 border-b border-slate-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {homeFlag
              ? <Image src={homeFlag} alt="" width={16} height={11} unoptimized className="rounded-sm" />
              : <IconFlagFallback width={16} height={11} />}
            <span className="text-[10px] font-bold text-slate-700 truncate">{last.homeTeam.shortName}</span>
          </div>
          <Spoiler>
            <span className="text-xs font-black text-[#c8102e] shrink-0">
              {last.score.fullTime.home ?? 0}–{last.score.fullTime.away ?? 0}
            </span>
          </Spoiler>
          <div className="flex items-center gap-1.5 min-w-0 justify-end">
            <span className="text-[10px] font-bold text-slate-700 truncate">{last.awayTeam.shortName}</span>
            {awayFlag
              ? <Image src={awayFlag} alt="" width={16} height={11} unoptimized className="rounded-sm" />
              : <IconFlagFallback width={16} height={11} />}
          </div>
        </div>

        {/* Top scorers */}
        <Spoiler blockMode label="Resultado oculto · Toca para ver">
        <div className="px-3 py-3 divide-y divide-slate-50">
          {winners.slice(0, 3).map((s, i) => (
            <Link
              key={s.name}
              href={`/predicciones/${encodeURIComponent(s.name)}`}
              className="flex items-center gap-3 py-2 hover:bg-slate-50 -mx-3 px-3 transition-colors"
            >
              <RankBadge rank={i + 1} />
              <span className="flex-1 text-xs font-bold text-slate-800 truncate">{s.name}</span>
              <span className="text-[10px] text-slate-400">predijo {s.display}</span>
              <span className="text-xs font-black text-[#c8102e]">+{s.points}</span>
            </Link>
          ))}

          {winners[0].points === 0 && (
            <p className="text-[10px] text-slate-400 text-center pt-2">Nadie acertó este partido</p>
          )}
        </div>

        {/* Bulk stats */}
        <div className="px-3 py-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-black text-green-600 tabular-nums">{exactCount}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Exacto</p>
          </div>
          <div>
            <p className="text-sm font-black text-yellow-600 tabular-nums">{resultCount}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Signo</p>
          </div>
          <div>
            <p className="text-sm font-black text-red-500 tabular-nums">{missCount}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fallo</p>
          </div>
        </div>
        </Spoiler>
      </div>
    </section>
  )
}
