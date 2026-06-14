'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getFlagUrl, getMatchKey, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { IconCheck } from '@/components/icons'
import { ParticipantStats } from '@/components/ParticipantStats'
import { PremiumGate } from '@/components/PremiumGate'
import { useLite } from '@/contexts/LiteContext'
import { useIdentity } from '@/contexts/IdentityContext'
import { scoreGroupMatch, calculateParticipantScore } from '@/lib/scoring'
import type { Match, PredictionsData } from '@/lib/types'
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
  const { isPremium, ready: liteReady } = useLite()
  const { name: myName, ready: idReady } = useIdentity()
  const isOwnProfile = myName != null && myName === name

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => { setMatches(d.matches ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const preds = predictions[name]
  if (!preds) {
    return (
      <div className="p-4 text-center text-sm text-slate-400">
        Participante no encontrado
      </div>
    )
  }

  // LITE mode: only your own profile is free; others require Pro
  if (liteReady && idReady && !isPremium && !isOwnProfile) {
    return (
      <div className="p-3">
        <button
          onClick={() => router.back()}
          className="text-[11px] text-slate-400 mb-2 flex items-center gap-1 hover:text-slate-700"
        >
          ← Volver
        </button>
        <PremiumGate
          mode="replace"
          feature={`las predicciones de ${name}`}
          title={`👀 Predicciones de ${name}`}
          description="Mejora a Pro para ver las predicciones de los demás participantes, no solo las tuyas."
        >
          <div />
        </PremiumGate>
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

  // Predictions are stored as "who advances FROM round X".
  // We display them as "team reaches round X+1" (the round they're now in).
  const ROUND_LABEL: Record<string, string> = {
    ROUND_OF_32: 'Octavos',       // won R32 → plays octavos
    ROUND_OF_16: 'Cuartos',       // won octavos → plays cuartos
    QUARTER_FINALS: 'Semis',      // won cuartos → plays semis
    SEMI_FINALS: 'Final',         // won semis → plays final
    THIRD_PLACE: 'Tercero',       // won 3rd-place match
    FINAL: 'Campeón',             // won final
  }
  const ROUND_ORDER = ['ROUND_OF_32','ROUND_OF_16','QUARTER_FINALS','SEMI_FINALS','THIRD_PLACE','FINAL']
  const knockoutByRound = new Map<string, { key: string; tla: string }[]>()
  for (const [key, pred] of Object.entries(preds.knockout)) {
    const r = pred.round ?? 'ROUND_OF_32'
    if (!knockoutByRound.has(r)) knockoutByRound.set(r, [])
    knockoutByRound.get(r)!.push({ key, tla: pred.advancingTeamTla })
  }

  // R32 qualifiers — the 32 teams predicted to come out of the groups.
  // Built from every R32 matchKey (both home and away). Deduplicated.
  const r32Qualifiers: string[] = []
  const seen = new Set<string>()
  for (const [key, pred] of Object.entries(preds.knockout)) {
    if (pred.round !== 'ROUND_OF_32') continue
    for (const t of key.split('_')) {
      if (!seen.has(t)) { seen.add(t); r32Qualifiers.push(t) }
    }
  }

  // R32 qualifier flags — derived from the breakdown built by scoring.ts
  const r32QualifyTlas = new Set(
    score.breakdown.filter(b => b.reason === 'r32_qualify').map(b => b.matchKey.replace('r32_qualify_', ''))
  )
  // Per-round actual winners — for any FINISHED knockout match, the TLA of the
  // team that actually advanced. Lets us mark a prediction with ✓ only when
  // the predicted team really won its match in that round (independent of
  // whether the participant earned points for it — useful for SF/3rd/Final
  // where no advancement points are awarded but the ✓ is still informative).
  const advancedByRound = new Map<string, Set<string>>()
  for (const m of matches) {
    if (m.status !== 'FINISHED' || m.stage === 'GROUP_STAGE') continue
    const winnerTla = m.score.winner === 'HOME_TEAM' ? m.homeTeam.tla
      : m.score.winner === 'AWAY_TEAM' ? m.awayTeam.tla : null
    if (!winnerTla) continue
    if (!advancedByRound.has(m.stage)) advancedByRound.set(m.stage, new Set())
    advancedByRound.get(m.stage)!.add(winnerTla)
  }

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 text-lg leading-none">←</button>
        <div>
          <h1 className="text-sm font-black text-slate-800">{name}</h1>
          <p className="text-[10px] text-slate-400">{score.totalPoints} pts totales · {score.groupStagePoints} grupos · {score.knockoutPoints} KO</p>
        </div>
      </div>

      {loading && <div className="text-center text-sm text-slate-400 py-4">Cargando partidos…</div>}

      {!loading && (
        <PremiumGate
          mode="replace"
          feature="las stats personales"
          title="📊 Tus estadísticas"
          description="% de acierto, tendencia 1X2, mejor día, racha actual"
          compact
        >
          <ParticipantStats preds={preds} matches={matches} />
        </PremiumGate>
      )}

      {/* Group stage — first group free in lite mode, the rest are Pro */}
      {(() => {
        const renderGroup = (groupKey: string) => {
          const gMatches = matchesByGroup.get(groupKey)!
          const letter = groupKey.replace('GROUP_', '')
          return (
            <section key={groupKey}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Grupo {letter}
              </p>
              <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-50">
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
                      <span className="text-[10px] font-semibold text-slate-700 flex-1 truncate">
                        {m.homeTeam.shortName} – {m.awayTeam.shortName}
                      </span>
                      {awayFlagUrl && <Image src={awayFlagUrl} alt="" width={14} height={10} unoptimized className="rounded-sm shrink-0" />}
                      <span className="text-[10px] font-bold text-slate-500 ml-1">{pred.homeGoals}–{pred.awayGoals}</span>
                      {isFinished && (
                        <>
                          <span className="text-[9px] text-slate-400">
                            ({m.score.fullTime.home ?? 0}–{m.score.fullTime.away ?? 0})
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${REASON_BADGE[reason] ?? 'bg-slate-100 text-slate-400'}`}>
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
        }
        const [firstGroup, ...restGroups] = sortedGroups
        return (
          <>
            {firstGroup && renderGroup(firstGroup)}
            {restGroups.length > 0 && (
              <PremiumGate
                mode="replace"
                feature="todas las predicciones de grupos"
                title="🔮 Predicciones de todos los grupos"
                description="Mejora a Pro para ver las predicciones de fase de grupos al completo, no solo el primer grupo."
                compact
              >
                {restGroups.map(renderGroup)}
              </PremiumGate>
            )}
          </>
        )
      })()}

      {/* Knockouts — Pro */}
      {(r32Qualifiers.length > 0 || knockoutByRound.size > 0) && (
        <PremiumGate
          mode="replace"
          feature="las eliminatorias"
          title="🏆 Eliminatorias"
          description="Tus predicciones de octavos, cuartos, semis, final y 3er puesto con tu progreso real"
          compact
        >
        <section>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Eliminatorias</p>
          <div className="space-y-2">
            {r32Qualifiers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-3 py-1.5 border-b border-slate-50 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Dieciseisavos (R32)
                  </span>
                  <span className="text-[9px] text-slate-300">{r32Qualifiers.length} equipos · +3 c/u</span>
                </div>
                {r32Qualifiers.map(tla => {
                  const teamName = TLA_TO_EXCEL_NAME[tla] ?? tla
                  const flagUrl = getFlagUrl(tla)
                  const scored = r32QualifyTlas.has(tla)
                  return (
                    <div key={`r32q-${tla}`} className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-50">
                      {flagUrl && <Image src={flagUrl} alt="" width={14} height={10} unoptimized className="rounded-sm shrink-0" />}
                      <span className="text-[10px] font-semibold text-slate-700 flex-1 truncate">{teamName}</span>
                      {scored && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100 text-green-700 shrink-0">
                          <IconCheck size={9} />
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {ROUND_ORDER.filter(r => knockoutByRound.has(r)).map(round => (
              <div key={round} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-3 py-1.5 border-b border-slate-50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ROUND_LABEL[round]}</span>
                </div>
                {knockoutByRound.get(round)!.map(({ key, tla }) => {
                  const teamName = TLA_TO_EXCEL_NAME[tla] ?? tla
                  const flagUrl = getFlagUrl(tla)
                  // R32 → ✓ if team qualified to R32 (3 pts via r32_qualify)
                  // R16/QF/SF/Final → ✓ if the predicted team is the actual
                  //   winner of a real match in that round (regardless of
                  //   whether points were awarded — SF/Final aren't scored).
                  const scored = round === 'ROUND_OF_32'
                    ? r32QualifyTlas.has(tla)
                    : (advancedByRound.get(round)?.has(tla) ?? false)
                  return (
                    <div key={key} className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-50">
                      {flagUrl && <Image src={flagUrl} alt="" width={14} height={10} unoptimized className="rounded-sm shrink-0" />}
                      <span className="text-[10px] font-semibold text-slate-700 flex-1 truncate">{teamName}</span>
                      {scored && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100 text-green-700 shrink-0">
                          <IconCheck size={9} />
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </section>
        </PremiumGate>
      )}

      {/* Specials — Pro */}
      <PremiumGate
        mode="replace"
        feature="las predicciones especiales"
        title="⭐ Especiales"
        description="Tu campeón, subcampeón, 3er puesto, Bota de Oro/Plata/Bronce y Balón de Oro/Plata/Bronce"
        compact
      >
      <section>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Especiales</p>
        <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-50">
          {[
            { label: 'Campeón', value: TLA_TO_EXCEL_NAME[preds.specials.champion] ?? preds.specials.champion },
            { label: 'Subcampeón', value: TLA_TO_EXCEL_NAME[preds.specials.runnerUp] ?? preds.specials.runnerUp },
            { label: '3er puesto', value: TLA_TO_EXCEL_NAME[preds.specials.thirdPlace] ?? preds.specials.thirdPlace },
            { label: '🥇 Bota Oro', value: preds.specials.goldenBoot.first },
            { label: '🥈 Bota Plata', value: preds.specials.goldenBoot.second },
            { label: '🥉 Bota Bronce', value: preds.specials.goldenBoot.third },
            { label: '🥇 Balón Oro', value: preds.specials.goldenBall.first },
            { label: '🥈 Balón Plata', value: preds.specials.goldenBall.second },
            { label: '🥉 Balón Bronce', value: preds.specials.goldenBall.third },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2.5">
              <span className="text-[10px] text-slate-400 w-24 shrink-0">{label}</span>
              <span className="text-[10px] font-semibold text-slate-700">{value || '—'}</span>
            </div>
          ))}
        </div>
      </section>
      </PremiumGate>
    </div>
  )
}
