'use client'
import { useLite } from '@/contexts/LiteContext'
import { usePaywall } from '@/contexts/PaywallContext'

interface PremiumGateProps {
  children: React.ReactNode
  feature?: string
  mode?: 'overlay' | 'cutoff' | 'replace'
  limit?: number             // for cutoff: how many visible children before fade
  title?: string             // for replace: card title (defaults to "Función Pro")
  description?: string       // for replace: card description
  compact?: boolean          // for replace: smaller card
}

export function PremiumGate({
  children,
  feature,
  mode = 'replace',
  limit = 3,
  title,
  description,
  compact = false,
}: PremiumGateProps) {
  const { isPremium, ready } = useLite()
  const { showPaywall } = usePaywall()

  // Until we know whether the user is premium, render children optimistically
  // (avoids flash of paywall on hydration). When SSR-rendered the user is
  // treated as free and the paywall replace will show.
  if (!ready || isPremium) return <>{children}</>

  const onUpgrade = () => showPaywall(feature)

  if (mode === 'replace') {
    return <ReplaceFallback onUpgrade={onUpgrade} title={title} description={description} compact={compact} />
  }

  if (mode === 'overlay') {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none" style={{ filter: 'blur(8px)' }}>
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
          <UpgradeCallout compact onUpgrade={onUpgrade} feature={feature} />
        </div>
      </div>
    )
  }

  // cutoff: render first `limit` children + fade + CTA below
  const arr = Array.isArray(children) ? children : [children]
  const visible = arr.slice(0, limit)
  return (
    <div>
      <div className="relative">
        {visible}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
      </div>
      <UpgradeCallout onUpgrade={onUpgrade} feature={feature} />
    </div>
  )
}

function ReplaceFallback({ onUpgrade, title, description, compact }: { onUpgrade: () => void; title?: string; description?: string; compact?: boolean }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-amber-100 ${compact ? 'px-3 py-3' : 'px-4 py-5'} flex flex-col items-center text-center`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md mb-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
      </div>
      <p className="text-xs font-black text-slate-800 mb-0.5">{title ?? 'Función Pro'}</p>
      {description && <p className="text-[10px] text-slate-500 mb-2 max-w-xs">{description}</p>}
      <button
        onClick={onUpgrade}
        className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1.5 rounded-full shadow-sm hover:shadow active:scale-95 transition-all"
      >
        Mejorar a Pro
      </button>
    </div>
  )
}

function UpgradeCallout({ onUpgrade, feature, compact }: { onUpgrade: () => void; feature?: string; compact?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${compact ? 'p-2' : 'p-3'}`}>
      <button
        onClick={onUpgrade}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1.5 rounded-full shadow-sm hover:shadow active:scale-95 transition-all"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
        Mejorar a Pro{feature ? ` para ver ${feature}` : ''}
      </button>
    </div>
  )
}
