// src/lib/real-bracket.ts
//
// Resuelve el cuadro REAL del Mundial slot a slot: coloca cada cruce R32 en su
// posición FIFA (vía posiciones de grupo) y propaga los ganadores hacia delante
// (octavos → cuartos → semis → final + 3er puesto) a medida que terminan los
// partidos — sin esperar a que football-data publique los equipos de la
// siguiente ronda. Cuando football-data sí publica el partido real (con equipos)
// se engancha para mostrar marcador/estado.
import type { Match, Stage } from './types'
import { computeConfirmedPositions } from './qualifications'
import {
  LEFT_R32_SLOTS, RIGHT_R32_SLOTS,
  LEFT_R16_SLOTS, RIGHT_R16_SLOTS,
  LEFT_QF_SLOTS, RIGHT_QF_SLOTS,
  LEFT_SF_SLOT, RIGHT_SF_SLOT,
  FINAL_SLOT, THIRD_PLACE_SLOT, SLOT_WNUM,
} from './wc-bracket'

export interface ResolvedSlot {
  slot: string
  stage: Stage
  homeTla: string | null
  awayTla: string | null
  match: Match | null      // partido real enganchado a este slot (si se identifica)
  winnerTla: string | null
  loserTla: string | null
}

const WNUM_SLOT: Record<number, string> = Object.fromEntries(
  Object.entries(SLOT_WNUM).map(([slot, n]) => [n, slot]),
)

function matchWinner(m: Match | null): string | null {
  if (!m || m.status !== 'FINISHED') return null
  if (m.score?.winner === 'HOME_TEAM') return m.homeTeam?.tla ?? null
  if (m.score?.winner === 'AWAY_TEAM') return m.awayTeam?.tla ?? null
  return null
}

function otherTeam(m: Match | null, tla: string | null): string | null {
  if (!m || !tla) return null
  if (m.homeTeam?.tla === tla) return m.awayTeam?.tla ?? null
  if (m.awayTeam?.tla === tla) return m.homeTeam?.tla ?? null
  return null
}

const isDeterminate = (tag: string) => /^[12][A-L]$/.test(tag)

export function resolveRealBracket(matches: Match[]): Map<string, ResolvedSlot> {
  const positions = computeConfirmedPositions(matches)
  const resolved = new Map<string, ResolvedSlot>()

  const r32Matches = matches.filter(m => m.stage === 'ROUND_OF_32')
  const findR32ByTla = (tla: string | null): Match | null =>
    tla ? (r32Matches.find(m => m.homeTeam?.tla === tla || m.awayTeam?.tla === tla) ?? null) : null

  const stageMatchByTeams = (stage: Stage, a: string | null, b: string | null): Match | null => {
    if (!a || !b) return null
    return matches.find(m => m.stage === stage && (
      (m.homeTeam?.tla === a && m.awayTeam?.tla === b) ||
      (m.homeTeam?.tla === b && m.awayTeam?.tla === a)
    )) ?? null
  }

  const setSlot = (slot: string, stage: Stage, homeTla: string | null, awayTla: string | null, match: Match | null) => {
    const winnerTla = matchWinner(match)
    const loserTla = winnerTla ? otherTeam(match, winnerTla) : null
    resolved.set(slot, { slot, stage, homeTla, awayTla, match, winnerTla, loserTla })
  }
  const winnerOf = (slot: string) => resolved.get(slot)?.winnerTla ?? null
  const loserOf = (slot: string) => resolved.get(slot)?.loserTla ?? null

  // --- R32: ubica cada slot por su tag determinable (1X/2X) → equipo → partido real ---
  for (const slot of [...LEFT_R32_SLOTS, ...RIGHT_R32_SLOTS]) {
    const [homeTag, awayTag] = slot.split('-')
    const det = [homeTag, awayTag].find(isDeterminate) ?? null
    const detTla = det ? positions.get(det) ?? null : null
    const match = findR32ByTla(detTla)
    if (match) {
      setSlot(slot, 'ROUND_OF_32', match.homeTeam?.tla ?? null, match.awayTeam?.tla ?? null, match)
    } else {
      const h = isDeterminate(homeTag) ? positions.get(homeTag) ?? null : null
      const a = isDeterminate(awayTag) ? positions.get(awayTag) ?? null : null
      setSlot(slot, 'ROUND_OF_32', h, a, null)
    }
  }

  // --- R16 / QF / SF / Final: propaga ganadores por número FIFA (Wn) ---
  const stageSlots: [Stage, readonly string[]][] = [
    ['ROUND_OF_16', [...LEFT_R16_SLOTS, ...RIGHT_R16_SLOTS]],
    ['QUARTER_FINALS', [...LEFT_QF_SLOTS, ...RIGHT_QF_SLOTS]],
    ['SEMI_FINALS', [LEFT_SF_SLOT, RIGHT_SF_SLOT]],
    ['FINAL', [FINAL_SLOT]],
  ]
  for (const [stage, slots] of stageSlots) {
    for (const slot of slots) {
      const [wa, wb] = slot.split('-')                 // 'W74','W77'
      const home = winnerOf(WNUM_SLOT[Number(wa.slice(1))])
      const away = winnerOf(WNUM_SLOT[Number(wb.slice(1))])
      setSlot(slot, stage, home, away, stageMatchByTeams(stage, home, away))
    }
  }

  // --- 3er puesto: perdedores de las dos semifinales (L101 / L102) ---
  const [la, lb] = THIRD_PLACE_SLOT.split('-')         // 'L101','L102'
  const tpHome = loserOf(WNUM_SLOT[Number(la.slice(1))])
  const tpAway = loserOf(WNUM_SLOT[Number(lb.slice(1))])
  setSlot(THIRD_PLACE_SLOT, 'THIRD_PLACE', tpHome, tpAway, stageMatchByTeams('THIRD_PLACE', tpHome, tpAway))

  // --- Fecha/estado en rondas aún sin equipos ---
  // Dentro de cada ronda, football-data ordena los partidos por número FIFA (Wn),
  // así que el orden por id equivale al orden de Wn. Enganchamos el partido real a
  // cada slot por esa posición SOLO para mostrar fecha/hora cuando aún no se pudo
  // enganchar por equipos (no altera equipos ni ganador, que vienen de la propagación).
  const WN_RANGES: Array<[Stage, number, number]> = [
    ['ROUND_OF_16', 89, 96], ['QUARTER_FINALS', 97, 100], ['SEMI_FINALS', 101, 102], ['FINAL', 103, 103],
  ]
  for (const [stage, lo, hi] of WN_RANGES) {
    const roundMatches = matches.filter(m => m.stage === stage).sort((a, b) => a.id - b.id)
    for (let wn = lo; wn <= hi; wn++) {
      const r = resolved.get(WNUM_SLOT[wn])
      const m = roundMatches[wn - lo]
      if (r && !r.match && m) r.match = m
    }
  }
  const tpMatch = matches.find(m => m.stage === 'THIRD_PLACE')
  const tpSlot = resolved.get(THIRD_PLACE_SLOT)
  if (tpSlot && !tpSlot.match && tpMatch) tpSlot.match = tpMatch

  return resolved
}
