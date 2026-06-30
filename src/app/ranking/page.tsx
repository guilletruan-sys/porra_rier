'use client'
import { useEffect, useState } from 'react'
import { RankingRow } from '@/components/RankingRow'
import { RankingChart } from '@/components/RankingChart'
import { LiveRankingBanner, type LiveMatchSummary } from '@/components/LiveRankingBanner'
import { IconTrophy } from '@/components/icons'
import { useIdentity } from '@/contexts/IdentityContext'
import type { RankingEntry } from '@/lib/types'
import type { HistoryPoint } from '@/app/api/ranking/history/route'
import participantsRaw from '@/data/participants.json'

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [liveMatches, setLiveMatches] = useState<LiveMatchSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const { name: myName } = useIdentity()

  useEffect(() => {
    let cancelled = false
    let interval: ReturnType<typeof setInterval> | null = null

    const load = () =>
      fetch('/api/ranking', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          if (cancelled) return
          setRanking(d.ranking ?? [])
          setLiveMatches(d.liveMatches ?? [])
          setLoading(false)
          // Si hay partido en directo, repolear cada 10s para refrescar minuto/marcador
          const hasLive = (d.liveMatches ?? []).length > 0
          if (hasLive && !interval) interval = setInterval(load, 10_000)
          else if (!hasLive && interval) { clearInterval(interval); interval = null }
        })
        .catch(() => { if (!cancelled) setLoading(false) })

    load()
    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    fetch('/api/ranking/history')
      .then(r => r.json())
      .then(d => setHistory(d.history ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <IconTrophy size={13} className="text-[#c8102e]" />
          Clasificación general
        </h2>
        <span className="text-[9px] text-slate-400 dark:text-slate-500">{ranking.length} participantes</span>
      </div>

      <RankingChart history={history} participants={participantsRaw as string[]} />

      <LiveRankingBanner matches={liveMatches} />

      {loading && <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">Calculando puntuación…</div>}

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800">
        {ranking.map((entry) => (
          <RankingRow key={entry.name} entry={entry} highlight={!!myName && entry.name === myName} />
        ))}
      </div>

      {ranking.length > 0 && (
        <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-4">
          Actualizado cada 60 segundos · {new Date().toLocaleTimeString('es-ES')}
        </p>
      )}
    </div>
  )
}
