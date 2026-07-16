'use client'

import { useEffect, useRef, useCallback } from 'react'
import { signOut } from 'next-auth/react'

const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes inactivity
const WARNING_MS = 1 * 60 * 1000 // warn 1 minute before expiry

export default function SessionTimeout() {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)

  const logout = useCallback(() => {
    signOut({ callbackUrl: '/' })
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    timerRef.current = setTimeout(() => {
      logout()
    }, TIMEOUT_MS)

    warningRef.current = setTimeout(() => {
      // Could show a warning toast here if needed
    }, TIMEOUT_MS - WARNING_MS)
  }, [logout])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => document.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, [resetTimer])

  return null
}
