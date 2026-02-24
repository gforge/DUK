import React, { createContext, useContext, useState, useCallback } from 'react'
import { Snackbar, Alert } from '@mui/material'
import type { AlertColor } from '@mui/material'

interface SnackMessage {
  id: number
  message: string
  severity: AlertColor
}

interface SnackContextValue {
  showSnack: (message: string, severity?: AlertColor) => void
}

const SnackContext = createContext<SnackContextValue | null>(null)

let idCounter = 0

export function SnackProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<SnackMessage[]>([])

  const showSnack = useCallback((message: string, severity: AlertColor = 'info') => {
    const id = ++idCounter
    setMessages((prev) => [...prev, { id, message, severity }])
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id))
    }, 4000)
  }, [])

  const handleClose = (id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <SnackContext.Provider value={{ showSnack }}>
      {children}
      {messages.map((msg) => (
        <Snackbar
          key={msg.id}
          open
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          onClose={() => handleClose(msg.id)}
        >
          <Alert onClose={() => handleClose(msg.id)} severity={msg.severity} sx={{ width: '100%' }}>
            {msg.message}
          </Alert>
        </Snackbar>
      ))}
    </SnackContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSnack(): SnackContextValue {
  const ctx = useContext(SnackContext)
  if (!ctx) throw new Error('useSnack must be used within SnackProvider')
  return ctx
}
