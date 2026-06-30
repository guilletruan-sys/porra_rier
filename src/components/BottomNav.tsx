'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function IconHome({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#c8102e"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function IconCalendar({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#c8102e"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconTrophy({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#c8102e"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94C8.02 14.31 9.37 15.35 11 15.79V18H9c-.55 0-1 .45-1 1s.45 1 1 1h6c.55 0 1-.45 1-1s-.45-1-1-1h-2v-2.21c1.63-.44 2.98-1.48 3.61-2.85C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/>
      <path d="M7 4H4v4c0 3.3 2.7 6 6 6h4c3.3 0 6-2.7 6-6V4h-3"/><line x1="7" y1="4" x2="17" y2="4"/>
    </svg>
  )
}

function IconUsers({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#c8102e"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconRunner({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#c8102e"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2"/><path d="M7.5 13l2-6 3.5 3 2-3.5 4 1.5"/><path d="M6 21l2-4 3 2 2-4 3 2"/>
    </svg>
  )
}

function IconBracket({ active }: { active: boolean }) {
  const stroke = active ? '#c8102e' : '#94a3b8'
  const fill = active ? '#c8102e' : 'none'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="6" height="4" rx="1" fill={fill} stroke={stroke} />
      <rect x="2" y="16" width="6" height="4" rx="1" fill={fill} stroke={stroke} />
      <rect x="10" y="10" width="6" height="4" rx="1" fill={fill} stroke={stroke} />
      <rect x="18" y="10" width="4" height="4" rx="1" fill={fill} stroke={stroke} />
      <path d="M8 6h2v6" />
      <path d="M8 18h2v-6" />
      <path d="M16 12h2" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/', Icon: IconHome, label: 'Inicio' },
  { href: '/partidos', Icon: IconCalendar, label: 'Partidos' },
  { href: '/cuadro', Icon: IconBracket, label: 'Cuadro' },
  { href: '/ranking', Icon: IconTrophy, label: 'Ranking' },
  { href: '/predicciones', Icon: IconUsers, label: 'Prediccs.' },
  { href: '/goleadores', Icon: IconRunner, label: 'Golead.' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around py-2 pb-4 z-50">
      {NAV_ITEMS.map(({ href, Icon, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <div className={`flex items-center justify-center rounded-xl px-2 py-1 transition-colors ${active ? 'bg-red-50 dark:bg-red-950/40' : ''}`}>
              <Icon active={active} />
            </div>
            <span className={`text-[9px] font-semibold ${active ? 'text-[#c8102e]' : 'text-slate-400 dark:text-slate-500 '}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
