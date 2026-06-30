// Datos simulados para el prototipo "porra viva".
// Los 16 cruces R32 oficiales con equipos plausibles. Los kickoffs son relativos
// a `simulatedNow` del admin — no son fechas reales.

export interface MockCross {
  slot: string                // slot oficial FIFA, ej. "2A-2B"
  round: 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'THIRD_PLACE' | 'FINAL'
  home: string                // TLA
  away: string
  /** Horas a partir de `simulatedNow` cuando empieza el partido. */
  kickoffHoursFromNow: number
}

// 16 cruces R32 — los slots oficiales del WC 2026 con equipos plausibles.
// Orden visual (top→bottom, side izq + side der) tomado de wc-bracket.ts.
export const MOCK_R32: MockCross[] = [
  // Lado izquierdo (8)
  { slot: '1E-3ABCDF',  round: 'ROUND_OF_32', home: 'GER', away: 'RSA', kickoffHoursFromNow: 12 },
  { slot: '1I-3CDFGH',  round: 'ROUND_OF_32', home: 'FRA', away: 'JPN', kickoffHoursFromNow: 14 },
  { slot: '2A-2B',      round: 'ROUND_OF_32', home: 'ESP', away: 'MAR', kickoffHoursFromNow: 18 },
  { slot: '1F-2C',      round: 'ROUND_OF_32', home: 'NED', away: 'SCO', kickoffHoursFromNow: 20 },
  { slot: '2K-2L',      round: 'ROUND_OF_32', home: 'CRO', away: 'URU', kickoffHoursFromNow: 36 },
  { slot: '1H-2J',      round: 'ROUND_OF_32', home: 'ESP', away: 'KOR', kickoffHoursFromNow: 38 },
  { slot: '1D-3BEFIJ',  round: 'ROUND_OF_32', home: 'USA', away: 'SUI', kickoffHoursFromNow: 42 },
  { slot: '1G-3AEHIJ',  round: 'ROUND_OF_32', home: 'BEL', away: 'SEN', kickoffHoursFromNow: 44 },
  // Lado derecho (8)
  { slot: '1C-2F',      round: 'ROUND_OF_32', home: 'BRA', away: 'SWE', kickoffHoursFromNow: 13 },
  { slot: '2E-2I',      round: 'ROUND_OF_32', home: 'ECU', away: 'NOR', kickoffHoursFromNow: 15 },
  { slot: '1A-3CEFHI',  round: 'ROUND_OF_32', home: 'CAN', away: 'CIV', kickoffHoursFromNow: 19 },
  { slot: '1L-3EHIJK',  round: 'ROUND_OF_32', home: 'ENG', away: 'UZB', kickoffHoursFromNow: 21 },
  { slot: '2D-2G',      round: 'ROUND_OF_32', home: 'TUR', away: 'IRN', kickoffHoursFromNow: 37 },
  { slot: '1J-2H',      round: 'ROUND_OF_32', home: 'ARG', away: 'POL', kickoffHoursFromNow: 39 },
  { slot: '1B-3EFGIJ',  round: 'ROUND_OF_32', home: 'COL', away: 'NZL', kickoffHoursFromNow: 43 },
  { slot: '1K-3DEIJL',  round: 'ROUND_OF_32', home: 'POR', away: 'GHA', kickoffHoursFromNow: 45 },
]

// Predicciones preset de los 12 OTROS participantes — para que el sandbox se sienta
// "habitado". El usuario controla las suyas; estas son ficticias pero plausibles.
// Cada participante tiene un sesgo: favorito por equipo, optimista/pesimista, etc.
export const MOCK_OTHERS_PREDICTIONS: Record<string, Record<string, string>> = {
  'Joss': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'FRA', '2A-2B': 'ESP', '1F-2C': 'NED',
    '2K-2L': 'CRO', '1H-2J': 'ESP', '1D-3BEFIJ': 'USA', '1G-3AEHIJ': 'BEL',
    '1C-2F': 'BRA', '2E-2I': 'ECU', '1A-3CEFHI': 'CAN', '1L-3EHIJK': 'ENG',
    '2D-2G': 'TUR', '1J-2H': 'ARG', '1B-3EFGIJ': 'COL', '1K-3DEIJL': 'POR',
  },
  'Crespo': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'FRA', '2A-2B': 'ESP', '1F-2C': 'NED',
    '2K-2L': 'URU', '1H-2J': 'ESP', '1D-3BEFIJ': 'SUI', '1G-3AEHIJ': 'BEL',
    '1C-2F': 'BRA', '2E-2I': 'NOR', '1A-3CEFHI': 'CIV', '1L-3EHIJK': 'ENG',
    '2D-2G': 'IRN', '1J-2H': 'ARG', '1B-3EFGIJ': 'COL', '1K-3DEIJL': 'POR',
  },
  'Hugo': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'FRA', '2A-2B': 'MAR', '1F-2C': 'NED',
    '2K-2L': 'CRO', '1H-2J': 'ESP', '1D-3BEFIJ': 'USA', '1G-3AEHIJ': 'BEL',
    '1C-2F': 'BRA', '2E-2I': 'ECU', '1A-3CEFHI': 'CAN', '1L-3EHIJK': 'ENG',
    '2D-2G': 'TUR', '1J-2H': 'ARG', '1B-3EFGIJ': 'COL', '1K-3DEIJL': 'POR',
  },
  'SaTa': {
    '1E-3ABCDF': 'RSA', '1I-3CDFGH': 'JPN', '2A-2B': 'ESP', '1F-2C': 'SCO',
    '2K-2L': 'URU', '1H-2J': 'KOR', '1D-3BEFIJ': 'SUI', '1G-3AEHIJ': 'SEN',
    '1C-2F': 'SWE', '2E-2I': 'NOR', '1A-3CEFHI': 'CIV', '1L-3EHIJK': 'UZB',
    '2D-2G': 'IRN', '1J-2H': 'POL', '1B-3EFGIJ': 'NZL', '1K-3DEIJL': 'GHA',
  },
  'Josete 2.0': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'FRA', '2A-2B': 'ESP', '1F-2C': 'NED',
    '2K-2L': 'CRO', '1H-2J': 'ESP', '1D-3BEFIJ': 'USA', '1G-3AEHIJ': 'BEL',
    '1C-2F': 'BRA', '2E-2I': 'ECU', '1A-3CEFHI': 'CAN', '1L-3EHIJK': 'ENG',
    '2D-2G': 'TUR', '1J-2H': 'ARG', '1B-3EFGIJ': 'COL', '1K-3DEIJL': 'POR',
  },
  'ALMAN Y JOTA': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'FRA', '2A-2B': 'ESP', '1F-2C': 'NED',
    '2K-2L': 'CRO', '1H-2J': 'ESP', '1D-3BEFIJ': 'USA', '1G-3AEHIJ': 'SEN',
    '1C-2F': 'BRA', '2E-2I': 'ECU', '1A-3CEFHI': 'CAN', '1L-3EHIJK': 'ENG',
    '2D-2G': 'TUR', '1J-2H': 'ARG', '1B-3EFGIJ': 'COL', '1K-3DEIJL': 'POR',
  },
  'Rier': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'JPN', '2A-2B': 'ESP', '1F-2C': 'NED',
    '2K-2L': 'CRO', '1H-2J': 'ESP', '1D-3BEFIJ': 'USA', '1G-3AEHIJ': 'BEL',
    '1C-2F': 'BRA', '2E-2I': 'ECU', '1A-3CEFHI': 'CIV', '1L-3EHIJK': 'ENG',
    '2D-2G': 'TUR', '1J-2H': 'ARG', '1B-3EFGIJ': 'COL', '1K-3DEIJL': 'POR',
  },
  'Foca': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'FRA', '2A-2B': 'MAR', '1F-2C': 'NED',
    '2K-2L': 'CRO', '1H-2J': 'ESP', '1D-3BEFIJ': 'SUI', '1G-3AEHIJ': 'BEL',
    '1C-2F': 'BRA', '2E-2I': 'NOR', '1A-3CEFHI': 'CAN', '1L-3EHIJK': 'ENG',
    '2D-2G': 'TUR', '1J-2H': 'ARG', '1B-3EFGIJ': 'COL', '1K-3DEIJL': 'POR',
  },
  'CEICH': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'FRA', '2A-2B': 'ESP', '1F-2C': 'NED',
    '2K-2L': 'CRO', '1H-2J': 'ESP', '1D-3BEFIJ': 'USA', '1G-3AEHIJ': 'BEL',
    '1C-2F': 'SWE', '2E-2I': 'ECU', '1A-3CEFHI': 'CAN', '1L-3EHIJK': 'ENG',
    '2D-2G': 'TUR', '1J-2H': 'ARG', '1B-3EFGIJ': 'NZL', '1K-3DEIJL': 'POR',
  },
  'Popi': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'FRA', '2A-2B': 'ESP', '1F-2C': 'NED',
    '2K-2L': 'URU', '1H-2J': 'ESP', '1D-3BEFIJ': 'USA', '1G-3AEHIJ': 'BEL',
    '1C-2F': 'BRA', '2E-2I': 'ECU', '1A-3CEFHI': 'CIV', '1L-3EHIJK': 'ENG',
    '2D-2G': 'IRN', '1J-2H': 'ARG', '1B-3EFGIJ': 'COL', '1K-3DEIJL': 'POR',
  },
  'Javier': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'FRA', '2A-2B': 'ESP', '1F-2C': 'NED',
    '2K-2L': 'CRO', '1H-2J': 'ESP', '1D-3BEFIJ': 'USA', '1G-3AEHIJ': 'BEL',
    '1C-2F': 'BRA', '2E-2I': 'ECU', '1A-3CEFHI': 'CAN', '1L-3EHIJK': 'ENG',
    '2D-2G': 'TUR', '1J-2H': 'ARG', '1B-3EFGIJ': 'COL', '1K-3DEIJL': 'POR',
  },
  'Mario L.R': {
    '1E-3ABCDF': 'GER', '1I-3CDFGH': 'FRA', '2A-2B': 'ESP', '1F-2C': 'SCO',
    '2K-2L': 'CRO', '1H-2J': 'ESP', '1D-3BEFIJ': 'USA', '1G-3AEHIJ': 'BEL',
    '1C-2F': 'BRA', '2E-2I': 'ECU', '1A-3CEFHI': 'CAN', '1L-3EHIJK': 'ENG',
    '2D-2G': 'TUR', '1J-2H': 'ARG', '1B-3EFGIJ': 'COL', '1K-3DEIJL': 'POR',
  },
}

export const DEMO_PARTICIPANTS = [
  'Joss', 'Josete 2.0', 'Crespo', 'SaTa', 'Guille', 'Hugo',
  'ALMAN Y JOTA', 'Rier', 'Foca', 'CEICH', 'Popi', 'Javier', 'Mario L.R',
] as const

export type DemoParticipantName = typeof DEMO_PARTICIPANTS[number]

/** Devuelve el porcentaje de "% del grupo dice X" para un slot dado, incluyendo al usuario. */
export function aggregateOpinion(
  slot: string,
  mySelection: string | null,
): Record<string, number> {
  const counts: Record<string, number> = {}
  let total = 0
  // Predicciones preset
  for (const preds of Object.values(MOCK_OTHERS_PREDICTIONS)) {
    const tla = preds[slot]
    if (!tla) continue
    counts[tla] = (counts[tla] ?? 0) + 1
    total++
  }
  if (mySelection) {
    counts[mySelection] = (counts[mySelection] ?? 0) + 1
    total++
  }
  if (total === 0) return {}
  const out: Record<string, number> = {}
  for (const tla of Object.keys(counts)) {
    out[tla] = counts[tla] / total
  }
  return out
}
