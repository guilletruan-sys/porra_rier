import { displayScore } from '../src/lib/score-format'
import type { Score } from '../src/lib/types'

const base = (over: Partial<Score>): Score => ({
  winner: null,
  fullTime: { home: 0, away: 0 },
  halfTime: { home: null, away: null },
  ...over,
})

describe('displayScore', () => {
  it('returns the full-time score for a regular match', () => {
    const s = base({ winner: 'HOME_TEAM', fullTime: { home: 2, away: 1 } })
    expect(displayScore(s)).toEqual({ home: 2, away: 1 })
  })

  it('strips the shootout from full-time and exposes penalties (fullTime includes pens)', () => {
    // football-data: GER 1-1 PAR, pens 3-4, fullTime = 4-5, winner = AWAY
    const s = base({
      winner: 'AWAY_TEAM',
      duration: 'PENALTY_SHOOTOUT',
      regularTime: { home: 1, away: 1 },
      extraTime: { home: 0, away: 0 },
      penalties: { home: 3, away: 4 },
      fullTime: { home: 4, away: 5 },
    })
    expect(displayScore(s)).toEqual({ home: 1, away: 1, pens: { home: 3, away: 4 } })
  })

  it('uses regularTime+extraTime for the play score when available', () => {
    // Won in extra time without penalties → no pens, play = full time
    const s = base({
      winner: 'HOME_TEAM',
      duration: 'EXTRA_TIME',
      regularTime: { home: 1, away: 1 },
      extraTime: { home: 1, away: 0 },
      fullTime: { home: 2, away: 1 },
    })
    expect(displayScore(s)).toEqual({ home: 2, away: 1 })
  })

  it('falls back to fullTime - penalties when regular/extra time are missing', () => {
    const s = base({
      winner: 'AWAY_TEAM',
      duration: 'PENALTY_SHOOTOUT',
      penalties: { home: 2, away: 4 },
      fullTime: { home: 3, away: 5 },
    })
    expect(displayScore(s)).toEqual({ home: 1, away: 1, pens: { home: 2, away: 4 } })
  })

  it('handles null full-time as 0-0', () => {
    const s = base({ fullTime: { home: null, away: null } })
    expect(displayScore(s)).toEqual({ home: 0, away: 0 })
  })
})
