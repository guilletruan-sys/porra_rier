// src/app/api/ranking/history/route.ts
import { NextResponse } from 'next/server'
import { fetchAllMatches } from '@/lib/football-api'
import { calculateParticipantScore } from '@/lib/scoring'
import predictionsRaw from '@/data/predictions.json'
import participantsRaw from '@/data/participants.json'
import type { PredictionsData, Match } from '@/lib/types'

export const revalidate = 60

export interface HistoryPoint {
  date: string
  label: string
  rankings: Record<string, number>
}

const predictions = predictionsRaw as PredictionsData
const participants = participantsRaw as string[]

export interface HistoryPoint {
  date: string
  label: string
  rankings: Record<string, number>
}

export async function GET() {
  try {
    const allMatches = await fetchAllMatches()

    // Group finished matches by UTC date (YYYY-MM-DD)
    const matchesByDate = new Map<string, Match[]>()
    for (const match of allMatches) {
      if (match.status === 'FINISHED') {
        const date = match.utcDate.slice(0, 10)
        if (!matchesByDate.has(date)) matchesByDate.set(date, [])
        matchesByDate.get(date)!.push(match)
      }
    }

    const sortedDates = [...matchesByDate.keys()].sort()
    if (sortedDates.length === 0) {
      return NextResponse.json({ history: [] })
    }

    const history: HistoryPoint[] = []
    let cumulativeMatches: Match[] = []

    for (const date of sortedDates) {
      cumulativeMatches = [...cumulativeMatches, ...matchesByDate.get(date)!]

      // Calculate scores for all participants up to this date
      const scores = participants.map(name =>
        calculateParticipantScore(name, predictions, cumulativeMatches)
      )

      // Sort by totalPoints desc, assign ranks (ties get same rank)
      scores.sort((a, b) => b.totalPoints - a.totalPoints)
      const rankings: Record<string, number> = {}
      let rank = 1
      for (let i = 0; i < scores.length; i++) {
        if (i > 0 && scores[i].totalPoints < scores[i - 1].totalPoints) {
          rank = i + 1
        }
        rankings[scores[i].name] = rank
      }

      const label = new Date(date + 'T12:00:00Z').toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })

      history.push({ date, label, rankings })
    }

    return NextResponse.json({ history })
  } catch (e) {
    console.error('API /ranking/history error:', e)
    return NextResponse.json({ history: [] }, { status: 500 })
  }
}
