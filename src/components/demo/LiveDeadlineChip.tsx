'use client'

interface LiveDeadlineChipProps {
  deadline: Date
  now: Date
}

function formatDuration(ms: number): string {
  if (ms <= 0) return 'cerrado'
  const totalMin = Math.floor(ms / 60_000)
  const days = Math.floor(totalMin / 1440)
  const hours = Math.floor((totalMin % 1440) / 60)
  const mins = totalMin % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}min`
  return `${mins}min`
}

export function LiveDeadlineChip({ deadline, now }: LiveDeadlineChipProps) {
  const remaining = deadline.getTime() - now.getTime()
  const closed = remaining <= 0
  const closing = !closed && remaining < 30 * 60_000
  const cls = closed
    ? 'bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 '
    : closing
      ? 'bg-orange-100 text-orange-700 animate-pulse'
      : 'bg-emerald-50 text-emerald-700'
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cls}`}>
      {closed ? '🔒 cerrado' : closing ? `⚠ cierra en ${formatDuration(remaining)}` : `cierra en ${formatDuration(remaining)}`}
    </span>
  )
}
