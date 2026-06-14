'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GroupStandings } from '@/components/GroupStandings'
import { TeamHero } from '@/components/team/TeamHero'
import { TeamStatsChips } from '@/components/team/TeamStatsChips'
import { TeamFixtures } from '@/components/team/TeamFixtures'
import { LineupPitch } from '@/components/team/LineupPitch'
import { TeamSquad } from '@/components/team/TeamSquad'
import { TeamScorers } from '@/components/team/TeamScorers'
import { TeamPorraSection } from '@/components/team/TeamPorraSection'
import { TeamNews } from '@/components/team/TeamNews'
import { PremiumGate } from '@/components/PremiumGate'
import { useLite } from '@/contexts/LiteContext'
import { TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import type { Match } from '@/lib/types'

export default function TeamPage({ params }: { params: Promise<{ tla: string }> }) {
  const { tla: rawTla } = use(params)
  const tla = rawTla.toUpperCase()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const { isPremium, ready: liteReady } = useLite()

  useEffect(() => {
    if (!isPremium) { setLoading(false); return }
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => { setMatches(d.matches ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isPremium])

  if (liteReady && !isPremium) {
    const tname = TLA_TO_EXCEL_NAME[tla] ?? tla
    return (
      <div className="p-3">
        <button
          onClick={() => router.back()}
          className="text-[11px] text-slate-400 mb-2 flex items-center gap-1 hover:text-slate-700"
        >
          ← Volver
        </button>
        <PremiumGate
          mode="replace"
          feature="la página del equipo"
          title={`🇺🇳 ${tname}`}
          description="Plantilla oficial, último 11, calendario completo del equipo, goleadores propios, noticias y clasificación de su grupo"
        >
          <div />
        </PremiumGate>
      </div>
    )
  }

  const teamName = TLA_TO_EXCEL_NAME[tla]
  if (!teamName) {
    return (
      <div className="p-4 text-center text-sm text-slate-400">
        Equipo no encontrado
      </div>
    )
  }

  const teamMatches = matches.filter(m => m.homeTeam.tla === tla || m.awayTeam.tla === tla)
  const groupKey = teamMatches.find(m => m.stage === 'GROUP_STAGE')?.group ?? null
  const groupLetter = groupKey ? groupKey.replace('GROUP_', '') : null

  let position: number | null = null
  let totalTeams: number | null = null
  if (groupLetter) {
    const standings = computeGroupOrder(matches, groupKey!)
    const idx = standings.indexOf(tla)
    if (idx >= 0) {
      position = idx + 1
      totalTeams = standings.length
    }
  }

  return (
    <div className="p-3 pb-4">
      <button
        onClick={() => router.back()}
        className="text-[11px] text-slate-400 mb-2 flex items-center gap-1 hover:text-slate-700"
      >
        ← Volver
      </button>

      <TeamHero tla={tla} group={groupKey} position={position} totalTeams={totalTeams} />

      {loading ? (
        <div className="bg-white rounded-xl p-6 text-center text-sm text-slate-400 shadow-sm">
          Cargando datos…
        </div>
      ) : (
        <>
          <TeamStatsChips tla={tla} matches={matches} />

          {groupLetter && (
            <section className="mb-3">
              <GroupStandings matches={matches} group={groupLetter} highlightTla={tla} />
            </section>
          )}

          <TeamFixtures tla={tla} matches={matches} />

          <LineupPitch tla={tla} />

          <TeamSquad tla={tla} />

          <TeamScorers tla={tla} />

          <TeamPorraSection tla={tla} />

          <TeamNews tla={tla} />
        </>
      )}
    </div>
  )
}

function computeGroupOrder(matches: Match[], groupKey: string): string[] {
  const groupMatches = matches.filter(m => m.stage === 'GROUP_STAGE' && m.group === groupKey)
  const teams: Record<string, { tla: string; pj: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }> = {}

  for (const m of groupMatches) {
    if (!teams[m.homeTeam.tla]) teams[m.homeTeam.tla] = { tla: m.homeTeam.tla, pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
    if (!teams[m.awayTeam.tla]) teams[m.awayTeam.tla] = { tla: m.awayTeam.tla, pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
  }
  for (const m of groupMatches) {
    if (m.status !== 'FINISHED') continue
    const hg = m.score.fullTime.home ?? 0
    const ag = m.score.fullTime.away ?? 0
    const h = teams[m.homeTeam.tla]
    const a = teams[m.awayTeam.tla]
    h.pj++; h.gf += hg; h.ga += ag
    a.pj++; a.gf += ag; a.ga += hg
    if (hg > ag) { h.w++; h.pts += 3; a.l++ }
    else if (hg < ag) { a.w++; a.pts += 3; h.l++ }
    else { h.d++; h.pts++; a.d++; a.pts++ }
  }
  return Object.values(teams)
    .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
    .map(t => t.tla)
}
