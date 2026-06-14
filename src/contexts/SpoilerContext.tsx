'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'porra-spoilers-hidden'

interface SpoilerContextValue {
  hidden: boolean
  toggle: () => void
  ready: boolean
}

const Ctx = createContext<SpoilerContextValue>({ hidden: false, toggle: () => {}, ready: false })

export function SpoilerProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setHidden(localStorage.getItem(KEY) === '1')
    setReady(true)
  }, [])

  const toggle = () => {
    setHidden(h => {
      const next = !h
      localStorage.setItem(KEY, next ? '1' : '0')
      return next
    })
  }

  return <Ctx.Provider value={{ hidden, toggle, ready }}>{children}</Ctx.Provider>
}

export const useSpoiler = () => useContext(Ctx)
