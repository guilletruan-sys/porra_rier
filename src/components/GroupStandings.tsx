'use client'
import Image from 'next/image'
import Link from 'next/link'
import { getFlagUrl } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import { Spoiler } from '@/components/Spoiler'
import { PremiumGate } from '@/components/PremiumGate'
import type { Match } from '@/lib/types'

interface TeamRow {
  tla: string
  name: string
  pj: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  pts: number
}

function calcStandings(matches: Match[], group: string): TeamRow[] {
  const allGroupMatches = matches.filter(
    m => m.stage === 'GROUP_STAGE' && m.group === `GROUP_${group}`
  )

  const teams: Record<string, TeamRow> = {}

  // Register all teams from all group matches (played or not)
  for (const m of allGroupMatches) {
    if (!teams[m.homeTeam.tla])
      teams[m.homeTeam.tla] = { tla: m.homeTeam.tla, name: m.homeTeam.shortName, pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
    if (!teams[m.awayTeam.tla])
      teams[m.awayTeam.tla] = { tla: m.awayTeam.tla, name: m.awayTeam.shortName, pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
  }

  // Count only finished matches
  for (const m of allGroupMatches) {
    if (m.status !== 'FINISHED') continue
    const hg = m.score.fullTime.home ?? 0
    const ag = m.score.fullTime.away ?? 0
    const h = teams[m.homeTeam.tla]
    const a = teams[m.awayTeam.tla]

    h.pj++; h.gf += hg; h.ga += ag
    a.pj++; a.gf += ag; a.ga += hg

    if (hg > ag)      { h.w++; h.pts += 3; a.l++ }
    else if (hg < ag) { a.w++; a.pts += 3; h.l++ }
    else              { h.d++; h.pts++; a.d++; a.pts++ }
  }

  return Object.values(teams).sort(
    (a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf
  )
}

interface GroupStandingsProps {
  matches: Match[]
  group: string
  highlightTla?: string
}

export function GroupStandings({ matches, group, highlightTla }: GroupStandingsProps) {
  const rows = calcStandings(matches, group)
  if (rows.length === 0) return null
  const hasPlayed = rows.some(r => r.pj > 0)

  return (
    <PremiumGate
      mode="replace"
      feature={`la clasificación del grupo ${group}`}
      title={`📊 Grupo ${group}`}
      description="Tabla en tiempo real con PJ · G · E · P · GF · GC · DG · Puntos"
      compact
    >
    <div className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-50">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          Clasificación Grupo {group}
        </span>
      </div>
      {hasPlayed ? <Spoiler blockMode label={`Clasificación grupo ${group} oculta · Toca para ver`}>
        <_GroupTable rows={rows} highlightTla={highlightTla} />
      </Spoiler> : <_GroupTable rows={rows} highlightTla={highlightTla} />}
    </div>
    </PremiumGate>
  )
}

interface TableProps { rows: TeamRow[]; highlightTla?: string }
function _GroupTable({ rows, highlightTla }: TableProps) {
  return (
    <>
      <table className="w-full">
        <thead>
          <tr className="text-[8px] font-bold text-slate-400 uppercase">
            <th className="pl-3 py-1.5 text-left w-5">#</th>
            <th className="py-1.5 text-left">Equipo</th>
            <th className="py-1.5 text-center w-6">PJ</th>
            <th className="py-1.5 text-center w-6">G</th>
            <th className="py-1.5 text-center w-6">E</th>
            <th className="py-1.5 text-center w-6">P</th>
            <th className="py-1.5 text-center w-8">DG</th>
            <th className="pr-3 py-1.5 text-center w-8 text-[#c8102e]">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const flagUrl = getFlagUrl(row.tla)
            const isQualifying = i < 2
            const isHighlighted = row.tla === highlightTla
            return (
              <tr key={row.tla} className={`border-t border-slate-50 ${isHighlighted ? 'bg-red-50' : isQualifying ? 'bg-green-50/50' : ''}`}>
                <td className="pl-3 py-2">
                  <span className={`text-[10px] font-black ${isHighlighted ? 'text-[#c8102e]' : 'text-slate-400'}`}>{i + 1}</span>
                </td>
                <td className="py-2">
                  <Link href={`/equipo/${row.tla}`} className="flex items-center gap-1.5">
                    {flagUrl
                      ? <Image src={flagUrl} alt="" width={14} height={10} unoptimized className="rounded-sm shrink-0" />
                      : <IconFlagFallback width={14} height={10} />
                    }
                    <span className={`text-[10px] font-semibold truncate ${isHighlighted ? 'text-[#c8102e]' : 'text-slate-800'}`}>{row.name}</span>
                  </Link>
                </td>
                <td className="py-2 text-center text-[10px] text-slate-500">{row.pj}</td>
                <td className="py-2 text-center text-[10px] text-slate-500">{row.w}</td>
                <td className="py-2 text-center text-[10px] text-slate-500">{row.d}</td>
                <td className="py-2 text-center text-[10px] text-slate-500">{row.l}</td>
                <td className="py-2 text-center text-[10px] text-slate-500">
                  {row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}
                </td>
                <td className="pr-3 py-2 text-center">
                  <span className="text-[11px] font-black text-[#c8102e]">{row.pts}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
