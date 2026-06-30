import Image from 'next/image'
import { getFlagUrl, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { IconTrophy, IconFlagFallback } from '@/components/icons'
import participants from '@/data/participants.json'
import predictionsRaw from '@/data/predictions.json'
import type { PredictionsData } from '@/lib/types'

const predictions = predictionsRaw as PredictionsData

export function ChampionsWidget() {
  const groups = new Map<string, string[]>()
  for (const name of participants as string[]) {
    const tla = predictions[name]?.specials.champion
    if (!tla) continue
    if (!groups.has(tla)) groups.set(tla, [])
    groups.get(tla)!.push(name)
  }
  const sorted = [...groups.entries()].sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length
    return a[0].localeCompare(b[0])
  })

  if (sorted.length === 0) return null

  return (
    <section>
      <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <IconTrophy size={13} className="text-[#c8102e]" />
        ¿Quién será campeón?
      </h2>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800">
        {sorted.map(([tla, names]) => {
          const flagUrl = getFlagUrl(tla)
          const teamName = TLA_TO_EXCEL_NAME[tla] ?? tla
          return (
            <div key={tla} className="px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1">
                {flagUrl
                  ? <Image src={flagUrl} alt="" width={18} height={13} unoptimized className="rounded-sm" />
                  : <IconFlagFallback width={18} height={13} />}
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex-1">{teamName}</span>
                <span className="text-[10px] font-bold text-[#c8102e] bg-red-50 px-1.5 py-0.5 rounded-full">
                  {names.length} {names.length === 1 ? 'voto' : 'votos'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400  pl-6">
                {[...names].sort().join(' · ')}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
