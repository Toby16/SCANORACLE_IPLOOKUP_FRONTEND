import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { saveToken } from '../services/authService.js'
import GhostLogo from '../components/GhostLogo.jsx'
import styles from './AuthCallback.module.css'

/**
 * Google SSO Callback Page — /auth/callback
 *
 * The backend redirects here after a successful Google OAuth exchange.
 * It attaches the token as a query param, e.g.:
 *   /auth/callback?access_token=eyJ...
 *
 * We read it, save it, and redirect to the dashboard.
 * If no token is present the user is sent back to /auth.
 */
export default function AuthCallback() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'error'
  const [errMsg, setErrMsg] = useState(null)

  useEffect(() => {
    // Backend may return access_token or token
    const token = params.get('access_token') || params.get('token')

    if (token) {
      saveToken(token)
      setStatus('success')
      setTimeout(() => navigate('/', { replace: true }), 900)
    } else {
      // Check for error message from backend
      const error = params.get('error') || params.get('message')
      setErrMsg(error || 'Authentication failed. No token was returned.')
      setStatus('error')
    }
  }, [navigate, params])

  return (
    <div className={styles.page}>
      <div className={styles.glowBg} aria-hidden="true" />
      <div className={styles.card}>
        <GhostLogo size={48} showText showSub />

        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.text}>Completing sign-in…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.text}>Signed in! Redirecting…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.errText}>{errMsg}</p>
            <button className={styles.backBtn} onClick={() => navigate('/auth')}>
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  )
}
