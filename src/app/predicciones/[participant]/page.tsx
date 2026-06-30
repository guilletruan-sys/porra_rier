'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getFlagUrl, getMatchKey, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { ParticipantStats } from '@/components/ParticipantStats'
import { KnockoutJourneyList } from '@/components/KnockoutJourneyList'
import { scoreGroupMatch, calculateParticipantScore } from '@/lib/scoring'
import { useParticipantRanks } from '@/lib/use-participant-ranks'
import type { Match, PredictionsData } from '@/lib/types'
import participantsList from '@/data/participants.json'
import predictionsRaw from '@/data/predictions.json'

const predictions = predictionsRaw as PredictionsData

const REASON_BG: Record<string, string> = {
  exact: 'bg-green-50',
  result: 'bg-yellow-50',
  miss: 'bg-red-50',
  knockout_correct: 'bg-green-50',
}
const REASON_BADGE: Record<string, string> = {
  exact: 'bg-green-100 text-green-700',
  result: 'bg-yellow-100 text-yellow-700',
  miss: 'bg-red-100 text-red-500',
  knockout_correct: 'bg-green-100 text-green-700',
}

export default function ParticipantPage({ params }: { params: Promise<{ participant: string }> }) {
  const { participant } = use(params)
  const name = decodeURIComponent(participant)
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const ranks = useParticipantRanks()
  const myRank = ranks[name]

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => { setMatches(d.matches ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const preds = predictions[name]
  if (!preds) {
    return (
      <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
        Participante no encontrado
      </div>
    )
  }

  const score = calculateParticipantScore(name, predictions, matches)

  // Group stage: group matches by group name
  const groupMatches = matches.filter(m => m.stage === 'GROUP_STAGE')
  const matchesByGroup = new Map<string, Match[]>()
  for (const m of groupMatches) {
    const g = m.group ?? 'OTHER'
    if (!matchesByGroup.has(g)) matchesByGroup.set(g, [])
    matchesByGroup.get(g)!.push(m)
  }
  const sortedGroups = [...matchesByGroup.keys()].sort()

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 dark:text-slate-500 text-lg leading-none">←</button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            {myRank && (
              <span className="text-[10px] font-black text-[#c8102e] bg-red-50 px-1.5 py-0.5 rounded-full tabular-nums">
                {myRank}º
              </span>
            )}
            <span className="truncate">{name}</span>
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{score.totalPoints} pts totales · {score.groupStagePoints} grupos · {score.knockoutPoints} KO</p>
        </div>
        <div className="relative shrink-0">
          <select
            aria-label="Comparar con otro participante"
            value=""
            onChange={e => {
              const other = e.target.value
              if (other) router.push(`/h2h/${encodeURIComponent(name)}/${encodeURIComponent(other)}`)
            }}
            className="appearance-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[10px] font-bold pl-2 pr-6 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c8102e]/40"
          >
            <option value="">vs…</option>
            {(participantsList as string[])
              .filter(p => p !== name)
              .sort((a, b) => (ranks[a] ?? Infinity) - (ranks[b] ?? Infinity) || a.localeCompare(b))
              .map(p => (
                <option key={p} value={p}>
                  {ranks[p] ? `${ranks[p]}º ${p}` : p}
                </option>
              ))}
          </select>
          <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {loading && <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">Cargando partidos…</div>}

      {!loading && <ParticipantStats preds={preds} matches={matches} />}

      {/* Group stage — colapsable para no ocupar toda la pantalla */}
      {!loading && sortedGroups.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setGroupsOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 py-1"
            aria-expanded={groupsOpen}
          >
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Fase de grupos · {score.groupStagePoints} pts
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500">
              {groupsOpen ? 'ocultar' : 'ver'}
              <svg className={`transition-transform ${groupsOpen ? 'rotate-180' : ''}`} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          {groupsOpen && (
            <div className="space-y-4 mt-2">
              {sortedGroups.map(groupKey => {
        const gMatches = matchesByGroup.get(groupKey)!
        const letter = groupKey.replace('GROUP_', '')
        return (
          <section key={groupKey}>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Grupo {letter}
            </p>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800">
              {gMatches.map(m => {
                const key = getMatchKey(m.homeTeam.tla, m.awayTeam.tla)
                const pred = preds.groupStage[key]
                if (!pred) return null
                const { points, reason } = scoreGroupMatch(pred, m)
                const isFinished = m.status === 'FINISHED' || m.status === 'IN_PLAY'
                const homeFlagUrl = getFlagUrl(m.homeTeam.tla)
                const awayFlagUrl = getFlagUrl(m.awayTeam.tla)
                return (
                  <div key={m.id} className={`flex items-center gap-2 px-3 py-2.5 ${isFinished ? (REASON_BG[reason] ?? '') : ''}`}>
                    {homeFlagUrl && <Image src={homeFlagUrl} alt="" width={14} height={10} unoptimized className="rounded-sm shrink-0" />}
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">
                      {m.homeTeam.shortName} – {m.awayTeam.shortName}
                    </span>
                    {awayFlagUrl && <Image src={awayFlagUrl} alt="" width={14} height={10} unoptimized className="rounded-sm shrink-0" />}
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400  ml-1">{pred.homeGoals}–{pred.awayGoals}</span>
                    {isFinished && (
                      <>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">
                          ({m.score.fullTime.home ?? 0}–{m.score.fullTime.away ?? 0})
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${REASON_BADGE[reason] ?? 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500'}`}>
                          {points > 0 ? `+${points}` : '0'}
                        </span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Knockouts — vista "por equipo + en juego" */}
      {!loading && <KnockoutJourneyList preds={preds} matches={matches} />}

      {/* Specials */}
      <section>
        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Especiales</p>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800">
          {[
            { label: 'Campeón', value: TLA_TO_EXCEL_NAME[preds.specials.champion] ?? preds.specials.champion },
            { label: 'Subcampeón', value: TLA_TO_EXCEL_NAME[preds.specials.runnerUp] ?? preds.specials.runnerUp },
            { label: '3er puesto', value: TLA_TO_EXCEL_NAME[preds.specials.thirdPlace] ?? preds.specials.thirdPlace },
            { label: 'Pichichi', value: [preds.specials.goldenBoot.first, preds.specials.goldenBoot.second, preds.specials.goldenBoot.third].filter(Boolean).join(' · ') },
            { label: 'Balón de Oro', value: [preds.specials.goldenBall.first, preds.specials.goldenBall.second, preds.specials.goldenBall.third].filter(Boolean).join(' · ') },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 w-20 shrink-0">{label}</span>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{value || '—'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
