'use client'
import { useState } from 'react'

interface Slide { title: string; body: string; emoji: string }

const SLIDES: Slide[] = [
  {
    emoji: '🎯',
    title: 'Han llegado los cruces reales',
    body: 'Cuando acabe la fase de grupos, en la versión real conocerás los emparejamientos de R32. Aquí lo hemos simulado con un cuadro ficticio.',
  },
  {
    emoji: '👆',
    title: 'Predice con un tap',
    body: 'Cada cruce tiene dos botones gigantes. Toca el equipo que crees que pasa. Puedes cambiar de opinión hasta el deadline.',
  },
  {
    emoji: '➕',
    title: 'Suma sobre tu porra del Excel',
    body: 'En la versión real, los puntos de esta porra viva se suman a los que ya tienes del Excel original. Misma escala: 5 pts en R32, 7 en R16, 10 en cuartos.',
  },
]

export function LiveOnboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const slide = SLIDES[i]
  const last = i === SLIDES.length - 1

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center space-y-3">
          <div className="text-5xl">{slide.emoji}</div>
          <h2 className="text-base font-black text-slate-900 dark:text-slate-50">{slide.title}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300  leading-relaxed">{slide.body}</p>
        </div>

        <div className="px-6 pb-4 flex items-center justify-center gap-1.5">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className={`w-1.5 h-1.5 rounded-full ${idx === i ? 'bg-[#c8102e]' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 p-3 flex gap-2">
          {i > 0 && (
            <button
              onClick={() => setI(i - 1)}
              className="flex-1 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300  text-sm font-bold py-2.5 rounded-xl"
            >
              ← Atrás
            </button>
          )}
          <button
            onClick={() => last ? onDone() : setI(i + 1)}
            className="flex-1 bg-[#c8102e] text-white text-sm font-black py-2.5 rounded-xl"
          >
            {last ? 'Empezar' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  )
}
