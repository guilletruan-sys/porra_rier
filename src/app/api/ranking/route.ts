// src/app/api/ranking/route.ts
import { NextResponse } from 'next/server'
import { fetchAllMatches } from '@/lib/football-api'
import { calculateParticipantScore, deriveActualOutcomes, type ActualOutcomes } from '@/lib/scoring'
import { buildTiebreakCtx, compareWithTiebreak, type TiebreakCtx } from '@/lib/ranking-tiebreak'
import type { PredictionsData, Match, ParticipantScore } from '@/lib/types'
import predictionsData from '@/data/predictions.json'
import participantsList from '@/data/participants.json'

export const revalidate = 60

interface SnapshotMaps {
  ranks: Record<string, number>
  points: Record<string, number>
}

function rankWithTies(scores: ParticipantScore[], ctx: TiebreakCtx): { rank: number; tied: boolean }[] {
  const out: { rank: number; tied: boolean }[] = []
  for (let i = 0; i < scores.length; i++) {
    if (i === 0) { out.push({ rank: 1, tied: false }); continue }
    const tied = compareWithTiebreak(scores[i - 1], scores[i], ctx) === 0
    out.push({ rank: tied ? out[i - 1].rank : i + 1, tied })
  }
  return out
}

function snapshot(
  participants: string[],
  predictions: PredictionsData,
  matches: Match[],
  ctx: TiebreakCtx,
  outcomes: ActualOutcomes,
): SnapshotMaps | null {
  const scores = participants.map(name => calculateParticipantScore(name, predictions, matches, outcomes))
  scores.sort((a, b) => compareWithTiebreak(a, b, ctx))
  if (scores[0]?.totalPoints === 0) return null   // sin diferenciación todavía
  const ranks: Record<string, number> = {}
  const points: Record<string, number> = {}
  const tiers = rankWithTies(scores, ctx)
  scores.forEach((s, i) => {
    ranks[s.name] = tiers[i].rank
    points[s.name] = s.totalPoints
  })
  return { ranks, points }
}

interface LiveMatchSummary {
  id: number
  homeTeam: { tla: string; shortName: string }
  awayTeam: { tla: string; shortName: string }
  score: { home: number; away: number }
  minute: number | null
  injuryTime: number | null
  status: string
}

export async function GET() {
  try {
    const allMatches = await fetchAllMatches()
    const predictions = predictionsData as PredictionsData
    const participants = participantsList as string[]

    const finished = allMatches.filter(m => m.status === 'FINISHED')
    const liveMatchObjects = allMatches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
    const hasLiveMatch = liveMatchObjects.length > 0

    // Contexto de desempate — calculado UNA vez con los datos más actuales y reutilizado en los 3 snapshots.
    const ctx = await buildTiebreakCtx(allMatches, predictions, participants)

    // Outcomes oficiales del Mundial (campeón / runner-up / 3er puesto / pichichi)
    // — alimentan los specials. Pichichi viene del context; balón de oro no se sabe
    // hasta el voto FIFA post-final, queda undefined.
    const topScorerOfficial = ctx.topScorersOfficial.size > 0
      ? [...ctx.topScorersOfficial][0]
      : undefined
    const currentOutcomes = deriveActualOutcomes(allMatches, { goldenBoot: topScorerOfficial })
    const finishedOutcomes = deriveActualOutcomes(finished, { goldenBoot: topScorerOfficial })

    // Snapshot por-partido (FINISHED excluyendo el más reciente)
    const finishedSorted = [...finished].sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    const latestFinished = finishedSorted.at(-1)
    const prevMatchSet = latestFinished
      ? finishedSorted.filter(m => m.id !== latestFinished.id)
      : []
    const prevOutcomes = deriveActualOutcomes(prevMatchSet, { goldenBoot: topScorerOfficial })
    const prevMatchSnap = prevMatchSet.length > 0
      ? snapshot(participants, predictions, prevMatchSet, ctx, prevOutcomes)
      : null

    // Snapshot estable (sin partidos en directo)
    const stableSnap = hasLiveMatch ? snapshot(participants, predictions, finished, ctx, finishedOutcomes) : null

    // Current: todo (FINISHED + IN_PLAY + PAUSED)
    const currentScores = participants.map(name =>
      calculateParticipantScore(name, predictions, allMatches, currentOutcomes)
    )
    currentScores.sort((a, b) => compareWithTiebreak(a, b, ctx))
    const currentTiers = rankWithTies(currentScores, ctx)

    const ranking = currentScores.map((s, i) => {
      const { rank, tied } = currentTiers[i]
      const stableR = stableSnap?.ranks[s.name]
      const stableP = stableSnap?.points[s.name]
      const prevR = prevMatchSnap?.ranks[s.name]
      const prevP = prevMatchSnap?.points[s.name]

      let rankDelta = 0
      let pointsDelta = 0
      let deltaStatus: 'finished' | 'live' | undefined

      // Origen "live": hay partido en directo Y sus puntos actuales difieren del snapshot estable
      if (hasLiveMatch && stableP != null && s.totalPoints !== stableP) {
        deltaStatus = 'live'
        pointsDelta = s.totalPoints - stableP
        rankDelta = stableR != null ? stableR - rank : 0
      } else if (prevP != null && (s.totalPoints !== prevP || (prevR != null && prevR !== rank))) {
        deltaStatus = 'finished'
        pointsDelta = s.totalPoints - prevP
        rankDelta = prevR != null ? prevR - rank : 0
      }

      return { ...s, rank, rankDelta, pointsDelta, deltaStatus, tied }
    })

    // Resumen ligero de partidos en directo para el banner
    const liveMatches: LiveMatchSummary[] = liveMatchObjects.map(m => ({
      id: m.id,
      homeTeam: { tla: m.homeTeam?.tla ?? '', shortName: m.homeTeam?.shortName ?? '' },
      awayTeam: { tla: m.awayTeam?.tla ?? '', shortName: m.awayTeam?.shortName ?? '' },
      score: {
        home: m.score?.fullTime?.home ?? 0,
        away: m.score?.fullTime?.away ?? 0,
      },
      minute: m.minute ?? null,
      injuryTime: m.injuryTime ?? null,
      status: m.status,
    }))

    return NextResponse.json(
      { ranking, hasLiveMatch, liveMatches },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (err) {
    console.error('API /ranking error:', err)
    return NextResponse.json({ error: 'Failed to calculate ranking' }, { status: 500 })
  }
}
