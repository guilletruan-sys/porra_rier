'use client'
import { useEffect, useState } from 'react'
import { useLite } from '@/contexts/LiteContext'
import { usePaywall } from '@/contexts/PaywallContext'

const PRO_FEATURES = [
  'Ranking completo del grupo',
  'Calendario entero del Mundial',
  'Detalles de cada partido: alineaciones, eventos, vídeos',
  'Páginas de equipos y jugadores',
  'Estadísticas avanzadas y gráficas de tu perfil',
  'Eliminatorias y predicciones especiales',
  'Actualizaciones en directo a tiempo real',
  'Tabla de goleadores oficial',
]

export function PaywallModal() {
  const { open, feature, closePaywall } = usePaywall()
  const { unlock } = useLite()
  const [toast, setToast] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePaywall() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, closePaywall])

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setToast(null); setShowCode(false); setCode(''); setCodeError(null)
    }
  }, [open])

  if (!open) return null

  const onSubscribe = () => {
    setToast('Pagos temporalmente no disponibles. Inténtalo más tarde.')
    setTimeout(() => setToast(null), 3500)
  }
  const onActivateCode = () => {
    setCodeError(null)
    const ok = unlock(code)
    if (ok) closePaywall()
    else setCodeError('Código no válido')
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={closePaywall}
    >
      <div
        className="bg-white w-full sm:max-w-sm sm:max-h-[90vh] max-h-[90dvh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar mobile */}
        <div className="flex justify-center pt-2 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Golden header */}
        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white px-5 pt-5 pb-6 relative">
          <button
            onClick={closePaywall}
            aria-label="Cerrar"
            className="absolute top-3 right-3 text-white/80 text-2xl leading-none w-7 h-7 flex items-center justify-center hover:text-white"
          >×</button>
          <div className="flex items-center gap-2 mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 22 12 17.27 5.79 22l2.39-8.15L2 9.36h7.61z"/></svg>
            <h2 className="text-lg font-black">Porra Rier <span className="bg-white text-amber-600 px-1.5 py-0.5 rounded text-xs ml-1">PRO</span></h2>
          </div>
          <p className="text-sm font-semibold text-white/95">Desbloquea toda la experiencia</p>
          {feature && (
            <p className="text-[11px] text-white/85 mt-1">
              {feature} es una función Pro
            </p>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <ul className="px-4 py-4 space-y-2">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-slate-700">
                <span className="text-green-600 mt-0.5 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* Price */}
          <div className="px-4 pb-3">
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Suscripción mensual</p>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-3xl font-black text-slate-800">9,99 €</span>
                <span className="text-xs text-slate-500">/mes</span>
              </div>
              <p className="text-[10px] text-amber-600 font-bold mt-1">🎉 Primer mes a 1 €</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 pb-4 shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
          <button
            onClick={onSubscribe}
            className="w-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-sm py-3 rounded-xl shadow active:scale-95 transition-transform"
          >
            Suscribirme · 1 € el primer mes
          </button>

          {toast && (
            <p className="mt-2 text-[11px] text-center text-red-600 bg-red-50 px-2 py-1.5 rounded-lg">
              {toast}
            </p>
          )}

          {/* Admin code */}
          <div className="mt-3 text-center">
            {!showCode ? (
              <button
                onClick={() => setShowCode(true)}
                className="text-[11px] text-slate-400 underline"
              >
                ¿Tienes un código de Pro?
              </button>
            ) : (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  autoFocus
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') onActivateCode() }}
                  placeholder="Código"
                  className="flex-1 text-[11px] border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={onActivateCode}
                  className="text-[11px] font-bold bg-slate-800 text-white px-3 py-1.5 rounded"
                >Activar</button>
              </div>
            )}
            {codeError && (
              <p className="mt-1 text-[10px] text-red-600">{codeError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
