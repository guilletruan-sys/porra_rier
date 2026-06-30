import Link from 'next/link'
import type { RankingEntry } from '@/lib/types'
import { RankBadge } from '@/components/icons'
import { H2HButton } from '@/components/H2HPickerSheet'

interface RankingRowProps {
  entry: RankingEntry
  highlight?: boolean
}

export function RankingRow({ entry, highlight }: RankingRowProps) {
  const { rank, name, totalPoints, groupStagePoints, knockoutPoints, pendingKnockoutPoints, inPlayKnockoutPoints, rankDelta, pointsDelta, deltaStatus, tied } = entry

  return (
    <Link href={`/predicciones/${encodeURIComponent(name)}`} className="block">
    <div className={`flex items-center gap-2 px-3 py-3 ${highlight ? 'bg-red-50' : ''}`}>
      {/* Rank */}
      <div className="w-7 flex justify-center items-center shrink-0">
        <RankBadge rank={rank} />
        {tied && (
          <span
            className="text-[8px] text-slate-400 dark:text-slate-500 leading-none ml-0.5"
            title="Empate persistente — premio compartido si no se rompe"
          >
            *
          </span>
        )}
      </div>

      {/* Name + breakdown */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{name}</p>
        <p className="text-[9px] text-slate-400 dark:text-slate-500">
          Grupos: {groupStagePoints} pts · KO: {knockoutPoints} pts
          {pendingKnockoutPoints ? (
            <span className="text-emerald-600 dark:text-emerald-400 ml-1" title="Pts ya asegurados; se suman cuando acabe la fase de grupos">
              (+{pendingKnockoutPoints} pendientes)
            </span>
          ) : null}
          {inPlayKnockoutPoints ? (
            <span className="text-amber-600 dark:text-amber-400 ml-1" title="Puntos KO/especiales que aún tiene vivos (equipos en el cuadro sin consolidar)">
              · {inPlayKnockoutPoints} en juego
            </span>
          ) : null}
        </p>
      </div>

      {/* Delta — rank arrow + points gained/lost from the last scoring event */}
      {(rankDelta !== 0 || pointsDelta !== 0) && (
        <span
          className={`flex items-center gap-0.5 text-[9px] font-bold ${
            deltaStatus === 'live'
              ? 'text-orange-500 animate-pulse'
              : (rankDelta > 0 || pointsDelta > 0)
                ? 'text-green-500'
                : 'text-red-400'
          }`}
          title={deltaStatus === 'live' ? 'Cambio provisional por partido en juego' : 'Cambio del último partido'}
        >
          {rankDelta !== 0 && (
            <span>{rankDelta > 0 ? `↑${rankDelta}` : `↓${Math.abs(rankDelta)}`}</span>
          )}
          {pointsDelta !== 0 && (
            <span>{pointsDelta > 0 ? `+${pointsDelta}` : `${pointsDelta}`}</span>
          )}
        </span>
      )}

      {/* Total points */}
      <div className="text-right shrink-0">
        <span className={`text-sm font-black ${rank === 1 ? 'text-[#c8102e]' : 'text-slate-600 dark:text-slate-300 '}`}>
          {totalPoints}
        </span>
        <span className="text-[9px] text-slate-400 dark:text-slate-500 block">pts</span>
      </div>

      {/* H2H quick action */}
      <H2HButton selfName={name} compact />
    </div>
    </Link>
  )
}
