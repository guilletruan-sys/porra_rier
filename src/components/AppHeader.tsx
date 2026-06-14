'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useSpoiler } from '@/contexts/SpoilerContext'

interface AppHeaderProps {
  title?: string
  subtitle?: string
}

export function AppHeader({ title = 'Taladros WC 2026', subtitle }: AppHeaderProps) {
  const [isLive, setIsLive] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { hidden, toggle } = useSpoiler()

  useEffect(() => {
    const check = () =>
      fetch('/api/matches', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          const live = (d.matches ?? []).some(
            (m: { status: string }) => m.status === 'IN_PLAY' || m.status === 'PAUSED'
          )
          setIsLive(live)
        })
        .catch(() => {})

    check()
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    window.location.reload()
  }

  return (
    <header className="bg-gradient-to-r from-[#c8102e] to-[#006341] px-4 py-3 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/icon.png" alt="Taladros" width={28} height={28} className="rounded-sm" />
          <h1 className="text-sm font-black tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <a
              href="https://www.cope.es/programas/tiempo-de-juego"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escuchar retransmisión en la COPE"
              className="animate-pulse bg-green-600 hover:bg-green-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z"/>
              </svg>
              EN VIVO · COPE
            </a>
          )}
          <button
            onClick={toggle}
            aria-label={hidden ? 'Mostrar resultados' : 'Ocultar resultados'}
            title={hidden ? 'Mostrar resultados' : 'Ocultar resultados'}
            className={`p-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors ${hidden ? 'bg-white/20' : ''}`}
          >
            {hidden ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Actualizar"
            className="p-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={refreshing ? 'animate-spin' : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>
      {subtitle && <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>}
    </header>
  )
}
