// src/lib/knockout-journey.ts
//
// "Por equipo" view of a participant's knockout fortune. Group-stage scoring is
// per-match and easy to follow; the knockout phase mixes three point sources that
// land at different times (qualify to R32, advance per round, team specials), so the
// natural unit here is "a team you backed and how far it goes". This module turns a
// participant's predictions + the live bracket into, per backed team, a cascade of
// point items each tagged asegurado / en juego / perdido (locked / inplay / lost).
import type { Match, ParticipantPredictions, PredictionsData, Stage } from './types'

// Points awarded for correctly predicting a team to WIN its match in each round.
// (Winning SEMI_FINALS reaches the final — that is scored via champion/runner-up specials.)
export const ADVANCE_POINTS: Partial<Record<Stage, number>> = {
  ROUND_OF_32: 5,
  ROUND_OF_16: 7,
  QUARTER_FINALS: 10,
}
export const R32_QUALIFY_POINTS = 3 // per team correctly predicted to be in R32

// Team-based special outcomes. Accepts the wider ActualOutcomes from scoring.ts too
// (extra goldenBoot/goldenBall fields are simply ignored — they are player bets, not
// per-team, and stay out of the journey).
export interface KnockoutOutcomes {
  champion?: string
  runnerUp?: string
  thirdPlace?: string
}

export type PointState = 'locked' | 'inplay' | 'lost'

export interface JourneyItem {
  source: 'r32_qualify' | 'advance' | 'champion' | 'runnerUp' | 'thirdPlace'
  round?: Stage
  label: string
  points: number
  state: PointState
}

export interface TeamJourney {
  tla: string
  deepestLabel: string       // how far you predicted them ("Campeón", "Semis", …)
  alive: boolean             // still alive in the real tournament
  eliminatedRound?: Stage    // where they were knocked out (only when !alive)
  locked: number
  inPlay: number
  lost: number
  items: JourneyItem[]       // the cascade, ordered qualify → advances → specials
}

export interface KnockoutBreakdown {
  locked: number
  inPlay: number
  lost: number
  teams: TeamJourney[]
}

const ADVANCE_ROUNDS: Stage[] = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS']

const ADVANCE_LABEL: Record<string, string> = {
  ROUND_OF_32: 'Gana dieciseisavos',
  ROUND_OF_16: 'Gana octavos',
  QUARTER_FINALS: 'Gana cuartos',
}

// "hasta dónde lo predijiste" — depth (for sorting) + label (for display).
const ELIM_LABEL: Record<string, string> = {
  ROUND_OF_32: 'dieciseisavos',
  ROUND_OF_16: 'octavos',
  QUARTER_FINALS: 'cuartos',
  SEMI_FINALS: 'semis',
  THIRD_PLACE: '3er puesto',
  FINAL: 'la final',
}

export function computeKnockoutJourney(
  preds: ParticipantPredictions,
  matches: Match[],
  actual?: KnockoutOutcomes,
): KnockoutBreakdown {
  const groupStageDone = !matches.some(m => m.stage === 'GROUP_STAGE' && m.status !== 'FINISHED')

  // --- Build participant's stakes from their predictions ---
  const r32Teams = new Set<string>()
  const advancers: Partial<Record<Stage, Set<string>>> = {}
  const stakeTeams = new Set<string>()
  for (const pred of Object.values(preds.knockout)) {
    if (pred.round === 'ROUND_OF_32') {
      if (pred.homeTla) { r32Teams.add(pred.homeTla); stakeTeams.add(pred.homeTla) }
      if (pred.awayTla) { r32Teams.add(pred.awayTla); stakeTeams.add(pred.awayTla) }
    }
    if (pred.advancingTeamTla) {
      if (!advancers[pred.round]) advancers[pred.round] = new Set()
      advancers[pred.round]!.add(pred.advancingTeamTla)
      stakeTeams.add(pred.advancingTeamTla)
    }
  }
  for (const t of [preds.specials.champion, preds.specials.runnerUp, preds.specials.thirdPlace]) {
    if (t) stakeTeams.add(t)
  }

  // --- Derive the live bracket state from the real matches ---
  const teamsInRound = new Map<string, Set<string>>()   // teams present in each real round (any status)
  const advancedByRound = new Map<string, Set<string>>() // teams that WON a FINISHED match in that round
  const eliminatedRound = new Map<string, Stage>()       // team → round where it lost a FINISHED match
  for (const m of matches) {
    if (m.stage === 'GROUP_STAGE') continue
    if (!teamsInRound.has(m.stage)) teamsInRound.set(m.stage, new Set())
    const present = teamsInRound.get(m.stage)!
    if (m.homeTeam?.tla) present.add(m.homeTeam.tla)
    if (m.awayTeam?.tla) present.add(m.awayTeam.tla)
    if (m.status !== 'FINISHED') continue
    const winner = m.score.winner === 'HOME_TEAM' ? m.homeTeam?.tla
      : m.score.winner === 'AWAY_TEAM' ? m.awayTeam?.tla : null
    if (!winner) continue
    const loser = winner === m.homeTeam?.tla ? m.awayTeam?.tla : m.homeTeam?.tla
    if (!advancedByRound.has(m.stage)) advancedByRound.set(m.stage, new Set())
    advancedByRound.get(m.stage)!.add(winner)
    if (loser) eliminatedRound.set(loser, m.stage)
  }
  const inR32 = (tla: string) => teamsInRound.get('ROUND_OF_32')?.has(tla) ?? false

  // Still alive in the real tournament. Before the R32 is drawn (groups not done)
  // everything is still pending → treat as alive (its points are "en juego").
  const alive = (tla: string): boolean => {
    if (!groupStageDone) return true
    if (eliminatedRound.has(tla)) return false
    return inR32(tla)
  }

  // --- State per point source ---
  const qualifyState = (tla: string): PointState => {
    if (!groupStageDone) return 'inplay'
    return inR32(tla) ? 'locked' : 'lost'
  }
  const advanceState = (round: Stage, tla: string): PointState => {
    if (advancedByRound.get(round)?.has(tla)) return 'locked'
    return alive(tla) ? 'inplay' : 'lost'
  }
  const championState = (tla: string): PointState => {
    if (actual?.champion === tla) return 'locked'
    if (actual?.champion && actual.champion !== tla) return 'lost'
    return alive(tla) ? 'inplay' : 'lost'
  }
  const runnerUpState = (tla: string): PointState => {
    if (actual?.runnerUp === tla) return 'locked'
    if (actual?.runnerUp && actual.runnerUp !== tla) return 'lost'
    if (actual?.champion === tla) return 'lost' // won the final → not runner-up
    if (eliminatedRound.get(tla) === 'FINAL') return 'inplay' // lost final = runner-up
    return alive(tla) ? 'inplay' : 'lost'
  }
  const thirdPlaceState = (tla: string): PointState => {
    if (actual?.thirdPlace === tla) return 'locked'
    if (actual?.thirdPlace && actual.thirdPlace !== tla) return 'lost'
    if (actual?.champion === tla || actual?.runnerUp === tla) return 'lost' // reached the final
    const elim = eliminatedRound.get(tla)
    if (elim === 'FINAL') return 'lost'                              // runner-up, not 3rd
    if (elim && elim !== 'SEMI_FINALS' && elim !== 'THIRD_PLACE') return 'lost' // out before semis
    if (groupStageDone && !inR32(tla)) return 'lost'                 // never qualified
    return 'inplay'
  }

  // --- depth + label per team ("hasta dónde lo predijiste") ---
  const depthAndLabel = (tla: string): { depth: number; label: string } => {
    if (preds.specials.champion === tla) return { depth: 6, label: 'Campeón' }
    if (preds.specials.runnerUp === tla) return { depth: 5, label: 'Subcampeón' }
    if (preds.specials.thirdPlace === tla) return { depth: 4, label: '3er puesto' }
    if (advancers['QUARTER_FINALS']?.has(tla)) return { depth: 3, label: 'Semis' }
    if (advancers['ROUND_OF_16']?.has(tla)) return { depth: 2, label: 'Cuartos' }
    if (advancers['ROUND_OF_32']?.has(tla)) return { depth: 1, label: 'Octavos' }
    return { depth: 0, label: 'Dieciseisavos' }
  }

  // --- Build a journey per team ---
  const depthOf = new Map<string, number>()
  const teams: TeamJourney[] = []
  for (const tla of stakeTeams) {
    const items: JourneyItem[] = []

    if (r32Teams.has(tla)) {
      items.push({ source: 'r32_qualify', label: 'Clasifica a dieciseisavos', points: R32_QUALIFY_POINTS, state: qualifyState(tla) })
    }
    for (const round of ADVANCE_ROUNDS) {
      if (advancers[round]?.has(tla)) {
        items.push({ source: 'advance', round, label: ADVANCE_LABEL[round], points: ADVANCE_POINTS[round]!, state: advanceState(round, tla) })
      }
    }
    if (preds.specials.champion === tla) items.push({ source: 'champion', label: 'Campeón', points: 30, state: championState(tla) })
    if (preds.specials.runnerUp === tla) items.push({ source: 'runnerUp', label: 'Subcampeón', points: 20, state: runnerUpState(tla) })
    if (preds.specials.thirdPlace === tla) items.push({ source: 'thirdPlace', label: '3er puesto', points: 15, state: thirdPlaceState(tla) })

    if (items.length === 0) continue

    let locked = 0, inPlay = 0, lost = 0
    for (const it of items) {
      if (it.state === 'locked') locked += it.points
      else if (it.state === 'inplay') inPlay += it.points
      else lost += it.points
    }
    const { depth, label } = depthAndLabel(tla)
    depthOf.set(tla, depth)
    const isAlive = alive(tla)
    teams.push({
      tla, deepestLabel: label, alive: isAlive,
      eliminatedRound: !isAlive ? eliminatedRound.get(tla) : undefined,
      locked, inPlay, lost, items,
    })
  }

  teams.sort((a, b) =>
    (depthOf.get(b.tla)! - depthOf.get(a.tla)!) ||
    (b.locked + b.inPlay) - (a.locked + a.inPlay) ||
    a.tla.localeCompare(b.tla),
  )

  const totals = teams.reduce(
    (acc, t) => { acc.locked += t.locked; acc.inPlay += t.inPlay; acc.lost += t.lost; return acc },
    { locked: 0, inPlay: 0, lost: 0 },
  )

  return { ...totals, teams }
}

export { ELIM_LABEL }

// ----------------------------------------------------------------------------
// "Qué hay en juego en este partido" — para un cruce KO por jugar, quién suma
// puntos según quién gane. Espejo exacto de la regla de scoring: ganar la ronda
// reparte los pts de avance al equipo que pase; final y 3er puesto reparten los
// especiales (campeón/subcampeón/3º). Las semis no dan puntos directos.
// ----------------------------------------------------------------------------
export type StakeKind = 'advance' | 'final' | 'third' | 'semi'

export interface StakeBeneficiary {
  name: string
  points: number
  label?: string // "Campeón" / "Subcampeón" / "3er puesto" (specials)
}

export interface MatchStakes {
  kind: StakeKind
  advancePoints?: number // sólo para 'advance' (+5/+7/+10)
  home: { tla: string; beneficiaries: StakeBeneficiary[] }
  away: { tla: string; beneficiaries: StakeBeneficiary[] }
}

const byPointsThenName = (a: StakeBeneficiary, b: StakeBeneficiary) =>
  b.points - a.points || a.name.localeCompare(b.name)

export function computeMatchStakes(
  match: Match,
  predictions: PredictionsData,
  participants: string[],
): MatchStakes {
  const round = match.stage
  const home = match.homeTeam?.tla ?? ''
  const away = match.awayTeam?.tla ?? ''
  const homeB: StakeBeneficiary[] = []
  const awayB: StakeBeneficiary[] = []

  const predictsAdvance = (p: ParticipantPredictions, r: Stage, tla: string) =>
    Object.values(p.knockout).some(k => k.round === r && k.advancingTeamTla === tla)

  const pack = (kind: StakeKind, advancePoints?: number): MatchStakes => ({
    kind,
    advancePoints,
    home: { tla: home, beneficiaries: homeB.sort(byPointsThenName) },
    away: { tla: away, beneficiaries: awayB.sort(byPointsThenName) },
  })

  if (round === 'FINAL') {
    for (const name of participants) {
      const sp = predictions[name]?.specials
      if (!sp) continue
      if (sp.champion === home) homeB.push({ name, points: 30, label: 'Campeón' })
      if (sp.runnerUp === away) homeB.push({ name, points: 20, label: 'Subcampeón' })
      if (sp.champion === away) awayB.push({ name, points: 30, label: 'Campeón' })
      if (sp.runnerUp === home) awayB.push({ name, points: 20, label: 'Subcampeón' })
    }
    return pack('final')
  }

  if (round === 'THIRD_PLACE') {
    for (const name of participants) {
      const sp = predictions[name]?.specials
      if (!sp) continue
      if (sp.thirdPlace === home) homeB.push({ name, points: 15, label: '3er puesto' })
      if (sp.thirdPlace === away) awayB.push({ name, points: 15, label: '3er puesto' })
    }
    return pack('third')
  }

  if (round === 'SEMI_FINALS') {
    // Ganar la semi no da puntos directos; muestra quién mantendría vivo su
    // bet de campeón/subcampeón si su equipo llega a la final.
    for (const name of participants) {
      const sp = predictions[name]?.specials
      if (!sp) continue
      if (sp.champion === home) homeB.push({ name, points: 30, label: 'Campeón' })
      if (sp.runnerUp === home) homeB.push({ name, points: 20, label: 'Subcampeón' })
      if (sp.champion === away) awayB.push({ name, points: 30, label: 'Campeón' })
      if (sp.runnerUp === away) awayB.push({ name, points: 20, label: 'Subcampeón' })
    }
    return pack('semi')
  }

  // Rondas de avance directo: R32 / R16 / QF
  const pts = ADVANCE_POINTS[round] ?? 0
  for (const name of participants) {
    const p = predictions[name]
    if (!p) continue
    if (predictsAdvance(p, round, home)) homeB.push({ name, points: pts })
    if (predictsAdvance(p, round, away)) awayB.push({ name, points: pts })
  }
  return pack('advance', pts)
}
