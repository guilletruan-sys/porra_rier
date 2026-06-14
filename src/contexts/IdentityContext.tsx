'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'porra-rier-identity'

interface IdentityValue {
  name: string | null
  setName: (n: string | null) => void
  ready: boolean
  openPicker: () => void
  pickerOpen: boolean
  closePicker: () => void
}

const Ctx = createContext<IdentityValue>({
  name: null,
  setName: () => {},
  ready: false,
  openPicker: () => {},
  pickerOpen: false,
  closePicker: () => {},
})

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    setNameState(localStorage.getItem(KEY))
    setReady(true)
  }, [])

  const setName = (n: string | null) => {
    if (n) localStorage.setItem(KEY, n)
    else localStorage.removeItem(KEY)
    setNameState(n)
  }

  const openPicker = () => setPickerOpen(true)
  const closePicker = () => setPickerOpen(false)

  return (
    <Ctx.Provider value={{ name, setName, ready, openPicker, pickerOpen, closePicker }}>
      {children}
    </Ctx.Provider>
  )
}

export const useIdentity = () => useContext(Ctx)
