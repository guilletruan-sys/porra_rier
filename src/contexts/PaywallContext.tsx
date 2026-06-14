'use client'
import { createContext, useContext, useState } from 'react'

interface PaywallValue {
  open: boolean
  feature: string | null
  showPaywall: (feature?: string) => void
  closePaywall: () => void
}

const Ctx = createContext<PaywallValue>({
  open: false,
  feature: null,
  showPaywall: () => {},
  closePaywall: () => {},
})

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [feature, setFeature] = useState<string | null>(null)

  const showPaywall = (f?: string) => {
    setFeature(f ?? null)
    setOpen(true)
  }
  const closePaywall = () => setOpen(false)

  return (
    <Ctx.Provider value={{ open, feature, showPaywall, closePaywall }}>
      {children}
    </Ctx.Provider>
  )
}

export const usePaywall = () => useContext(Ctx)
