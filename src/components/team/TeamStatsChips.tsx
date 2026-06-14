'use client'
import { useEffect, useState } from 'react'
import type { Match } from '@/lib/types'
import type { PublicTeam } from '@/app/api/wc-teams/route'

interface TeamStatsChipsProps {
  tla: string
  matches: Match[]
}

interface Stats {
  pj: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  formLast5: ('W' | 'D' | 'L')[]
}

function computeStats(tla: string, matches: Match[]): Stats {
  const played = matches
    .filter(m => m.status === 'FINISHED' && (m.homeTeam.tla === tla || m.awayTeam.tla === tla))
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))

  const stats: Stats = { pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, formLast5: [] }
  for (const m of played) {
    const isHome = m.homeTeam.tla === tla
    const own = isHome ? (m.score.fullTime.home ?? 0) : (m.score.fullTime.away ?? 0)
    const opp = isHome ? (m.score.fullTime.away ?? 0) : (m.score.fullTime.home ?? 0)
    stats.pj++
    stats.gf += own
    stats.ga += opp
    let result: 'W' | 'D' | 'L'
    if (own > opp) { stats.w++; result = 'W' }
    else if (own < opp) { stats.l++; result = 'L' }
    else { stats.d++; result = 'D' }
    stats.formLast5.push(result)
  }
  stats.formLast5 = stats.formLast5.slice(-5)
  return stats
}

const FORM_STYLES = {
  W: 'bg-green-500 text-white',
  D: 'bg-yellow-400 text-yellow-900',
  L: 'bg-red-500 text-white',
}

export function TeamStatsChips({ tla, matches }: TeamStatsChipsProps) {
  const [avgAge, setAvgAge] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/wc-teams').then(r => r.json()).then(d => {
      const t: PublicTeam | undefined = d.teams?.[tla]
      const ages = (t?.players ?? []).map(p => p.age).filter((a): a is number => a != null)
      if (ages.length) {
        const mean = ages.reduce((a, b) => a + b, 0) / ages.length
        setAvgAge(Math.round(mean * 10) / 10)
      }
    }).catch(() => {})
  }, [tla])

  const s = computeStats(tla, matches)
  const diff = s.gf - s.ga
  const diffSign = diff > 0 ? `+${diff}` : `${diff}`

  if (s.pj === 0 && avgAge == null) {
    return (
      <div className="bg-white rounded-xl shadow-sm px-3 py-3 mb-3 text-center text-xs text-slate-400">
        Sin partidos jugados todavía
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm px-3 py-3 mb-3">
      <div className="grid grid-cols-4 gap-2 mb-3">
        {s.pj > 0 ? (
          <>
            <Stat label="PJ" value={s.pj} />
            <Stat label="G-E-P" value={`${s.w}-${s.d}-${s.l}`} />
            <Stat label="GF/GC" value={`${s.gf}/${s.ga}`} />
            <Stat label="Dif." value={diffSign} highlight />
          </>
        ) : (
          <>
            <Stat label="PJ" value="0" />
            <Stat label="Edad media" value={avgAge != null ? `${avgAge}` : '—'} highlight />
            <Stat label="Plantilla" value="26" />
            <Stat label="—" value="—" />
          </>
        )}
      </div>
      {s.pj > 0 && avgAge != null && (
        <div className="text-center text-[10px] text-slate-400 mb-2">
          Edad media de la plantilla: <span className="font-bold text-slate-600">{avgAge}</span> años
        </div>
      )}
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Últimos 5</p>
        <div className="flex gap-1">
          {s.formLast5.length === 0 ? (
            <span className="text-[10px] text-slate-400">—</span>
          ) : (
            s.formLast5.map((r, i) => (
              <span key={i} className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black ${FORM_STYLES[r]}`}>
                {r}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-sm font-black ${highlight ? 'text-[#c8102e]' : 'text-slate-800'} tabular-nums`}>{value}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}
