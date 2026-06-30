// Estructura oficial del cuadro de eliminatorias FIFA WC 2026.
// Cada cruce tiene un "slot" estable (ej. "2A-2B", "W73-W75") que NO depende de
// quién acabe jugando — es el cruce abstracto del bracket FIFA.
//
// Los slots Wn-Wm que la FIFA y el Excel usan NO son secuenciales según el
// orden visible del Excel: W73…W88 son los 16 R32, pero la asignación de qué
// slot R32 corresponde a qué número FIFA viene determinada por el cuadro
// oficial. Esta tabla está derivada cruzando las filas R16/QF/SF del Excel
// con las predicciones reales de un participante (Guille) — cada Wm de un
// cruce R16 tiene que coincidir con uno de los slots R32, y eso fija el
// mapeo unívocamente.
//
// El orden visual top→bottom de cada lado es el del cuadro tipo árbol: las
// 8 R32 del lado izquierdo alimentan a R16 #1-4 → QF #1-2 → SF izq → Final.
// Análogo para la derecha. SF #1 (W97-W98) en izquierda, SF #2 (W99-W100)
// en derecha.

import type { Stage } from './types'

export type BracketSide = 'left' | 'right' | 'center'

// --- Lado izquierdo: alimenta a SF1 = W97-W98 ---
// R16 top: W74-W77 (W89). R16 bottom: W83-W84 (W93), W81-W82 (W94).
export const LEFT_R32_SLOTS = [
  '1E-3ABCDF',   // W74 ─┐
  '1I-3CDFGH',   // W77 ─┴ W89 (R16) ─┐
  '2A-2B',       // W73 ─┐            │
  '1F-2C',       // W75 ─┴ W90 (R16) ─┴ W97 (QF) ─┐
  '2K-2L',       // W83 ─┐                        │
  '1H-2J',       // W84 ─┴ W93 (R16) ─┐           │
  '1D-3BEFIJ',   // W81 ─┐            │           │
  '1G-3AEHIJ',   // W82 ─┴ W94 (R16) ─┴ W98 (QF) ─┴ W101 (SF1)
] as const

export const LEFT_R16_SLOTS = [
  'W74-W77',   // W89 (top)
  'W73-W75',   // W90
  'W83-W84',   // W93
  'W81-W82',   // W94 (bottom)
] as const

export const LEFT_QF_SLOTS = [
  'W89-W90',   // W97 (top)
  'W93-W94',   // W98 (bottom)
] as const

export const LEFT_SF_SLOT = 'W97-W98'   // W101

// --- Lado derecho: alimenta a SF2 = W99-W100 ---
export const RIGHT_R32_SLOTS = [
  '1C-2F',       // W76 ─┐
  '2E-2I',       // W78 ─┴ W91 (R16) ─┐
  '1A-3CEFHI',   // W79 ─┐            │
  '1L-3EHIJK',   // W80 ─┴ W92 (R16) ─┴ W99 (QF) ─┐
  '2D-2G',       // W86 ─┐                        │
  '1J-2H',       // W88 ─┴ W95 (R16) ─┐           │
  '1B-3EFGIJ',   // W85 ─┐            │           │
  '1K-3DEIJL',   // W87 ─┴ W96 (R16) ─┴ W100(QF) ─┴ W102 (SF2)
] as const

export const RIGHT_R16_SLOTS = [
  'W76-W78',   // W91 (top)
  'W79-W80',   // W92
  'W86-W88',   // W95
  'W85-W87',   // W96 (bottom)
] as const

export const RIGHT_QF_SLOTS = [
  'W91-W92',   // W99 (top)
  'W95-W96',   // W100 (bottom)
] as const

export const RIGHT_SF_SLOT = 'W99-W100'   // W102

// --- Centro ---
export const FINAL_SLOT = 'W101-W102'     // W103
export const THIRD_PLACE_SLOT = 'L101-L102'

// Número FIFA del ganador que produce cada slot (Wn). Permite propagar ganadores
// hacia delante: el slot R16 'W74-W77' lo alimentan los ganadores de los slots
// cuyo Wn es 74 y 77. Derivado de los comentarios de las tablas de arriba.
export const SLOT_WNUM: Record<string, number> = {
  // R32 — izquierda
  '1E-3ABCDF': 74, '1I-3CDFGH': 77, '2A-2B': 73, '1F-2C': 75,
  '2K-2L': 83, '1H-2J': 84, '1D-3BEFIJ': 81, '1G-3AEHIJ': 82,
  // R32 — derecha
  '1C-2F': 76, '2E-2I': 78, '1A-3CEFHI': 79, '1L-3EHIJK': 80,
  '2D-2G': 86, '1J-2H': 88, '1B-3EFGIJ': 85, '1K-3DEIJL': 87,
  // R16
  'W74-W77': 89, 'W73-W75': 90, 'W83-W84': 93, 'W81-W82': 94,
  'W76-W78': 91, 'W79-W80': 92, 'W86-W88': 95, 'W85-W87': 96,
  // QF
  'W89-W90': 97, 'W93-W94': 98, 'W91-W92': 99, 'W95-W96': 100,
  // SF
  'W97-W98': 101, 'W99-W100': 102,
  // Final
  'W101-W102': 103,
}

/** Slots a renderizar en una columna del cuadro, en orden visual top→bottom. */
export function slotsForColumn(stage: Stage, side: BracketSide): readonly string[] {
  if (side === 'left') {
    if (stage === 'ROUND_OF_32') return LEFT_R32_SLOTS
    if (stage === 'ROUND_OF_16') return LEFT_R16_SLOTS
    if (stage === 'QUARTER_FINALS') return LEFT_QF_SLOTS
    if (stage === 'SEMI_FINALS') return [LEFT_SF_SLOT]
  }
  if (side === 'right') {
    if (stage === 'ROUND_OF_32') return RIGHT_R32_SLOTS
    if (stage === 'ROUND_OF_16') return RIGHT_R16_SLOTS
    if (stage === 'QUARTER_FINALS') return RIGHT_QF_SLOTS
    if (stage === 'SEMI_FINALS') return [RIGHT_SF_SLOT]
  }
  if (side === 'center' && stage === 'FINAL') return [FINAL_SLOT]
  return []
}
