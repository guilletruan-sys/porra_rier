import { displayScore } from '@/lib/score-format'
import type { Score } from '@/lib/types'

/**
 * Marcador con los penaltis como subíndice entre paréntesis, p.ej. 1₍₃₎ – 1₍₄₎.
 * Devuelve contenido inline; el tamaño/color del número grande lo pone el padre.
 */
export function ScoreText({
  score,
  sep = ' – ',
  penClassName = 'text-[0.6em] font-bold align-sub ml-px',
}: {
  score: Score
  sep?: string
  penClassName?: string
}) {
  const d = displayScore(score)
  return (
    <>
      {d.home}{d.pens && <span className={penClassName}>({d.pens.home})</span>}
      {sep}
      {d.away}{d.pens && <span className={penClassName}>({d.pens.away})</span>}
    </>
  )
}
