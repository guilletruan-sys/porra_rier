'use client'
import { useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'porra-theme'

function readStored(): Theme | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'dark' || v === 'light' ? v : null
}

function applyToDOM(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  // Para que el chrome del navegador (status bar iOS) pinte coherente.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f1f5f9')
}

export function useTheme(): { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const stored = readStored()
    const initial: Theme = stored
      ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setThemeState(initial)
    applyToDOM(initial)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    applyToDOM(t)
    try { window.localStorage.setItem(STORAGE_KEY, t) } catch { /* quota / disabled */ }
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, toggle, setTheme }
}

/**
 * Inlined no-flash script. Renderizado en <head> via dangerouslySetInnerHTML
 * para aplicar la clase `dark` ANTES del primer paint, evitando el flash
 * blanco cuando el usuario tiene tema oscuro guardado o preferencia del SO.
 */
export const NO_FLASH_SCRIPT = `
(function() {
  try {
    var s = localStorage.getItem('${STORAGE_KEY}');
    var t = (s === 'dark' || s === 'light')
      ? s
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (t === 'dark') document.documentElement.classList.add('dark');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#0f172a' : '#f1f5f9');
  } catch (e) {}
})();
`
