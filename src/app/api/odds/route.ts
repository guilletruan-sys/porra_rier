// src/app/api/odds/route.ts
import { NextResponse } from 'next/server'
import { fetchWcOdds } from '@/lib/odds-api'

export const revalidate = 7200 // 2h — preserva créditos de The Odds API (free: 500/mes)

export async function GET() {
  try {
    const odds = await fetchWcOdds()
    return NextResponse.json({ odds })
  } catch (err) {
    console.error('API /odds error:', err)
    // No bloqueamos la UI ante errores — devolvemos vacío y los chips no aparecen.
    return NextResponse.json({ odds: {} }, { status: 200 })
  }
}
