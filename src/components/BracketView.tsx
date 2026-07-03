'use client'
import { useState } from 'react'
import { BracketMatchCard } from '@/components/BracketMatchCard'
import { MatchDetailsSheet } from '@/components/MatchDetailsSheet'
import { MatchPreviewSheet } from '@/components/MatchPreviewSheet'
import { TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import {
  type BracketSide,
  slotsForColumn,
  THIRD_PLACE_SLOT,
} from '@/lib/wc-bracket'
import type { ResolvedSlot } from '@/lib/real-bracket'
import { displayScore } from '@/lib/score-format'
import type { KnockoutPrediction, Match, PredictionsData, Stage, Team } from '@/lib/types'

interface BracketViewProps {
  matches: Match[]
  /** Si está presente, se renderizan las predicciones de este participante en lugar del cuadro real. */
  participantName?: string
  predictions?: PredictionsData
  /** Cuadro real ya resuelto slot→cruce (equipos propagados + partido enganchado). Solo en modo real. */
  realBracket?: Map<string, ResolvedSlot>
}

interface ColumnDef {
  stage: Stage
  side: BracketSide
  label: string
}

const COLUMNS: ColumnDef[] = [
  { stage: 'ROUND_OF_32',    side: 'left',   label: 'Dieciseisavos' },
  { stage: 'ROUND_OF_16',    side: 'left',   label: 'Octavos' },
  { stage: 'QUARTER_FINALS', side: 'left',   label: 'Cuartos' },
  { stage: 'SEMI_FINALS',    side: 'left',   label: 'Semis' },
  { stage: 'FINAL',          side: 'center', label: 'Final' },
  { stage: 'SEMI_FINALS',    side: 'right',  label: 'Semis' },
  { stage: 'QUARTER_FINALS', side: 'right',  label: 'Cuartos' },
  { stage: 'ROUND_OF_16',    side: 'right',  label: 'Octavos' },
  { stage: 'ROUND_OF_32',    side: 'right',  label: 'Dieciseisavos' },
]

// 8 R32 por lado × ~60px ≈ 480. Damos algo de respiro.
const BRACKET_MIN_HEIGHT = 560

function winnerTla(m: Match): string | null {
  if (m.score?.winner === 'HOME_TEAM') return m.homeTeam?.tla ?? null
  if (m.score?.winner === 'AWAY_TEAM') return m.awayTeam?.tla ?? null
  return null
}

function formatBracketDate(utcDate: string): string {
  const d = new Date(utcDate)
  if (isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
  return `${date} · ${time}`
}

const KNOCKOUT_ORDER: Stage[] = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL']

export type PredictionOutcome = 'correct' | 'wrong' | 'pending'

function predictionOutcome(round: Stage, predictedTla: string, matches: Match[]): PredictionOutcome {
  if (round === 'THIRD_PLACE') {
    const m = matches.find(x => x.stage === 'THIRD_PLACE' && x.status === 'FINISHED')
    if (!m) return 'pending'
    const w = winnerTla(m)
    if (!w) return 'pending'
    return w === predictedTla ? 'correct' : 'wrong'
  }

  const stageWin = matches.find(m =>
    m.stage === round && m.status === 'FINISHED' && winnerTla(m) === predictedTla,
  )
  if (stageWin) return 'correct'

  const teamLost = (m: Match) => {
    if (m.status !== 'FINISHED') return false
    const w = winnerTla(m)
    if (!w) return false
    const involved = m.homeTeam?.tla === predictedTla || m.awayTeam?.tla === predictedTla
    return involved && w !== predictedTla
  }
  const upToHere = KNOCKOUT_ORDER.slice(0, KNOCKOUT_ORDER.indexOf(round) + 1)
  if (matches.some(m => upToHere.includes(m.stage) && teamLost(m))) return 'wrong'

  const later = KNOCKOUT_ORDER.slice(KNOCKOUT_ORDER.indexOf(round) + 1)
  if (matches.some(m => later.includes(m.stage) && (m.homeTeam?.tla === predictedTla || m.awayTeam?.tla === predictedTla))) {
    return 'correct'
  }

  return 'pending'
}

export function BracketView({ matches, participantName, predictions, realBracket }: BracketViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [previewMatch, setPreviewMatch] = useState<Match | null>(null)

  const isParticipantMode = !!participantName && !!predictions?.[participantName]
  const participantKnockout = isParticipantMode
    ? predictions![participantName!].knockout
    : null

  return (
    <div className="overflow-x-auto pb-2 -mx-3 px-3">
      {/* Header de rondas */}
      <div className="flex items-end min-w-max mb-1 sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm py-1">
        {COLUMNS.map((c, i) => (
          <div key={i} className="w-[148px] shrink-0 px-1 text-center">
            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400  uppercase tracking-widest">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Cuadro: 9 columnas, izq → final ← der */}
      <div
        className="flex items-stretch min-w-max"
        style={{ minHeight: BRACKET_MIN_HEIGHT }}
      >
        {COLUMNS.map((c, i) => (
          <RoundColumn
            key={i}
            columnDef={c}
            matches={matches}
            participantKnockout={participantKnockout}
            realBracket={realBracket}
            onOpenFinished={(m) => setSelectedMatch(m)}
            onOpenPending={(m) => setPreviewMatch(m)}
          />
        ))}
      </div>

      {/* 3er puesto */}
      <ThirdPlaceSection
        matches={matches}
        participantKnockout={participantKnockout}
        realBracket={realBracket}
        onOpenFinished={(m) => setSelectedMatch(m)}
        onOpenPending={(m) => setPreviewMatch(m)}
      />

      {selectedMatch && (
        <MatchDetailsSheet match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
      {previewMatch && (
        <MatchPreviewSheet match={previewMatch} onClose={() => setPreviewMatch(null)} />
      )}
    </div>
  )
}

interface ColumnProps {
  columnDef: ColumnDef
  matches: Match[]
  participantKnockout: Record<string, KnockoutPrediction> | null
  realBracket?: Map<string, ResolvedSlot>
  onOpenFinished: (m: Match) => void
  onOpenPending: (m: Match) => void
}

function RoundColumn({ columnDef, matches, participantKnockout, realBracket, onOpenFinished, onOpenPending }: ColumnProps) {
  const { stage, side } = columnDef
  const slots = slotsForColumn(stage, side)

  const cards: React.ReactNode[] = slots.map(slot =>
    participantKnockout
      ? renderParticipantCard(slot, stage, participantKnockout, matches)
      : renderRealCard(slot, realBracket, onOpenFinished, onOpenPending),
  )

  const isLastColumn = side === 'center'
  const showConnectorRight = side === 'left'
  const showConnectorLeft = side === 'right'

  return (
    <div className="w-[148px] shrink-0 flex flex-col">
      {cards.map((card, i) => {
        const isEven = i % 2 === 0
        const rightCorner = showConnectorRight && !isLastColumn
          ? isEven
            ? 'border-r-2 border-b-2 border-slate-200 dark:border-slate-800'
            : 'border-r-2 border-t-2 border-slate-200 dark:border-slate-800'
          : ''
        const leftCorner = showConnectorLeft
          ? isEven
            ? 'border-l-2 border-b-2 border-slate-200 dark:border-slate-800'
            : 'border-l-2 border-t-2 border-slate-200 dark:border-slate-800'
          : ''
        const padRight = showConnectorRight ? 'pr-3' : ''
        const padLeft = showConnectorLeft ? 'pl-3' : ''
        return (
          <div
            key={i}
            className={`flex-1 flex items-center px-1 ${padLeft} ${padRight} ${leftCorner} ${rightCorner}`}
            style={{ minHeight: 56 }}
          >
            <div className="w-full">{card}</div>
          </div>
        )
      })}
    </div>
  )
}

function renderParticipantCard(
  slot: string,
  stage: Stage,
  participantKnockout: Record<string, KnockoutPrediction>,
  matches: Match[],
): React.ReactNode {
  const pred = participantKnockout[slot]
  if (!pred) return <SlotPlaceholder slot={slot} />
  const outcome = predictionOutcome(stage, pred.advancingTeamTla, matches)
  return (
    <BracketMatchCard
      home={{ tla: pred.homeTla, label: TLA_TO_EXCEL_NAME[pred.homeTla] ?? pred.homeTla }}
      away={{ tla: pred.awayTla, label: TLA_TO_EXCEL_NAME[pred.awayTla] ?? pred.awayTla }}
      predictedAdvanceTla={pred.advancingTeamTla}
      predictionOutcome={outcome}
    />
  )
}

function teamStub(tla: string): Team {
  return { id: 0, name: tla, shortName: TLA_TO_EXCEL_NAME[tla] ?? tla, tla, crest: '' }
}

/** Partido sintético para un cruce ya determinado (equipos propagados) que
 *  football-data todavía no ha publicado — permite abrir el preview "quién suma". */
function synthMatch(stage: Stage, homeTla: string, awayTla: string): Match {
  return {
    id: -1, utcDate: '', status: 'TIMED', matchday: null, stage, group: null,
    homeTeam: teamStub(homeTla), awayTeam: teamStub(awayTla),
    score: { winner: null, fullTime: { home: null, away: null }, halfTime: { home: null, away: null } },
  }
}

function ResolvedCard({ r, onOpenFinished, onOpenPending }: {
  r: ResolvedSlot
  onOpenFinished: (m: Match) => void
  onOpenPending: (m: Match) => void
}): React.ReactNode {
  const m = r.match
  const homeTla = r.homeTla ?? m?.homeTeam?.tla ?? null
  const awayTla = r.awayTla ?? m?.awayTeam?.tla ?? null
  const isLiveOrDone = !!m && (m.status === 'FINISHED' || m.status === 'IN_PLAY' || m.status === 'PAUSED')
  const bothKnown = !!homeTla && !!awayTla
  const ds = m && isLiveOrDone ? displayScore(m.score) : null
  const onTap = (m || bothKnown)
    ? () => {
        if (m && isLiveOrDone) onOpenFinished(m)
        else if (m) onOpenPending(m)
        else onOpenPending(synthMatch(r.stage, homeTla!, awayTla!))
      }
    : undefined
  return (
    <BracketMatchCard
      home={{ tla: homeTla, label: homeTla ? (TLA_TO_EXCEL_NAME[homeTla] ?? homeTla) : 'Por determinar' }}
      away={{ tla: awayTla, label: awayTla ? (TLA_TO_EXCEL_NAME[awayTla] ?? awayTla) : 'Por determinar' }}
      score={ds ? { home: ds.home, away: ds.away } : undefined}
      pens={ds?.pens}
      status={m?.status}
      dateLabel={m?.utcDate ? formatBracketDate(m.utcDate) : undefined}
      winnerTla={r.winnerTla}
      onTap={onTap}
    />
  )
}

function renderRealCard(
  slot: string,
  realBracket: Map<string, ResolvedSlot> | undefined,
  onOpenFinished: (m: Match) => void,
  onOpenPending: (m: Match) => void,
): React.ReactNode {
  const r = realBracket?.get(slot)
  if (!r || (!r.homeTla && !r.awayTla && !r.match)) return <SlotPlaceholder slot={slot} />
  return <ResolvedCard r={r} onOpenFinished={onOpenFinished} onOpenPending={onOpenPending} />
}

function ThirdPlaceSection({
  matches, participantKnockout, realBracket, onOpenFinished, onOpenPending,
}: {
  matches: Match[]
  participantKnockout: Record<string, KnockoutPrediction> | null
  realBracket?: Map<string, ResolvedSlot>
  onOpenFinished: (m: Match) => void
  onOpenPending: (m: Match) => void
}) {
  let card: React.ReactNode = null
  if (participantKnockout) {
    const pred = participantKnockout[THIRD_PLACE_SLOT]
    if (pred) {
      const outcome = predictionOutcome('THIRD_PLACE', pred.advancingTeamTla, matches)
      card = (
        <BracketMatchCard
          home={{ tla: pred.homeTla, label: TLA_TO_EXCEL_NAME[pred.homeTla] ?? pred.homeTla }}
          away={{ tla: pred.awayTla, label: TLA_TO_EXCEL_NAME[pred.awayTla] ?? pred.awayTla }}
          predictedAdvanceTla={pred.advancingTeamTla}
          predictionOutcome={outcome}
        />
      )
    }
  } else {
    const r = realBracket?.get(THIRD_PLACE_SLOT)
    if (r && (r.homeTla || r.awayTla || r.match)) {
      card = <ResolvedCard r={r} onOpenFinished={onOpenFinished} onOpenPending={onOpenPending} />
    }
  }

  return (
    <div className="mt-6 max-w-[180px]">
      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">3er puesto</p>
      {card ?? <SlotPlaceholder slot={THIRD_PLACE_SLOT} />}
    </div>
  )
}

function SlotPlaceholder({ slot }: { slot: string }) {
  return (
    <BracketMatchCard
      home={{ tla: null, label: 'Por determinar' }}
      away={{ tla: null, label: slot }}
    />
  )
}
