'use client'
import { TLA_TO_EXCEL_NAME } from '@/lib/team-map'

interface AggregateOpinionProps {
  slot: string
  homeTla: string
  awayTla: string
  mySelection: string | null
  /** Si null, oculto hasta que el usuario elija. */
  agg: Record<string, number>
  reveal: boolean
}

export function AggregateOpinion({ homeTla, awayTla, agg, reveal }: AggregateOpinionProps) {
  if (!reveal) {
    return (
      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
        Elige primero para ver qué dice el grupo
      </p>
    )
  }
  const home = Math.round((agg[homeTla] ?? 0) * 100)
  const away = Math.round((agg[awayTla] ?? 0) * 100)
  const homeName = TLA_TO_EXCEL_NAME[homeTla] ?? homeTla
  const awayName = TLA_TO_EXCEL_NAME[awayTla] ?? awayTla
  return (
    <div className="space-y-1">
      <div className="flex h-1 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950">
        <div className="bg-blue-400" style={{ width: `${home}%` }} />
        <div className="bg-violet-400" style={{ width: `${away}%` }} />
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 ">
        <span className="font-bold text-blue-600">{home}%</span> dice {homeName} · <span className="font-bold text-violet-600">{away}%</span> dice {awayName}
      </p>
    </div>
  )
}
