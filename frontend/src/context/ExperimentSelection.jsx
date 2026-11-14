import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const LS_CODES = 'ignis_selected_experiment_codes'

function readStored() {
  try {
    const raw = localStorage.getItem(LS_CODES)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === 'string') : []
  } catch {
    return []
  }
}

function writeStored(codes) {
  localStorage.setItem(LS_CODES, JSON.stringify(codes))
}

const ExperimentSelectionContext = createContext(null)

export function ExperimentSelectionProvider({ children }) {
  const [selected, setSelected] = useState(readStored)

  const persist = useCallback((next) => {
    setSelected(next)
    writeStored(next)
  }, [])

  const toggle = useCallback(
    (code) => {
      persist(
        selected.includes(code)
          ? selected.filter((c) => c !== code)
          : [...selected, code],
      )
    },
    [persist, selected],
  )

  const add = useCallback(
    (code) => {
      if (!code || selected.includes(code)) return
      persist([...selected, code])
    },
    [persist, selected],
  )

  const remove = useCallback(
    (code) => {
      persist(selected.filter((c) => c !== code))
    },
    [persist, selected],
  )

  const clear = useCallback(() => persist([]), [persist])

  const value = useMemo(
    () => ({ selected, toggle, add, remove, clear }),
    [selected, toggle, add, remove, clear],
  )

  return (
    <ExperimentSelectionContext.Provider value={value}>
      {children}
    </ExperimentSelectionContext.Provider>
  )
}

export function useExperimentSelection() {
  const ctx = useContext(ExperimentSelectionContext)
  if (!ctx) {
    throw new Error('useExperimentSelection must be used within ExperimentSelectionProvider')
  }
  return ctx
}
