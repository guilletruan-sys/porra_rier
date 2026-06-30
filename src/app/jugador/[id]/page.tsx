'use client'
import { use, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Match } from '@/lib/types'

interface PersonCurrentTeam {
  id: number
  name: string
  shortName?: string
  crest?: string
  area?: { name: string; flag?: string }
  venue?: string
}

interface Person {
  id: number
  name: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  nationality?: string
  section?: string
  position?: string
  shirtNumber?: number
  currentTeam?: PersonCurrentTeam | null
}

function ageFromDob(dob: string | undefined): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

interface WcStats {
  appearances: number
  goals: number
  assists: number
  yellow: number
  red: number
  matches: Match[]
}

interface WikiInfo { thumbnail: string | null; club: string | null }

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const pid = Number(id)
  const router = useRouter()
  const [person, setPerson] = useState<Person | null>(null)
  const [wiki, setWiki] = useState<WikiInfo | null>(null)
  const [stats, setStats] = useState<WcStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/persons/${pid}`)
      .then(r => r.json())
      .then(d => setPerson(d.person ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [pid])

  // After we know the player's name, ask Wikipedia for photo + real current club
  useEffect(() => {
    if (!person?.name) return
    fetch(`/api/wiki-player?name=${encodeURIComponent(person.name)}`)
      .then(r => r.json())
      .then(d => setWiki({ thumbnail: d.thumbnail ?? null, club: d.club ?? null }))
      .catch(() => {})
  }, [person?.name])

  // Compute WC stats by fetching each FINISHED match this team played, and counting
  useEffect(() => {
    if (!person) return
    const teamName = person.nationality
    if (!teamName) return
    let cancelled = false
    ;(async () => {
      const res = await fetch('/api/matches', { cache: 'no-store' })
      const j = await res.json()
      const matches: Match[] = j.matches ?? []
      const finished = matches.filter(m =>
        m.status === 'FINISHED' &&
        (m.homeTeam.name === teamName || m.awayTeam.name === teamName)
      )
      const acc: WcStats = { appearances: 0, goals: 0, assists: 0, yellow: 0, red: 0, matches: [] }
      for (const m of finished) {
        const det = await fetch(`/api/match/${m.id}`, { cache: 'no-store' }).then(r => r.json()).catch(() => null)
        const md = det?.match
        if (!md) continue
        // Check appearance: in lineup or bench
        const inLineup = [...(md.homeLineup ?? []), ...(md.awayLineup ?? [])].some((p: { id: number }) => p.id === pid)
        const inBench = [...(md.homeBench ?? []), ...(md.awayBench ?? [])].some((p: { id: number }) => p.id === pid)
        const subbedIn = (md.substitutions ?? []).some((s: { playerIn: { id: number } }) => s.playerIn.id === pid)
        if (inLineup || (inBench && subbedIn)) acc.appearances++
        for (const g of md.goals ?? []) {
          if (g.scorer?.id === pid) acc.goals++
          if (g.assist?.id === pid) acc.assists++
        }
        for (const b of md.bookings ?? []) {
          if (b.player?.id === pid) {
            if (b.card === 'YELLOW') acc.yellow++
            else if (b.card === 'RED' || b.card === 'YELLOW_RED') acc.red++
          }
        }
        acc.matches.push(m)
      }
      if (!cancelled) setStats(acc)
    })()
    return () => { cancelled = true }
  }, [person, pid])

  if (loading) {
    return <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">Cargando…</div>
  }
  if (!person) {
    return <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">Jugador no encontrado</div>
  }

  const age = ageFromDob(person.dateOfBirth)

  return (
    <div className="p-3 pb-4">
      <button
        onClick={() => router.back()}
        className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1 hover:text-slate-700 dark:text-slate-200"
      >
        ← Volver
      </button>

      <div className="bg-gradient-to-br from-[#c8102e] to-[#006341] text-white px-4 py-5 -mx-3 mb-3">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm rounded-xl w-20 h-20 flex items-center justify-center shrink-0 overflow-hidden">
            {wiki?.thumbnail
              ? <img src={wiki.thumbnail} alt={person.name} className="w-full h-full object-cover" />
              : <span className="text-2xl font-black">{person.shirtNumber ?? '–'}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black tracking-tight truncate">{person.name}</h1>
            {person.nationality && (
              <p className="text-xs font-semibold text-white/80 mt-0.5">{person.nationality}</p>
            )}
            <p className="text-[10px] text-white/70 mt-1">
              {person.position ?? '—'}
              {person.shirtNumber != null ? ` · #${person.shirtNumber}` : ''}
              {age != null ? ` · ${age} años` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Current club — prefer Wikipedia (real club) over football-data (returns the national team during WC) */}
      {(wiki?.club || person.currentTeam) && (
        <section className="mb-4">
          <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Club actual
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm px-3 py-3 flex items-center gap-3">
            {!wiki?.club && person.currentTeam?.crest && (
              <Image src={person.currentTeam.crest} alt="" width={36} height={36} unoptimized className="rounded shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {wiki?.club ?? person.currentTeam?.name}
              </p>
              {!wiki?.club && person.currentTeam?.area?.name && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{person.currentTeam.area.name}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* WC stats */}
      {stats && (
        <section className="mb-4">
          <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Mundial 2026
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm px-3 py-3 grid grid-cols-4 gap-2 mb-2">
            <Stat label="PJ" value={stats.appearances} />
            <Stat label="Goles" value={stats.goals} highlight={stats.goals > 0} />
            <Stat label="Asist." value={stats.assists} />
            <Stat label="🟨" value={`${stats.yellow}${stats.red ? ` 🟥${stats.red}` : ''}`} />
          </div>
          {stats.matches.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800 mt-2">
              {stats.matches.map(m => (
                <Link
                  key={m.id}
                  href={`/equipo/${m.homeTeam.tla}`}
                  className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900"
                >
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {m.homeTeam.shortName} – {m.awayTeam.shortName}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {m.score.fullTime.home ?? 0}-{m.score.fullTime.away ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-base font-black tabular-nums ${highlight ? 'text-[#c8102e]' : 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}
