import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { saveToken } from '../services/authService.js'
import GhostLogo from '../components/GhostLogo.jsx'
import styles from './SSOCallback.module.css'

/**
 * SSOCallback — /auth/callback
 *
 * The backend Google OAuth flow redirects here after successful authentication:
 *   http://localhost:5173/auth/callback?access_token=<JWT>
 *
 * This page:
 *  1. Reads the token from query params
 *  2. Posts it back to the opener window (the Auth page popup)
 *  3. Closes itself
 *
 * If opened directly (not in a popup), it falls back to saving the token
 * and redirecting to / itself.
 *
 * Backend config required:
 *   Set the Google OAuth redirect URI to: http://localhost:5173/auth/callback
 */
export default function SSOCallback() {
  const [params]  = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [errMsg, setErrMsg] = useState(null)

  useEffect(() => {
    const token = params.get('access_token') || params.get('token')
    const error = params.get('error') || params.get('message') || params.get('detail')

    if (token) {
      // Always save locally in case postMessage fails
      saveToken(token)

      if (window.opener && !window.opener.closed) {
        // Popup mode — post token to parent and close
        try {
          window.opener.postMessage(
            { type: 'GHOSTROUTE_SSO_SUCCESS', token },
            window.location.origin  // only trust same origin
          )
        } catch {
          // opener exists but postMessage failed — parent will navigate itself
        }
        setStatus('success')
        // Give the parent a moment to receive, then close
        setTimeout(() => window.close(), 800)
      } else {
        // Fallback: not in a popup — redirect directly
        setStatus('redirect')
        window.location.replace('/')
      }
    } else {
      // Error from backend
      const msg = error || 'Google authentication failed. No token was returned.'

      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(
            { type: 'GHOSTROUTE_SSO_ERROR', error: msg },
            window.location.origin
          )
        } catch { /* ignore */ }
        setStatus('error')
        setErrMsg(msg)
        setTimeout(() => window.close(), 2000)
      } else {
        // Not a popup — show the error and let user navigate back
        setStatus('error')
        setErrMsg(msg)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.page}>
      <div className={styles.glowBg} aria-hidden="true" />

      <div className={styles.card}>
        <GhostLogo size={44} showText showSub />

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Completing sign-in…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successText}>Signed in successfully!</p>
            <p className={styles.text}>This window will close automatically.</p>
          </>
        )}

        {status === 'redirect' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Redirecting to your dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.errText}>{errMsg}</p>
            {!window.opener && (
              <button
                className={styles.backBtn}
                onClick={() => window.location.replace('/auth')}
              >
                ← Back to sign in
              </button>
            )}
            {window.opener && (
              <p className={styles.text}>This window will close shortly.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
