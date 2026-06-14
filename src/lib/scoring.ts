// src/lib/scoring.ts
import type { GroupPrediction, KnockoutPrediction, Match, MatchPoints, Stage, PredictionsData, ParticipantScore } from './types'
import { getMatchKey } from './team-map'

// Points awarded for correctly predicting a team to advance from each round
const ADVANCE_POINTS: Partial<Record<Stage, number>> = {
  ROUND_OF_32: 5,
  ROUND_OF_16: 7,
  QUARTER_FINALS: 10,
}
const R32_QUALIFY_POINTS = 3  // per team correctly predicted to be in R32

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

  for (const [key, pred] of Object.entries(knockout)) {
    if (pred.round === 'ROUND_OF_32') {
      const parts = key.split('_')
      if (parts.length === 2) { r32Teams.add(parts[0]); r32Teams.add(parts[1]) }
    }
    if (!advancers[pred.round]) advancers[pred.round] = new Set()
    advancers[pred.round]!.add(pred.advancingTeamTla)
  }
  return { r32Teams, advancers }
}

interface TopThreePick { first: string; second: string; third: string }
interface TopThreeActual { first?: string; second?: string; third?: string }

// 3 pts si Oro acierta, 2 si Plata acierta, 1 si Bronce acierta — por hueco e independiente.
function scoreTopThree(pick: TopThreePick, actual: TopThreeActual): number {
  let pts = 0
  if (actual.first && pick.first && pick.first.toLowerCase() === actual.first.toLowerCase()) pts += 3
  if (actual.second && pick.second && pick.second.toLowerCase() === actual.second.toLowerCase()) pts += 2
  if (actual.third && pick.third && pick.third.toLowerCase() === actual.third.toLowerCase()) pts += 1
  return pts
}

export function scoreSpecials(
  specials: {
    goldenBoot: TopThreePick
    goldenBall: TopThreePick
    champion: string
    runnerUp: string
    thirdPlace: string
  },
  actual: {
    goldenBoot?: TopThreeActual
    goldenBall?: TopThreeActual
    champion?: string
    runnerUp?: string
    thirdPlace?: string
  },
): number {
  let pts = 0
  if (actual.goldenBoot) pts += scoreTopThree(specials.goldenBoot, actual.goldenBoot)
  if (actual.goldenBall) pts += scoreTopThree(specials.goldenBall, actual.goldenBall)
  if (actual.champion && specials.champion === actual.champion) pts += 30
  if (actual.runnerUp && specials.runnerUp === actual.runnerUp) pts += 20
  if (actual.thirdPlace && specials.thirdPlace === actual.thirdPlace) pts += 15
  return pts
}

export function calculateParticipantScore(
  participantName: string,
  predictions: PredictionsData,
  matches: Match[],
): ParticipantScore {
  const preds = predictions[participantName]
  if (!preds) return { name: participantName, totalPoints: 0, groupStagePoints: 0, knockoutPoints: 0, specialsPoints: 0, breakdown: [] }

  const breakdown: MatchPoints[] = []
  let groupStagePoints = 0
  let knockoutPoints = 0

  const { r32Teams, advancers } = buildKnockoutSets(preds.knockout)
  // Track which R32 teams have already been credited (avoid double-counting)
  const r32Credited = new Set<string>()

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

    // Award 3 pts for each team correctly predicted to be in R32
    if (match.stage === 'ROUND_OF_32') {
      for (const teamTla of [match.homeTeam.tla, match.awayTeam.tla]) {
        if (r32Teams.has(teamTla) && !r32Credited.has(teamTla)) {
          r32Credited.add(teamTla)
          breakdown.push({ matchKey: `r32_qualify_${teamTla}`, points: R32_QUALIFY_POINTS, reason: 'r32_qualify' })
          knockoutPoints += R32_QUALIFY_POINTS
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

  return {
    name: participantName,
    totalPoints: groupStagePoints + knockoutPoints,
    groupStagePoints,
    knockoutPoints,
    specialsPoints: 0,
    breakdown,
  }
}
