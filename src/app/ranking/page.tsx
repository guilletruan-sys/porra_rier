'use client'
import { useEffect, useState } from 'react'
import { RankingRow } from '@/components/RankingRow'
import { RankingChart } from '@/components/RankingChart'
import { PremiumGate } from '@/components/PremiumGate'
import { useLite } from '@/contexts/LiteContext'
import { IconTrophy } from '@/components/icons'
import type { RankingEntry } from '@/lib/types'
import type { HistoryPoint } from '@/app/api/ranking/history/route'
import participantsRaw from '@/data/participants.json'

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const { isPremium, ready: liteReady } = useLite()

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

  const visibleRanking = liteReady && !isPremium ? ranking.slice(0, 3) : ranking
  const hiddenCount = ranking.length - visibleRanking.length

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <IconTrophy size={13} className="text-[#c8102e]" />
          Clasificación general
        </h2>
        <span className="text-[9px] text-slate-400">
          {isPremium ? `${ranking.length} participantes` : `Top 3 de ${ranking.length}`}
        </span>
      </div>

      {/* Ranking chart — Pro */}
      <PremiumGate
        mode="replace"
        feature="la gráfica de evolución del ranking"
        title="📈 Evolución de posiciones"
        description="Cómo ha cambiado cada participante de puesto día a día"
      >
        <RankingChart history={history} participants={participantsRaw as string[]} />
      </PremiumGate>

      {loading && <div className="text-center text-sm text-slate-400 py-8">Calculando puntuación…</div>}

      {!loading && (
        <>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-50 mt-4">
            {visibleRanking.map((entry) => (
              <RankingRow key={entry.name} entry={entry} />
            ))}
          </div>

          {hiddenCount > 0 && (
            <div className="mt-3">
              <PremiumGate
                mode="replace"
                feature="el ranking completo"
                title="Ranking completo"
                description={`Hay ${hiddenCount} participantes más por debajo del podio. Mejora a Pro para ver toda la clasificación.`}
              >
                <div />
              </PremiumGate>
            </div>
          )}
        </>
      )}

      {ranking.length > 0 && (
        <p className="text-center text-[10px] text-slate-300 mt-4">
          Actualizado cada 60 segundos · {new Date().toLocaleTimeString('es-ES')}
        </p>
      )}
    </div>
  )
}
