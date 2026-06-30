import { MAINTENANCE_MESSAGE } from '@/lib/maintenance'

export function MaintenanceScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-200 leading-snug">
          {MAINTENANCE_MESSAGE}
        </h1>
      </div>
    </div>
  )
}
