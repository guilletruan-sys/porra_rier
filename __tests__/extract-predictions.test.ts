import { parseGroupPrediction, parseKnockoutPrediction } from '../src/lib/parse-predictions'

describe('parseGroupPrediction', () => {
  it('parses "2-1" as home win', () => {
    expect(parseGroupPrediction('2-1')).toEqual({ homeGoals: 2, awayGoals: 1, pick: 'home' })
  })
  it('parses "0-0" as draw', () => {
    expect(parseGroupPrediction('0-0')).toEqual({ homeGoals: 0, awayGoals: 0, pick: 'draw' })
  })
  it('parses "0-2" as away win', () => {
    expect(parseGroupPrediction('0-2')).toEqual({ homeGoals: 0, awayGoals: 2, pick: 'away' })
  })
  it('parses "Local|2-1" format', () => {
    expect(parseGroupPrediction('Local|2-1')).toEqual({ homeGoals: 2, awayGoals: 1, pick: 'home' })
  })
  it('parses "X|0-0" format', () => {
    expect(parseGroupPrediction('X|0-0')).toEqual({ homeGoals: 0, awayGoals: 0, pick: 'draw' })
  })
  it('parses "1|2-0" prefix format', () => {
    expect(parseGroupPrediction('1|2-0')).toEqual({ homeGoals: 2, awayGoals: 0, pick: 'home' })
  })
  it('parses "2|0-2" away win with prefix', () => {
    expect(parseGroupPrediction('2|0-2')).toEqual({ homeGoals: 0, awayGoals: 2, pick: 'away' })
  })
  it('returns null for Pendiente', () => {
    expect(parseGroupPrediction('Pendiente')).toBeNull()
  })
  it('returns null for empty string', () => {
    expect(parseGroupPrediction('')).toBeNull()
  })
  it('returns null for dash placeholder', () => {
    expect(parseGroupPrediction('-')).toBeNull()
  })
})

describe('parseKnockoutPrediction', () => {
  it('parses known team name (home win)', () => {
    expect(parseKnockoutPrediction('Mexico')).toEqual({ advancingTeamTla: 'MEX', round: 'ROUND_OF_32' })
  })
  it('parses known team name with whitespace', () => {
    expect(parseKnockoutPrediction('  Canada  ')).toEqual({ advancingTeamTla: 'CAN', round: 'ROUND_OF_32' })
  })
  it('returns null for unknown team name', () => {
    expect(parseKnockoutPrediction('UnknownTeam')).toBeNull()
  })
  it('returns null for Pendiente', () => {
    expect(parseKnockoutPrediction('Pendiente')).toBeNull()
  })
  it('returns null for empty string', () => {
    expect(parseKnockoutPrediction('')).toBeNull()
  })
  it('returns null for dash placeholder', () => {
    expect(parseKnockoutPrediction('-')).toBeNull()
  })
})
