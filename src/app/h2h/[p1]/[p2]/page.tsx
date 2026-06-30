'use client'
import { use, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { H2HRow, type H2HRowWinner } from '@/components/H2HRow'
import { scoreGroupMatch, calculateParticipantScore, deriveActualOutcomes } from '@/lib/scoring'
import { computeKnockoutJourney, type KnockoutBreakdown } from '@/lib/knockout-journey'
import { getMatchKey, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { useParticipantRanks } from '@/lib/use-participant-ranks'
import {
  LEFT_R32_SLOTS, LEFT_R16_SLOTS, LEFT_QF_SLOTS, LEFT_SF_SLOT,
  RIGHT_R32_SLOTS, RIGHT_R16_SLOTS, RIGHT_QF_SLOTS, RIGHT_SF_SLOT,
  FINAL_SLOT, THIRD_PLACE_SLOT,
} from '@/lib/wc-bracket'
import type { Match, ParticipantScore, PredictionsData } from '@/lib/types'
import predictionsRaw from '@/data/predictions.json'

const predictions = predictionsRaw as PredictionsData

type Tab = 'group' | 'ko' | 'specials'

// Slots oficiales en orden top-down, izquierda → derecha (igual que /cuadro).
const ALL_KO_SLOTS: string[] = [
  ...LEFT_R32_SLOTS, ...LEFT_R16_SLOTS, ...LEFT_QF_SLOTS, LEFT_SF_SLOT,
  FINAL_SLOT,
  RIGHT_SF_SLOT, ...RIGHT_QF_SLOTS, ...RIGHT_R16_SLOTS, ...RIGHT_R32_SLOTS,
  THIRD_PLACE_SLOT,
]

const R32_ALL = new Set<string>([...LEFT_R32_SLOTS, ...RIGHT_R32_SLOTS])
const R16_ALL = new Set<string>([...LEFT_R16_SLOTS, ...RIGHT_R16_SLOTS])
const QF_ALL  = new Set<string>([...LEFT_QF_SLOTS, ...RIGHT_QF_SLOTS])

function stageLabel(slot: string): string {
  if (R32_ALL.has(slot)) return 'R32'
  if (R16_ALL.has(slot)) return 'Octavos'
  if (QF_ALL.has(slot))  return 'Cuartos'
  if (slot === LEFT_SF_SLOT || slot === RIGHT_SF_SLOT) return 'Semis'
  if (slot === FINAL_SLOT) return 'Final'
  if (slot === THIRD_PLACE_SLOT) return '3er puesto'
  return ''
}

function predLabel(homeTla: string, awayTla: string, advancing: string): string {
  const h = TLA_TO_EXCEL_NAME[homeTla] ?? homeTla
  const a = TLA_TO_EXCEL_NAME[awayTla] ?? awayTla
  const w = advancing === homeTla ? h : a
  return `${h} − ${a} · ${w}`
}

// Pichichi/balón: top-3 (oro/plata/bronce) → texto para comparar y mostrar.
function top3Str(t: { first: string; second: string; third: string }): string {
  return [t.first, t.second, t.third].filter(Boolean).join(' · ')
}

export default function H2HPage({ params }: { params: Promise<{ p1: string; p2: string }> }) {
  const { p1: p1Raw, p2: p2Raw } = use(params)
  const p1 = decodeURIComponent(p1Raw)
  const p2 = decodeURIComponent(p2Raw)
  const router = useRouter()
  const ranks = useParticipantRanks()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('group')
  const [onlyDivergent, setOnlyDivergent] = useState(false)

  useEffect(() => {
    fetch('/api/matches', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setMatches(d.matches ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const preds1 = predictions[p1]
  const preds2 = predictions[p2]

  const outcomes = useMemo(() => deriveActualOutcomes(matches), [matches])
  const s1 = useMemo(
    () => preds1 ? calculateParticipantScore(p1, predictions, matches, outcomes) : null,
    [p1, preds1, matches, outcomes],
  )
  const s2 = useMemo(
    () => preds2 ? calculateParticipantScore(p2, predictions, matches, outcomes) : null,
    [p2, preds2, matches, outcomes],
  )
  // Journeys para detectar qué puntos EN JUEGO comparten ambos (mueven el marcador
  // de los dos por igual y por tanto no abren brecha en el duelo).
  const j1 = useMemo(() => preds1 ? computeKnockoutJourney(preds1, matches, outcomes) : null, [preds1, matches, outcomes])
  const j2 = useMemo(() => preds2 ? computeKnockoutJourney(preds2, matches, outcomes) : null, [preds2, matches, outcomes])

  if (!preds1 || !preds2) {
    return (
      <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
        Uno de los participantes no existe.{' '}
        <Link href="/ranking" className="underline text-[#c8102e]">Volver al ranking</Link>
      </div>
    )
  }

  // ---- Group rows ----
  const groupRows = matches
    .filter(m => m.stage === 'GROUP_STAGE')
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .map(m => {
      const k = getMatchKey(m.homeTeam.tla, m.awayTeam.tla)
      const pred1 = preds1.groupStage[k]
      const pred2 = preds2.groupStage[k]
      if (!pred1 && !pred2) return null
      const r1 = pred1 ? scoreGroupMatch(pred1, m) : { points: 0, reason: 'pending' as const }
      const r2 = pred2 ? scoreGroupMatch(pred2, m) : { points: 0, reason: 'pending' as const }
      const isPlayed = m.status === 'FINISHED' || m.status === 'IN_PLAY' || m.status === 'PAUSED'
      const actual = isPlayed
        ? `${m.score.fullTime.home ?? 0}–${m.score.fullTime.away ?? 0}`
        : 'Pendiente'
      const divergent = !pred1 || !pred2 || pred1.homeGoals !== pred2.homeGoals || pred1.awayGoals !== pred2.awayGoals
      let winner: H2HRowWinner = 'pending'
      if (isPlayed) {
        if (r1.points > r2.points) winner = 'p1'
        else if (r2.points > r1.points) winner = 'p2'
        else winner = 'draw'
      }
      return {
        key: `g-${m.id}`,
        homeTla: m.homeTeam.tla, awayTla: m.awayTeam.tla,
        actual,
        p1Pred: pred1 ? `${pred1.homeGoals}–${pred1.awayGoals}` : '—',
        p2Pred: pred2 ? `${pred2.homeGoals}–${pred2.awayGoals}` : '—',
        p1Points: isPlayed ? r1.points : undefined,
        p2Points: isPlayed ? r2.points : undefined,
        winner, divergent,
      }
    })
    .filter(Boolean) as Array<{
      key: string; homeTla: string; awayTla: string; actual: string;
      p1Pred: string; p2Pred: string; p1Points?: number; p2Points?: number;
      winner: H2HRowWinner; divergent: boolean;
    }>

  // ---- KO rows (by official slot order) ----
  const koRows = ALL_KO_SLOTS.map(slot => {
    const k1 = preds1.knockout[slot]
    const k2 = preds2.knockout[slot]
    if (!k1 && !k2) return null
    const divergent = !k1 || !k2
      || k1.homeTla !== k2.homeTla
      || k1.awayTla !== k2.awayTla
      || k1.advancingTeamTla !== k2.advancingTeamTla
    return {
      key: `k-${slot}`,
      slotLabel: `${slot} · ${stageLabel(slot)}`,
      p1Pred: k1 ? predLabel(k1.homeTla, k1.awayTla, k1.advancingTeamTla) : null,
      p2Pred: k2 ? predLabel(k2.homeTla, k2.awayTla, k2.advancingTeamTla) : null,
      winner: 'pending' as H2HRowWinner,    // sin resultados de KO aún
      divergent,
    }
  }).filter(Boolean) as Array<{
    key: string; slotLabel: string; p1Pred: string | null; p2Pred: string | null;
    winner: H2HRowWinner; divergent: boolean;
  }>

  // ---- Specials rows ----
  const specials: Array<{ key: string; label: string; v1: string; v2: string }> = [
    { key: 'champ',  label: 'Campeón',     v1: preds1.specials.champion,  v2: preds2.specials.champion },
    { key: 'runner', label: 'Subcampeón',  v1: preds1.specials.runnerUp,  v2: preds2.specials.runnerUp },
    { key: 'third',  label: '3er puesto',  v1: preds1.specials.thirdPlace, v2: preds2.specials.thirdPlace },
    { key: 'pich',   label: 'Pichichi',    v1: top3Str(preds1.specials.goldenBoot), v2: top3Str(preds2.specials.goldenBoot) },
    { key: 'ball',   label: 'Balón de Oro',v1: top3Str(preds1.specials.goldenBall), v2: top3Str(preds2.specials.goldenBall) },
  ]

  // ---- Counters (sólo cuentan partidos con ganador no-pending) ----
  const winsP1 = groupRows.filter(r => r.winner === 'p1').length
  const winsP2 = groupRows.filter(r => r.winner === 'p2').length
  const draws  = groupRows.filter(r => r.winner === 'draw').length
  const lead = (s1?.totalPoints ?? 0) - (s2?.totalPoints ?? 0)

  const visibleGroup = onlyDivergent ? groupRows.filter(r => r.divergent) : groupRows
  const visibleKO    = onlyDivergent ? koRows.filter(r => r.divergent)    : koRows
  const visibleSpec  = onlyDivergent
    ? specials.filter(r => r.v1 !== r.v2)
    : specials

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-slate-400 dark:text-slate-500 text-lg leading-none">←</button>
        <div className="flex-1 grid grid-cols-3 items-center text-center gap-1">
          <ParticipantHeader name={p1} rank={ranks[p1]} points={s1?.totalPoints ?? 0} side="left" />
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            vs
            <div className={`text-xs ${lead === 0 ? 'text-slate-400 dark:text-slate-500' : lead > 0 ? 'text-blue-600' : 'text-violet-600'}`}>
              {lead === 0 ? 'igualados' : lead > 0 ? `+${lead}` : `${lead}`}
            </div>
          </div>
          <ParticipantHeader name={p2} rank={ranks[p2]} points={s2?.totalPoints ?? 0} side="right" />
        </div>
      </div>

      {/* Win counter — sólo partidos con resultado */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm px-3 py-2 flex items-center justify-center gap-3 text-xs font-black">
        <span className="text-blue-600 tabular-nums">{winsP1}</span>
        <span className="text-slate-300 dark:text-slate-600">−</span>
        <span className="text-slate-400 dark:text-slate-500 tabular-nums">{draws}</span>
        <span className="text-slate-300 dark:text-slate-600">−</span>
        <span className="text-violet-600 tabular-nums">{winsP2}</span>
        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold ml-1">en partidos jugados</span>
      </div>

      {/* ¿Aún hay opciones? — puntos posibles de aquí al final */}
      {!loading && <ChancesPanel p1={p1} p2={p2} s1={s1} s2={s2} j1={j1} j2={j2} />}

      {/* Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          {(['group', 'ko', 'specials'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                tab === t ? 'bg-[#c8102e] text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400  shadow-sm'
              }`}
            >
              {t === 'group' ? 'Grupo' : t === 'ko' ? 'Eliminatorias' : 'Especiales'}
            </button>
          ))}
        </div>
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400  flex items-center gap-1.5 shrink-0">
          <input
            type="checkbox"
            checked={onlyDivergent}
            onChange={e => setOnlyDivergent(e.target.checked)}
            className="accent-[#c8102e]"
          />
          Solo divergencias
        </label>
      </div>

      {loading && <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">Cargando…</div>}

      {/* Content */}
      {!loading && tab === 'group' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800 overflow-hidden">
          {visibleGroup.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
              {onlyDivergent ? 'No hay divergencias en grupo.' : 'No hay predicciones de grupo.'}
            </p>
          ) : (
            visibleGroup.map(r => (
              <H2HRow
                key={r.key}
                homeTla={r.homeTla}
                awayTla={r.awayTla}
                actualResult={r.actual}
                p1Pred={r.p1Pred}
                p2Pred={r.p2Pred}
                p1Points={r.p1Points}
                p2Points={r.p2Points}
                winner={r.winner}
                divergent={r.divergent}
              />
            ))
          )}
        </div>
      )}

      {!loading && tab === 'ko' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800 overflow-hidden">
          {visibleKO.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
              {onlyDivergent ? 'No hay divergencias en eliminatorias.' : 'No hay predicciones de KO.'}
            </p>
          ) : (
            visibleKO.map(r => (
              <H2HRow
                key={r.key}
                slotLabel={r.slotLabel}
                p1Pred={r.p1Pred}
                p2Pred={r.p2Pred}
                winner={r.winner}
                divergent={r.divergent}
              />
            ))
          )}
        </div>
      )}

      {!loading && tab === 'specials' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800 overflow-hidden">
          {visibleSpec.map(r => {
            const divergent = r.v1 !== r.v2
            const winner: H2HRowWinner = 'pending'
            return (
              <H2HRow
                key={r.key}
                slotLabel={r.label}
                p1Pred={r.v1 || '—'}
                p2Pred={r.v2 || '—'}
                winner={winner}
                divergent={divergent}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// Puntos EN JUEGO que ambos predijeron igual (mismo equipo, misma ronda/especial).
// Caerán —o fallarán— para los dos a la vez, así que no abren brecha en el duelo.
function inPlayKeys(j: KnockoutBreakdown | null): Map<string, number> {
  const m = new Map<string, number>()
  if (!j) return m
  for (const t of j.teams) for (const it of t.items) {
    if (it.state !== 'inplay') continue
    const key = it.source === 'advance' ? `adv:${it.round}:${t.tla}` : `${it.source}:${t.tla}`
    m.set(key, it.points)
  }
  return m
}
function sharedInPlay(j1: KnockoutBreakdown | null, j2: KnockoutBreakdown | null): number {
  const a = inPlayKeys(j1)
  const b = inPlayKeys(j2)
  let s = 0
  for (const [k, pts] of a) if (b.has(k)) s += pts
  return s
}

function ChancesPanel({ p1, p2, s1, s2, j1, j2 }: {
  p1: string; p2: string
  s1: ParticipantScore | null; s2: ParticipantScore | null
  j1: KnockoutBreakdown | null; j2: KnockoutBreakdown | null
}) {
  const total1 = s1?.totalPoints ?? 0
  const total2 = s2?.totalPoints ?? 0
  const inPlay1 = s1?.inPlayKnockoutPoints ?? 0
  const inPlay2 = s2?.inPlayKnockoutPoints ?? 0
  const max1 = total1 + inPlay1
  const max2 = total2 + inPlay2
  const shared = sharedInPlay(j1, j2)
  const nothingLeft = inPlay1 === 0 && inPlay2 === 0

  // El de delante por puntos actuales. El de atrás solo puede adelantar con lo que
  // NO comparten: cuando logra su techo, el de delante se lleva los compartidos.
  const leaderIs1 = total1 >= total2
  const leaderName = leaderIs1 ? p1 : p2
  const trailerName = leaderIs1 ? p2 : p1
  const leaderTotal = leaderIs1 ? total1 : total2
  const trailerTotal = leaderIs1 ? total2 : total1
  const trailerInPlay = leaderIs1 ? inPlay2 : inPlay1
  // Máximo que el de atrás puede ponerse por encima del de delante:
  // (su techo) − (lo del de delante asegurado + lo compartido que también se llevaría).
  const swing = (trailerTotal + trailerInPlay) - (leaderTotal + shared)

  let text: string
  let tone: 'open' | 'tight' | 'closed'
  if (total1 === total2 && nothingLeft) {
    text = 'Empate definitivo — no quedan puntos en juego'; tone = 'closed'
  } else if (nothingLeft) {
    text = `${leaderName} gana el duelo — no quedan puntos en juego`; tone = 'closed'
  } else if (swing < 0) {
    text = `🔒 ${leaderName} tiene el duelo ganado · ${trailerName} no llega ni acertándolo todo (colchón de ${-swing})`; tone = 'closed'
  } else if (swing === 0) {
    text = `${trailerName} como mucho empata a ${leaderName}`; tone = 'tight'
  } else {
    text = `🔥 Aún hay opciones · ${trailerName} puede ponerse hasta +${swing} sobre ${leaderName}`; tone = 'open'
  }

  const toneCls = tone === 'open'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    : tone === 'tight'
      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm px-3 py-2.5">
      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
        Posibles de aquí al final
      </p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <PossibleSide name={p1} inPlay={inPlay1} max={max1} color="text-blue-700" />
        <PossibleSide name={p2} inPlay={inPlay2} max={max2} color="text-violet-700" />
      </div>
      {shared > 0 && (
        <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 mb-1.5">
          Comparten {shared} pts en juego (mueven a los dos por igual)
        </p>
      )}
      <p className={`text-[10px] font-bold text-center rounded-lg px-2 py-1.5 ${toneCls}`}>{text}</p>
    </div>
  )
}

function PossibleSide({ name, inPlay, max, color }: { name: string; inPlay: number; max: number; color: string }) {
  return (
    <div className="text-center min-w-0">
      <p className={`text-[10px] font-black truncate ${color}`}>{name}</p>
      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tabular-nums">máx {max}</p>
      <p className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">+{inPlay} en juego</p>
    </div>
  )
}

function ParticipantHeader({ name, rank, points, side }: { name: string; rank?: number; points: number; side: 'left' | 'right' }) {
  const color = side === 'left' ? 'text-blue-700' : 'text-violet-700'
  return (
    <Link href={`/predicciones/${encodeURIComponent(name)}`} className="block min-w-0">
      <div className="flex items-center gap-1 justify-center">
        {rank && (
          <span className={`text-[10px] font-black tabular-nums ${color} bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-full`}>
            {rank}º
          </span>
        )}
        <p className={`text-xs font-black ${color} truncate`}>{name}</p>
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400  tabular-nums">{points} pts</p>
    </Link>
  )
}
