import { createContext, useContext, useState, useCallback } from 'react'

const MobileNavContext = createContext({ isOpen: false, toggle: () => {}, close: () => {} })

export function MobileNavProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = useCallback(() => setIsOpen(v => !v), [])
  const close = useCallback(() => setIsOpen(false), [])
  return (
    <MobileNavContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </MobileNavContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useMobileNav = () => useContext(MobileNavContext)
