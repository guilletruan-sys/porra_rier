// scripts/build-rier-predictions.ts
//
// Lee el Excel individual de cada participante (backup-old-excels/) y construye
// src/data/participants.json y src/data/predictions.json en el ESQUEMA ACTUAL
// (el mismo que Taladros):
//   - groupStage: { homeGoals, awayGoals, pick }
//   - knockout:   Record<slot, { slot, homeTla, awayTla, advancingTeamTla, round }>
//                 keyed por el slot FIFA canónico (derivado, ver más abajo)
//   - specials:   champion/runnerUp/thirdPlace + goldenBoot/goldenBall (STRINGS)
//
// El Excel no trae el slot FIFA, pero sí los cruces (local-visitante) y el equipo
// que pasa de cada ronda. El slot se DERIVA: con las posiciones de grupo que
// predijo cada uno se ubican los 16 cruces R32 (por su etiqueta 1X/2X) y desde
// ahí se propagan sus ganadores por el cableado oficial (SLOT_WNUM) a octavos →
// cuartos → semis → final + 3er puesto. Lo que no se pueda ubicar se guarda con
// una clave de respaldo para no perder datos de puntuación.
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import {
  LEFT_R32_SLOTS, RIGHT_R32_SLOTS, LEFT_R16_SLOTS, RIGHT_R16_SLOTS,
  LEFT_QF_SLOTS, RIGHT_QF_SLOTS, LEFT_SF_SLOT, RIGHT_SF_SLOT,
  FINAL_SLOT, THIRD_PLACE_SLOT, SLOT_WNUM,
} from '../src/lib/wc-bracket'

const BACKUP_DIR = path.join(__dirname, '..', 'backup-old-excels')

const FILE_TO_PARTICIPANT: Array<[string, string]> = [
  ['MUNDIAL-PEDRO.xlsx', 'Pedro'],
  ['City Excel-Mundial-2026.xlsx', 'City'],
  ['Excel-Mundial-2026_CQAV.xlsx', 'Miguel'],
  ['Excel-Mundial-2026_Tola.xlsx', 'Tola'],
  ['Julito (reparado).xlsx', 'Julito'],
  ['mundial-2026 partido españa.xlsx', 'Tacho'],
  ['Gafa.xlsx', 'Gafas'],
  ['Excel-Mundial-2026_CQAV FELI DEFINITIVO.xlsx', 'Felipe Ramón'],
  ['Excel-Mundial-2026 Vaca.xlsx', 'Vaca'],
]

// Composición real de grupos WC2026 (TLA → letra de grupo). Fija por el sorteo.
const TLA_GROUP: Record<string, string> = {
  MEX:'A',RSA:'A',KOR:'A',CZE:'A', CAN:'B',BIH:'B',QAT:'B',SUI:'B', BRA:'C',MAR:'C',HAI:'C',SCO:'C',
  USA:'D',PAR:'D',AUS:'D',TUR:'D', GER:'E',CUW:'E',CIV:'E',ECU:'E', NED:'F',JPN:'F',SWE:'F',TUN:'F',
  BEL:'G',EGY:'G',IRN:'G',NZL:'G', ESP:'H',CPV:'H',KSA:'H',URU:'H', FRA:'I',SEN:'I',IRQ:'I',NOR:'I',
  ARG:'J',ALG:'J',AUT:'J',JOR:'J', POR:'K',COD:'K',UZB:'K',COL:'K', ENG:'L',CRO:'L',GHA:'L',PAN:'L',
}

const ES_TO_TLA: Record<string, string> = {
  'México':'MEX','Sudáfrica':'RSA','Corea del Sur':'KOR','República Checa':'CZE','Canadá':'CAN',
  'Bosnia y Herzegovina':'BIH','Catar':'QAT','Suiza':'SUI','Brasil':'BRA','Marruecos':'MAR','Haití':'HAI',
  'Escocia':'SCO','Estados Unidos':'USA','Paraguay':'PAR','Australia':'AUS','Turquía':'TUR','Alemania':'GER',
  'Curazao':'CUW','Costa de Marfil':'CIV','Ecuador':'ECU','Países Bajos':'NED','Japón':'JPN','Suecia':'SWE',
  'Túnez':'TUN','Bélgica':'BEL','Egipto':'EGY','Irán':'IRN','Nueva Zelanda':'NZL','España':'ESP',
  'Cabo Verde':'CPV','Arabia Saudita':'KSA','Uruguay':'URU','Francia':'FRA','Senegal':'SEN','Irak':'IRQ',
  'Noruega':'NOR','Argentina':'ARG','Argelia':'ALG','Austria':'AUT','Jordania':'JOR','Portugal':'POR',
  'RD Congo':'COD','Uzbekistán':'UZB','Colombia':'COL','Inglaterra':'ENG','Croacia':'CRO','Ghana':'GHA','Panamá':'PAN',
}

function normPlayerKey(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
}
const PLAYER_CANONICAL: Record<string, string> = {
  'kylian mbappe':'Kylian Mbappé','kilian mbappe':'Kylian Mbappé','killian mbappe':'Kylian Mbappé',
  'kilyan mbappe':'Kylian Mbappé','mbappe':'Kylian Mbappé','cristiano':'Cristiano Ronaldo',
  'cristiano ronaldo':'Cristiano Ronaldo','harry kane':'Harry Kane','kane':'Harry Kane',
  'mikel oyarzabal':'Mikel Oyarzabal','oyarzabal':'Mikel Oyarzabal','vinicius':'Vinícius Júnior',
  'vinicius junior':'Vinícius Júnior','vinicius jr':'Vinícius Júnior','lautaro':'Lautaro Martínez',
  'lautaro martinez':'Lautaro Martínez','menphis depay':'Memphis Depay','memphis depay':'Memphis Depay',
  'doue':'Désiré Doué','desire doue':'Désiré Doué','haaland':'Erling Haaland','erling haaland':'Erling Haaland',
  'messi':'Lionel Messi','lionel messi':'Lionel Messi','dembele':'Ousmane Dembélé','ousmane dembele':'Ousmane Dembélé',
  'modric':'Luka Modrić','luka modric':'Luka Modrić','lamine yamal':'Lamine Yamal','lamine':'Lamine Yamal',
  'pedri':'Pedri','vitinha':'Vitinha','diogo costa':'Diogo Costa',
}
function canonicalPlayer(raw: string): string {
  const v = (raw ?? '').trim()
  if (!v) return ''
  return PLAYER_CANONICAL[normPlayerKey(v)] ?? v
}

type PickResult = 'home' | 'draw' | 'away'
type Stage = 'GROUP_STAGE' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'THIRD_PLACE' | 'FINAL'
interface GroupPrediction { homeGoals: number; awayGoals: number; pick: PickResult }
interface KnockoutPrediction { slot: string; homeTla: string; awayTla: string; advancingTeamTla: string; round: Stage }
interface Specials { champion: string; runnerUp: string; thirdPlace: string; goldenBoot: string; goldenBall: string }
interface RawKO { round: Stage; homeTla: string; awayTla: string; advancingTeamTla: string }
interface ParticipantPredictions {
  groupStage: Record<string, GroupPrediction>
  knockout: Record<string, KnockoutPrediction>
  specials: Specials
}

const tla = (name: string | undefined): string | null => (name ? ES_TO_TLA[name.trim()] ?? null : null)
const getMatchKey = (home: string, away: string) => `${home}_${away}`
function asInt(v: unknown): number | null {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() && !isNaN(Number(v))) return Number(v)
  return null
}

/** Posiciones de grupo predichas: '1A' → TLA, '2A' → TLA, '3A' → TLA. */
function computePositions(groupStage: Record<string, GroupPrediction>): Map<string, string> {
  interface Rec { tla: string; pts: number; gf: number; ga: number }
  const byGroup = new Map<string, Map<string, Rec>>()
  const rec = (g: string, t: string) => {
    if (!byGroup.has(g)) byGroup.set(g, new Map())
    const m = byGroup.get(g)!
    if (!m.has(t)) m.set(t, { tla: t, pts: 0, gf: 0, ga: 0 })
    return m.get(t)!
  }
  for (const [key, gp] of Object.entries(groupStage)) {
    const [h, a] = key.split('_')
    const g = TLA_GROUP[h]
    if (!g || TLA_GROUP[a] !== g) continue
    const rh = rec(g, h), ra = rec(g, a)
    rh.gf += gp.homeGoals; rh.ga += gp.awayGoals
    ra.gf += gp.awayGoals; ra.ga += gp.homeGoals
    if (gp.homeGoals > gp.awayGoals) rh.pts += 3
    else if (gp.homeGoals < gp.awayGoals) ra.pts += 3
    else { rh.pts++; ra.pts++ }
  }
  const positions = new Map<string, string>()
  for (const [g, m] of byGroup) {
    const sorted = [...m.values()].sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf)
    sorted.forEach((r, i) => { if (i < 3) positions.set(`${i + 1}${g}`, r.tla) })
  }
  return positions
}

/** Asigna a cada cruce KO su slot FIFA canónico (o una clave de respaldo). */
function deriveKnockout(positions: Map<string, string>, ko: RawKO[]): Record<string, KnockoutPrediction> {
  const WNUM_SLOT: Record<number, string> = {}
  for (const [slot, n] of Object.entries(SLOT_WNUM)) WNUM_SLOT[n] = slot

  const result: Record<string, KnockoutPrediction> = {}
  const assigned = new Set<number>()
  const winnerBySlot: Record<string, string> = {}
  const indexed = ko.map((k, i) => ({ k, i }))
  const byRound = (r: Stage) => indexed.filter(x => x.k.round === r)
  const isDet = (t: string) => /^[12][A-L]$/.test(t)
  const sameSet = (a: string, b: string, x: string, y: string) => (a === x && b === y) || (a === y && b === x)
  const put = (slot: string, idx: number, round: Stage) => {
    const k = ko[idx]
    result[slot] = { slot, homeTla: k.homeTla, awayTla: k.awayTla, advancingTeamTla: k.advancingTeamTla, round }
    winnerBySlot[slot] = k.advancingTeamTla
    assigned.add(idx)
  }

  // R32: por la etiqueta determinable (1X/2X) → equipo → cruce que lo contiene.
  const r32 = byRound('ROUND_OF_32')
  for (const slot of [...LEFT_R32_SLOTS, ...RIGHT_R32_SLOTS]) {
    const det = slot.split('-').find(isDet)
    const team = det ? positions.get(det) : undefined
    if (!team) continue
    const hit = r32.find(x => !assigned.has(x.i) && (x.k.homeTla === team || x.k.awayTla === team))
    if (hit) put(slot, hit.i, 'ROUND_OF_32')
  }

  // R16 / QF / SF: propagación por número FIFA (Wn) → cruce con esos dos equipos.
  const wRounds: Array<[Stage, string[]]> = [
    ['ROUND_OF_16', [...LEFT_R16_SLOTS, ...RIGHT_R16_SLOTS]],
    ['QUARTER_FINALS', [...LEFT_QF_SLOTS, ...RIGHT_QF_SLOTS]],
    ['SEMI_FINALS', [LEFT_SF_SLOT, RIGHT_SF_SLOT]],
  ]
  for (const [round, slots] of wRounds) {
    const pool = byRound(round)
    for (const slot of slots) {
      const [wa, wb] = slot.split('-')
      const home = winnerBySlot[WNUM_SLOT[Number(wa.slice(1))]]
      const away = winnerBySlot[WNUM_SLOT[Number(wb.slice(1))]]
      if (!home || !away) continue
      const hit = pool.find(x => !assigned.has(x.i) && sameSet(x.k.homeTla, x.k.awayTla, home, away))
      if (hit) put(slot, hit.i, round)
    }
  }

  // Final y 3er puesto: un único cruce cada uno.
  const fin = byRound('FINAL').find(x => !assigned.has(x.i))
  if (fin) put(FINAL_SLOT, fin.i, 'FINAL')
  const third = byRound('THIRD_PLACE').find(x => !assigned.has(x.i))
  if (third) put(THIRD_PLACE_SLOT, third.i, 'THIRD_PLACE')

  // Sobrantes (cruces no ubicados): clave de respaldo para no perder puntuación.
  for (const { k, i } of indexed) {
    if (assigned.has(i)) continue
    result[`${k.round}_${k.homeTla}_${k.awayTla}`] = {
      slot: `${k.round}_${k.homeTla}_${k.awayTla}`,
      homeTla: k.homeTla, awayTla: k.awayTla, advancingTeamTla: k.advancingTeamTla, round: k.round,
    }
  }
  return result
}

function parseFile(filepath: string): { preds: ParticipantPredictions; resolved: number; total: number } {
  const wb = XLSX.readFile(filepath)
  const ws = wb.Sheets['WORLDCUP']
  if (!ws) throw new Error(`No WORLDCUP sheet in ${filepath}`)
  const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' }) as unknown[][]

  const groupStage: Record<string, GroupPrediction> = {}
  const koOrdered: RawKO[] = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (!row) continue
    const D = row[3]
    const AA = row[26] as string
    const AC = row[28]
    const AD = row[29]
    const AF = row[31] as string
    const homeTla = tla(AA)
    const awayTla = tla(AF)
    if (!homeTla || !awayTla) continue
    const hg = asInt(AC), ag = asInt(AD)
    const pickStr = typeof D === 'string' ? D.trim() : ''

    if (pickStr === 'Local' || pickStr === 'Empate' || pickStr === 'Visitante') {
      if (hg == null || ag == null) continue
      const pick: PickResult = pickStr === 'Local' ? 'home' : pickStr === 'Visitante' ? 'away' : 'draw'
      groupStage[getMatchKey(homeTla, awayTla)] = { homeGoals: hg, awayGoals: ag, pick }
    } else if (pickStr && pickStr !== '-') {
      const winTla = tla(pickStr)
      if (!winTla) continue
      koOrdered.push({ round: 'ROUND_OF_32', homeTla, awayTla, advancingTeamTla: winTla })
    }
  }

  // Asigna rondas por conteo: 16 R32 → 8 R16 → 4 QF → 2 SF → 1 3º → 1 Final.
  const ROUND_LAYOUT: Array<[Stage, number]> = [
    ['ROUND_OF_32', 16], ['ROUND_OF_16', 8], ['QUARTER_FINALS', 4], ['SEMI_FINALS', 2], ['THIRD_PLACE', 1], ['FINAL', 1],
  ]
  let idx = 0
  for (const [round, count] of ROUND_LAYOUT) {
    for (let i = 0; i < count && idx < koOrdered.length; i++, idx++) koOrdered[idx].round = round
  }

  const positions = computePositions(groupStage)
  const knockout = deriveKnockout(positions, koOrdered)
  const resolved = Object.values(knockout).filter(k => SLOT_WNUM[k.slot] !== undefined || k.slot === THIRD_PLACE_SLOT).length

  // Specials.
  const findRowByW = (needle: string): unknown[] | null => {
    for (let i = 140; i < Math.min(170, data.length); i++) {
      const row = data[i]
      const W = typeof row?.[22] === 'string' ? (row[22] as string).toLowerCase() : ''
      if (W.includes(needle)) return row
    }
    return null
  }
  const valAA = (row: unknown[] | null) => (row && typeof row[26] === 'string' ? (row[26] as string).trim() : '') || ''
  const specials: Specials = {
    champion: tla(valAA(findRowByW('campeón'))) ?? '',
    runnerUp: tla(valAA(findRowByW('subcampeón'))) ?? '',
    thirdPlace: tla(valAA(findRowByW('3º puesto'))) ?? '',
    goldenBoot: canonicalPlayer(valAA(findRowByW('bota de oro'))),
    goldenBall: canonicalPlayer(valAA(findRowByW('balón de oro'))),
  }

  return { preds: { groupStage, knockout, specials }, resolved, total: koOrdered.length }
}

function main() {
  const participants: string[] = []
  const predictions: Record<string, ParticipantPredictions> = {}

  for (const [filename, participant] of FILE_TO_PARTICIPANT) {
    const fp = path.join(BACKUP_DIR, filename)
    if (!fs.existsSync(fp)) { console.error(`Missing file: ${filename}`); continue }
    try {
      const { preds, resolved, total } = parseFile(fp)
      participants.push(participant)
      predictions[participant] = preds
      console.log(
        `✓ ${participant}: ${Object.keys(preds.groupStage).length} grupo · ` +
        `${total} KO (${resolved} ubicados en slot) · champ=${preds.specials.champion}, boot=${preds.specials.goldenBoot}`
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
