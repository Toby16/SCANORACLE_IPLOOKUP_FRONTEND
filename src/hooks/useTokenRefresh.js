import { useEffect, useRef } from 'react'
import { refreshToken, isAuthenticated } from '../services/authService.js'

const REFRESH_INTERVAL_MS = 85 * 60 * 1000  // 85 minutes

/**
 * Automatically refreshes the JWT every 85 minutes.
 * Pauses when the tab is hidden, resumes on visibility.
 * Only runs when the user is authenticated.
 */
export function useTokenRefresh() {
  const intervalRef = useRef(null)

  const startInterval = () => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(async () => {
      if (!isAuthenticated()) return
      try {
        await refreshToken()
      } catch {
        // Silently fail — user will be redirected on next protected route access
      }
    }, REFRESH_INTERVAL_MS)
  }

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) return

    // Start immediately
    startInterval()

    // Pause when tab is hidden, resume when visible
    const handleVisibility = () => {
      if (document.hidden) {
        stopInterval()
      } else {
        // Refresh immediately on return, then restart interval
        if (isAuthenticated()) {
          refreshToken().catch(() => {})
          startInterval()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stopInterval()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])
}
