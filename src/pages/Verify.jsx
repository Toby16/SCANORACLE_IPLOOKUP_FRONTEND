// src/pages/Verify.jsx
import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  requestVerification, verifyAccount,
  loginUser, activateAccount,
  saveToken, getToken, refreshToken,
  getTempCredentials, clearTempCredentials,
} from '../services/authService.js'
import GhostLogo from '../components/GhostLogo.jsx'
import styles from './Verify.module.css'

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current }) {
  const labels = ['Sign up', 'Verify', 'Activate']
  return (
    <div className={styles.steps}>
      {labels.map((s, i) => (
        <div key={s} className={styles.stepItem}>
          <div className={`${styles.stepDot}
            ${i < current  ? styles.stepDone   : ''}
            ${i === current ? styles.stepActive : ''}
          `}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`${styles.stepLabel} ${i === current ? styles.stepLabelActive : ''}`}>{s}</span>
          {i < labels.length - 1 && (
            <div className={`${styles.stepLine} ${i < current ? styles.stepLineDone : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Verify Page ───────────────────────────────────────────────────────────────
export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()

  // Resolve email + username from location state, fall back to sessionStorage
  const tempCreds = getTempCredentials()
  const email    = location.state?.email    ?? tempCreds?.email    ?? null
  const username = location.state?.username ?? tempCreds?.username ?? email

  // ── Fetch state (QR / verification URL) ────────────────────────────────────
  const [fetchStatus,     setFetchStatus]     = useState('loading')
  const [fetchError,      setFetchError]       = useState(null)
  const [verificationUrl, setVerificationUrl] = useState(null)
  const [qrCode,          setQrCode]          = useState(null)

  // ── "Verify me" button state ───────────────────────────────────────────────
  // idle → loading → verified | error
  const [verifyMeStatus, setVerifyMeStatus] = useState('idle')
  const [verifyMeError,  setVerifyMeError]  = useState(null)

  // ── "Done" button state ────────────────────────────────────────────────────
  // idle → busy → done | error
  const [doneStatus, setDoneStatus] = useState('idle')
  const [doneMsg,    setDoneMsg]    = useState('')
  const [doneError,  setDoneError]  = useState(null)

  // Guard: must have at least email or username to be here
  useEffect(() => {
    if (!email && !username) navigate('/auth', { replace: true })
  }, [email, username, navigate])

  // ── Fetch QR + verification URL ────────────────────────────────────────────
  const fetchVerification = useCallback(async () => {
    setFetchStatus('loading'); setFetchError(null)
    try {
      // username (user_id from signup) is preferred; email is the fallback the API also accepts
      const r = await requestVerification({ username: username || email })
      setVerificationUrl(r.verificationUrl)
      setQrCode(r.qrCode)
      setFetchStatus('ready')
    } catch (err) {
      setFetchError(err.messageField || err.errorField || err.message || 'Failed to generate verification.')
      setFetchStatus('error')
    }
  }, [username, email])

  useEffect(() => {
    if (email || username) fetchVerification()
  }, [fetchVerification, email, username])

  // ── "Verify me" — calls the verification URL directly in the browser ───────
  const handleVerifyMe = useCallback(async () => {
    if (!verificationUrl) return
    if (verifyMeStatus === 'loading' || verifyMeStatus === 'verified') return
    setVerifyMeStatus('loading'); setVerifyMeError(null)
    try {
      await verifyAccount(verificationUrl)
      setVerifyMeStatus('verified')
    } catch (err) {
      setVerifyMeError(err.message || 'Verification failed. Please try again.')
      setVerifyMeStatus('error')
    }
  }, [verificationUrl, verifyMeStatus])

  // ── "Done — Activate my account" ──────────────────────────────────────────
  const handleDone = useCallback(async () => {
    if (doneStatus === 'busy' || doneStatus === 'done') return
    setDoneError(null); setDoneStatus('busy')

    try {
      // 1 — Try to reuse / refresh any existing token first
      let token = getToken()
      if (token) {
        setDoneMsg('Refreshing session…')
        try { token = (await refreshToken()) || token } catch { /* fall through to login */ }
      }

      // 2 — No valid token → login with stored credentials
      if (!token) {
        setDoneMsg('Signing you in…')
        const creds = getTempCredentials()
        if (!creds?.email || !creds?.password) {
          throw new Error('Session expired. Please sign up again.')
        }
        const loginResult = await loginUser({ email: creds.email, password: creds.password })
        token = loginResult.token
        if (!token) throw new Error('Login did not return a token.')
        saveToken(token)
      }

      clearTempCredentials()

      // 3 — Activate account
      setDoneMsg('Activating your account…')
      await activateAccount(token)

      // 4 — Done!
      setDoneMsg('All done! Loading your dashboard…')
      setDoneStatus('done')
      setTimeout(() => navigate('/', { replace: true }), 1000)

    } catch (err) {
      setDoneError(err.message || 'Something went wrong. Please try again.')
      setDoneStatus('error')
    }
  }, [doneStatus, navigate])

  if (!email && !username) return null

  const isBusy      = doneStatus === 'busy'
  const isDone      = doneStatus === 'done'
  const isVerified  = verifyMeStatus === 'verified'
  const vmLoading   = verifyMeStatus === 'loading'

  return (
    <div className={styles.page}>
      <div className={styles.glowBg} aria-hidden="true" />

      <div className={styles.container}>
        <GhostLogo size={42} showText showSub />
        <Steps current={1} />

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Verify your account</h1>
            <p className={styles.emailChip}>{email}</p>
            <p className={styles.subtitle}>
              Scan the QR code on another device, or click{' '}
              <strong>Verify me</strong> to verify right here.
              Then click <strong>Done</strong> to activate your account.
            </p>
          </div>

          {/* ── Loading state ── */}
          {fetchStatus === 'loading' && (
            <div className={styles.stateBox}>
              <div className={styles.spinner} />
              <p className={styles.stateText}>Generating your verification…</p>
            </div>
          )}

          {/* ── Error fetching QR ── */}
          {fetchStatus === 'error' && (
            <div className={styles.stateBox}>
              <div className={styles.iconBox} data-variant="error">✕</div>
              <p className={styles.errorText}>{fetchError}</p>
              <button className={styles.retryBtn} onClick={fetchVerification}>Try again</button>
            </div>
          )}

          {/* ── Ready ── */}
          {fetchStatus === 'ready' && !isDone && (
            <div className={styles.body}>

              {/* QR Code */}
              {qrCode && (
                <div className={styles.qrSection}>
                  <div className={styles.qrFrame}>
                    <img src={qrCode} alt="Verification QR code" className={styles.qrImg} />
                  </div>
                  <p className={styles.qrCaption}>Scan with any camera to verify on another device</p>
                </div>
              )}

              {/* ── Verify me button ────────────────────────────────────────── */}
              {verifyMeStatus === 'error' && verifyMeError && (
                <div className={styles.inlineError} role="alert">
                  <span>✕</span> {verifyMeError}
                </div>
              )}

              <button
                type="button"
                className={`${styles.verifyMeBtn} ${isVerified ? styles.verifyMeBtnDone : ''}`}
                disabled={vmLoading || isVerified || isBusy}
                onClick={handleVerifyMe}
              >
                {vmLoading && <><span className={styles.btnSpinner} /> Verifying…</>}
                {isVerified && <>✓&nbsp;&nbsp;Verified</>}
                {!vmLoading && !isVerified && 'Verify me'}
              </button>

              {/* Done progress indicator */}
              {isBusy && (
                <div className={styles.progressBox}>
                  <div className={styles.spinner} />
                  <p className={styles.progressText}>{doneMsg}</p>
                </div>
              )}

              {/* Done error */}
              {doneStatus === 'error' && doneError && (
                <div className={styles.inlineError} role="alert">
                  <span>✕</span> {doneError}
                </div>
              )}

              <div className={styles.divider}><span>when done on your device</span></div>

              {/* ── Done button ─────────────────────────────────────────────── */}
              <button type="button" className={styles.doneBtn} disabled={isBusy} onClick={handleDone}>
                {isBusy
                  ? <><span className={styles.btnSpinner} />{doneMsg}</>
                  : 'Done — Activate my account'
                }
              </button>
            </div>
          )}

          {/* ── Success state ── */}
          {isDone && (
            <div className={styles.stateBox}>
              <div className={styles.iconBox} data-variant="success">✓</div>
              <p className={styles.successText}>Account activated!</p>
              <p className={styles.stateText}>{doneMsg}</p>
              <div className={styles.spinner} />
            </div>
          )}
        </div>

        {!isDone && !isBusy && (
          <button className={styles.backLink} onClick={() => navigate('/auth')}>
            ← Back to sign in
          </button>
        )}
      </div>
    </div>
  )
}
