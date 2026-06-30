'use client'
import { useMemo } from 'react'
import { scoreGroupMatch } from '@/lib/scoring'
import { getMatchKey, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import type { Match, PredictionsData } from '@/lib/types'

interface LiveStakesGridProps {
  match: Match
  predictions: PredictionsData
  participants: string[]
  ranks?: Record<string, number>
}

// Puntos por avance según las reglas oficiales (ver src/lib/scoring.ts).
const ADVANCE_POINTS: Partial<Record<string, number>> = {
  ROUND_OF_32: 5,
  ROUND_OF_16: 7,
  QUARTER_FINALS: 10,
}

export function LiveStakesGrid({ match, predictions, participants, ranks }: LiveStakesGridProps) {
  if (match.stage === 'GROUP_STAGE') {
    return <GroupStakes match={match} predictions={predictions} participants={participants} ranks={ranks} />
  }
  const advancePts = ADVANCE_POINTS[match.stage]
  if (advancePts) {
    return <KnockoutStakes match={match} predictions={predictions} participants={participants} ranks={ranks} advancePts={advancePts} />
  }
  // SF/Final/3rd se cobran por especiales, no por advance — no hay "en juego" aquí en este MVP.
  return null
}

/* -------------------------------------------------------------------------- */
/*  Grupos                                                                    */
/* -------------------------------------------------------------------------- */

interface GroupRow {
  name: string
  rank?: number
  pick: '1' | 'X' | '2'
  pred: string
  points: number
  reason: 'exact' | 'result' | 'miss' | 'pending' | 'knockout_correct' | 'r32_qualify'
}

function GroupStakes({ match, predictions, participants, ranks }: Required<Pick<LiveStakesGridProps, 'match' | 'predictions' | 'participants'>> & { ranks?: Record<string, number> }) {
  const rows = useMemo<GroupRow[]>(() => {
    const matchKey = getMatchKey(match.homeTeam.tla, match.awayTeam.tla)
    const home = match.score?.fullTime?.home ?? 0
    const away = match.score?.fullTime?.away ?? 0
    // Forzamos un Match "como si estuviera finalizado en este marcador" para que scoreGroupMatch
    // no devuelva pending.
    const snapshot: Match = {
      ...match,
      status: 'FINISHED',
      score: { ...match.score, fullTime: { home, away } },
    }
    const out: GroupRow[] = []
    for (const name of participants) {
      const pred = predictions[name]?.groupStage?.[matchKey]
      if (!pred) continue
      const { points, reason } = scoreGroupMatch(pred, snapshot)
      out.push({
        name,
        rank: ranks?.[name],
        pick: pred.pick === 'home' ? '1' : pred.pick === 'away' ? '2' : 'X',
        pred: `${pred.homeGoals}–${pred.awayGoals}`,
        points,
        reason: reason as GroupRow['reason'],
      })
    }
    return out.sort((a, b) => (b.points - a.points) || ((a.rank ?? Infinity) - (b.rank ?? Infinity)) || a.name.localeCompare(b.name))
  }, [match, predictions, participants, ranks])

  const homeName = TLA_TO_EXCEL_NAME[match.homeTeam.tla] ?? match.homeTeam.shortName
  const awayName = TLA_TO_EXCEL_NAME[match.awayTeam.tla] ?? match.awayTeam.shortName
  const home = match.score?.fullTime?.home ?? 0
  const away = match.score?.fullTime?.away ?? 0

  if (rows.length === 0) return null

  return (
    <div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400  mb-2">
        Si acaba <span className="font-black tabular-nums">{home}–{away}</span> ({homeName} {home > away ? 'gana' : away > home ? 'pierde' : 'empata'} {awayName}):
      </p>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800 overflow-hidden">
        {rows.map(r => <GroupRowView key={r.name} row={r} />)}
      </div>
    </div>
  )
}

function GroupRowView({ row }: { row: GroupRow }) {
  const bg = row.reason === 'exact' ? 'bg-green-50'
    : row.reason === 'result' ? 'bg-yellow-50'
    : row.reason === 'miss' ? 'bg-red-50'
    : 'bg-white dark:bg-slate-900'
  const badge = row.reason === 'exact' ? 'bg-green-100 text-green-700'
    : row.reason === 'result' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-500'
  const pickCls = row.pick === '1' ? 'bg-blue-100 text-blue-700'
    : row.pick === '2' ? 'bg-violet-100 text-violet-700'
    : 'bg-amber-100 text-amber-700'
  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${bg}`}>
      {row.rank && (
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 tabular-nums w-5 text-right shrink-0">
          {row.rank}º
        </span>
      )}
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{row.name}</span>
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${pickCls}`}>{row.pick}</span>
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400  tabular-nums">{row.pred}</span>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge}`}>
        {row.points > 0 ? `+${row.points}` : '0'} pts
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Eliminatorias                                                             */
/* -------------------------------------------------------------------------- */

interface KoRow {
  name: string
  rank?: number
  points: number
}

function KnockoutStakes({
  match, predictions, participants, ranks, advancePts,
}: Required<Pick<LiveStakesGridProps, 'match' | 'predictions' | 'participants'>> & { ranks?: Record<string, number>; advancePts: number }) {
  const homeTla = match.homeTeam.tla
  const awayTla = match.awayTeam.tla
  const homeName = TLA_TO_EXCEL_NAME[homeTla] ?? match.homeTeam.shortName
  const awayName = TLA_TO_EXCEL_NAME[awayTla] ?? match.awayTeam.shortName

  const compute = (winnerTla: string): KoRow[] =>
    participants.map(name => {
      const ko = predictions[name]?.knockout ?? {}
      const hit = Object.values(ko).some(p => p.round === match.stage && p.advancingTeamTla === winnerTla)
      return { name, rank: ranks?.[name], points: hit ? advancePts : 0 }
    }).sort((a, b) => (b.points - a.points) || ((a.rank ?? Infinity) - (b.rank ?? Infinity)) || a.name.localeCompare(b.name))

  const homeRows = useMemo(() => compute(homeTla), [match.stage, homeTla, predictions, participants, ranks, advancePts])
  const awayRows = useMemo(() => compute(awayTla), [match.stage, awayTla, predictions, participants, ranks, advancePts])

  return (
    <div className="grid grid-cols-2 gap-2">
      <KoColumn title={`Si gana ${homeName}`} rows={homeRows} accent="blue" />
      <KoColumn title={`Si gana ${awayName}`} rows={awayRows} accent="violet" />
    </div>
  )
}

function KoColumn({ title, rows, accent }: { title: string; rows: KoRow[]; accent: 'blue' | 'violet' }) {
  const accentBg = accent === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
  const rowAccentBg = accent === 'blue' ? 'bg-blue-50/40' : 'bg-violet-50/40'
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
      <p className={`text-[9px] font-black uppercase tracking-widest px-2 py-1.5 text-center ${accentBg}`}>
        {title}
      </p>
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {rows.map(r => (
          <div key={r.name} className={`flex items-center gap-1.5 px-2 py-1.5 ${r.points > 0 ? rowAccentBg : ''}`}>
            {r.rank && (
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 tabular-nums w-5 text-right shrink-0">
                {r.rank}º
              </span>
            )}
            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{r.name}</span>
            <span className={`text-[9px] font-bold tabular-nums ${r.points > 0 ? 'text-emerald-700' : 'text-slate-400 dark:text-slate-500'}`}>
              {r.points > 0 ? `+${r.points}` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
