// src/lib/parse-predictions.ts
// Pure parse functions with no file I/O — safe to import in tests and production code.

import { EXCEL_NAME_TO_TLA } from './team-map'
import type { GroupPrediction, PickResult, Stage } from './types'

export function parseGroupPrediction(raw: string): GroupPrediction | null {
  if (!raw || raw === 'Pendiente' || raw === '-' || raw === '') return null
  // Strip prefix if present: "1|2-0" → "2-0", "X|1-1" → "1-1", "Local|2-1" → "2-1"
  const cleaned = raw.includes('|') ? raw.split('|').slice(1).join('|') : raw
  const match = cleaned.match(/^(\d+)-(\d+)$/)
  if (!match) return null
  const homeGoals = parseInt(match[1])
  const awayGoals = parseInt(match[2])
  let pick: PickResult
  if (homeGoals > awayGoals) pick = 'home'
  else if (awayGoals > homeGoals) pick = 'away'
  else pick = 'draw'
  return { homeGoals, awayGoals, pick }
}

// Lighter form of knockout prediction returned by the standalone parser. The full
// KnockoutPrediction in types.ts includes slot/homeTla/awayTla, which require the
// surrounding row context that's only available inside the extractor script.
export interface SimpleKnockoutPrediction {
  advancingTeamTla: string
  round: Stage
}

export function parseKnockoutPrediction(raw: string, round: Stage = 'ROUND_OF_32'): SimpleKnockoutPrediction | null {
  if (!raw || raw === 'Pendiente' || raw === '-' || raw === '') return null
  const tla = EXCEL_NAME_TO_TLA[raw.trim()]
  if (!tla) return null
  return { advancingTeamTla: tla, round }
}
