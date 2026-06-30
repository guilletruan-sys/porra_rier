// src/components/RankingChart.tsx
'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { IconTrending } from '@/components/icons'

const COLORS = [
  '#e11d48', '#f97316', '#eab308', '#16a34a', '#0d9488',
  '#2563eb', '#7c3aed', '#db2777', '#64748b', '#65a30d',
  '#0891b2', '#9333ea', '#dc2626',
]

interface HistoryPoint {
  label: string
  date: string
  rankings: Record<string, number>
}

interface RankingChartProps {
  history: HistoryPoint[]
  participants: string[]
}

export function RankingChart({ history, participants }: RankingChartProps) {
  if (history.length === 0) return null

  // Top 4 by current ranking (lowest rank value in the latest history point)
  const latest = history[history.length - 1].rankings
  const top4 = [...participants]
    .filter(p => latest[p] != null)
    .sort((a, b) => latest[a] - latest[b])
    .slice(0, 4)

  const data = history.map(({ label, rankings }) => ({ label, ...rankings }))
  const total = participants.length

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-3 mb-4">
      <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <IconTrending size={13} className="text-[#c8102e]" />
        Evolución de posiciones
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            interval="preserveStartEnd"
          />
          <YAxis
            reversed
            allowDecimals={false}
            domain={[1, total]}
            ticks={Array.from({ length: total }, (_, i) => i + 1)}
            interval={0}
            tickFormatter={(v) => `${v}º`}
            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
            width={32}
          />
          <Tooltip
            contentStyle={{ fontSize: '11px', borderRadius: '8px', padding: '6px 10px' }}
            formatter={(value, name) => [`#${value}`, String(name)]}
            itemSorter={(item) => (item.value as number)}
          />
          {top4.map((name, i) => (
            <Line
              key={name}
              type="linear"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {top4.map((name, i) => (
          <span key={name} className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 ">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}
