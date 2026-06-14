// src/app/api/persons/[id]/route.ts
import { NextResponse } from 'next/server'

export const revalidate = 86400 // 24h — player profile rarely changes

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const pid = Number(id)
  if (!Number.isFinite(pid)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  const key = process.env.FOOTBALL_DATA_API_KEY
  if (!key) return NextResponse.json({ person: null })
  try {
    const res = await fetch(`https://api.football-data.org/v4/persons/${pid}`, {
      headers: { 'X-Auth-Token': key },
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`football-data ${res.status}`)
    const person = await res.json()
    return NextResponse.json({ person })
  } catch (err) {
    console.error('API /persons/[id] error:', err)
    return NextResponse.json({ person: null }, { status: 200 })
  }
}
