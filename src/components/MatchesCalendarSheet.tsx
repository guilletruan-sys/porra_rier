'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { MatchCard, type MatchCardOdds } from '@/components/MatchCard'
import { getFlagUrl, getMatchKey } from '@/lib/team-map'
import type { Match } from '@/lib/types'

interface MatchesCalendarSheetProps {
  matches: Match[]
  odds?: Record<string, MatchCardOdds>
  onClose: () => void
}

function dayKey(utcDate: string): string {
  const d = new Date(utcDate)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }) // YYYY-MM-DD
}

function todayKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
}

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// Top 8 favoritas del Mundial 2026. España va aparte (bandera grande).
const FAVORITE_TLAS = ['ARG', 'FRA', 'BRA', 'ENG', 'POR', 'GER', 'NED']

interface DayCell {
  date: Date
  key: string           // YYYY-MM-DD
  inMonth: boolean      // false → días grises del mes anterior/siguiente
  isToday: boolean
  matchCount: number
  spainPlays: boolean
  favoriteTlas: string[]   // TLAs de favoritas (no España) que juegan ese día, deduplicadas
}

function buildMonthGrid(year: number, month: number, matchesByDay: Map<string, Match[]>): DayCell[] {
  const today = todayKey()
  // Primer día del mes en Madrid time
  const first = new Date(Date.UTC(year, month, 1))
  // En español la semana empieza en lunes (1). Calculamos cuántos días retroceder para alinear.
  const firstWeekday = (first.getUTCDay() + 6) % 7   // 0 = lun, 6 = dom
  const start = new Date(first)
  start.setUTCDate(first.getUTCDate() - firstWeekday)

  // Total de celdas: siempre 6 filas × 7 = 42 para que el grid se vea estable.
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    const matches = matchesByDay.get(key) ?? []

    const favoriteTlas: string[] = []
    for (const m of matches) {
      for (const tla of [m.homeTeam?.tla, m.awayTeam?.tla]) {
        if (tla && FAVORITE_TLAS.includes(tla) && !favoriteTlas.includes(tla)) {
          favoriteTlas.push(tla)
        }
      }
    }

    cells.push({
      date: d,
      key,
      inMonth: d.getUTCMonth() === month,
      isToday: key === today,
      matchCount: matches.length,
      spainPlays: matches.some(m => m.homeTeam?.tla === 'ESP' || m.awayTeam?.tla === 'ESP'),
      favoriteTlas,
    })
  }
  return cells
}

function dayLabel(key: string): string {
  if (!key) return ''
  const d = new Date(key + 'T12:00:00')
  return d.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid',
  })
}

export function MatchesCalendarSheet({ matches, odds, onClose }: MatchesCalendarSheetProps) {
  const matchesByDay = useMemo(() => {
    const map = new Map<string, Match[]>()
    for (const m of matches) {
      const k = dayKey(m.utcDate)
      if (!k) continue
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(m)
    }
    for (const list of map.values()) list.sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    return map
  }, [matches])

  // Mes inicial: el mes del primer partido futuro o, si todos pasaron, el actual.
  const initialMonth = useMemo(() => {
    const future = matches.find(m => m.status === 'SCHEDULED' || m.status === 'TIMED')
    const ref = future ? new Date(future.utcDate) : new Date()
    return { year: ref.getUTCFullYear(), month: ref.getUTCMonth() }
  }, [matches])

  const [{ year, month }, setMonth] = useState(initialMonth)
  const [selected, setSelected] = useState<string | null>(() => {
    const t = todayKey()
    return matchesByDay.has(t) ? t : null
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const cells = useMemo(() => buildMonthGrid(year, month, matchesByDay), [year, month, matchesByDay])
  const selectedMatches = selected ? matchesByDay.get(selected) ?? [] : []
  const spainFlag = getFlagUrl('ESP')

  const navigate = (dir: -1 | 1) => {
    let nextYear = year
    let nextMonth = month + dir
    if (nextMonth < 0) { nextMonth = 11; nextYear -= 1 }
    if (nextMonth > 11) { nextMonth = 0; nextYear += 1 }
    setMonth({ year: nextYear, month: nextMonth })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-md max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-2 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header — month navigation */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0 border-b border-slate-100 dark:border-slate-800">
          <button onClick={() => navigate(-1)} aria-label="Mes anterior" className="text-slate-500 dark:text-slate-400  hover:text-slate-800 dark:text-slate-100 w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-950">‹</button>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100 capitalize">
            {MONTH_NAMES[month]} {year}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(1)} aria-label="Mes siguiente" className="text-slate-500 dark:text-slate-400  hover:text-slate-800 dark:text-slate-100 w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-950">›</button>
            <button onClick={onClose} aria-label="Cerrar" className="text-slate-400 dark:text-slate-500 text-xl leading-none w-7 h-7 flex items-center justify-center hover:text-slate-700 dark:text-slate-200">×</button>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="px-3 pt-2 shrink-0">
          <div className="grid grid-cols-7 gap-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">
            {WEEK_DAYS.map(w => <div key={w}>{w}</div>)}
          </div>
        </div>

        {/* Day grid */}
        <div className="px-3 pt-1 pb-3 shrink-0">
          <div className="grid grid-cols-7 gap-1">
            {cells.map(cell => {
              const isSelected = selected === cell.key
              const hasMatches = cell.matchCount > 0
              return (
                <button
                  key={cell.key}
                  onClick={() => setSelected(cell.key)}
                  disabled={!hasMatches && !cell.inMonth}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-colors ${
                    !cell.inMonth ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200'
                  } ${
                    isSelected
                      ? 'bg-[#c8102e] text-white'
                      : cell.isToday
                        ? 'ring-1 ring-[#c8102e] bg-red-50'
                        : hasMatches
                          ? 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : ''}>{cell.date.getUTCDate()}</span>
                  {cell.spainPlays && spainFlag && (
                    <Image
                      src={spainFlag}
                      alt="España"
                      width={14}
                      height={10}
                      unoptimized
                      className="absolute bottom-1 rounded-sm shadow-sm"
                    />
                  )}
                  {!cell.spainPlays && cell.favoriteTlas.length > 0 && (
                    <div className="absolute bottom-0.5 flex items-center gap-0.5">
                      {cell.favoriteTlas.slice(0, 3).map(tla => {
                        const url = getFlagUrl(tla)
                        return url ? (
                          <Image
                            key={tla}
                            src={url}
                            alt={tla}
                            width={10}
                            height={7}
                            unoptimized
                            className="rounded-[1px] shadow-sm"
                          />
                        ) : null
                      })}
                      {cell.favoriteTlas.length > 3 && (
                        <span className={`text-[7px] font-black tabular-nums ${isSelected ? 'text-white' : 'text-[#c8102e]'}`}>
                          +{cell.favoriteTlas.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {hasMatches && !cell.spainPlays && cell.favoriteTlas.length === 0 && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white/80 dark:bg-slate-800/80' : 'bg-[#c8102e]'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day matches */}
        <div className="flex-1 overflow-y-auto overscroll-contain border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          {!selected ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">Selecciona un día para ver los partidos</p>
          ) : selectedMatches.length === 0 ? (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6 capitalize">
              {dayLabel(selected)} — sin partidos
            </p>
          ) : (
            <div className="px-3 py-3 space-y-2">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest capitalize">
                {dayLabel(selected)} · {selectedMatches.length} partido{selectedMatches.length !== 1 ? 's' : ''}
              </p>
              {selectedMatches.map(m => (
                <MatchCard
                  key={m.id}
                  match={m}
                  odds={m.homeTeam?.tla && m.awayTeam?.tla
                    ? odds?.[getMatchKey(m.homeTeam.tla, m.awayTeam.tla)]
                    : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
