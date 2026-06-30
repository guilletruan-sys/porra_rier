import { computeConfirmedPositions } from '../src/lib/qualifications'
import type { Match, MatchStatus } from '../src/lib/types'

let nextId = 1
const mk = (
  home: string,
  away: string,
  homeGoals: number | null,
  awayGoals: number | null,
  status: MatchStatus = 'FINISHED',
  group = 'GROUP_A',
): Match => ({
  id: nextId++,
  utcDate: '2026-06-12T15:00:00Z',
  status,
  matchday: 1,
  stage: 'GROUP_STAGE',
  group,
  homeTeam: { id: 1, name: home, shortName: home, tla: home, crest: '' },
  awayTeam: { id: 2, name: away, shortName: away, tla: away, crest: '' },
  score: {
    winner:
      homeGoals == null || awayGoals == null
        ? null
        : homeGoals > awayGoals ? 'HOME_TEAM' : awayGoals > homeGoals ? 'AWAY_TEAM' : 'DRAW',
    fullTime: { home: homeGoals, away: awayGoals },
    halfTime: { home: null, away: null },
  },
})

describe('computeConfirmedPositions', () => {
  beforeEach(() => { nextId = 1 })

  it('grupo entero con resultados claros: 1º, 2º, 3º y 4º confirmados', () => {
    // Grupo A: USA 9, MEX 6, ESP 3, RSA 0 (sin empates de criterios)
    const matches: Match[] = [
      mk('USA', 'MEX', 2, 0),
      mk('ESP', 'RSA', 1, 0),
      mk('USA', 'ESP', 3, 0),
      mk('MEX', 'RSA', 2, 0),
      mk('USA', 'RSA', 4, 0),
      mk('MEX', 'ESP', 1, 0),
    ]
    const out = computeConfirmedPositions(matches)
    expect(out.get('1A')).toBe('USA')
    expect(out.get('2A')).toBe('MEX')
    expect(out.get('3A')).toBe('ESP')
    // RSA es 4º — no se mete en el mapping (solo 1º/2º/3º).
    expect(out.has('4A')).toBe(false)
  })

  it('cuando dos equipos pueden quedar empatados en pts/GD/GF, sus posiciones quedan indeterminadas', () => {
    // Grupo B: dos partidos jugados, dos pendientes que pueden generar empate.
    // USA y MEX llevan 3 pts cada uno; ESP y RSA 0. Los dos pendientes son
    // USA vs ESP y MEX vs RSA. Si los dos primeros ganan por la misma diferencia,
    // empatan. Por tanto 1B y 2B son indeterminados.
    const matches: Match[] = [
      mk('USA', 'MEX', 1, 0, 'FINISHED', 'GROUP_B'),
      mk('ESP', 'RSA', 1, 0, 'FINISHED', 'GROUP_B'),
      // Cambiamos el segundo a que MEX gana → ahora USA y MEX a 3 pts, ESP 3 pts, RSA 0
      mk('USA', 'ESP', null, null, 'SCHEDULED', 'GROUP_B'),
      mk('MEX', 'RSA', null, null, 'SCHEDULED', 'GROUP_B'),
    ]
    const out = computeConfirmedPositions(matches)
    // No podemos confirmar las posiciones de cabeza en este caso.
    expect(out.has('1B')).toBe(false)
    expect(out.has('2B')).toBe(false)
  })

  it('grupo aún no empezado → no se confirma nada', () => {
    const matches: Match[] = [
      mk('USA', 'MEX', null, null, 'SCHEDULED', 'GROUP_C'),
      mk('ESP', 'RSA', null, null, 'SCHEDULED', 'GROUP_C'),
      mk('USA', 'ESP', null, null, 'SCHEDULED', 'GROUP_C'),
      mk('MEX', 'RSA', null, null, 'SCHEDULED', 'GROUP_C'),
      mk('USA', 'RSA', null, null, 'SCHEDULED', 'GROUP_C'),
      mk('MEX', 'ESP', null, null, 'SCHEDULED', 'GROUP_C'),
    ]
    const out = computeConfirmedPositions(matches)
    expect(out.has('1C')).toBe(false)
    expect(out.has('2C')).toBe(false)
    expect(out.has('3C')).toBe(false)
  })

  it('un equipo con ventaja insalvable es 1º incluso con un partido pendiente', () => {
    // Grupo D: USA lleva 6 pts (2 victorias) tras 2 partidos. Los demás tienen 0 pts cada uno.
    // En el partido pendiente, USA tiene asegurado 6 pts mínimo. Los rivales pueden
    // sacar como máximo 3 pts. Por tanto USA es 1º seguro.
    const matches: Match[] = [
      mk('USA', 'MEX', 2, 0, 'FINISHED', 'GROUP_D'),
      mk('USA', 'ESP', 2, 0, 'FINISHED', 'GROUP_D'),
      mk('MEX', 'RSA', 0, 0, 'FINISHED', 'GROUP_D'),
      mk('ESP', 'RSA', 0, 0, 'FINISHED', 'GROUP_D'),
      mk('USA', 'RSA', null, null, 'SCHEDULED', 'GROUP_D'),
      mk('MEX', 'ESP', null, null, 'SCHEDULED', 'GROUP_D'),
    ]
    const out = computeConfirmedPositions(matches)
    expect(out.get('1D')).toBe('USA')
  })
})
