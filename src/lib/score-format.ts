// src/lib/score-format.ts
//
// En eliminatorias football-data mete el resultado de los penaltis DENTRO de
// `fullTime` (p.ej. 1-1 + penaltis 3-4 → fullTime 4-5). Para mostrarlo bien
// queremos el marcador al final del juego (reglamentario + prórroga) y, aparte,
// el de la tanda. Esto deriva ambos.
import type { Score } from './types'

export interface DisplayScore {
  home: number
  away: number
  /** Resultado de la tanda de penaltis, solo si el partido se decidió así. */
  pens?: { home: number; away: number }
}

export function displayScore(score: Score): DisplayScore {
  const ftH = score.fullTime?.home ?? 0
  const ftA = score.fullTime?.away ?? 0
  const pen = score.penalties
  const decidedOnPens =
    score.duration === 'PENALTY_SHOOTOUT' && !!pen && (pen.home != null || pen.away != null)

  if (!decidedOnPens) return { home: ftH, away: ftA }

  const penH = pen!.home ?? 0
  const penA = pen!.away ?? 0
  // Marcador al final del juego: reg + prórroga si están; si no, fullTime − penaltis.
  const reg = score.regularTime
  const et = score.extraTime
  const play = reg
    ? { home: (reg.home ?? 0) + (et?.home ?? 0), away: (reg.away ?? 0) + (et?.away ?? 0) }
    : { home: ftH - penH, away: ftA - penA }

  return { home: play.home, away: play.away, pens: { home: penH, away: penA } }
}
