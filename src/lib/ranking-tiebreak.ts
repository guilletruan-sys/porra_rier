// src/lib/ranking-tiebreak.ts
//
// Criterio oficial de desempate del Eurofund 2026 World Cup Pool (regla 2.c):
//
//   0. Más puntos totales (criterio principal del ranking).
//   i. Quien haya acertado el campeón del Mundial.
//  ii. Quien tenga más goles del jugador que eligió como pichichi.
//      Caso especial: si dos o más jugadores acaban con los mismos goles como
//      pichichi oficial del Mundial, todos los participantes que eligieron a
//      cualquiera de ellos están empatados en este criterio.
// iii. Quien tenga más resultados exactos en la fase de grupos.
//  iv. Quien tenga más puntos en la fase de grupos.
//   v. Si persiste el empate, en el ranking salen con el mismo `rank`.

import type { Match, ParticipantScore, PredictionsData } from './types'

export interface TiebreakCtx {
  /** TLA del campeón real, o null si la final aún no ha terminado. */
  actualChampion: string | null
  /** Nombres (lower-case) de los pichichis oficiales del torneo (los que comparten goal-count máximo). */
  topScorersOfficial: Set<string>
  /** Goles por jugador (key = nombre lower-case). Vacío si /scorers no respondió. */
  goalsByPlayer: Record<string, number>
  /** participantName → cuántos breakdown[].reason === 'exact'. */
  exactCount: Record<string, number>
  /** participantName → predictions[name] (cache para no llamar al map en cada compare). */
  predictionsByName: PredictionsData
}

function winnerTla(m: Match): string | null {
  if (m.score?.winner === 'HOME_TEAM') return m.homeTeam?.tla ?? null
  if (m.score?.winner === 'AWAY_TEAM') return m.awayTeam?.tla ?? null
  return null
}

function extractActualChampion(matches: Match[]): string | null {
  const final = matches.find(m => m.stage === 'FINAL' && m.status === 'FINISHED')
  return final ? winnerTla(final) : null
}

interface ScorerLike {
  player?: { name?: string | null } | null
  goals?: number | null
}

/** Construye `topScorersOfficial` + `goalsByPlayer` a partir de /api/scorers. */
async function fetchScorerData(): Promise<{ topScorersOfficial: Set<string>; goalsByPlayer: Record<string, number> }> {
  const empty = { topScorersOfficial: new Set<string>(), goalsByPlayer: {} as Record<string, number> }
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) return empty
  try {
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=50',
      {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 60 },
      },
    )
    if (!res.ok) return empty
    const data = await res.json()
    const scorers: ScorerLike[] = data?.scorers ?? []
    const goalsByPlayer: Record<string, number> = {}
    let max = 0
    for (const s of scorers) {
      const name = s.player?.name?.toLowerCase().trim()
      const goals = typeof s.goals === 'number' ? s.goals : 0
      if (!name) continue
      goalsByPlayer[name] = goals
      if (goals > max) max = goals
    }
    if (max === 0) return { topScorersOfficial: new Set<string>(), goalsByPlayer }
    const topScorersOfficial = new Set<string>(
      Object.entries(goalsByPlayer)
        .filter(([, g]) => g === max)
        .map(([n]) => n),
    )
    return { topScorersOfficial, goalsByPlayer }
  } catch {
    return empty
  }
}

function countExactByParticipant(participants: string[], predictions: PredictionsData, matches: Match[]): Record<string, number> {
  // Calculamos directamente desde predictions + matches sin re-correr el scoring entero —
  // sólo necesitamos saber cuántos exactos por participante.
  const counts: Record<string, number> = {}
  for (const name of participants) counts[name] = 0
  for (const m of matches) {
    if (m.stage !== 'GROUP_STAGE') continue
    if (m.status !== 'FINISHED' && m.status !== 'IN_PLAY' && m.status !== 'PAUSED') continue
    const home = m.score?.fullTime?.home
    const away = m.score?.fullTime?.away
    if (home == null || away == null) continue
    const key = `${m.homeTeam?.tla}_${m.awayTeam?.tla}`
    for (const name of participants) {
      const pred = predictions[name]?.groupStage?.[key]
      if (!pred) continue
      if (pred.homeGoals === home && pred.awayGoals === away) counts[name]++
    }
  }
  return counts
}

export async function buildTiebreakCtx(
  matches: Match[],
  predictions: PredictionsData,
  participants: string[],
): Promise<TiebreakCtx> {
  const [scorerData] = await Promise.all([fetchScorerData()])
  return {
    actualChampion: extractActualChampion(matches),
    topScorersOfficial: scorerData.topScorersOfficial,
    goalsByPlayer: scorerData.goalsByPlayer,
    exactCount: countExactByParticipant(participants, predictions, matches),
    predictionsByName: predictions,
  }
}

/**
 * Comparador con cascada oficial. Negativo → `a` primero, positivo → `b` primero, 0 → empate persistente.
 */
export function compareWithTiebreak(a: ParticipantScore, b: ParticipantScore, ctx: TiebreakCtx): number {
  if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints

  const p1 = ctx.predictionsByName[a.name]
  const p2 = ctx.predictionsByName[b.name]

  // i — acertar el campeón
  if (ctx.actualChampion) {
    const aOk = p1?.specials?.champion === ctx.actualChampion ? 1 : 0
    const bOk = p2?.specials?.champion === ctx.actualChampion ? 1 : 0
    if (aOk !== bOk) return bOk - aOk
  }

  // ii — goles del pichichi elegido (con regla "ambos eligieron a un pichichi oficial → empate")
  if (Object.keys(ctx.goalsByPlayer).length > 0) {
    const aKey = (p1?.specials?.goldenBoot ?? '').toLowerCase().trim()
    const bKey = (p2?.specials?.goldenBoot ?? '').toLowerCase().trim()
    const aIsOfficial = aKey !== '' && ctx.topScorersOfficial.has(aKey)
    const bIsOfficial = bKey !== '' && ctx.topScorersOfficial.has(bKey)
    if (!(aIsOfficial && bIsOfficial)) {
      const aGoals = ctx.goalsByPlayer[aKey] ?? 0
      const bGoals = ctx.goalsByPlayer[bKey] ?? 0
      if (aGoals !== bGoals) return bGoals - aGoals
    }
  }

  // iii — exactos en grupo
  const aExact = ctx.exactCount[a.name] ?? 0
  const bExact = ctx.exactCount[b.name] ?? 0
  if (aExact !== bExact) return bExact - aExact

  // iv — puntos en grupo
  if (a.groupStagePoints !== b.groupStagePoints) return b.groupStagePoints - a.groupStagePoints

  // v — empate persistente
  return 0
}
