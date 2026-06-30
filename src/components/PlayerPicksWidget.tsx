import participants from '@/data/participants.json'
import predictionsRaw from '@/data/predictions.json'
import type { PredictionsData } from '@/lib/types'
import { canonicalizePlayer } from '@/lib/player-canonicalize'

const predictions = predictionsRaw as PredictionsData

interface PlayerPicksWidgetProps {
  kind: 'goldenBoot' | 'goldenBall'
  title: string
  icon: string         // emoji shown before the title
}

export function PlayerPicksWidget({ kind, title, icon }: PlayerPicksWidgetProps) {
  // Resolve each prediction to a canonical player from the official squads when
  // possible. Variants like "Mbappe", "Kylian Mbappe", "K. Mbappé" all collapse
  // to "Kylian Mbappé".
  const groups = new Map<string, { display: string; names: string[] }>()

  for (const name of participants as string[]) {
    // Top-3 (oro/plata/bronce): agrupamos por la apuesta de oro (1ª).
    const raw = predictions[name]?.specials?.[kind]?.first
    if (!raw || typeof raw !== 'string') continue
    const canonical = canonicalizePlayer(raw)
    if (!canonical) continue
    if (!groups.has(canonical)) {
      groups.set(canonical, { display: canonical, names: [] })
    }
    groups.get(canonical)!.names.push(name)
  }

  const sorted = [...groups.values()].sort((a, b) => {
    if (b.names.length !== a.names.length) return b.names.length - a.names.length
    return a.display.localeCompare(b.display)
  })

  if (sorted.length === 0) return null

  return (
    <section>
      <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span>{icon}</span>
        {title}
      </h2>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800">
        {sorted.map(g => (
          <div key={g.display} className="px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex-1 truncate">{g.display}</span>
              <span className="text-[10px] font-bold text-[#c8102e] bg-red-50 px-1.5 py-0.5 rounded-full shrink-0">
                {g.names.length} {g.names.length === 1 ? 'voto' : 'votos'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 ">
              {[...g.names].sort().join(' · ')}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
