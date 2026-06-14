// src/app/api/ranking/route.ts
import { NextResponse } from 'next/server'
import { fetchAllMatches } from '@/lib/football-api'
import { calculateParticipantScore } from '@/lib/scoring'
import type { PredictionsData, Match } from '@/lib/types'
import predictionsData from '@/data/predictions.json'
import participantsList from '@/data/participants.json'

export const revalidate = 60

function computeRanks(participants: string[], predictions: PredictionsData, matches: Match[]): Record<string, number> | null {
  const scores = participants.map(name => calculateParticipantScore(name, predictions, matches))
  scores.sort((a, b) => b.totalPoints - a.totalPoints)
  if (scores[0]?.totalPoints === 0) return null  // no differentiation yet
  const ranks: Record<string, number> = {}
  scores.forEach((s, i) => { ranks[s.name] = i + 1 })
  return ranks
}

export async function GET() {
  try {
    const allMatches = await fetchAllMatches()
    const predictions = predictionsData as PredictionsData
    const participants = participantsList as string[]

    const finished = allMatches.filter(m => m.status === 'FINISHED')
    const dates = [...new Set(finished.map(m => m.utcDate.slice(0, 10)))].sort()
    const latestDate = dates.at(-1)
    const prevMatches = latestDate ? finished.filter(m => m.utcDate.slice(0, 10) < latestDate) : []

    const prevRanks = prevMatches.length > 0
      ? computeRanks(participants, predictions, prevMatches)
      : null

    const scores = participants.map(name =>
      calculateParticipantScore(name, predictions, allMatches)
    )
    scores.sort((a, b) => b.totalPoints - a.totalPoints)

    const ranked = scores.map((s, i) => {
      const rank = i + 1
      const prev = prevRanks?.[s.name]
      const rankDelta = prev != null ? prev - rank : 0
      return { ...s, rank, rankDelta }
    })

    return NextResponse.json({ ranking: ranked })
  } catch (err) {
    console.error('API /ranking error:', err)
    return NextResponse.json({ error: 'Failed to calculate ranking' }, { status: 500 })
  }
}
