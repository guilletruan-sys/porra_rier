// src/app/api/wc-teams/route.ts
import { NextResponse } from 'next/server'

export const revalidate = 3600 // 1h — squads update slowly

interface FdSquadPlayer {
  id: number
  name: string
  position: string
  shirtNumber?: number
  dateOfBirth?: string
  nationality?: string
}

interface FdCoach {
  id: number
  name: string
  dateOfBirth?: string
  nationality?: string
}

interface FdTeam {
  id: number
  name: string
  tla: string
  coach?: FdCoach
  squad?: FdSquadPlayer[]
}

const TLA_NORMALIZE: Record<string, string> = { URY: 'URU' }

export interface PublicPlayer {
  id: number
  number: number
  position: 'GK' | 'DF' | 'MF' | 'FW'
  name: string
  age: number | null
  nationality: string | null
}

export interface PublicCoach {
  name: string
  nationality: string | null
  age: number | null
}

export interface PublicTeam {
  name: string
  coach: PublicCoach | null
  players: PublicPlayer[]
}

function ageFromDob(dob: string | undefined, refDate = new Date()): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  let age = refDate.getFullYear() - d.getFullYear()
  const mDiff = refDate.getMonth() - d.getMonth()
  if (mDiff < 0 || (mDiff === 0 && refDate.getDate() < d.getDate())) age--
  return age
}

function simplePos(p: string): 'GK' | 'DF' | 'MF' | 'FW' {
  const s = (p ?? '').toLowerCase()
  if (s.includes('goalkeeper')) return 'GK'
  if (s.includes('back') || s.includes('defence')) return 'DF'
  if (s.includes('midfield')) return 'MF'
  return 'FW'
}

export async function GET() {
  const key = process.env.FOOTBALL_DATA_API_KEY
  if (!key) return NextResponse.json({ teams: {} })
  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/teams', {
      headers: { 'X-Auth-Token': key },
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`football-data ${res.status}`)
    const data = await res.json()
    const result: Record<string, PublicTeam> = {}
    for (const t of (data.teams as FdTeam[]) ?? []) {
      const tla = TLA_NORMALIZE[t.tla] ?? t.tla
      const players: PublicPlayer[] = (t.squad ?? []).map(p => ({
        id: p.id,
        number: p.shirtNumber ?? 0,
        position: simplePos(p.position),
        name: p.name,
        age: ageFromDob(p.dateOfBirth),
        nationality: p.nationality ?? null,
      }))
      const coach: PublicCoach | null = t.coach
        ? {
            name: t.coach.name,
            nationality: t.coach.nationality ?? null,
            age: ageFromDob(t.coach.dateOfBirth),
          }
        : null
      result[tla] = { name: t.name, coach, players }
    }
    return NextResponse.json({ teams: result }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('API /wc-teams error:', err)
    return NextResponse.json({ teams: {} }, { status: 200 })
  }
}
