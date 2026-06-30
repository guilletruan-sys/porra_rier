import {
  scoreGroupMatch,
  scoreSpecials,
  calculateParticipantScore,
} from '../src/lib/scoring'
import type { GroupPrediction, Match, Stage, PredictionsData } from '../src/lib/types'

const makeMatch = (homeGoals: number, awayGoals: number, stage: Stage = 'GROUP_STAGE'): Match => ({
  id: 1,
  utcDate: '2026-06-12T15:00:00Z',
  status: 'FINISHED',
  matchday: 1,
  stage,
  group: 'GROUP_A',
  homeTeam: { id: 1, name: 'Mexico', shortName: 'Mexico', tla: 'MEX', crest: '' },
  awayTeam: { id: 2, name: 'South Africa', shortName: 'S.Africa', tla: 'RSA', crest: '' },
  score: {
    winner: homeGoals > awayGoals ? 'HOME_TEAM' : awayGoals > homeGoals ? 'AWAY_TEAM' : 'DRAW',
    fullTime: { home: homeGoals, away: awayGoals },
    halfTime: { home: null, away: null },
  },
})

describe('scoreGroupMatch', () => {
  it('gives 4 pts for exact score prediction', () => {
    const pred: GroupPrediction = { homeGoals: 2, awayGoals: 1, pick: 'home' }
    expect(scoreGroupMatch(pred, makeMatch(2, 1))).toEqual({ points: 4, reason: 'exact' })
  })
  it('gives 1 pt for correct result (home win) without exact score', () => {
    const pred: GroupPrediction = { homeGoals: 1, awayGoals: 0, pick: 'home' }
    expect(scoreGroupMatch(pred, makeMatch(2, 1))).toEqual({ points: 1, reason: 'result' })
  })
  it('gives 1 pt for correct draw prediction', () => {
    const pred: GroupPrediction = { homeGoals: 1, awayGoals: 1, pick: 'draw' }
    expect(scoreGroupMatch(pred, makeMatch(0, 0))).toEqual({ points: 1, reason: 'result' })
  })
  it('gives 4 pts for exact draw', () => {
    const pred: GroupPrediction = { homeGoals: 0, awayGoals: 0, pick: 'draw' }
    expect(scoreGroupMatch(pred, makeMatch(0, 0))).toEqual({ points: 4, reason: 'exact' })
  })
  it('gives 0 pts for wrong result', () => {
    const pred: GroupPrediction = { homeGoals: 0, awayGoals: 1, pick: 'away' }
    expect(scoreGroupMatch(pred, makeMatch(2, 1))).toEqual({ points: 0, reason: 'miss' })
  })
  it('returns pending when match not finished', () => {
    const pred: GroupPrediction = { homeGoals: 2, awayGoals: 1, pick: 'home' }
    const match = makeMatch(0, 0)
    match.status = 'SCHEDULED'
    match.score.fullTime = { home: null, away: null }
    match.score.winner = null
    expect(scoreGroupMatch(pred, match)).toEqual({ points: 0, reason: 'pending' })
  })
})

const makeKnockoutMatch = (homeTla: string, awayTla: string, winnerTla: string, stage: Stage): Match => ({
  id: 99,
  utcDate: '2026-07-01T15:00:00Z',
  status: 'FINISHED',
  matchday: null,
  stage,
  group: null,
  homeTeam: { id: 10, name: homeTla, shortName: homeTla, tla: homeTla, crest: '' },
  awayTeam: { id: 11, name: awayTla, shortName: awayTla, tla: awayTla, crest: '' },
  score: {
    winner: winnerTla === homeTla ? 'HOME_TEAM' : 'AWAY_TEAM',
    fullTime: { home: winnerTla === homeTla ? 2 : 0, away: winnerTla === awayTla ? 2 : 0 },
    halfTime: { home: null, away: null },
  },
})

describe('knockout scoring via calculateParticipantScore', () => {
  const mkKO = (slot: string, homeTla: string, awayTla: string, advancingTeamTla: string, round: Stage) =>
    ({ slot, homeTla, awayTla, advancingTeamTla, round })

  const basePredictions = (knockout: PredictionsData['x']['knockout']): PredictionsData => ({
    'Tester': {
      groupStage: {},
      knockout,
      specials: { goldenBoot: { first: '', second: '', third: '' }, goldenBall: { first: '', second: '', third: '' }, champion: '', runnerUp: '', thirdPlace: '' },
    }
  })

  it('awards 3 pts when a predicted R32 team appears in the actual R32', () => {
    const predictions = basePredictions({
      's1': mkKO('s1', 'MEX', 'RSA', 'MEX', 'ROUND_OF_32'),
    })
    const match = makeKnockoutMatch('MEX', 'BRA', 'MEX', 'ROUND_OF_32')
    const score = calculateParticipantScore('Tester', predictions, [match])
    // MEX was in predicted bracket → 3 pts; MEX also won → 5 pts
    expect(score.knockoutPoints).toBe(8)
  })

  it('awards 3 pts for each team correctly predicted in R32 bracket (both teams in matchup)', () => {
    const predictions = basePredictions({
      's1': mkKO('s1', 'MEX', 'RSA', 'MEX', 'ROUND_OF_32'),
    })
    const match = makeKnockoutMatch('MEX', 'RSA', 'MEX', 'ROUND_OF_32')
    const score = calculateParticipantScore('Tester', predictions, [match])
    expect(score.knockoutPoints).toBe(11) // 3 (MEX qualify) + 3 (RSA qualify) + 5 (MEX advances)
  })

  it('awards 0 pts when R32 team was not predicted in bracket', () => {
    const predictions = basePredictions({
      's1': mkKO('s1', 'FRA', 'GER', 'FRA', 'ROUND_OF_32'),
    })
    const match = makeKnockoutMatch('MEX', 'BRA', 'MEX', 'ROUND_OF_32')
    const score = calculateParticipantScore('Tester', predictions, [match])
    expect(score.knockoutPoints).toBe(0)
  })

  it('awards 5 pts for correctly predicted R32 winner (advances to R16)', () => {
    const predictions = basePredictions({
      's1': mkKO('s1', 'MEX', 'RSA', 'MEX', 'ROUND_OF_32'),
    })
    const match = makeKnockoutMatch('MEX', 'BRA', 'MEX', 'ROUND_OF_32')
    const score = calculateParticipantScore('Tester', predictions, [match])
    const advanceEntry = score.breakdown.find(b => b.reason === 'knockout_correct')
    expect(advanceEntry?.points).toBe(5)
  })

  it('awards 7 pts for correctly predicted R16 winner (advances to QF)', () => {
    const predictions = basePredictions({
      's1': mkKO('s1', 'MEX', 'RSA', 'MEX', 'ROUND_OF_16'),
    })
    const match = makeKnockoutMatch('MEX', 'BRA', 'MEX', 'ROUND_OF_16')
    const score = calculateParticipantScore('Tester', predictions, [match])
    expect(score.knockoutPoints).toBe(7)
  })

  it('awards 10 pts for correctly predicted QF winner (advances to SF)', () => {
    const predictions = basePredictions({
      's1': mkKO('s1', 'MEX', 'RSA', 'MEX', 'QUARTER_FINALS'),
    })
    const match = makeKnockoutMatch('MEX', 'BRA', 'MEX', 'QUARTER_FINALS')
    const score = calculateParticipantScore('Tester', predictions, [match])
    expect(score.knockoutPoints).toBe(10)
  })

  it('awards 0 pts when predicted wrong R32 winner', () => {
    const predictions = basePredictions({
      's1': mkKO('s1', 'MEX', 'RSA', 'RSA', 'ROUND_OF_32'),
    })
    const match = makeKnockoutMatch('MEX', 'RSA', 'MEX', 'ROUND_OF_32')
    const score = calculateParticipantScore('Tester', predictions, [match])
    expect(score.knockoutPoints).toBe(6)
  })

  it('does not score FINAL or THIRD_PLACE matches (handled by specials)', () => {
    const predictions = basePredictions({
      's1': mkKO('s1', 'MEX', 'RSA', 'MEX', 'FINAL'),
    })
    const finalMatch = makeKnockoutMatch('MEX', 'RSA', 'MEX', 'FINAL')
    const score = calculateParticipantScore('Tester', predictions, [finalMatch])
    expect(score.knockoutPoints).toBe(0)
  })

  it('does not double-count R32 qualify pts for same team', () => {
    const predictions = basePredictions({
      's1': mkKO('s1', 'MEX', 'RSA', 'MEX', 'ROUND_OF_32'),
      's2': mkKO('s2', 'MEX', 'BRA', 'MEX', 'ROUND_OF_32'),
    })
    const match = makeKnockoutMatch('MEX', 'RSA', 'MEX', 'ROUND_OF_32')
    const score = calculateParticipantScore('Tester', predictions, [match])
    const qualifyPts = score.breakdown.filter(b => b.reason === 'r32_qualify')
    const mexCredits = qualifyPts.filter(b => b.matchKey.includes('MEX'))
    expect(mexCredits).toHaveLength(1)
  })
})

describe('scoreSpecials (Rier: top-3 bota/balón 3-2-1)', () => {
  const specials = {
    goldenBoot: { first: 'Mbappé', second: 'Kane', third: 'Haaland' },
    goldenBall: { first: 'Vinicius', second: 'Pedri', third: 'Yamal' },
    champion: 'FRA',
    runnerUp: 'BRA',
    thirdPlace: 'ESP',
  }

  it('gives 3 pts for the golden boot ORO (1st) correct', () => {
    expect(scoreSpecials(specials, { goldenBoot: { first: 'Mbappé' } })).toBe(3)
  })
  it('gives 2 pts for plata (2nd) and 1 pt for bronce (3rd)', () => {
    expect(scoreSpecials(specials, { goldenBoot: { second: 'Kane' } })).toBe(2)
    expect(scoreSpecials(specials, { goldenBoot: { third: 'Haaland' } })).toBe(1)
  })
  it('sums the three independently (3+2+1 = 6 max per categoría)', () => {
    expect(scoreSpecials(specials, { goldenBoot: { first: 'Mbappé', second: 'Kane', third: 'Haaland' } })).toBe(6)
  })
  it('scores golden ball top-3 the same way', () => {
    expect(scoreSpecials(specials, { goldenBall: { first: 'Vinicius', third: 'Yamal' } })).toBe(4)
  })
  it('gives 30 pts for correct champion', () => {
    expect(scoreSpecials(specials, { champion: 'FRA' })).toBe(30)
  })
  it('gives 20 pts for correct runner-up', () => {
    expect(scoreSpecials(specials, { runnerUp: 'BRA' })).toBe(20)
  })
  it('gives 15 pts for correct 3rd place', () => {
    expect(scoreSpecials(specials, { thirdPlace: 'ESP' })).toBe(15)
  })
  it('gives 0 pts for all wrong', () => {
    expect(scoreSpecials(specials, { champion: 'ARG', goldenBoot: { first: 'Messi' } })).toBe(0)
  })
  it('is case-insensitive for player names', () => {
    expect(scoreSpecials(specials, { goldenBoot: { first: 'MBAPPÉ' } })).toBe(3)
  })
})

describe('calculateParticipantScore', () => {
  const finishedMatch: Match = makeMatch(2, 1)
  const scheduledMatch: Match = {
    ...makeMatch(0, 0),
    id: 2,
    status: 'SCHEDULED',
    homeTeam: { id: 3, name: 'Brazil', shortName: 'Brazil', tla: 'BRA', crest: '' },
    awayTeam: { id: 4, name: 'Morocco', shortName: 'Morocco', tla: 'MAR', crest: '' },
    score: { winner: null, fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
  }

  it('returns zero score for unknown participant', () => {
    const score = calculateParticipantScore('Unknown', {}, [finishedMatch])
    expect(score.totalPoints).toBe(0)
    expect(score.breakdown).toHaveLength(0)
  })

  it('accumulates group stage points correctly', () => {
    const predictions: PredictionsData = {
      'Tester': {
        groupStage: {
          'MEX_RSA': { homeGoals: 2, awayGoals: 1, pick: 'home' },  // exact: 4 pts
        },
        knockout: {},
        specials: { goldenBoot: { first: '', second: '', third: '' }, goldenBall: { first: '', second: '', third: '' }, champion: '', runnerUp: '', thirdPlace: '' },
      }
    }
    const score = calculateParticipantScore('Tester', predictions, [finishedMatch])
    expect(score.groupStagePoints).toBe(4)
    expect(score.totalPoints).toBe(4)
    expect(score.breakdown).toHaveLength(1)
    expect(score.breakdown[0]).toEqual({ matchKey: 'MEX_RSA', points: 4, reason: 'exact' })
  })

  it('skips pending matches in total but includes in breakdown', () => {
    const predictions: PredictionsData = {
      'Tester': {
        groupStage: {
          'MEX_RSA': { homeGoals: 2, awayGoals: 1, pick: 'home' },
          'BRA_MAR': { homeGoals: 1, awayGoals: 0, pick: 'home' },
        },
        knockout: {},
        specials: { goldenBoot: { first: '', second: '', third: '' }, goldenBall: { first: '', second: '', third: '' }, champion: '', runnerUp: '', thirdPlace: '' },
      }
    }
    const score = calculateParticipantScore('Tester', predictions, [finishedMatch, scheduledMatch])
    expect(score.totalPoints).toBe(4)  // only the finished match (exact: 4 pts)
    expect(score.breakdown).toHaveLength(2)
  })
})
