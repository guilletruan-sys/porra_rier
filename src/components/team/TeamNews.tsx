'use client'
import { useEffect, useState } from 'react'

interface NewsItem {
  title: string
  link: string
  source: string
  pubDate: string
}

interface TeamNewsProps {
  tla: string
}

function formatDate(pubDate: string): string {
  const d = new Date(pubDate)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })
}

export function TeamNews({ tla }: TeamNewsProps) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/team/${tla}/news`)
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tla])

  if (loading) {
    return (
      <section className="mb-4">
        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
          Noticias
        </h2>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center text-xs text-slate-400 dark:text-slate-500 shadow-sm">
          Cargando…
        </div>
      </section>
    )
  }

  if (items.length === 0) return null

  return (
    <section className="mb-4">
      <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
        Noticias
      </h2>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm divide-y divide-slate-50 dark:divide-slate-800">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 transition-colors"
          >
            <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">{item.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-bold text-[#c8102e] truncate">{item.source}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">{formatDate(item.pubDate)}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
