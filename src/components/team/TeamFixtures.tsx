'use client'
import { useEffect, useState } from 'react'
import { MatchCard, type MatchCardOdds } from '@/components/MatchCard'
import { getMatchKey } from '@/lib/team-map'
import type { Match } from '@/lib/types'

interface TeamFixturesProps {
  tla: string
  matches: Match[]
}

export function TeamFixtures({ tla, matches }: TeamFixturesProps) {
  const [odds, setOdds] = useState<Record<string, MatchCardOdds>>({})

  useEffect(() => {
    fetch('/api/odds').then(r => r.json()).then(d => setOdds(d.odds ?? {})).catch(() => {})
  }, [])

  const teamMatches = matches
    .filter(m => m.homeTeam.tla === tla || m.awayTeam.tla === tla)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))

  if (teamMatches.length === 0) return null

  const played = teamMatches.filter(m => m.status === 'FINISHED' || m.status === 'IN_PLAY' || m.status === 'PAUSED')
  const upcoming = teamMatches.filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED')

  const renderCard = (m: Match) => (
    <MatchCard
      key={m.id}
      match={m}
      odds={m.homeTeam?.tla && m.awayTeam?.tla
        ? odds[getMatchKey(m.homeTeam.tla, m.awayTeam.tla)]
        : undefined}
    />
  )

  return (
    <section className="mb-4">
      <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
        Calendario
      </h2>
      {played.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400  mb-1.5">Jugados</p>
          <div className="space-y-2">{played.map(renderCard)}</div>
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400  mb-1.5">Próximos</p>
          <div className="space-y-2">{upcoming.map(renderCard)}</div>
        </div>
      )}
    </section>
  )
}
