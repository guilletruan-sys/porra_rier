import participants from '@/data/participants.json'
import predictionsRaw from '@/data/predictions.json'
import type { PredictionsData, Stage } from '@/lib/types'

const predictions = predictionsRaw as PredictionsData

interface TeamPorraSectionProps {
  tla: string
}

// Label = the round the team reaches after winning round X.
const REACHES_LABEL: Record<Stage, string> = {
  GROUP_STAGE: 'Grupos',
  ROUND_OF_32: 'Octavos',
  ROUND_OF_16: 'Cuartos',
  QUARTER_FINALS: 'Semis',
  SEMI_FINALS: 'Final',
  THIRD_PLACE: 'Tercer puesto',
  FINAL: 'Campeón',
}

const ROUND_ORDER: Stage[] = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL']

export function TeamPorraSection({ tla }: TeamPorraSectionProps) {
  const champions: string[] = []
  const runnerUps: string[] = []
  const thirds: string[] = []
  const r32Qualifiers: string[] = []   // predicted this team to come out of the groups
  const byRound: Record<string, string[]> = {}

  for (const name of participants as string[]) {
    const p = predictions[name]
    if (!p) continue
    if (p.specials.champion === tla) champions.push(name)
    if (p.specials.runnerUp === tla) runnerUps.push(name)
    if (p.specials.thirdPlace === tla) thirds.push(name)

    let predictedInR32 = false
    for (const pred of Object.values(p.knockout)) {
      if (pred.round === 'ROUND_OF_32') {
        if (pred.homeTla === tla || pred.awayTla === tla) predictedInR32 = true
      }
      if (pred.advancingTeamTla === tla) {
        const round = pred.round
        if (!byRound[round]) byRound[round] = []
        if (!byRound[round].includes(name)) byRound[round].push(name)
      }
    }
    if (predictedInR32) r32Qualifiers.push(name)
  }

  const advancingRounds = ROUND_ORDER.filter(r => byRound[r]?.length > 0)
  const hasData =
    champions.length > 0 ||
    runnerUps.length > 0 ||
    thirds.length > 0 ||
    r32Qualifiers.length > 0 ||
    advancingRounds.length > 0

  if (!hasData) return null

  return (
    <section className="mb-4">
      <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
        La porra dice
      </h2>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800">
        {champions.length > 0 && <Row label="🏆 Lo ven campeón" names={champions} highlight />}
        {runnerUps.length > 0 && <Row label="🥈 Lo ven subcampeón" names={runnerUps} />}
        {thirds.length > 0 && <Row label="🥉 Lo ven en 3er puesto" names={thirds} />}
        {r32Qualifiers.length > 0 && <Row label="Lo ponen en Dieciseisavos" names={r32Qualifiers} />}
        {advancingRounds.map(r => (
          <Row key={r} label={`Lo ven llegar a ${REACHES_LABEL[r]}`} names={byRound[r]} />
        ))}
      </div>
    </section>
  )
}

function Row({ label, names, highlight }: { label: string; names: string[]; highlight?: boolean }) {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex-1">{label}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${highlight ? 'bg-red-50 text-[#c8102e]' : 'bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 '}`}>
          {names.length}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 ">{[...names].sort().join(' · ')}</p>
    </div>
  )
}
