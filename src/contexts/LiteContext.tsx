'use client'
import { createContext, useContext } from 'react'

interface LiteValue {
  isPremium: boolean
  unlock: (code: string) => boolean
  lock: () => void
  ready: boolean
}

const Ctx = createContext<LiteValue>({
  isPremium: false,
  unlock: () => false,
  lock: () => {},
  ready: false,
})

export function LiteProvider({ children }: { children: React.ReactNode }) {
  // App liberada por completo: todo el mundo es Pro, sin paywall ni código.
  const unlock = () => true
  const lock = () => {}

  return (
    <Ctx.Provider value={{ isPremium: true, unlock, lock, ready: true }}>
      {children}
    </Ctx.Provider>
  )
}

export const useLite = () => useContext(Ctx)
