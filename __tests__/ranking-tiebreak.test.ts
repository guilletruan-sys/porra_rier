import { compareWithTiebreak, type TiebreakCtx } from '../src/lib/ranking-tiebreak'
import type { ParticipantPredictions, ParticipantScore, PredictionsData } from '../src/lib/types'

const mkPreds = (champion: string, goldenBoot: string): ParticipantPredictions => ({
  groupStage: {},
  knockout: {},
  specials: { goldenBoot, goldenBall: '', champion, runnerUp: '', thirdPlace: '' },
})

const mkScore = (name: string, totalPoints: number, groupStagePoints = 0): ParticipantScore => ({
  name,
  totalPoints,
  groupStagePoints,
  knockoutPoints: totalPoints - groupStagePoints,
  specialsPoints: 0,
  breakdown: [],
})

const baseCtx = (predictions: PredictionsData, overrides: Partial<TiebreakCtx> = {}): TiebreakCtx => ({
  actualChampion: null,
  topScorersOfficial: new Set<string>(),
  goalsByPlayer: {},
  exactCount: {},
  predictionsByName: predictions,
  ...overrides,
})

describe('compareWithTiebreak — criterio oficial 2.c', () => {
  it('criterio principal: más puntos totales gana', () => {
    const ctx = baseCtx({})
    const a = mkScore('A', 100)
    const b = mkScore('B', 90)
    expect(Math.sign(compareWithTiebreak(a, b, ctx))).toBe(-1)
    expect(Math.sign(compareWithTiebreak(b, a, ctx))).toBe(1)
  })

  it('i. campeón acertado rompe el empate a puntos', () => {
    const predictions: PredictionsData = {
      A: mkPreds('ESP', 'Mbappé'),
      B: mkPreds('FRA', 'Mbappé'),
    }
    const ctx = baseCtx(predictions, { actualChampion: 'ESP' })
    const result = compareWithTiebreak(mkScore('A', 100), mkScore('B', 100), ctx)
    expect(Math.sign(result)).toBe(-1)   // A pasa por delante
  })

  it('ii. goles del pichichi elegido (con regla de empate entre pichichis oficiales)', () => {
    const predictions: PredictionsData = {
      A: mkPreds('ESP', 'Mbappé'),
      B: mkPreds('ESP', 'Vinicius'),
      C: mkPreds('ESP', 'Lewandowski'),
    }
    const ctx = baseCtx(predictions, {
      actualChampion: 'ESP',
      // Mbappé y Vinicius empatan como pichichi oficial con 8 goles; Lewandowski 6.
      topScorersOfficial: new Set(['mbappé', 'vinicius']),
      goalsByPlayer: { 'mbappé': 8, 'vinicius': 8, 'lewandowski': 6 },
    })
    // A vs B: ambos eligieron a pichichi oficial → empatados aquí, pasa al criterio iii.
    expect(compareWithTiebreak(mkScore('A', 100), mkScore('B', 100), ctx)).toBe(0)
    // A vs C: Mbappé (8) > Lewandowski (6) → A primero.
    expect(Math.sign(compareWithTiebreak(mkScore('A', 100), mkScore('C', 100), ctx))).toBe(-1)
  })

  it('iii. más exactos en grupo desempata cuando i/ii no aplican o están igualados', () => {
    const predictions: PredictionsData = {
      A: mkPreds('ESP', 'Mbappé'),
      B: mkPreds('ESP', 'Mbappé'),
    }
    const ctx = baseCtx(predictions, {
      actualChampion: 'ESP',
      exactCount: { A: 5, B: 3 },
    })
    expect(Math.sign(compareWithTiebreak(mkScore('A', 100), mkScore('B', 100), ctx))).toBe(-1)
  })

  it('iv. más puntos en grupo desempata cuando los anteriores no lo hicieron', () => {
    const predictions: PredictionsData = {
      A: mkPreds('ESP', 'Mbappé'),
      B: mkPreds('ESP', 'Mbappé'),
    }
    const ctx = baseCtx(predictions, {
      actualChampion: 'ESP',
      exactCount: { A: 4, B: 4 },
    })
    expect(Math.sign(compareWithTiebreak(mkScore('A', 100, 40), mkScore('B', 100, 30), ctx))).toBe(-1)
  })

  it('v. devuelve 0 cuando todos los criterios están igualados (premio compartido)', () => {
    const predictions: PredictionsData = {
      A: mkPreds('ESP', 'Mbappé'),
      B: mkPreds('ESP', 'Mbappé'),
    }
    const ctx = baseCtx(predictions, {
      actualChampion: 'ESP',
      exactCount: { A: 4, B: 4 },
    })
    expect(compareWithTiebreak(mkScore('A', 100, 40), mkScore('B', 100, 40), ctx)).toBe(0)
  })

  it('cuando aún no hay campeón ni pichichi oficiales, cae directamente a iii→iv', () => {
    const predictions: PredictionsData = {
      A: mkPreds('ESP', 'Mbappé'),
      B: mkPreds('FRA', 'Vinicius'),
    }
    const ctx = baseCtx(predictions, {
      exactCount: { A: 6, B: 5 },
    })
    expect(Math.sign(compareWithTiebreak(mkScore('A', 100), mkScore('B', 100), ctx))).toBe(-1)
  })
})
