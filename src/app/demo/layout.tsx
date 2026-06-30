'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DemoIdentitySwitcher } from '@/components/demo/DemoIdentitySwitcher'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const links = [
    { href: '/demo', label: 'Inicio' },
    { href: '/demo/vivo', label: 'Predecir' },
  ]
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white sticky top-0 z-40 shadow-lg">
        <div className="px-3 py-2 flex items-center justify-between gap-2 max-w-md mx-auto">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest opacity-70 hover:opacity-100">
            ← Volver a la app
          </Link>
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
            🧪 PROTOTIPO
          </span>
        </div>
        <div className="px-3 pb-2 max-w-md mx-auto">
          <DemoIdentitySwitcher />
        </div>
        <nav className="px-3 pb-2 max-w-md mx-auto flex gap-2">
          {links.map(l => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex-1 text-center text-[11px] font-black uppercase tracking-widest py-1.5 rounded-lg transition-colors ${
                  active ? 'bg-white text-slate-900' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="max-w-md mx-auto p-3">
        {children}
      </div>
    </div>
  )
}
