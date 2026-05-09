import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  requestVerification, verifyAccount,
  loginUser, activateAccount,
  saveToken, getTempCredentials, clearTempCredentials,
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
  const email    = location.state?.email ?? null

  const [fetchStatus,     setFetchStatus]     = useState('loading')
  const [fetchError,      setFetchError]       = useState(null)
  const [verificationUrl, setVerificationUrl] = useState(null)
  const [qrCode,          setQrCode]          = useState(null)

  const [verifyStatus, setVerifyStatus] = useState('idle')
  const [verifyError,  setVerifyError]  = useState(null)
  const [statusMsg,    setStatusMsg]    = useState('')

  useEffect(() => {
    if (!email) navigate('/auth', { replace: true })
  }, [email, navigate])

  const fetchVerification = useCallback(async () => {
    setFetchStatus('loading'); setFetchError(null)
    try {
      const r = await requestVerification({ email })
      setVerificationUrl(r.verificationUrl)
      setQrCode(r.qrCode)
      setFetchStatus('ready')
    } catch (err) {
      setFetchError(err.messageField || err.errorField || err.message || 'Failed to generate verification.')
      setFetchStatus('error')
    }
  }, [email])

  useEffect(() => { if (email) fetchVerification() }, [fetchVerification, email])

  const handleDone = useCallback(async () => {
    if (!verificationUrl || verifyStatus === 'verifying') return
    setVerifyError(null)

    try {
      // 1 — Confirm verification URL
      setVerifyStatus('verifying'); setStatusMsg('Confirming verification…')
      await verifyAccount(verificationUrl)

      // 2 — Login with stored credentials
      setVerifyStatus('logging_in'); setStatusMsg('Signing you in…')
      const creds = getTempCredentials()
      if (!creds) throw new Error('Session expired. Please sign up again.')
      const loginResult = await loginUser({ email: creds.email, password: creds.password })
      const token = loginResult.token
      if (!token) throw new Error('Login did not return a token.')
      saveToken(token)
      clearTempCredentials()

      // 3 — Activate account
      setVerifyStatus('activating'); setStatusMsg('Activating your account…')
      await activateAccount(token)

      // Done — redirect to dashboard (root /)
      setVerifyStatus('done'); setStatusMsg('All done! Loading your dashboard…')
      setTimeout(() => navigate('/', { replace: true }), 1000)

    } catch (err) {
      setVerifyError(err.message || 'Something went wrong. Please try again.')
      setVerifyStatus('error')
    }
  }, [verificationUrl, verifyStatus, navigate])

  if (!email) return null

  const isBusy = ['verifying', 'logging_in', 'activating'].includes(verifyStatus)
  const isDone = verifyStatus === 'done'

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
              Scan the QR code on any device to open your verification link,
              then click <strong>Done</strong> to activate your account.
            </p>
          </div>

          {fetchStatus === 'loading' && (
            <div className={styles.stateBox}>
              <div className={styles.spinner} />
              <p className={styles.stateText}>Generating your verification…</p>
            </div>
          )}

          {fetchStatus === 'error' && (
            <div className={styles.stateBox}>
              <div className={styles.iconBox} data-variant="error">✕</div>
              <p className={styles.errorText}>{fetchError}</p>
              <button className={styles.retryBtn} onClick={fetchVerification}>Try again</button>
            </div>
          )}

          {fetchStatus === 'ready' && !isDone && (
            <div className={styles.body}>
              {qrCode && (
                <div className={styles.qrSection}>
                  <div className={styles.qrFrame}>
                    <img src={qrCode} alt="Verification QR code" className={styles.qrImg} />
                  </div>
                  <p className={styles.qrCaption}>Scan with any camera to verify on another device</p>
                </div>
              )}

              {isBusy && (
                <div className={styles.progressBox}>
                  <div className={styles.spinner} />
                  <p className={styles.progressText}>{statusMsg}</p>
                </div>
              )}

              {verifyStatus === 'error' && verifyError && (
                <div className={styles.inlineError} role="alert">
                  <span>✕</span> {verifyError}
                </div>
              )}

              <div className={styles.divider}><span>when done on your device</span></div>

              <button type="button" className={styles.doneBtn} disabled={isBusy} onClick={handleDone}>
                {isBusy
                  ? <><span className={styles.btnSpinner} />{statusMsg}</>
                  : 'Done — Activate my account'
                }
              </button>
            </div>
          )}

          {isDone && (
            <div className={styles.stateBox}>
              <div className={styles.iconBox} data-variant="success">✓</div>
              <p className={styles.successText}>Account activated!</p>
              <p className={styles.stateText}>{statusMsg}</p>
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
