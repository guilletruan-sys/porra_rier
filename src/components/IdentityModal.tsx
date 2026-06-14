'use client'
import { useEffect, useState } from 'react'
import { useIdentity } from '@/contexts/IdentityContext'
import participants from '@/data/participants.json'

export function IdentityModal() {
  const { name, setName, ready, pickerOpen, closePicker } = useIdentity()
  const [autoOpen, setAutoOpen] = useState(false)
  const [skipped, setSkipped] = useState(false)

  useEffect(() => {
    if (ready && !name && !skipped) setAutoOpen(true)
  }, [ready, name, skipped])

  const open = autoOpen || pickerOpen
  if (!open) return null

  const choose = (n: string) => {
    setName(n)
    setAutoOpen(false)
    closePicker()
  }
  const skip = () => {
    setSkipped(true)
    setAutoOpen(false)
    closePicker()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 max-h-[90dvh] overflow-y-auto">
        <h2 className="text-base font-black text-slate-800 mb-1">¿Quién eres?</h2>
        <p className="text-xs text-slate-500 mb-4">Solo se guarda en este dispositivo. Sirve para mostrarte tus predicciones.</p>
        <div className="grid grid-cols-2 gap-2">
          {(participants as string[]).map(p => (
            <button
              key={p}
              onClick={() => choose(p)}
              className={`bg-slate-50 hover:bg-amber-50 hover:text-amber-700 text-xs font-bold text-slate-700 rounded-xl py-3 px-2 truncate transition-colors ${name === p ? 'ring-2 ring-amber-400 bg-amber-50' : ''}`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={skip}
          className="mt-4 w-full text-[11px] text-slate-400 underline"
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}
