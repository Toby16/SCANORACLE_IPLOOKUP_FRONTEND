import { useEffect, useRef, useCallback } from 'react'
import { saveToken } from '../services/authService.js'

const SSO_URL      = 'http://127.0.0.1:9000/api/v1.0/auth/google/'
const POPUP_W      = 520
const POPUP_H      = 640
const POLL_INTERVAL = 400   // ms — check if popup closed without sending a message

/**
 * useGoogleSSO
 *
 * Opens a centered popup for Google OAuth.
 * Listens for postMessage from the SSOCallback page.
 *
 * @param onSuccess (token: string) => void
 * @param onError   (message: string) => void
 */
export function useGoogleSSO(onSuccess, onError) {
  const popupRef  = useRef(null)
  const pollRef   = useRef(null)
  const cleanedUp = useRef(false)

  const cleanup = useCallback(() => {
    if (pollRef.current)  clearInterval(pollRef.current)
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close()
    window.removeEventListener('message', handleMessage)
    cleanedUp.current = true
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleMessage(event) {
    // Only accept messages from the same origin
    if (event.origin !== window.location.origin) return

    const { type, token, error } = event.data ?? {}

    if (type === 'GHOSTROUTE_SSO_SUCCESS' && token) {
      saveToken(token)
      cleanup()
      onSuccess?.(token)
    } else if (type === 'GHOSTROUTE_SSO_ERROR') {
      cleanup()
      onError?.(error || 'Google sign-in failed.')
    }
  }

  const openPopup = useCallback(() => {
    cleanedUp.current = false

    // Center the popup on screen
    const left = Math.round(window.screenX + (window.outerWidth  - POPUP_W) / 2)
    const top  = Math.round(window.screenY + (window.outerHeight - POPUP_H) / 2)

    const popup = window.open(
      SSO_URL,
      'ghostroute_google_sso',
      `width=${POPUP_W},height=${POPUP_H},left=${left},top=${top}` +
      ',scrollbars=yes,resizable=yes,status=yes'
    )

    if (!popup || popup.closed) {
      // Popup was blocked
      onError?.('Popup was blocked. Please allow popups for this site and try again.')
      return
    }

    popupRef.current = popup
    window.addEventListener('message', handleMessage)

    // Poll for popup closed without a message (user closed it manually)
    pollRef.current = setInterval(() => {
      if (popupRef.current?.closed && !cleanedUp.current) {
        cleanup()
        onError?.('Sign-in was cancelled.')
      }
    }, POLL_INTERVAL)
  }, [onSuccess, onError, cleanup]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return { openPopup }
}
