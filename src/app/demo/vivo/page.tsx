'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { LiveCrossCard } from '@/components/demo/LiveCrossCard'
import { LiveOnboarding } from '@/components/demo/LiveOnboarding'
import { useDemoIdentity, useMockResults, useMyPredictions, useOnboarded, useSimulatedNow } from '@/lib/demo/demo-storage'
import { MOCK_R32 } from '@/lib/demo/mock-bracket'

export default function DemoVivoPage() {
  const [identity] = useDemoIdentity()
  const { now } = useSimulatedNow()
  const { predictions, setPrediction } = useMyPredictions(identity)
  const { results } = useMockResults()
  const [onboarded, markOnboarded] = useOnboarded()

  const crossesWithDeadlines = useMemo(() =>
    MOCK_R32.map(c => ({
      ...c,
      deadline: new Date(now.getTime() + c.kickoffHoursFromNow * 3_600_000),
    })),
  [now])

  // Separar abiertos / cerrados.
  const open = crossesWithDeadlines.filter(c => c.deadline.getTime() > now.getTime() && !results[c.slot])
  const closed = crossesWithDeadlines.filter(c => c.deadline.getTime() <= now.getTime() || results[c.slot])

  open.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
  closed.sort((a, b) => b.deadline.getTime() - a.deadline.getTime())

  const totalDone = MOCK_R32.filter(c => predictions[c.slot]).length

  if (!identity) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-3">
        <p className="text-sm text-slate-600">Elige tu identidad en el desplegable de arriba.</p>
        <Link href="/demo" className="inline-block text-xs font-black text-[#c8102e] underline">
          ← Volver
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!onboarded && <LiveOnboarding onDone={markOnboarded} />}
      {/* Header con progreso */}
      <section className="bg-white rounded-2xl shadow-sm p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dieciseisavos · {identity}</p>
          <p className="text-[10px] font-black text-slate-500 tabular-nums">{totalDone}/{MOCK_R32.length}</p>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-[#c8102e] transition-all" style={{ width: `${(totalDone / MOCK_R32.length) * 100}%` }} />
        </div>
      </section>

      {/* Cruces abiertos */}
      {open.length > 0 && (
        <section className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Pendientes ({open.length})
          </p>
          {open.map(c => (
            <LiveCrossCard
              key={c.slot}
              cross={c}
              deadline={c.deadline}
              now={now}
              myPick={predictions[c.slot] ?? null}
              result={results[c.slot]}
              onPick={tla => setPrediction(c.slot, tla)}
            />
          ))}
        </section>
      )}

      {/* Cruces cerrados */}
      {closed.length > 0 && (
        <section className="space-y-2 mt-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Cerrados ({closed.length})
          </p>
          {closed.map(c => (
            <LiveCrossCard
              key={c.slot}
              cross={c}
              deadline={c.deadline}
              now={now}
              myPick={predictions[c.slot] ?? null}
              result={results[c.slot]}
              onPick={() => { /* noop */ }}
            />
          ))}
        </section>
      )}

      {open.length === 0 && closed.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-sm text-slate-500">No hay cruces todavía.</p>
        </div>
      )}
    </div>
  )
}
