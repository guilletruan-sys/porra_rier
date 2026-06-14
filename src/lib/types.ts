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
  advancingTeamTla: string   // TLA of team predicted to advance
  round: Stage               // which knockout round this prediction belongs to
}

export interface TopThree {
  first: string              // 🥇 Oro  (3 pts si acierta)
  second: string             // 🥈 Plata (2 pts si acierta)
  third: string              // 🥉 Bronce (1 pt si acierta)
}

export interface SpecialPredictions {
  goldenBoot: TopThree       // top scorer top-3 picks
  goldenBall: TopThree       // best player top-3 picks
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
  breakdown: MatchPoints[]
  previousRank?: number
}

export interface RankingEntry extends ParticipantScore {
  rank: number
  rankDelta: number   // positive = moved up, negative = moved down
}
