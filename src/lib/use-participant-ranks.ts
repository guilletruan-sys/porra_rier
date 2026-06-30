'use client'
import { useEffect, useState } from 'react'

/**
 * Devuelve un mapa { participantName → rank actual }. Mientras carga o si la
 * API falla, devuelve {} y los nombres se pintan sin prefijo (degradación silenciosa).
 *
 * Se monta sobre /api/ranking (revalidate=60 servidor + cache:'no-store' cliente) —
 * la respuesta lleva la lista `ranking` con `{ name, rank }`.
 */
export function useParticipantRanks() {
  const [ranks, setRanks] = useState<Record<string, number>>({})
  useEffect(() => {
    let cancelled = false
    fetch('/api/ranking', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const map: Record<string, number> = {}
        for (const r of d.ranking ?? []) {
          if (r?.name && typeof r.rank === 'number') map[r.name] = r.rank
        }
        setRanks(map)
      })
      .catch(() => { /* sin red → mantener {} */ })
    return () => { cancelled = true }
  }, [])
  return ranks
}

/** "1º Joss" / "12º Mario L.R" cuando el rank esté disponible, si no solo el nombre. */
export function participantWithRank(name: string, ranks: Record<string, number>): string {
  const r = ranks[name]
  return r ? `${r}º ${name}` : name
}
