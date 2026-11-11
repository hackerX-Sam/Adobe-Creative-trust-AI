import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'dark' | 'light'
const LS_KEY = 'ctai-theme'

export interface ChartPalette {
  tick: string
  grid: string
  axis: string
  sectorStroke: string
  radialTrack: string
}

interface ThemeApi {
  mode: ThemeMode
  setMode: (_m: ThemeMode) => void
  toggle: () => void
  palette: ChartPalette
}

const DARK_PALETTE: ChartPalette = {
  tick: '#6B6B75',
  grid: '#1F1F26',
  axis: '#292930',
  sectorStroke: '#0B0B0D',
  radialTrack: '#26262E',
}

const LIGHT_PALETTE: ChartPalette = {
  tick: '#8A8A94',
  grid: '#EDEDF1',
  axis: '#E0E0E6',
  sectorStroke: '#FFFFFF',
  radialTrack: '#E5E5EB',
}

const ThemeCtx = createContext<ThemeApi | null>(null)

function initialMode(): ThemeMode {
  const stored = (() => {
    try {
      return localStorage.getItem(LS_KEY)
    } catch {
      return null
    }
  })()
  return stored === 'light' ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    root.classList.toggle('light', mode === 'light')
    try {
      localStorage.setItem(LS_KEY, mode)
    } catch {
      /* storage unavailable */
    }
  }, [mode])

  const api = useMemo<ThemeApi>(
    () => ({
      mode,
      setMode,
      toggle: () => setMode((_m) => (_m === 'dark' ? 'light' : 'dark')),
      palette: mode === 'dark' ? DARK_PALETTE : LIGHT_PALETTE,
    }),
    [mode],
  )

  return <ThemeCtx.Provider value={api}>{children}</ThemeCtx.Provider>
}

export function useTheme(): ThemeApi {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
