import { useEffect, useRef, useState, useCallback } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export const IDLE_LOGOUT_ACK_KEY = 'idle_logout_ack'

const EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
]

export function useIdleLogout(
  supabase: SupabaseClient,
  {
    idleMs = 15 * 60 * 1000,
    redirectTo = '/login',
    warningBeforeMs = 30_000,
  }: { idleMs?: number; redirectTo?: string; warningBeforeMs?: number } = {}
) {
  const [warningVisible, setWarningVisible] = useState(false)
  const logoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    if (logoutRef.current) clearTimeout(logoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    // Do NOT clear warningVisible here – user must click "Stay logged in" to dismiss

    logoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut()
      sessionStorage.setItem(IDLE_LOGOUT_ACK_KEY, '1')
      window.location.assign(redirectTo)
    }, idleMs)

    if (warningBeforeMs > 0 && warningBeforeMs < idleMs) {
      warningRef.current = setTimeout(() => setWarningVisible(true), idleMs - warningBeforeMs)
    }
  }, [supabase, idleMs, redirectTo, warningBeforeMs])

  const dismissWarning = useCallback(() => {
    setWarningVisible(false)
    reset()
  }, [reset])

  useEffect(() => {
    if (!supabase) return

    reset()

    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }))

    return () => {
      if (logoutRef.current) clearTimeout(logoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      EVENTS.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [supabase, idleMs, redirectTo, warningBeforeMs, reset])

  return { warningVisible, dismissWarning }
}
