'use client'
import Image from 'next/image'
import { getFlagUrl, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import { computeMatchStakes, type StakeKind, type StakeBeneficiary } from '@/lib/knockout-journey'
import participants from '@/data/participants.json'
import predictionsRaw from '@/data/predictions.json'
import type { Match, PredictionsData } from '@/lib/types'

const predictions = predictionsRaw as PredictionsData

type SideResult = 'pending' | 'happened' | 'didnt'

function winnerSide(m: Match): 'home' | 'away' | null {
  if (m.status !== 'FINISHED') return null
  if (m.score?.winner === 'HOME_TEAM') return 'home'
  if (m.score?.winner === 'AWAY_TEAM') return 'away'
  return null
}

/**
 * "Quién puntúa según el resultado" para un cruce de eliminatorias. Si el partido
 * ya terminó, resalta el lado que ocurrió (quién sumó) y atenúa el otro. Devuelve
 * solo el contenido — el contenedor (padding/borde) lo pone quien lo use.
 */
export function MatchStakes({ match }: { match: Match }) {
  if (match.stage === 'GROUP_STAGE') return null
  const stakes = computeMatchStakes(match, predictions, participants as string[])
  const ws = winnerSide(match)
  const homeName = TLA_TO_EXCEL_NAME[match.homeTeam?.tla ?? ''] ?? match.homeTeam?.shortName ?? '—'
  const awayName = TLA_TO_EXCEL_NAME[match.awayTeam?.tla ?? ''] ?? match.awayTeam?.shortName ?? '—'
  const sideResult = (side: 'home' | 'away'): SideResult =>
    ws === null ? 'pending' : ws === side ? 'happened' : 'didnt'

  return (
    <div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
        Quién puntúa según el resultado
      </p>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3">
        {stakes.kind === 'advance' && `Pasa de ronda · +${stakes.advancePoints} para quien lo acertó`}
        {stakes.kind === 'final' && 'Final · campeón +30 · subcampeón +20'}
        {stakes.kind === 'third' && '3er puesto · +15'}
        {stakes.kind === 'semi' && 'La semifinal no da puntos directos — esto es lo que quedaría a un paso, en la final'}
      </p>
      <div className="space-y-2">
        <OutcomeBlock teamName={homeName} flag={getFlagUrl(match.homeTeam?.tla ?? '')} data={stakes.home} kind={stakes.kind} result={sideResult('home')} />
        <OutcomeBlock teamName={awayName} flag={getFlagUrl(match.awayTeam?.tla ?? '')} data={stakes.away} kind={stakes.kind} result={sideResult('away')} />
      </div>
    </div>
  )
}

function OutcomeBlock({ teamName, flag, data, kind, result }: {
  teamName: string
  flag: string | null
  data: { tla: string; beneficiaries: StakeBeneficiary[] }
  kind: StakeKind
  result: SideResult
}) {
  const verb = kind === 'semi' ? 'Si llega a la final' : 'Si gana'
  const ptsColor = kind === 'semi' ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
  const n = data.beneficiaries.length
  const dim = result === 'didnt'
  return (
    <div className={`rounded-xl px-3 py-2.5 ${
      result === 'happened'
        ? 'bg-green-50 dark:bg-green-950/30 ring-1 ring-green-200 dark:ring-green-900'
        : 'bg-slate-50 dark:bg-slate-950/40'
    } ${dim ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {flag
          ? <Image src={flag} alt="" width={18} height={13} unoptimized className="rounded-sm" />
          : <IconFlagFallback width={18} height={13} />}
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{verb} {teamName}</span>
        {result === 'happened' && <span className="text-[8px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider">✓ pasó</span>}
        <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-auto tabular-nums">
          {n} {n === 1 ? 'persona' : 'personas'}
        </span>
      </div>
      {n === 0 ? (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Nadie suma con este resultado</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {data.beneficiaries.map((b, i) => (
            <span
              key={`${b.name}-${i}`}
              className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full pl-2 pr-1.5 py-0.5"
            >
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{b.name}</span>
              {b.label && <span className="text-[8px] text-slate-400 dark:text-slate-500">{b.label}</span>}
              <span className={`text-[9px] font-black tabular-nums ${ptsColor}`}>+{b.points}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
