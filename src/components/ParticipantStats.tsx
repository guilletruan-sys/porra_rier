'use client'
import type { Match, ParticipantPredictions } from '@/lib/types'
import { getMatchKey } from '@/lib/team-map'
import { scoreGroupMatch } from '@/lib/scoring'

interface ParticipantStatsProps {
  preds: ParticipantPredictions
  matches: Match[]
}

interface Stats {
  finishedGroupMatches: number
  exact: number
  result: number
  miss: number
  pickHome: number
  pickDraw: number
  pickAway: number
  bestDayPoints: number
  bestDayLabel: string | null
  currentStreak: number  // consecutive most recent finished group matches with points > 0
}

function dayKey(utcDate: string): string {
  const d = new Date(utcDate)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }) // YYYY-MM-DD
}

function dayLabel(key: string): string {
  if (!key) return ''
  return new Date(key + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Madrid',
  })
}

function compute(preds: ParticipantPredictions, matches: Match[]): Stats {
  const finished = matches
    .filter(m => m.status === 'FINISHED' && m.stage === 'GROUP_STAGE')
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))

  const s: Stats = {
    finishedGroupMatches: 0,
    exact: 0, result: 0, miss: 0,
    pickHome: 0, pickDraw: 0, pickAway: 0,
    bestDayPoints: 0, bestDayLabel: null,
    currentStreak: 0,
  }

  for (const pred of Object.values(preds.groupStage)) {
    if (pred.pick === 'home') s.pickHome++
    else if (pred.pick === 'draw') s.pickDraw++
    else if (pred.pick === 'away') s.pickAway++
  }

  // Per-day aggregation + per-match chronological history (for streak)
  const dayTotals = new Map<string, number>()
  const history: number[] = []
  for (const m of finished) {
    const key = getMatchKey(m.homeTeam.tla, m.awayTeam.tla)
    const pred = preds.groupStage[key]
    if (!pred) continue
    const { points, reason } = scoreGroupMatch(pred, m)
    if (reason === 'pending') continue
    s.finishedGroupMatches++
    if (reason === 'exact') s.exact++
    else if (reason === 'result') s.result++
    else s.miss++
    history.push(points)
    const dKey = dayKey(m.utcDate)
    dayTotals.set(dKey, (dayTotals.get(dKey) ?? 0) + points)
  }

  // Best day = highest day total. Tie-break: most recent day.
  for (const [k, v] of dayTotals) {
    if (v > s.bestDayPoints || (v === s.bestDayPoints && (s.bestDayLabel == null || k > (s.bestDayLabel ?? '')))) {
      s.bestDayPoints = v
      s.bestDayLabel = k
    }
  }
  if (s.bestDayLabel) s.bestDayLabel = dayLabel(s.bestDayLabel)

  // Current streak: walk backwards from the latest finished match while we kept scoring
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] > 0) s.currentStreak++
    else break
  }

  return s
}

export function ParticipantStats({ preds, matches }: ParticipantStatsProps) {
  const s = compute(preds, matches)
  const totalGuesses = s.exact + s.result + s.miss
  if (totalGuesses === 0) return null

  const hitPct = Math.round(((s.exact + s.result) / totalGuesses) * 100)
  const totalPicks = s.pickHome + s.pickDraw + s.pickAway
  const pct = (n: number) => totalPicks ? Math.round((n / totalPicks) * 100) : 0

  return (
    <section>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Stats</p>

      {/* Top row: hit % + breakdown */}
      <div className="bg-white rounded-xl shadow-sm px-3 py-3 mb-2 grid grid-cols-4 gap-2 text-center">
        <Stat label="% acierto" value={`${hitPct}%`} highlight />
        <Stat label="Exactos" value={s.exact} colorClass="text-green-600" />
        <Stat label="Signo" value={s.result} colorClass="text-yellow-600" />
        <Stat label="Fallos" value={s.miss} colorClass="text-red-500" />
      </div>

      {/* 1X2 tendency bar */}
      <div className="bg-white rounded-xl shadow-sm px-3 py-3 mb-2">
        <p className="text-[10px] font-bold text-slate-500 mb-2">Tu tendencia 1X2 (de {totalPicks} predicciones)</p>
        {totalPicks > 0 && (
          <>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-2">
              {s.pickHome > 0 && <div className="bg-blue-400" style={{ width: `${(s.pickHome / totalPicks) * 100}%` }} />}
              {s.pickDraw > 0 && <div className="bg-amber-400" style={{ width: `${(s.pickDraw / totalPicks) * 100}%` }} />}
              {s.pickAway > 0 && <div className="bg-violet-400" style={{ width: `${(s.pickAway / totalPicks) * 100}%` }} />}
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-blue-700">1 · {pct(s.pickHome)}% ({s.pickHome})</span>
              <span className="text-amber-700">X · {pct(s.pickDraw)}% ({s.pickDraw})</span>
              <span className="text-violet-700">2 · {pct(s.pickAway)}% ({s.pickAway})</span>
            </div>
          </>
        )}
      </div>

      {/* Best day + streak */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl shadow-sm px-3 py-3 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Mejor día</p>
          <p className="text-lg font-black text-[#c8102e] mt-1">+{s.bestDayPoints}</p>
          {s.bestDayLabel && <p className="text-[10px] text-slate-500 truncate mt-0.5 capitalize">{s.bestDayLabel}</p>}
        </div>
        <div className="bg-white rounded-xl shadow-sm px-3 py-3 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Racha actual</p>
          <p className="text-lg font-black text-slate-800 mt-1">
            {s.currentStreak} <span className="text-xs font-bold text-slate-400">seguidos</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {s.currentStreak === 0 ? 'sin puntos en el último' : 'partidos con puntos'}
          </p>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, highlight, colorClass }: {
  label: string
  value: string | number
  highlight?: boolean
  colorClass?: string
}) {
  return (
    <div>
      <p className={`text-base font-black tabular-nums ${highlight ? 'text-[#c8102e]' : colorClass ?? 'text-slate-800'}`}>{value}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}
