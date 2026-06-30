'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParticipantRanks } from '@/lib/use-participant-ranks'
import participantsList from '@/data/participants.json'

interface H2HPickerSheetProps {
  /** Participant whose H2H view we'll navigate to with the chosen rival as p2. */
  selfName: string
  onClose: () => void
}

function H2HPickerSheet({ selfName, onClose }: H2HPickerSheetProps) {
  const router = useRouter()
  const ranks = useParticipantRanks()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const others = (participantsList as string[])
    .filter(p => p !== selfName)
    .sort((a, b) => (ranks[a] ?? Infinity) - (ranks[b] ?? Infinity) || a.localeCompare(b))

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-md max-h-[80dvh] sm:max-h-[70vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm font-black text-slate-800 dark:text-slate-100">Comparar <span className="text-[#c8102e]">{selfName}</span> vs…</span>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate-400 dark:text-slate-500 text-xl leading-none w-7 h-7 flex items-center justify-center hover:text-slate-700 dark:text-slate-200">×</button>
        </div>
        <div className="overflow-y-auto overscroll-contain divide-y divide-slate-50 dark:divide-slate-800">
          {others.map(p => (
            <button
              key={p}
              onClick={() => {
                onClose()
                router.push(`/h2h/${encodeURIComponent(selfName)}/${encodeURIComponent(p)}`)
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 transition-colors"
            >
              {ranks[p] && (
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tabular-nums w-6 text-right shrink-0">
                  {ranks[p]}º
                </span>
              )}
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{p}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function H2HButton({ selfName, compact = false }: { selfName: string; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        aria-label={`Comparar ${selfName} con otro participante`}
        title="Comparar con otro participante"
        className={
          compact
            ? 'shrink-0 text-[9px] font-black text-slate-400 dark:text-slate-500 hover:text-[#c8102e] bg-slate-50 dark:bg-slate-900 hover:bg-red-50 rounded-full px-2 py-1 transition-colors'
            : 'shrink-0 text-xs font-black text-slate-500 dark:text-slate-400  hover:text-[#c8102e] bg-slate-50 dark:bg-slate-900 hover:bg-red-50 rounded-full px-3 py-1.5 transition-colors'
        }
      >
        vs
      </button>
      {open && <H2HPickerSheet selfName={selfName} onClose={() => setOpen(false)} />}
    </>
  )
}
