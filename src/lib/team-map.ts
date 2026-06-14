// src/lib/team-map.ts

// Maps Excel team name → football-data.org TLA (ISO 3166 alpha-3 based)
export const EXCEL_NAME_TO_TLA: Record<string, string> = {
  // Group A
  'Mexico': 'MEX',
  'South Africa': 'RSA',
  'South Korea': 'KOR',
  'Czech Republic': 'CZE',
  // Group B
  'Canada': 'CAN',
  'Bosnia and Herzegovina': 'BIH',
  'Qatar': 'QAT',
  'Switzerland': 'SUI',
  // Group C
  'Brazil': 'BRA',
  'Morocco': 'MAR',
  'Haiti': 'HAI',
  'Scotland': 'SCO',
  // Group D
  'United States': 'USA',
  'Paraguay': 'PAR',
  'Australia': 'AUS',
  'Turkey': 'TUR',
  // Group E
  'Germany': 'GER',
  'Curaçao': 'CUW',
  'Ivory Coast': 'CIV',
  'Ecuador': 'ECU',
  // Group F
  'Netherlands': 'NED',
  'Japan': 'JPN',
  'Sweden': 'SWE',
  'Tunisia': 'TUN',
  // Group G
  'Belgium': 'BEL',
  'Egypt': 'EGY',
  'Iran': 'IRN',
  'New Zealand': 'NZL',
  // Group H
  'Spain': 'ESP',
  'Cape Verde': 'CPV',
  'Saudi Arabia': 'KSA',
  'Uruguay': 'URU',
  // Group I
  'France': 'FRA',
  'Senegal': 'SEN',
  'Iraq': 'IRQ',
  'Norway': 'NOR',
  // Group J
  'Argentina': 'ARG',
  'Algeria': 'ALG',
  'Austria': 'AUT',
  'Jordan': 'JOR',
  // Group K
  'Portugal': 'POR',
  'DR Congo': 'COD',
  'Uzbekistan': 'UZB',
  'Colombia': 'COL',
  // Group L
  'England': 'ENG',
  'Croatia': 'CRO',
  'Ghana': 'GHA',
  'Panama': 'PAN',
}

export const TLA_TO_EXCEL_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(EXCEL_NAME_TO_TLA).map(([name, tla]) => [tla, name])
)

// Flag emoji by TLA (ISO 3166-1 alpha-2 based flag regional indicator)
const TLA_TO_ALPHA2: Record<string, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz',
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct',
  USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
  ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
}

export function getFlagUrl(tla: string): string {
  const alpha2 = TLA_TO_ALPHA2[tla]
  if (!alpha2) return ''
  return `https://flagcdn.com/w40/${alpha2}.png`
}

export function getMatchKey(homeTla: string, awayTla: string): string {
  return `${homeTla}_${awayTla}`
}
