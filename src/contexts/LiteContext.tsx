'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'porra-rier-premium'

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
  const [isPremium, setIsPremium] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setIsPremium(localStorage.getItem(KEY) === 'true')
    setReady(true)
  }, [])

  const unlock = (code: string): boolean => {
    const expected = process.env.NEXT_PUBLIC_ADMIN_CODE ?? ''
    if (!expected) return false
    if (code.trim() === expected) {
      localStorage.setItem(KEY, 'true')
      setIsPremium(true)
      return true
    }
    return false
  }

  const lock = () => {
    localStorage.removeItem(KEY)
    setIsPremium(false)
  }

  return (
    <Ctx.Provider value={{ isPremium, unlock, lock, ready }}>
      {children}
    </Ctx.Provider>
  )
}

export const useLite = () => useContext(Ctx)
