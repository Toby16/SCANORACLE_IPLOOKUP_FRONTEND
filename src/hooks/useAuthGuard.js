import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated } from '../services/authService.js'

/**
 * useAuthGuard
 *
 * Call this at the top of any protected page.
 * It does two things:
 *
 * 1. Immediately checks if the user has a token — if not, redirects to /auth.
 * 2. Listens for the 'ghostroute:token-expired' custom event fired by authService
 *    whenever any API call receives a "Kindly input new token!" response.
 *    When fired, it automatically redirects to /auth with a friendly message.
 */
export function useAuthGuard() {
  const navigate = useNavigate()

  useEffect(() => {
    // Immediate check on mount
    if (!isAuthenticated()) {
      navigate('/auth', { replace: true })
      return
    }

    // Listen for expiry signals from any API call
    const handleExpired = () => {
      navigate('/auth', {
        replace: true,
        state: { sessionExpired: true },
      })
    }

    window.addEventListener('ghostroute:token-expired', handleExpired)
    return () => window.removeEventListener('ghostroute:token-expired', handleExpired)
  }, [navigate])
}
