// src/lib/qualifications.ts
//
// Detecta posiciones FIJADAS matemáticamente dentro de cada grupo del Mundial,
// haciendo brute force sobre todos los escenarios posibles de los partidos
// pendientes. Devuelve un Map: '1A' → 'USA', '2A' → 'MEX', ... solo con las
// posiciones que NO pueden cambiar pase lo que pase.
//
// Conservador con los empates: si en algún escenario simulado dos equipos
// quedan empatados en pts / dif goles / goles a favor, declaramos las
// posiciones afectadas como indeterminadas (no las metemos en el map).

import type { Match } from './types'

type Result = 'H' | 'E' | 'A'

interface TeamRecord {
  tla: string
  pts: number
  gf: number
  ga: number
}

function applyResult(rec: TeamRecord, gf: number, ga: number) {
  rec.gf += gf
  rec.ga += ga
  if (gf > ga) rec.pts += 3
  else if (gf === ga) rec.pts += 1
}

/** Ordena por pts > diferencia de goles > goles a favor. NO incluye head-to-head ni fair play. */
function sortRecords(a: TeamRecord, b: TeamRecord): number {
  if (b.pts !== a.pts) return b.pts - a.pts
  const dA = a.gf - a.ga, dB = b.gf - b.ga
  if (dB !== dA) return dB - dA
  return b.gf - a.gf
}

/** Devuelve true si dos team records están empatados en los criterios disponibles. */
function isTie(a: TeamRecord, b: TeamRecord): boolean {
  return a.pts === b.pts && (a.gf - a.ga) === (b.gf - b.ga) && a.gf === b.gf
}

function groupLetter(matchGroup: string | null | undefined): string | null {
  if (!matchGroup) return null
  // football-data devuelve 'GROUP_A' .. 'GROUP_L'
  const m = matchGroup.match(/^GROUP_([A-L])$/)
  return m ? m[1] : null
}

/**
 * Brute-forcea los escenarios pendientes en un grupo y devuelve el set de
 * posiciones (0..3) en las que puede terminar cada equipo del grupo.
 */
function possiblePositionsByTeam(
  played: Match[],
  pending: Match[],
): Map<string, Set<number>> {
  // Inicializa los records con todos los TLAs vistos
  const tlas = new Set<string>()
  for (const m of [...played, ...pending]) {
    if (m.homeTeam?.tla) tlas.add(m.homeTeam.tla)
    if (m.awayTeam?.tla) tlas.add(m.awayTeam.tla)
  }

  function freshRecords(): Map<string, TeamRecord> {
    const r = new Map<string, TeamRecord>()
    for (const tla of tlas) r.set(tla, { tla, pts: 0, gf: 0, ga: 0 })
    return r
  }

  // Aplica los partidos ya jugados — esto es común a todos los escenarios.
  const baseRecords = freshRecords()
  for (const m of played) {
    const home = m.homeTeam?.tla
    const away = m.awayTeam?.tla
    const hg = m.score?.fullTime?.home
    const ag = m.score?.fullTime?.away
    if (!home || !away || hg == null || ag == null) continue
    applyResult(baseRecords.get(home)!, hg, ag)
    applyResult(baseRecords.get(away)!, ag, hg)
  }

  const out = new Map<string, Set<number>>()
  for (const tla of tlas) out.set(tla, new Set())

  // 3^N escenarios. N ≤ 6 (partidos por grupo) → 729 máx.
  const N = pending.length
  const TOTAL = Math.pow(3, N)

  // Marcadores genéricos para los 3 resultados — sin afectar GD/GF irrealistamente
  // (usamos 1-0, 0-0, 0-1 que es neutro y permite el ordenamiento por pts > GD > GF
  //  sin sesgar artificialmente).
  function scoresFor(r: Result): [number, number] {
    if (r === 'H') return [1, 0]
    if (r === 'A') return [0, 1]
    return [0, 0]
  }

  for (let scenario = 0; scenario < TOTAL; scenario++) {
    // Decodifica el escenario en base 3
    const records = new Map<string, TeamRecord>()
    for (const [tla, rec] of baseRecords) records.set(tla, { ...rec })

    let s = scenario
    for (let i = 0; i < N; i++) {
      const r: Result = (['H', 'E', 'A'] as Result[])[s % 3]
      s = Math.floor(s / 3)
      const m = pending[i]
      const home = m.homeTeam?.tla
      const away = m.awayTeam?.tla
      if (!home || !away) continue
      const [hg, ag] = scoresFor(r)
      applyResult(records.get(home)!, hg, ag)
      applyResult(records.get(away)!, ag, hg)
    }

    // Ordena y asigna posición
    const sorted = [...records.values()].sort(sortRecords)
    // Si hay empates AMBIGUOS dentro de los primeros 3 puestos, esos puestos quedan
    // indeterminados. Marcamos como -1 (no añadiremos a las posiciones del equipo).
    const positions: number[] = sorted.map((_, idx) => idx)
    for (let i = 0; i < sorted.length - 1; i++) {
      if (isTie(sorted[i], sorted[i + 1])) {
        // Marca ambos como indeterminados
        positions[i] = -1
        positions[i + 1] = -1
      }
    }
    for (let idx = 0; idx < sorted.length; idx++) {
      const pos = positions[idx]
      if (pos < 0) continue
      out.get(sorted[idx].tla)!.add(pos)
    }
  }

  return out
}

/**
 * Devuelve el mapping de posiciones confirmadas: '1A' → 'USA', '2A' → 'MEX', etc.
 * Solo entradas en las que la posición es matemáticamente única.
 */
export function computeConfirmedPositions(matches: Match[]): Map<string, string> {
  const result = new Map<string, string>()
  const groupMatches = matches.filter(m => m.stage === 'GROUP_STAGE')

  // Agrupa por letra de grupo
  const byGroup = new Map<string, Match[]>()
  for (const m of groupMatches) {
    const g = groupLetter(m.group)
    if (!g) continue
    if (!byGroup.has(g)) byGroup.set(g, [])
    byGroup.get(g)!.push(m)
  }

  for (const [letter, list] of byGroup) {
    const played = list.filter(m => m.status === 'FINISHED')
    const pending = list.filter(m => m.status !== 'FINISHED')

    const posByTeam = possiblePositionsByTeam(played, pending)
    for (const [tla, positions] of posByTeam) {
      if (positions.size !== 1) continue
      const only = positions.values().next().value as number
      // Solo nos interesan 1º (0), 2º (1) y 3º (2). El 4º no clasifica.
      if (only < 0 || only > 2) continue
      const slotTag = `${only + 1}${letter}`   // '1A', '2A', '3A'
      result.set(slotTag, tla)
    }
  }

  return result
}
