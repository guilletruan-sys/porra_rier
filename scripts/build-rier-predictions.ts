// scripts/build-rier-predictions.ts
// Reads each participant's individual Excel from backup-old-excels/ and builds
// src/data/participants.json and src/data/predictions.json.
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

const BACKUP_DIR = path.join(__dirname, '..', 'backup-old-excels')

// File on disk → participant name. Order matches the WhatsApp screenshot.
const FILE_TO_PARTICIPANT: Array<[string, string]> = [
  ['MUNDIAL-PEDRO.xlsx', 'Pedro'],
  ['City Excel-Mundial-2026.xlsx', 'City'],
  ['Excel-Mundial-2026_CQAV (1) (1).xlsx', 'Miguel'],          // ~4MB matches Miguel
  ['Excel-Mundial-2026_Tola.xlsx', 'Tola'],
  ['Excel-Mundial-2026_CQAV.xlsx', 'Julito'],                   // 459 KB
  ['mundial-2026 partido españa.xlsx', 'Tacho'],
  ['Gafa.xlsx', 'Gafas'],
  ['Excel-Mundial-2026_CQAV FELI DEFINITIVO.xlsx', 'Felipe Ramón'],
  ['Excel-Mundial-2026 Vaca.xlsx', 'Vaca'],
]

// Spanish team name (as in the fan-made template) → FIFA TLA
const ES_TO_TLA: Record<string, string> = {
  'México': 'MEX',
  'Sudáfrica': 'RSA',
  'Corea del Sur': 'KOR',
  'República Checa': 'CZE',
  'Canadá': 'CAN',
  'Bosnia y Herzegovina': 'BIH',
  'Catar': 'QAT',
  'Suiza': 'SUI',
  'Brasil': 'BRA',
  'Marruecos': 'MAR',
  'Haití': 'HAI',
  'Escocia': 'SCO',
  'Estados Unidos': 'USA',
  'Paraguay': 'PAR',
  'Australia': 'AUS',
  'Turquía': 'TUR',
  'Alemania': 'GER',
  'Curazao': 'CUW',
  'Costa de Marfil': 'CIV',
  'Ecuador': 'ECU',
  'Países Bajos': 'NED',
  'Japón': 'JPN',
  'Suecia': 'SWE',
  'Túnez': 'TUN',
  'Bélgica': 'BEL',
  'Egipto': 'EGY',
  'Irán': 'IRN',
  'Nueva Zelanda': 'NZL',
  'España': 'ESP',
  'Cabo Verde': 'CPV',
  'Arabia Saudita': 'KSA',
  'Uruguay': 'URU',
  'Francia': 'FRA',
  'Senegal': 'SEN',
  'Irak': 'IRQ',
  'Noruega': 'NOR',
  'Argentina': 'ARG',
  'Argelia': 'ALG',
  'Austria': 'AUT',
  'Jordania': 'JOR',
  'Portugal': 'POR',
  'RD Congo': 'COD',
  'Uzbekistán': 'UZB',
  'Colombia': 'COL',
  'Inglaterra': 'ENG',
  'Croacia': 'CRO',
  'Ghana': 'GHA',
  'Panamá': 'PAN',
}

type PickResult = 'home' | 'draw' | 'away'

interface GroupPrediction { homeGoals: number; awayGoals: number; pick: PickResult }
interface KnockoutPrediction { advancingTeamTla: string; round: Stage }
interface Specials {
  champion: string
  runnerUp: string
  thirdPlace: string
  // Top-3 per category (Oro/Plata/Bronce)
  goldenBoot: { first: string; second: string; third: string }
  goldenBall: { first: string; second: string; third: string }
}
type Stage = 'GROUP_STAGE' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'THIRD_PLACE' | 'FINAL'

interface ParticipantPredictions {
  groupStage: Record<string, GroupPrediction>
  knockout: Record<string, KnockoutPrediction>
  specials: Specials
}

function tla(name: string | undefined): string | null {
  if (!name) return null
  return ES_TO_TLA[name.trim()] ?? null
}

function getMatchKey(home: string, away: string) {
  return `${home}_${away}`
}

function asInt(v: unknown): number | null {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() && !isNaN(Number(v))) return Number(v)
  return null
}

function parseFile(filepath: string): ParticipantPredictions {
  const wb = XLSX.readFile(filepath)
  const ws = wb.Sheets['WORLDCUP']
  if (!ws) throw new Error(`No WORLDCUP sheet in ${filepath}`)
  const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' }) as unknown[][]

  const groupStage: Record<string, GroupPrediction> = {}
  const knockoutOrdered: { key: string; advancingTeamTla: string }[] = []

  // Iterate rows. Detect rows that describe a match by having both AA (home) and AF (away).
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (!row) continue

    const D = row[3]              // Pick
    const AA = row[26] as string  // Home team name
    const AC = row[28]            // Home goals (predicted)
    const AD = row[29]            // Away goals (predicted)
    const AF = row[31] as string  // Away team name

    const homeTla = tla(AA)
    const awayTla = tla(AF)
    if (!homeTla || !awayTla) continue

    const hg = asInt(AC)
    const ag = asInt(AD)
    const pickStr = typeof D === 'string' ? D.trim() : ''

    // Group stage rows have pickStr ∈ {Local, Empate, Visitante}.
    // Knockout rows have a team name in D (predicted winner).
    if (pickStr === 'Local' || pickStr === 'Empate' || pickStr === 'Visitante') {
      if (hg == null || ag == null) continue
      const pick: PickResult = pickStr === 'Local' ? 'home' : pickStr === 'Visitante' ? 'away' : 'draw'
      const key = getMatchKey(homeTla, awayTla)
      groupStage[key] = { homeGoals: hg, awayGoals: ag, pick }
    } else if (pickStr && pickStr !== '-') {
      // Knockout — pickStr is a team name (Spanish)
      const winTla = tla(pickStr)
      if (!winTla) continue
      knockoutOrdered.push({ key: getMatchKey(homeTla, awayTla), advancingTeamTla: winTla })
    }
  }

  // Map knockoutOrdered to rounds by count:
  // 16 R32 → 8 R16 → 4 QF → 2 SF → 1 3rd → 1 Final
  const ROUND_LAYOUT: { round: Stage; count: number }[] = [
    { round: 'ROUND_OF_32', count: 16 },
    { round: 'ROUND_OF_16', count: 8 },
    { round: 'QUARTER_FINALS', count: 4 },
    { round: 'SEMI_FINALS', count: 2 },
    { round: 'THIRD_PLACE', count: 1 },
    { round: 'FINAL', count: 1 },
  ]
  const knockout: Record<string, KnockoutPrediction> = {}
  let idx = 0
  for (const { round, count } of ROUND_LAYOUT) {
    for (let i = 0; i < count && idx < knockoutOrdered.length; i++, idx++) {
      const item = knockoutOrdered[idx]
      knockout[item.key] = { advancingTeamTla: item.advancingTeamTla, round }
    }
  }

  // Specials. Locate the rows by the label text in column W.
  const findRowByW = (needle: string): unknown[] | null => {
    for (let i = 140; i < Math.min(170, data.length); i++) {
      const row = data[i]
      const W = typeof row?.[22] === 'string' ? (row[22] as string).toLowerCase() : ''
      if (W.includes(needle)) return row
    }
    return null
  }
  const valAA = (row: unknown[] | null) =>
    (row && typeof row[26] === 'string' ? (row[26] as string).trim() : '') || ''

  const championRow = findRowByW('campeón')
  const runnerUpRow = findRowByW('subcampeón')
  const thirdRow = findRowByW('3º puesto')
  const bootGoldRow = findRowByW('bota de oro')
  const bootSilverRow = findRowByW('bota de plata')
  const bootBronzeRow = findRowByW('bota de bronce')
  const ballGoldRow = findRowByW('balón de oro')
  const ballSilverRow = findRowByW('balón de plata')
  const ballBronzeRow = findRowByW('balón de bronce')

  const specials: Specials = {
    champion: tla(valAA(championRow)) ?? '',
    runnerUp: tla(valAA(runnerUpRow)) ?? '',
    thirdPlace: tla(valAA(thirdRow)) ?? '',
    goldenBoot: {
      first: valAA(bootGoldRow),
      second: valAA(bootSilverRow),
      third: valAA(bootBronzeRow),
    },
    goldenBall: {
      first: valAA(ballGoldRow),
      second: valAA(ballSilverRow),
      third: valAA(ballBronzeRow),
    },
  }

  return { groupStage, knockout, specials }
}

function main() {
  const participants: string[] = []
  const predictions: Record<string, ParticipantPredictions> = {}

  for (const [filename, participant] of FILE_TO_PARTICIPANT) {
    const fp = path.join(BACKUP_DIR, filename)
    if (!fs.existsSync(fp)) {
      console.error(`Missing file: ${filename}`)
      continue
    }
    try {
      const preds = parseFile(fp)
      participants.push(participant)
      predictions[participant] = preds
      console.log(
        `✓ ${participant}: ${Object.keys(preds.groupStage).length} group · ` +
        `${Object.keys(preds.knockout).length} knockout · ` +
        `champ=${preds.specials.champion}, boot=[${preds.specials.goldenBoot.first}|${preds.specials.goldenBoot.second}|${preds.specials.goldenBoot.third}]`
      )
    } catch (err) {
      console.error(`Error parsing ${filename}:`, err)
    }
  }

  const dataDir = path.join(__dirname, '..', 'src', 'data')
  fs.writeFileSync(path.join(dataDir, 'participants.json'), JSON.stringify(participants, null, 2))
  fs.writeFileSync(path.join(dataDir, 'predictions.json'), JSON.stringify(predictions, null, 2))
  console.log(`\nSaved ${participants.length} participants.`)
}

main()
