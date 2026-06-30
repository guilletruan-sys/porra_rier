'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getFlagUrl, TLA_TO_EXCEL_NAME } from '@/lib/team-map'
import { IconFlagFallback } from '@/components/icons'
import { LiveDeadlineChip } from '@/components/demo/LiveDeadlineChip'
import { AggregateOpinion } from '@/components/demo/AggregateOpinion'
import { aggregateOpinion, type MockCross } from '@/lib/demo/mock-bracket'

interface LiveCrossCardProps {
  cross: MockCross
  deadline: Date
  now: Date
  myPick: string | null
  /** Si está presente, el cruce ya tiene resultado y la card pasa a modo cerrado. */
  result?: string
  onPick: (tla: string) => void
}

const ADVANCE_POINTS_BY_ROUND: Partial<Record<MockCross['round'], number>> = {
  ROUND_OF_32: 5,
  ROUND_OF_16: 7,
  QUARTER_FINALS: 10,
}

export function LiveCrossCard({ cross, deadline, now, myPick, result, onPick }: LiveCrossCardProps) {
  const closed = now.getTime() >= deadline.getTime()
  const hasResult = !!result
  const homeName = TLA_TO_EXCEL_NAME[cross.home] ?? cross.home
  const awayName = TLA_TO_EXCEL_NAME[cross.away] ?? cross.away
  const homeFlag = getFlagUrl(cross.home)
  const awayFlag = getFlagUrl(cross.away)
  const agg = aggregateOpinion(cross.slot, myPick)
  const advancePts = ADVANCE_POINTS_BY_ROUND[cross.round] ?? 0
  const earnedPts = hasResult && myPick === result ? advancePts : 0

  const [recentlySaved, setRecentlySaved] = useState(false)
  useEffect(() => {
    if (!myPick) return
    setRecentlySaved(true)
    const t = setTimeout(() => setRecentlySaved(false), 1500)
    return () => clearTimeout(t)
  }, [myPick])

  if (hasResult) {
    // Cerrado con resultado: solo lectura, indicar acierto/fallo.
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between">
          <LiveDeadlineChip deadline={deadline} now={now} />
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {ROUND_LABEL[cross.round]}
          </span>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between gap-3">
            <TeamHalf tla={cross.home} name={homeName} flag={homeFlag} isWinner={result === cross.home} isMyPick={myPick === cross.home} compact />
            <span className="text-xs font-black text-slate-400 dark:text-slate-500">vs</span>
            <TeamHalf tla={cross.away} name={awayName} flag={awayFlag} isWinner={result === cross.away} isMyPick={myPick === cross.away} compact />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 ">
              {myPick
                ? <>Predijiste: <span className="font-black text-slate-700 dark:text-slate-200">{TLA_TO_EXCEL_NAME[myPick] ?? myPick}</span></>
                : <>Sin predicción</>}
            </span>
            <span className={`text-[10px] font-black tabular-nums px-2 py-0.5 rounded-full ${
              earnedPts > 0
                ? 'bg-emerald-100 text-emerald-700'
                : myPick
                  ? 'bg-red-100 text-red-600'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 '
            }`}>
              {earnedPts > 0 ? `+${earnedPts} pts` : '0 pts'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (closed) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800 opacity-80">
        <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between">
          <LiveDeadlineChip deadline={deadline} now={now} />
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{ROUND_LABEL[cross.round]}</span>
        </div>
        <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 ">
          {myPick
            ? <>Predijiste: <span className="font-black text-slate-700 dark:text-slate-200">{TLA_TO_EXCEL_NAME[myPick] ?? myPick}</span>. Esperando resultado…</>
            : <>Sin predicción. Cerrado.</>}
        </div>
      </div>
    )
  }

  // Editable
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800">
      <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between">
        <LiveDeadlineChip deadline={deadline} now={now} />
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{ROUND_LABEL[cross.round]}</span>
      </div>
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <ChoiceButton
            tla={cross.home}
            name={homeName}
            flag={homeFlag}
            chosen={myPick === cross.home}
            otherChosen={!!myPick && myPick !== cross.home}
            onClick={() => onPick(cross.home)}
          />
          <ChoiceButton
            tla={cross.away}
            name={awayName}
            flag={awayFlag}
            chosen={myPick === cross.away}
            otherChosen={!!myPick && myPick !== cross.away}
            onClick={() => onPick(cross.away)}
          />
        </div>

        <AggregateOpinion
          slot={cross.slot}
          homeTla={cross.home}
          awayTla={cross.away}
          mySelection={myPick}
          agg={agg}
          reveal={!!myPick}
        />

        {myPick && (
          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${recentlySaved ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              {recentlySaved ? 'Guardado ✓' : 'Guardado'}
            </span>
            <span className="font-bold">
              {myPick === cross.home ? `pasa ${homeName}` : `pasa ${awayName}`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const ROUND_LABEL: Record<MockCross['round'], string> = {
  ROUND_OF_32: 'R32',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semis',
  THIRD_PLACE: '3er puesto',
  FINAL: 'Final',
}

function TeamHalf({ tla, name, flag, isWinner, isMyPick, compact = false }: { tla: string; name: string; flag: string | null; isWinner: boolean; isMyPick: boolean; compact?: boolean }) {
  return (
    <div className={`flex-1 flex flex-col items-center gap-1 ${!isWinner && (isMyPick || true) ? 'opacity-100' : ''}`}>
      {flag
        ? <Image src={flag} alt="" width={compact ? 28 : 36} height={compact ? 20 : 26} unoptimized className={`rounded-sm shadow-sm ${!isWinner ? 'opacity-50' : ''}`} />
        : <IconFlagFallback width={compact ? 28 : 36} height={compact ? 20 : 26} />}
      <span className={`text-[10px] font-bold text-center ${isWinner ? 'text-emerald-700' : 'text-slate-500 dark:text-slate-400 '}`}>
        {name} {isMyPick && '✓'}
      </span>
    </div>
  )
}

function ChoiceButton({ tla, name, flag, chosen, otherChosen, onClick }: { tla: string; name: string; flag: string | null; chosen: boolean; otherChosen: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate(15) } catch { /* ignore */ }
        }
        onClick()
      }}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-95 ${
        chosen
          ? 'bg-[#c8102e] text-white border-[#c8102e] shadow-md scale-[1.02]'
          : otherChosen
            ? 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400  border-slate-100 dark:border-slate-800 opacity-50'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 hover:border-[#c8102e]/40'
      }`}
    >
      {flag
        ? <Image src={flag} alt="" width={40} height={28} unoptimized className="rounded-sm shadow-sm" />
        : <IconFlagFallback width={40} height={28} />}
      <span className="text-xs font-black text-center">{name}</span>
      <span className={`text-[9px] font-black uppercase tracking-widest ${chosen ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
        {chosen ? '✓ PASA' : 'PASA'}
      </span>
    </button>
  )
}
