import { NextResponse } from 'next/server'

export const revalidate = 60

export async function GET() {
  try {
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=30',
      {
        headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY ?? '' },
        next: { revalidate: 60 },
      }
    )
    if (!res.ok) throw new Error(`football-data.org scorers error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json({ scorers: data.scorers ?? [] })
  } catch (e) {
    console.error('API /scorers error:', e)
    return NextResponse.json({ scorers: [] }, { status: 500 })
  }
}
