'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useLite } from '@/contexts/LiteContext'
import { useIdentity } from '@/contexts/IdentityContext'
import { usePaywall } from '@/contexts/PaywallContext'

interface AppHeaderProps {
  title?: string
  subtitle?: string
}

export function AppHeader({ title = 'Porra', subtitle }: AppHeaderProps) {
  const [refreshing, setRefreshing] = useState(false)
  const { isPremium } = useLite()
  const { name, openPicker } = useIdentity()
  const { showPaywall } = usePaywall()
  const [showProMenu, setShowProMenu] = useState(false)

  useEffect(() => {
    // Auto-close pro menu on outside click
    if (!showProMenu) return
    const onDoc = () => setShowProMenu(false)
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [showProMenu])

  const handleRefresh = () => {
    setRefreshing(true)
    window.location.reload()
  }

  return (
    <header className="bg-gradient-to-r from-[#c8102e] to-[#006341] px-4 py-3 text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Image src="/icon.png" alt="Porra" width={28} height={28} className="rounded-sm" />
          <h1 className="text-sm font-black tracking-tight truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Identity pill */}
          <button
            onClick={openPicker}
            className="text-[10px] font-bold text-white/90 bg-white/15 hover:bg-white/25 px-2 py-1 rounded-full max-w-[100px] truncate"
            aria-label="Cambiar quién soy"
          >
            {name ? `Soy ${name}` : '¿Quién eres?'}
          </button>

          {/* Pro CTA / status */}
          {isPremium ? (
            <span className="text-[9px] font-black bg-gradient-to-br from-amber-400 to-amber-600 text-white px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
              PRO
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); showPaywall() }}
              className="text-[9px] font-black bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white px-2 py-1 rounded-full uppercase tracking-wider shadow-sm active:scale-95 transition-all"
              aria-label="Mejorar a Pro"
            >
              Mejorar a Pro
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Actualizar"
            className="p-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
          >
            <svg
              width="16"
              height="16"
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
