import { resolveRealBracket } from '../src/lib/real-bracket'
import type { Match, MatchStatus, Stage } from '../src/lib/types'

let idc = 5000
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

// Grupo terminado con orden estricto t1>t2>t3>t4 (cada uno gana a los de abajo, 1-0).
const makeGroup = (letter: string, teams: [string, string, string, string]): Match[] => {
  const out: Match[] = []
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      out.push({
        id: idc++, utcDate: '2026-06-15T15:00:00Z', status: 'FINISHED', matchday: 1,
        stage: 'GROUP_STAGE', group: `GROUP_${letter}`,
        homeTeam: { id: idc++, name: teams[i], shortName: teams[i], tla: teams[i], crest: '' },
        awayTeam: { id: idc++, name: teams[j], shortName: teams[j], tla: teams[j], crest: '' },
        score: { winner: 'HOME_TEAM', fullTime: { home: 1, away: 0 }, halfTime: { home: null, away: null } },
      })
    }
  }
  return out
}

describe('resolveRealBracket', () => {
  const groups = [
    ...makeGroup('A', ['A1', 'A2', 'A3', 'A4']),
    ...makeGroup('B', ['B1', 'B2', 'B3', 'B4']),
  ]
  // 2A = A2, 2B = B2 → slot '2A-2B' (que es W73).

  it('maps an R32 slot to its real match via group positions and records the winner', () => {
    const r32 = koMatch('A2', 'B2', 'ROUND_OF_32', { winner: 'A2' })
    const resolved = resolveRealBracket([...groups, r32])
    const s = resolved.get('2A-2B')!
    expect(new Set([s.homeTla, s.awayTla])).toEqual(new Set(['A2', 'B2']))
    expect(s.winnerTla).toBe('A2')
    expect(s.loserTla).toBe('B2')
    expect(s.match?.id).toBe(r32.id)
  })

  it('propagates the R32 winner into the feeding R16 slot', () => {
    const r32 = koMatch('A2', 'B2', 'ROUND_OF_32', { winner: 'A2' })
    const resolved = resolveRealBracket([...groups, r32])
    // R16 slot 'W73-W75' lo alimentan W73 (=slot 2A-2B) y W75 (=1F-2C, sin datos).
    const r16 = resolved.get('W73-W75')!
    expect(r16.homeTla).toBe('A2')   // ganador de 2A-2B
    expect(r16.awayTla).toBeNull()   // 1F-2C no resuelto
  })

  it('leaves a slot unresolved (null teams) when its match is not present', () => {
    const resolved = resolveRealBracket([...groups]) // sin R32
    const s = resolved.get('2A-2B')!
    // Sin match, resuelve los tags determinables por posición igualmente.
    expect(new Set([s.homeTla, s.awayTla])).toEqual(new Set(['A2', 'B2']))
    expect(s.winnerTla).toBeNull()
    expect(s.match).toBeNull()
  })

  it('attaches the real R16 match (and its winner) once both feeders are decided', () => {
    const r32a = koMatch('A2', 'B2', 'ROUND_OF_32', { winner: 'A2' }) // W73
    // 1F-2C is W75. Provide group F and C + that R32 so W75 resolves.
    const groupsFC = [
      ...makeGroup('F', ['F1', 'F2', 'F3', 'F4']),
      ...makeGroup('C', ['C1', 'C2', 'C3', 'C4']),
    ]
    const r32b = koMatch('F1', 'C2', 'ROUND_OF_32', { winner: 'F1' }) // 1F vs 2C
    const r16 = koMatch('A2', 'F1', 'ROUND_OF_16', { winner: 'F1' })  // W73 vs W75
    const resolved = resolveRealBracket([...groups, ...groupsFC, r32a, r32b, r16])
    const s = resolved.get('W73-W75')!
    expect(new Set([s.homeTla, s.awayTla])).toEqual(new Set(['A2', 'F1']))
    expect(s.match?.id).toBe(r16.id)
    expect(s.winnerTla).toBe('F1')
  })
})
