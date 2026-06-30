'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { MOCK_R32 } from '@/lib/demo/mock-bracket'
import { resetAllDemoData, useMockResults, useSimulatedNow } from '@/lib/demo/demo-storage'

const ADMIN_KEY = 'taladros'   // sin secreto fuerte, es solo evitar accesos accidentales

function AdminBody() {
  const params = useSearchParams()
  const ok = params.get('key') === ADMIN_KEY
  const { now, addHours, reset } = useSimulatedNow()
  const { results, setResult, clearAll } = useMockResults()

  if (!ok) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-2">
        <p className="text-sm font-bold text-slate-700">Panel admin protegido</p>
        <p className="text-[11px] text-slate-500">
          Añade <code className="bg-slate-100 px-1 rounded">?key=…</code> a la URL.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <section className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiempo virtual</h2>
        <p className="text-xs text-slate-700 mb-3 tabular-nums">
          {now.toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[1, 6, 12, 24].map(h => (
            <button
              key={h}
              onClick={() => addHours(h)}
              className="bg-[#c8102e] text-white text-xs font-black py-2 rounded-lg active:scale-95 transition-transform"
            >
              +{h}h
            </button>
          ))}
        </div>
        <button
          onClick={reset}
          className="mt-2 w-full text-[10px] font-black text-slate-500 underline"
        >
          Resetear al ahora real
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultados mockeados</h2>
          <button
            onClick={clearAll}
            className="text-[9px] font-black text-slate-500 underline"
          >
            Limpiar todos
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mb-3">Marca quien pasa cada cruce. Solo afecta cruces con kickoff ya pasado.</p>
        <div className="space-y-2">
          {MOCK_R32.map(c => {
            const home = TLA_TO_EXCEL_NAME[c.home] ?? c.home
            const away = TLA_TO_EXCEL_NAME[c.away] ?? c.away
            const winner = results[c.slot]
            return (
              <div key={c.slot} className="border border-slate-100 rounded-lg p-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.slot}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setResult(c.slot, c.home)}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-colors ${
                      winner === c.home ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {home}
                  </button>
                  <button
                    onClick={() => setResult(c.slot, c.away)}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-colors ${
                      winner === c.away ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {away}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <h2 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2">Zona peligrosa</h2>
        <button
          onClick={() => {
            if (confirm('¿Borrar TODOS los datos del demo (predicciones, tiempo, resultados)?')) {
              resetAllDemoData()
            }
          }}
          className="w-full bg-red-600 text-white text-xs font-black py-2 rounded-lg"
        >
          Borrar todo
        </button>
      </section>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-slate-400 py-8">Cargando…</div>}>
      <AdminBody />
    </Suspense>
  )
}
