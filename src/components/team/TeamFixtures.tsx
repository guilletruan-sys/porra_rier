import { MatchCard } from '@/components/MatchCard'
import type { Match } from '@/lib/types'

interface TeamFixturesProps {
  tla: string
  matches: Match[]
}

export function TeamFixtures({ tla, matches }: TeamFixturesProps) {
  const teamMatches = matches
    .filter(m => m.homeTeam.tla === tla || m.awayTeam.tla === tla)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))

  if (teamMatches.length === 0) return null

  const played = teamMatches.filter(m => m.status === 'FINISHED' || m.status === 'IN_PLAY' || m.status === 'PAUSED')
  const upcoming = teamMatches.filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED')

  return (
    <section className="mb-4">
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
        Calendario
      </h2>
      {played.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-slate-500 mb-1.5">Jugados</p>
          <div className="space-y-2">
            {played.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1.5">Próximos</p>
          <div className="space-y-2">
            {upcoming.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      )}
    </section>
  )
}
