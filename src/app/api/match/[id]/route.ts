// src/app/api/match/[id]/route.ts
import { NextResponse } from 'next/server'
import { fetchMatchDetails } from '@/lib/football-api'

export const revalidate = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const matchId = Number(id)
  if (!Number.isFinite(matchId)) {
    return NextResponse.json({ error: 'Invalid match id' }, { status: 400 })
  }
  try {
    const match = await fetchMatchDetails(matchId)
    return NextResponse.json({ match })
  } catch (err) {
    console.error('API /match/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}
