'use client'
import { useEffect, useState, useCallback } from 'react'

const KEY_IDENTITY = 'demo-porra:identity'
const KEY_SIMULATED_NOW_OFFSET = 'demo-porra:simulated-now-offset-ms'
const KEY_RESULTS = 'demo-porra:mock-results'
const KEY_ONBOARDED = 'demo-porra:onboarded'
const predictionsKey = (name: string) => `demo-porra:predictions:${name}`

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota / disabled */ }
}

function broadcast(key: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('demo-porra:change', { detail: { key } }))
}

function useLocalState<T>(key: string, initial: T): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial)
  useEffect(() => {
    setValue(safeRead<T>(key, initial))
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.key === key) setValue(safeRead<T>(key, initial))
    }
    window.addEventListener('demo-porra:change', onChange)
    return () => window.removeEventListener('demo-porra:change', onChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const update = useCallback((next: T) => {
    safeWrite(key, next)
    setValue(next)
    broadcast(key)
  }, [key])
  return [value, update]
}

/** Identidad ficticia. null hasta que el usuario elige. */
export function useDemoIdentity(): [string | null, (next: string | null) => void] {
  return useLocalState<string | null>(KEY_IDENTITY, null)
}

/** Predicciones del participante seleccionado. Key = slot, value = TLA elegido. */
export function useMyPredictions(name: string | null): {
  predictions: Record<string, string>
  setPrediction: (slot: string, tla: string) => void
  clearAll: () => void
} {
  const key = name ? predictionsKey(name) : '__none__'
  const [predictions, setPredictions] = useLocalState<Record<string, string>>(key, {})
  const setPrediction = useCallback((slot: string, tla: string) => {
    setPredictions({ ...predictions, [slot]: tla })
  }, [predictions, setPredictions])
  const clearAll = useCallback(() => setPredictions({}), [setPredictions])
  return { predictions, setPrediction, clearAll }
}

/**
 * Tiempo simulado: arranca igual que el reloj real, pero el admin puede sumarle
 * horas. Se guarda como offset (ms) sobre `Date.now()`.
 */
export function useSimulatedNow(): {
  now: Date
  addHours: (h: number) => void
  reset: () => void
} {
  const [offsetMs, setOffsetMs] = useLocalState<number>(KEY_SIMULATED_NOW_OFFSET, 0)
  // Tick cada 30s para que los countdowns se actualicen sin polling caro.
  const [, force] = useState(0)
  useEffect(() => {
    const t = setInterval(() => force(x => x + 1), 30_000)
    return () => clearInterval(t)
  }, [])
  const now = new Date(Date.now() + offsetMs)
  return {
    now,
    addHours: (h: number) => setOffsetMs(offsetMs + h * 3_600_000),
    reset: () => setOffsetMs(0),
  }
}

/** Resultados mockeados de los cruces. key=slot, value=winnerTla. */
export function useMockResults(): {
  results: Record<string, string>
  setResult: (slot: string, winnerTla: string) => void
  clearAll: () => void
} {
  const [results, setResults] = useLocalState<Record<string, string>>(KEY_RESULTS, {})
  return {
    results,
    setResult: (slot, winnerTla) => setResults({ ...results, [slot]: winnerTla }),
    clearAll: () => setResults({}),
  }
}

/** Si el usuario ya pasó el onboarding 1 vez (3 slides). */
export function useOnboarded(): [boolean, () => void] {
  const [done, setDone] = useLocalState<boolean>(KEY_ONBOARDED, false)
  return [done, () => setDone(true)]
}

/** Reset total — limpia TODO lo de demo de este navegador. */
export function resetAllDemoData() {
  if (typeof window === 'undefined') return
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('demo-porra:')) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
  window.dispatchEvent(new CustomEvent('demo-porra:change', { detail: { key: '*' } }))
}
