'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import FfmpegCheck from '@/components/FfmpegCheck'

interface TauriContextType {
  isTauri: boolean
}

const TauriContext = createContext<TauriContextType>({ isTauri: false })

export function useTauri() {
  return useContext(TauriContext)
}

export function TauriProvider({ children }: { children: React.ReactNode }) {
  const [isTauri, setIsTauri] = useState(false)

  useEffect(() => {
    setIsTauri(
      typeof window !== 'undefined' &&
        ('__TAURI__' in window || '__TAURI_INTERNALS__' in window),
    )
  }, [])

  return (
    <TauriContext.Provider value={{ isTauri }}>
      {isTauri && <FfmpegCheck />}
      {children}
    </TauriContext.Provider>
  )
}
