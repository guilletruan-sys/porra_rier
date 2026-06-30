// src/lib/types.ts

export type Stage =
  | 'GROUP_STAGE'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL'

export type MatchStatus = 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED'

export type MatchResult = 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null

export interface Team {
  id: number
  name: string
  shortName: string
  tla: string           // 3-letter code, e.g. "MEX"
  crest: string         // URL to team badge/flag
}

export interface Score {
  winner: MatchResult
  fullTime: { home: number | null; away: number | null }
  halfTime: { home: number | null; away: number | null }
  // Presentes en eliminatorias que van más allá del tiempo reglamentario.
  // OJO: football-data mete los penaltis dentro de `fullTime` (p.ej. 1-1 + pen 3-4 → fullTime 4-5).
  duration?: string  // 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT'
  regularTime?: { home: number | null; away: number | null }
  extraTime?: { home: number | null; away: number | null }
  penalties?: { home: number | null; away: number | null }
}

export interface Match {
  id: number
  utcDate: string       // ISO 8601
  status: MatchStatus
  matchday: number | null
  stage: Stage
  group: string | null  // e.g. "GROUP_A"
  homeTeam: Team
  awayTeam: Team
  score: Score
  minute?: number | null      // current play minute when IN_PLAY/PAUSED
  injuryTime?: number | null  // injury time minutes when applicable
}

export interface MatchEventPlayer {
  id: number
  name: string
}

export interface MatchGoal {
  minute: number | null
  injuryTime: number | null
  type: 'REGULAR' | 'OWN' | 'PENALTY' | string
  team: { id: number; name: string }
  scorer: MatchEventPlayer | null
  assist: MatchEventPlayer | null
  score: { home: number; away: number }
}

export interface MatchBooking {
  minute: number | null
  team: { id: number; name: string }
  player: MatchEventPlayer
  card: 'YELLOW' | 'RED' | 'YELLOW_RED' | string
}

export interface MatchPlayer {
  id: number
  name: string
  position: string        // 'Goalkeeper' | 'Defence' | 'Midfield' | 'Offence' | etc
  shirtNumber: number
}

export interface MatchSubstitution {
  minute: number | null
  team: { id: number; name: string }
  playerOut: MatchEventPlayer
  playerIn: MatchEventPlayer
}

export interface MatchReferee {
  id: number
  name: string
  type: string
  nationality: string
}

export interface MatchDetails extends Match {
  goals: MatchGoal[]
  bookings: MatchBooking[]
  substitutions: MatchSubstitution[]
  venue?: string
  attendance?: number
  referees?: MatchReferee[]
  homeFormation?: string
  homeLineup?: MatchPlayer[]
  homeBench?: MatchPlayer[]
  awayFormation?: string
  awayLineup?: MatchPlayer[]
  awayBench?: MatchPlayer[]
}

// ---- Prediction data (from Excel) ----

export type PickResult = 'home' | 'away' | 'draw'

export interface GroupPrediction {
  homeGoals: number
  awayGoals: number
  pick: PickResult      // derived from goals
}

export interface KnockoutPrediction {
  slot: string               // official FIFA bracket slot ("2A-2B", "W73-W75", …)
  homeTla: string            // TLA of the team this participant predicted on the home side
  awayTla: string            // TLA of the team this participant predicted on the away side
  advancingTeamTla: string   // TLA of the team predicted to advance from this matchup
  round: Stage               // which knockout round this prediction belongs to
}

/** Top-3 de una categoría (oro/plata/bronce) — la Rier puntúa los tres. */
export interface TopThreePick {
  first: string
  second: string
  third: string
}

export interface SpecialPredictions {
  goldenBoot: TopThreePick   // pichichi: oro/plata/bronce
  goldenBall: TopThreePick   // mejor jugador: oro/plata/bronce
  champion: string           // team TLA
  runnerUp: string           // team TLA
  thirdPlace: string         // team TLA
}

// matchKey format: "MEX_RSA" (home TLA _ away TLA)
export type MatchKey = string

export interface ParticipantPredictions {
  groupStage: Record<MatchKey, GroupPrediction>
  knockout: Record<MatchKey, KnockoutPrediction>
  specials: SpecialPredictions
}

export type PredictionsData = Record<string, ParticipantPredictions>  // participantName → predictions

// ---- Scoring ----

export interface MatchPoints {
  matchKey: MatchKey
  points: number
  reason: 'exact' | 'result' | 'knockout_correct' | 'r32_qualify' | 'miss' | 'pending'
}

export interface ParticipantScore {
  name: string
  totalPoints: number
  groupStagePoints: number
  knockoutPoints: number
  specialsPoints: number
  /**
   * Puntos que YA se sabe que se van a sumar al cerrar la fase de grupos
   * pero todavía no están consolidados (típicamente: r32_qualify cuando
   * football-data ya publicó algunos TLAs en R32 pero aún quedan grupos).
   * No se suman a totalPoints; existen sólo para mostrarlos como avance.
   */
  pendingKnockoutPoints?: number
  /**
   * Puntos de KO/especiales que el participante todavía tiene VIVOS (en juego):
   * predicciones cuyo equipo sigue en el cuadro y aún no se han consolidado ni
   * perdido. No se suman a totalPoints; sirven para mostrar cuánto puede cambiar.
   */
  inPlayKnockoutPoints?: number
  breakdown: MatchPoints[]
  previousRank?: number
}

export interface RankingEntry extends ParticipantScore {
  rank: number
  rankDelta: number     // positive = moved up, negative = moved down
  pointsDelta: number   // points gained (positive) or lost (negative) by the latest scoring event
  deltaStatus?: 'finished' | 'live'   // 'live' = delta is due to an in-play match (may revert); 'finished' = consolidated
  tied?: boolean        // true when sharing rank with the previous entry after applying every official tiebreaker
}
