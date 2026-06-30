'use client'
import Link from 'next/link'
import { useDemoIdentity, useMyPredictions, useSimulatedNow } from '@/lib/demo/demo-storage'
import { MOCK_R32 } from '@/lib/demo/mock-bracket'

export default function DemoHomePage() {
  const [identity] = useDemoIdentity()
  const { now } = useSimulatedNow()
  const { predictions } = useMyPredictions(identity)
  const total = MOCK_R32.length
  const done = MOCK_R32.filter(c => predictions[c.slot]).length
  const nextDeadline = MOCK_R32
    .map(c => new Date(now.getTime() + c.kickoffHoursFromNow * 3_600_000))
    .filter(d => d.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())[0]

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl shadow-sm p-4">
        <h1 className="text-lg font-black text-slate-900 mb-1">
          Porra viva
          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2 align-middle">
            Sandbox
          </span>
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Este es un prototipo con <strong>datos simulados</strong>. La idea: cuando empieza la
          eliminatoria real, cada uno podríamos volver a predecir los cruces con los equipos
          ya clasificados. Aquí puedes probar cómo se sentiría.
        </p>
      </section>

      {!identity ? (
        <section className="bg-[#c8102e] text-white rounded-2xl shadow-md p-4">
          <p className="text-sm font-black mb-2">👋 ¿Quién eres?</p>
          <p className="text-[11px] opacity-90">
            Elige tu nombre en el desplegable de arriba y empezamos.
          </p>
        </section>
      ) : (
        <section className="bg-gradient-to-br from-[#c8102e] to-[#9a0c23] text-white rounded-2xl shadow-md p-4">
          <p className="text-[10px] uppercase tracking-widest opacity-80 mb-1">Hola</p>
          <p className="text-xl font-black mb-3">{identity}</p>
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">Progreso R32</span>
              <span className="font-black tabular-nums">{done} / {total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white transition-all" style={{ width: `${(done / total) * 100}%` }} />
            </div>
            {nextDeadline && (
              <p className="text-[10px] opacity-90 mt-2">
                Próximo cierre: {nextDeadline.toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <Link href="/demo/vivo" className="block mt-3 bg-white text-[#c8102e] text-center text-sm font-black py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-colors">
            {done === 0 ? 'Empezar a predecir →' : done === total ? 'Revisar predicciones →' : `Sigue prediciendo (${total - done}) →`}
          </Link>
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Qué se prueba aquí?</h2>
        <ul className="text-[11px] text-slate-600 space-y-1.5">
          <li>• Predicción slot a slot con tap (sin formularios).</li>
          <li>• Autosave silencioso — nada que confirmar.</li>
          <li>• Visión agregada anónima de qué dice el grupo.</li>
          <li>• Deadline por cruce con countdown.</li>
          <li>• Estados visuales (abierto / a punto / cerrado / con resultado).</li>
        </ul>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">⚠ aviso</p>
        <p className="text-[11px] text-amber-700 leading-relaxed">
          Las predicciones se guardan SOLO en este navegador. Si pruebas en otro
          dispositivo, empiezas de cero. En la versión real, irían a Supabase
          asociadas a tu email.
        </p>
      </section>
    </div>
  )
}
