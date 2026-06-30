// src/lib/scoring.ts
import type { GroupPrediction, KnockoutPrediction, Match, MatchPoints, Stage, PredictionsData, ParticipantScore } from './types'
import { getMatchKey } from './team-map'
import { ADVANCE_POINTS, R32_QUALIFY_POINTS, computeKnockoutJourney } from './knockout-journey'

export function scoreGroupMatch(
  pred: GroupPrediction,
  match: Match,
): Pick<MatchPoints, 'points' | 'reason'> {
  const { home, away } = match.score.fullTime
  if (match.status === 'SCHEDULED' || match.status === 'TIMED' || home === null || away === null) {
    return { points: 0, reason: 'pending' }
  }
  if (pred.homeGoals === home && pred.awayGoals === away) {
    return { points: 4, reason: 'exact' }
  }
  const actualPick = home > away ? 'home' : away > home ? 'away' : 'draw'
  if (pred.pick === actualPick) {
    return { points: 1, reason: 'result' }
  }
  return { points: 0, reason: 'miss' }
}

// Build lookup sets from participant's knockout predictions:
// - r32Teams: all TLAs predicted to participate in R32 (both sides of each R32 matchup)
// - advancers: per round, the TLAs predicted to advance (win) from that round
function buildKnockoutSets(knockout: Record<string, KnockoutPrediction>) {
  const r32Teams = new Set<string>()
  const advancers: Partial<Record<Stage, Set<string>>> = {}

  for (const pred of Object.values(knockout)) {
    if (pred.round === 'ROUND_OF_32') {
      if (pred.homeTla) r32Teams.add(pred.homeTla)
      if (pred.awayTla) r32Teams.add(pred.awayTla)
    }
    if (!advancers[pred.round]) advancers[pred.round] = new Set()
    advancers[pred.round]!.add(pred.advancingTeamTla)
  }
  return { r32Teams, advancers }
}

export function scoreSpecials(
  specials: { goldenBoot: string; goldenBall: string; champion: string; runnerUp: string; thirdPlace: string },
  actual: { goldenBoot?: string; goldenBall?: string; champion?: string; runnerUp?: string; thirdPlace?: string },
): number {
  let pts = 0
  if (actual.goldenBoot && specials.goldenBoot.toLowerCase() === actual.goldenBoot.toLowerCase()) pts += 5
  if (actual.goldenBall && specials.goldenBall.toLowerCase() === actual.goldenBall.toLowerCase()) pts += 5
  if (actual.champion && specials.champion === actual.champion) pts += 30
  if (actual.runnerUp && specials.runnerUp === actual.runnerUp) pts += 20
  if (actual.thirdPlace && specials.thirdPlace === actual.thirdPlace) pts += 15
  return pts
}

export interface ActualOutcomes {
  champion?: string
  runnerUp?: string
  thirdPlace?: string
  goldenBoot?: string
  goldenBall?: string
}

export function calculateParticipantScore(
  participantName: string,
  predictions: PredictionsData,
  matches: Match[],
  actualOutcomes?: ActualOutcomes,
): ParticipantScore {
  const preds = predictions[participantName]
  if (!preds) return { name: participantName, totalPoints: 0, groupStagePoints: 0, knockoutPoints: 0, specialsPoints: 0, breakdown: [] }

  const breakdown: MatchPoints[] = []
  let groupStagePoints = 0
  let knockoutPoints = 0

  const { r32Teams, advancers } = buildKnockoutSets(preds.knockout)
  // Track which R32 teams have already been credited (avoid double-counting)
  const r32Credited = new Set<string>()
  // Equivalente para los pts "pendientes" (no consolidados) — mismos teams,
  // pero contabilizamos por separado para no contar dos veces.
  const pendingR32Credited = new Set<string>()
  let pendingKnockoutPoints = 0

  // Los 3 pts por equipo predicho en R32 solo se reparten cuando NO QUEDAN
  // partidos de grupos pendientes. Antes de eso, aunque football-data ya
  // haya publicado algunos TLAs en R32 (siguen siendo TIMED), no se acreditan
  // — coherente con la lectura natural de "se clasifica a R32 cuando acaban
  // los grupos".
  const groupStageDone = !matches.some(m => m.stage === 'GROUP_STAGE' && m.status !== 'FINISHED')

  for (const match of matches) {
    const matchKey = getMatchKey(match.homeTeam.tla, match.awayTeam.tla)

    if (match.stage === 'GROUP_STAGE') {
      const pred = preds.groupStage[matchKey]
      if (pred) {
        const result = scoreGroupMatch(pred, match)
        breakdown.push({ matchKey, ...result })
        groupStagePoints += result.points
      }
      continue
    }

    // THIRD_PLACE and FINAL are handled entirely by specials
    if (match.stage === 'THIRD_PLACE' || match.stage === 'FINAL') continue

    // Award 3 pts for each team correctly predicted to be in R32 — only once
    // the group stage is over.
    if (match.stage === 'ROUND_OF_32' && groupStageDone) {
      for (const teamTla of [match.homeTeam.tla, match.awayTeam.tla]) {
        if (r32Teams.has(teamTla) && !r32Credited.has(teamTla)) {
          r32Credited.add(teamTla)
          breakdown.push({ matchKey: `r32_qualify_${teamTla}`, points: R32_QUALIFY_POINTS, reason: 'r32_qualify' })
          knockoutPoints += R32_QUALIFY_POINTS
        }
      }
    }
    // Si los grupos NO han terminado pero football-data ya rellenó algunos
    // TLAs en R32 que el participante predijo, anotamos esos pts como
    // "pendientes" — se mostrarán como avance pero no entran en el total.
    if (match.stage === 'ROUND_OF_32' && !groupStageDone) {
      for (const teamTla of [match.homeTeam.tla, match.awayTeam.tla]) {
        if (teamTla && r32Teams.has(teamTla) && !pendingR32Credited.has(teamTla)) {
          pendingR32Credited.add(teamTla)
          pendingKnockoutPoints += R32_QUALIFY_POINTS
        }
      }
    }

    if (match.status !== 'FINISHED') continue

    const winnerTla = match.score.winner === 'HOME_TEAM' ? match.homeTeam.tla
      : match.score.winner === 'AWAY_TEAM' ? match.awayTeam.tla
      : null

    const pts = ADVANCE_POINTS[match.stage] ?? 0
    if (pts > 0 && winnerTla && advancers[match.stage]?.has(winnerTla)) {
      breakdown.push({ matchKey, points: pts, reason: 'knockout_correct' })
      knockoutPoints += pts
    }
  }

  const specialsPoints = actualOutcomes
    ? scoreSpecials(preds.specials, actualOutcomes)
    : 0

  // Puntos KO/especiales todavía vivos (en juego) — derivados del mismo cuadro.
  const inPlayKnockoutPoints = computeKnockoutJourney(preds, matches, actualOutcomes).inPlay

  return {
    name: participantName,
    totalPoints: groupStagePoints + knockoutPoints + specialsPoints,
    groupStagePoints,
    knockoutPoints,
    specialsPoints,
    pendingKnockoutPoints: pendingKnockoutPoints > 0 ? pendingKnockoutPoints : undefined,
    inPlayKnockoutPoints: inPlayKnockoutPoints > 0 ? inPlayKnockoutPoints : undefined,
    breakdown,
  }
}

/**
 * Deriva los outcomes "reales" del Mundial a partir de los matches FINISHED
 * para alimentar `calculateParticipantScore` con specials. Pichichi y balón
 * de oro requieren el contexto de scorers / votación FIFA y se pasan aparte.
 */
export function deriveActualOutcomes(matches: Match[], extra?: Pick<ActualOutcomes, 'goldenBoot' | 'goldenBall'>): ActualOutcomes {
  const out: ActualOutcomes = { ...(extra ?? {}) }
  const final = matches.find(m => m.stage === 'FINAL' && m.status === 'FINISHED')
  if (final) {
    if (final.score.winner === 'HOME_TEAM') {
      out.champion = final.homeTeam?.tla
      out.runnerUp = final.awayTeam?.tla
    } else if (final.score.winner === 'AWAY_TEAM') {
      out.champion = final.awayTeam?.tla
      out.runnerUp = final.homeTeam?.tla
    }
  }
  const tp = matches.find(m => m.stage === 'THIRD_PLACE' && m.status === 'FINISHED')
  if (tp) {
    if (tp.score.winner === 'HOME_TEAM') out.thirdPlace = tp.homeTeam?.tla
    else if (tp.score.winner === 'AWAY_TEAM') out.thirdPlace = tp.awayTeam?.tla
  }
  return out
}
