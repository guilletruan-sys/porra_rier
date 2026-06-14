// src/app/api/matches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchAllMatches, fetchTodayMatches } from '@/lib/football-api'

export const revalidate = 10

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter')

  try {
    const matches = filter === 'today'
      ? await fetchTodayMatches()
      : await fetchAllMatches()
    return NextResponse.json({ matches }, {
      headers: {
        // Server still caches via `revalidate = 10`; tell browsers/CDN
        // not to cache so polling actually picks up fresh data.
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err) {
    console.error('API /matches error:', err)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
