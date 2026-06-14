interface IconProps {
  size?: number
  className?: string
}

export function IconBall({ size = 14, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.36 6h-2.95a13.34 13.34 0 0 0-1.42-3.43A8.04 8.04 0 0 1 18.36 8zM12 4c.95 1.37 1.7 2.86 2.18 4.5h-4.36C10.3 6.86 11.05 5.37 12 4zM4.26 14a8.05 8.05 0 0 1 0-4h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.42 3.43A8.04 8.04 0 0 1 5.08 16zm2.95-8H5.08a8.04 8.04 0 0 1 4.37-3.43A13.34 13.34 0 0 0 8.03 8zM12 20c-.95-1.37-1.7-2.86-2.18-4.5h4.36C13.7 17.14 12.95 18.63 12 20zm2.62-6.5H9.38a13.55 13.55 0 0 1 0-3h5.24c.08.5.14 1 .14 1.5s-.06 1-.14 1.5zm.25 5.93c.64-.98 1.1-2.18 1.42-3.43h2.95a8.04 8.04 0 0 1-4.37 3.43zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38a8.05 8.05 0 0 1 0 4h-3.38z"/>
    </svg>
  )
}

export function IconTrophy({ size = 14, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94C8.02 14.31 9.37 15.35 11 15.79V18H9c-.55 0-1 .45-1 1s.45 1 1 1h6c.55 0 1-.45 1-1s-.45-1-1-1h-2v-2.21c1.63-.44 2.98-1.48 3.61-2.85C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
    </svg>
  )
}

export function IconUsers({ size = 14, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  )
}

export function IconTrending({ size = 14, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
    </svg>
  )
}

export function IconCheck({ size = 10, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function IconFlagFallback({ width = 14, height = 10, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 18" fill="none" stroke="#cbd5e1" strokeWidth="2" className={className}>
      <rect x="1" y="1" width="22" height="16" rx="2" strokeDasharray="3 2" />
    </svg>
  )
}

export function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) {
    return <span className="text-xs font-black text-slate-400">{rank}</span>
  }
  const styles: Record<number, string> = {
    1: 'bg-gradient-to-br from-amber-300 to-amber-600',
    2: 'bg-gradient-to-br from-slate-300 to-slate-500',
    3: 'bg-gradient-to-br from-orange-400 to-orange-700',
  }
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-black text-white shadow-sm ${styles[rank]}`}>
      {rank}
    </span>
  )
}
