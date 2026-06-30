import { computeKnockoutJourney, computeMatchStakes, type KnockoutBreakdown } from '../src/lib/knockout-journey'
import { calculateParticipantScore } from '../src/lib/scoring'
import type { Match, MatchStatus, ParticipantPredictions, Stage, PredictionsData } from '../src/lib/types'

let idc = 1000
// Build a knockout Match. If `winner` is given (and not overridden), the match is FINISHED;
// otherwise it is TIMED (team present in the bracket but the match not yet played).
const koMatch = (
  homeTla: string, awayTla: string, stage: Stage,
  o: { winner?: string; status?: MatchStatus } = {},
): Match => {
  const status = o.status ?? (o.winner ? 'FINISHED' : 'TIMED')
  const finished = status === 'FINISHED'
  return {
    id: idc++, utcDate: '2026-07-01T15:00:00Z', status, matchday: null, stage, group: null,
    homeTeam: { id: idc++, name: homeTla, shortName: homeTla, tla: homeTla, crest: '' },
    awayTeam: { id: idc++, name: awayTla, shortName: awayTla, tla: awayTla, crest: '' },
    score: {
      winner: finished && o.winner ? (o.winner === homeTla ? 'HOME_TEAM' : 'AWAY_TEAM') : null,
      fullTime: {
        home: finished ? (o.winner === homeTla ? 2 : 0) : null,
        away: finished ? (o.winner === awayTla ? 2 : 0) : null,
      },
      halfTime: { home: null, away: null },
    },
  }
}

const mkKO = (homeTla: string, awayTla: string, advancingTeamTla: string, round: Stage) =>
  ({ slot: `${homeTla}-${awayTla}`, homeTla, awayTla, advancingTeamTla, round })

const preds = (
  knockout: ParticipantPredictions['knockout'],
  specials: Partial<ParticipantPredictions['specials']> = {},
): ParticipantPredictions => ({
  groupStage: {},
  knockout,
  specials: { goldenBoot: { first: '', second: '', third: '' }, goldenBall: { first: '', second: '', third: '' }, champion: '', runnerUp: '', thirdPlace: '', ...specials },
})

const team = (j: KnockoutBreakdown, tla: string) =>
  j.teams.find(t => t.tla === tla)!

describe('computeKnockoutJourney', () => {
  it('locks the R32 qualify point when the team reached the real R32', () => {
    const p = preds({ a: mkKO('MEX', 'RSA', 'MEX', 'ROUND_OF_32') })
    const matches = [koMatch('MEX', 'BRA', 'ROUND_OF_32')] // TIMED, MEX present, RSA absent
    const j = computeKnockoutJourney(p, matches)
    expect(team(j, 'MEX').locked).toBe(3)
    expect(team(j, 'RSA').lost).toBe(3)
  })

  it('marks a future advance as in-play while the team is alive and the match is unplayed', () => {
    const p = preds({ a: mkKO('MEX', 'RSA', 'MEX', 'ROUND_OF_32') })
    const matches = [koMatch('MEX', 'BRA', 'ROUND_OF_32')] // not finished
    const j = computeKnockoutJourney(p, matches)
    expect(team(j, 'MEX').inPlay).toBe(5)
    expect(team(j, 'MEX').alive).toBe(true)
  })

  it('locks the advance when the team won its real R32 match', () => {
    const p = preds({ a: mkKO('MEX', 'RSA', 'MEX', 'ROUND_OF_32') })
    const matches = [koMatch('MEX', 'BRA', 'ROUND_OF_32', { winner: 'MEX' })]
    const j = computeKnockoutJourney(p, matches)
    expect(team(j, 'MEX').locked).toBe(8) // 3 qualify + 5 advance
    expect(team(j, 'MEX').inPlay).toBe(0)
  })

  it('marks deeper advances and the champion bet as lost once the team is eliminated', () => {
    const p = preds({
      a: mkKO('MEX', 'RSA', 'MEX', 'ROUND_OF_32'),
      b: mkKO('MEX', 'xxx', 'MEX', 'ROUND_OF_16'),
      c: mkKO('MEX', 'yyy', 'MEX', 'QUARTER_FINALS'),
    }, { champion: 'MEX' })
    const matches = [
      koMatch('MEX', 'BRA', 'ROUND_OF_32', { winner: 'MEX' }),
      koMatch('MEX', 'ARG', 'ROUND_OF_16', { winner: 'ARG' }), // MEX out in R16
    ]
    const j = computeKnockoutJourney(p, matches)
    const mex = team(j, 'MEX')
    expect(mex.alive).toBe(false)
    expect(mex.eliminatedRound).toBe('ROUND_OF_16')
    expect(mex.locked).toBe(8)            // qualify 3 + R32 advance 5
    expect(mex.lost).toBe(7 + 10 + 30)    // R16 + QF advances + champion bet
    expect(mex.inPlay).toBe(0)
  })

  it('keeps the champion bet in-play while the team is still alive', () => {
    const p = preds({ a: mkKO('MEX', 'RSA', 'MEX', 'ROUND_OF_32') }, { champion: 'MEX' })
    const matches = [koMatch('MEX', 'BRA', 'ROUND_OF_32', { winner: 'MEX' })]
    const j = computeKnockoutJourney(p, matches)
    const champ = team(j, 'MEX').items.find(i => i.source === 'champion')!
    expect(champ.state).toBe('inplay')
    expect(champ.points).toBe(30)
  })

  it('sorts teams by how deep they are predicted to go (champion first)', () => {
    const p = preds({
      a: mkKO('MEX', 'RSA', 'MEX', 'ROUND_OF_32'),
      b: mkKO('FRA', 'GER', 'FRA', 'QUARTER_FINALS'),
    }, { champion: 'MEX' })
    const matches = [koMatch('MEX', 'BRA', 'ROUND_OF_32'), koMatch('FRA', 'ITA', 'ROUND_OF_32')]
    const j = computeKnockoutJourney(p, matches)
    expect(j.teams[0].tla).toBe('MEX')
    expect(j.teams[0].deepestLabel).toBe('Campeón')
    expect(team(j, 'FRA').deepestLabel).toBe('Semis')
    expect(team(j, 'RSA').deepestLabel).toBe('Dieciseisavos')
  })

  it('does not list a team twice when predicted in two R32 slots', () => {
    const p = preds({
      a: mkKO('MEX', 'RSA', 'MEX', 'ROUND_OF_32'),
      b: mkKO('MEX', 'BRA', 'MEX', 'ROUND_OF_32'),
    })
    const matches = [koMatch('MEX', 'GER', 'ROUND_OF_32', { winner: 'MEX' })]
    const j = computeKnockoutJourney(p, matches)
    expect(j.teams.filter(t => t.tla === 'MEX')).toHaveLength(1)
    expect(team(j, 'MEX').locked).toBe(8) // qualify 3 + advance 5, counted once
  })

  it('locked total equals knockoutPoints + specialsPoints (team specials only)', () => {
    const predictions: PredictionsData = {
      'Tester': preds({
        a: mkKO('MEX', 'RSA', 'MEX', 'ROUND_OF_32'),
        b: mkKO('MEX', 'xxx', 'MEX', 'ROUND_OF_16'),
      }, { champion: 'MEX', thirdPlace: 'RSA' }),
    }
    const matches = [
      koMatch('MEX', 'BRA', 'ROUND_OF_32', { winner: 'MEX' }),
      koMatch('RSA', 'POR', 'ROUND_OF_32', { winner: 'RSA' }),
      koMatch('MEX', 'ARG', 'ROUND_OF_16', { winner: 'MEX' }),
      koMatch('MEX', 'ESP', 'FINAL', { winner: 'MEX' }),
    ]
    const outcomes = { champion: 'MEX' }
    const score = calculateParticipantScore('Tester', predictions, matches, outcomes)
    const j = computeKnockoutJourney(predictions['Tester'], matches, outcomes)
    expect(j.locked).toBe(score.knockoutPoints + score.specialsPoints)
  })

  it('exposes inPlayKnockoutPoints on the participant score', () => {
    const predictions: PredictionsData = {
      'Tester': preds({ a: mkKO('MEX', 'RSA', 'MEX', 'ROUND_OF_32') }),
    }
    const matches = [koMatch('MEX', 'BRA', 'ROUND_OF_32')] // not played → advance in play
    const score = calculateParticipantScore('Tester', predictions, matches)
    expect(score.inPlayKnockoutPoints).toBe(5)
  })
})

describe('computeMatchStakes', () => {
  it('lists who scores the advance points for each possible winner of a KO match', () => {
    const predictions: PredictionsData = {
      P1: preds({ a: mkKO('ARG', 'URU', 'ARG', 'QUARTER_FINALS') }),
      P2: preds({ a: mkKO('COL', 'BRA', 'COL', 'QUARTER_FINALS') }),
      P3: preds({ a: mkKO('ARG', 'xxx', 'ARG', 'QUARTER_FINALS') }),
    }
    const match = koMatch('ARG', 'COL', 'QUARTER_FINALS') // unplayed
    const s = computeMatchStakes(match, predictions, ['P1', 'P2', 'P3'])
    expect(s.kind).toBe('advance')
    expect(s.advancePoints).toBe(10)
    expect(s.home.tla).toBe('ARG')
    expect(s.home.beneficiaries.map(b => b.name).sort()).toEqual(['P1', 'P3'])
    expect(s.home.beneficiaries.every(b => b.points === 10)).toBe(true)
    expect(s.away.beneficiaries.map(b => b.name)).toEqual(['P2'])
  })

  it('lists champion and runner-up beneficiaries for a final', () => {
    const predictions: PredictionsData = {
      P1: preds({}, { champion: 'ESP', runnerUp: 'ARG' }),
      P2: preds({}, { champion: 'ARG' }),
      P3: preds({}, { runnerUp: 'ESP' }),
    }
    const match = koMatch('ESP', 'ARG', 'FINAL')
    const s = computeMatchStakes(match, predictions, ['P1', 'P2', 'P3'])
    expect(s.kind).toBe('final')
    // ESP wins → champion ESP (+30 P1) and runner-up ARG (+20 P1)
    expect(s.home.beneficiaries.map(b => `${b.name}:${b.points}`).sort()).toEqual(['P1:20', 'P1:30'])
    // ARG wins → champion ARG (+30 P2) and runner-up ESP (+20 P3)
    expect(s.away.beneficiaries.map(b => `${b.name}:${b.points}`).sort()).toEqual(['P2:30', 'P3:20'])
  })

  it('lists third-place beneficiaries for the third-place match', () => {
    const predictions: PredictionsData = {
      P1: preds({}, { thirdPlace: 'GER' }),
      P2: preds({}, { thirdPlace: 'POR' }),
    }
    const match = koMatch('GER', 'POR', 'THIRD_PLACE')
    const s = computeMatchStakes(match, predictions, ['P1', 'P2'])
    expect(s.kind).toBe('third')
    expect(s.home.beneficiaries.map(b => `${b.name}:${b.points}`)).toEqual(['P1:15'])
    expect(s.away.beneficiaries.map(b => `${b.name}:${b.points}`)).toEqual(['P2:15'])
  })
})
