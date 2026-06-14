'use client'
import { useEffect, useState } from 'react'
import { RankingRow } from '@/components/RankingRow'
import { RankingChart } from '@/components/RankingChart'
import { IconTrophy } from '@/components/icons'
import type { RankingEntry } from '@/lib/types'
import type { HistoryPoint } from '@/app/api/ranking/history/route'
import participantsRaw from '@/data/participants.json'

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HistoryPoint[]>([])

  useEffect(() => {
    fetch('/api/ranking')
      .then(r => r.json())
      .then(d => { setRanking(d.ranking ?? []); setLoading(false) })
      .catch(() => setLoading(false))
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
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <IconTrophy size={13} className="text-[#c8102e]" />
          Clasificación general
        </h2>
        <span className="text-[9px] text-slate-400">{ranking.length} participantes</span>
      </div>

      <RankingChart history={history} participants={participantsRaw as string[]} />

      {loading && <div className="text-center text-sm text-slate-400 py-8">Calculando puntuación…</div>}

      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-50">
        {ranking.map((entry) => (
          <RankingRow key={entry.name} entry={entry} />
        ))}
      </div>

      {ranking.length > 0 && (
        <p className="text-center text-[10px] text-slate-300 mt-4">
          Actualizado cada 60 segundos · {new Date().toLocaleTimeString('es-ES')}
        </p>
      )}
    </div>
  )
}
