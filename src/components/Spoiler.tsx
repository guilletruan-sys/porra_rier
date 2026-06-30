'use client'
import { useState } from 'react'
import { useSpoiler } from '@/contexts/SpoilerContext'

interface SpoilerProps {
  children: React.ReactNode
  blockMode?: boolean
  label?: string
}

export function Spoiler({ children, blockMode = false, label = 'Resultado oculto · Toca para ver' }: SpoilerProps) {
  const { hidden, ready } = useSpoiler()
  const [revealed, setRevealed] = useState(false)

  if (!ready || !hidden || revealed) return <>{children}</>

  if (blockMode) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setRevealed(true) }}
        className="block w-full text-center py-6 px-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 dark:text-slate-500 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-950 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <EyeOffIcon />
          {label}
        </span>
      </button>
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); setRevealed(true) }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRevealed(true) } }}
      aria-label="Mostrar resultado"
      className="inline-block cursor-pointer select-none"
      style={{ filter: 'blur(6px)' }}
    >
      {children}
    </span>
  )
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}
