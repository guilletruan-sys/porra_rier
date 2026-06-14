interface ProBadgeProps {
  size?: 'sm' | 'md'
  className?: string
}

export function ProBadge({ size = 'sm', className = '' }: ProBadgeProps) {
  const cls = size === 'sm'
    ? 'text-[8px] px-1 py-0.5'
    : 'text-[10px] px-1.5 py-0.5'
  return (
    <span className={`inline-flex items-center gap-0.5 bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black rounded uppercase tracking-wider shadow-sm ${cls} ${className}`}>
      <LockIcon />
      PRO
    </span>
  )
}

function LockIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  )
}
