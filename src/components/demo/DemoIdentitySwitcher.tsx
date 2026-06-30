'use client'
import { DEMO_PARTICIPANTS } from '@/lib/demo/mock-bracket'
import { useDemoIdentity } from '@/lib/demo/demo-storage'

export function DemoIdentitySwitcher() {
  const [identity, setIdentity] = useDemoIdentity()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="demo-identity" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
        Soy:
      </label>
      <div className="relative flex-1">
        <select
          id="demo-identity"
          value={identity ?? ''}
          onChange={e => setIdentity(e.target.value || null)}
          className="appearance-none w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-bold px-3 py-1.5 pr-8 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c8102e]/40"
        >
          <option value="">— elige —</option>
          {DEMO_PARTICIPANTS.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  )
}
