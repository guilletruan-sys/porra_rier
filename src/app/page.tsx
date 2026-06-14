'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MatchCard } from '@/components/MatchCard'
import { PichichiCard } from '@/components/PichichiCard'
import { ChampionsWidget } from '@/components/ChampionsWidget'
import { LiveBanner } from '@/components/LiveBanner'
import { NextMatchCountdown } from '@/components/NextMatchCountdown'
import { BestPredictionDaily } from '@/components/BestPredictionDaily'
import { IconBall, IconTrophy, RankBadge } from '@/components/icons'
import type { Match, RankingEntry } from '@/lib/types'

function dayKey(utcDate: string): string {
  const d = new Date(utcDate)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }) // YYYY-MM-DD
}

function dayLabel(key: string): string {
  if (!key) return ''
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
  if (key === today) return 'Hoy'
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
  if (key === tomorrowKey) return 'Mañana'
  return new Date(key + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Europe/Madrid',
  })
}

export default function HomePage() {
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const todayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    let interval: ReturnType<typeof setInterval> | null = null

    const loadMatches = (initial: boolean) =>
      fetch('/api/matches', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ matches: [] })).then(d => {
        if (cancelled) return
        const sorted = [...(d.matches ?? [])].sort((a: Match, b: Match) =>
          a.utcDate.localeCompare(b.utcDate)
        )
        setAllMatches(sorted)
        if (initial) setLoading(false)
        // Poll every 30s only while there's a live match
        const hasLive = sorted.some((m: Match) => m.status === 'IN_PLAY' || m.status === 'PAUSED')
        if (hasLive && !interval) {
          interval = setInterval(() => loadMatches(false), 10_000)
        } else if (!hasLive && interval) {
          clearInterval(interval); interval = null
        }
      })

    Promise.all([
      loadMatches(true),
      fetch('/api/ranking').then(r => r.json()).catch(() => ({ ranking: [] })).then(d => {
        if (!cancelled) setRanking(d.ranking ?? [])
      }),
    ])

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (containerRef.current && todayRef.current) {
      containerRef.current.scrollTop = todayRef.current.offsetTop - containerRef.current.offsetTop - 4
    }
  }, [allMatches])

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
  const matchesByDay = new Map<string, Match[]>()
  for (const m of allMatches) {
    const k = dayKey(m.utcDate)
    if (!matchesByDay.has(k)) matchesByDay.set(k, [])
    matchesByDay.get(k)!.push(m)
  }
  const days = [...matchesByDay.keys()]

  // Pick the anchor day: today if present, otherwise the first future day, otherwise the last
  let anchorDay = today
  if (!matchesByDay.has(today)) {
    anchorDay = days.find(d => d >= today) ?? days[days.length - 1] ?? today
  }

  const top5 = ranking.slice(0, 5)

  return (
    <div className="p-3 space-y-4">

      {/* Live banner — only when there's an in-play match */}
      <LiveBanner matches={allMatches} />

      {/* Countdown to next match — only when no live match */}
      <NextMatchCountdown matches={allMatches} />

      {/* Calendar */}
      <section>
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <IconBall size={13} className="text-[#c8102e]" />
          Calendario
        </h2>
        {loading ? (
          <div className="bg-white rounded-xl p-4 text-center text-sm text-slate-400 shadow-sm">Cargando…</div>
        ) : days.length === 0 ? (
          <div className="bg-white rounded-xl p-4 text-center text-sm text-slate-400 shadow-sm">
            Sin partidos
          </div>
        ) : (
          <div
            ref={containerRef}
            className="max-h-[60vh] overflow-y-auto bg-white rounded-xl shadow-sm p-2 space-y-3"
          >
            {days.map(d => (
              <div key={d} ref={d === anchorDay ? todayRef : null}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 py-1 sticky top-0 bg-white capitalize">
                  {dayLabel(d)}
                </p>
                <div className="space-y-2">
                  {matchesByDay.get(d)!.map(m => <MatchCard key={m.id} match={m} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Best prediction of the last finished match */}
      <BestPredictionDaily matches={allMatches} />

      {/* Mini ranking */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <IconTrophy size={13} className="text-[#c8102e]" />
            Clasificación
          </h2>
          <Link href="/ranking" className="text-[10px] font-bold text-[#c8102e]">Ver todo →</Link>
        </div>
        {loading ? null : top5.length === 0 ? (
          <div className="bg-white rounded-xl p-4 text-center text-sm text-slate-400 shadow-sm">Sin datos</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-50">
            {top5.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 px-3 py-2.5">
                <div className="w-6 flex justify-center shrink-0">
                  <RankBadge rank={entry.rank} />
                </div>
                <span className="flex-1 text-xs font-semibold text-slate-800">{entry.name}</span>
                <span className={`text-xs font-bold ${entry.rank === 1 ? 'text-[#c8102e]' : 'text-slate-500'}`}>
                  {entry.totalPoints} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pichichi */}
      <PichichiCard />

      {/* Champions */}
      <ChampionsWidget />

    </div>
  )
}
