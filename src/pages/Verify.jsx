import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  requestVerification,
  verifyAccount,
  loginUser,
  activateAccount,
  saveToken,
  getTempCredentials,
  clearTempCredentials,
} from '../services/authService.js'
import styles from './Verify.module.css'

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className={styles.logo}>
      <svg viewBox="0 0 56 56" fill="none" className={styles.logoSvg}>
        <circle cx="28" cy="28" r="26" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="5 3" className={styles.ringA}/>
        <circle cx="28" cy="28" r="17" stroke="#7c3aed" strokeWidth="1" opacity="0.4" className={styles.ringB}/>
        <circle cx="28" cy="28" r="8" fill="#7c3aed" opacity="0.15"/>
        <circle cx="28" cy="28" r="3.5" fill="#a78bfa"/>
        <line x1="28" y1="2"  x2="28" y2="12" stroke="#a78bfa" strokeWidth="1.5" opacity="0.8"/>
        <line x1="28" y1="44" x2="28" y2="54" stroke="#a78bfa" strokeWidth="1.5" opacity="0.8"/>
        <line x1="2"  y1="28" x2="12" y2="28" stroke="#a78bfa" strokeWidth="1.5" opacity="0.8"/>
        <line x1="44" y1="28" x2="54" y2="28" stroke="#a78bfa" strokeWidth="1.5" opacity="0.8"/>
        <path d="M9 9 L9 15 M9 9 L15 9"     stroke="#a78bfa" strokeWidth="1.5" opacity="0.5" strokeLinecap="round"/>
        <path d="M47 9 L47 15 M47 9 L41 9"  stroke="#a78bfa" strokeWidth="1.5" opacity="0.5" strokeLinecap="round"/>
        <path d="M9 47 L9 41 M9 47 L15 47"  stroke="#a78bfa" strokeWidth="1.5" opacity="0.5" strokeLinecap="round"/>
        <path d="M47 47 L47 41 M47 47 L41 47" stroke="#a78bfa" strokeWidth="1.5" opacity="0.5" strokeLinecap="round"/>
      </svg>
      <div className={styles.logoWords}>
        <span className={styles.logoName}><span className={styles.logoAccent}>Ghost</span>route</span>
        <span className={styles.logoSub}>Security Mega App</span>
      </div>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Sign up', 'Verify', 'Activate']
  return (
    <div className={styles.steps}>
      {steps.map((s, i) => (
        <div key={s} className={styles.stepItem}>
          <div className={`${styles.stepDot} ${i < current ? styles.stepDone : i === current ? styles.stepActive : ''}`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`${styles.stepLabel} ${i === current ? styles.stepLabelActive : ''}`}>{s}</span>
          {i < steps.length - 1 && <div className={`${styles.stepLine} ${i < current ? styles.stepLineDone : ''}`} />}
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

  // Stage 1: fetch QR + URL
  const [fetchStatus,     setFetchStatus]     = useState('loading')
  const [fetchError,      setFetchError]       = useState(null)
  const [verificationUrl, setVerificationUrl] = useState(null)
  const [qrCode,          setQrCode]          = useState(null)

  // Stage 2: verify → login → activate
  const [verifyStatus, setVerifyStatus] = useState('idle') // 'idle'|'verifying'|'logging_in'|'activating'|'done'|'error'
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

  // Full post-verification flow: verify URL → login → activate → dashboard
  const handleDone = useCallback(async () => {
    if (!verificationUrl || verifyStatus === 'verifying') return
    setVerifyError(null)

    try {
      // Step 1 — hit verification URL
      setVerifyStatus('verifying')
      setStatusMsg('Confirming verification…')
      await verifyAccount(verificationUrl)

      // Step 2 — login with stored credentials
      setVerifyStatus('logging_in')
      setStatusMsg('Signing you in…')
      const creds = getTempCredentials()
      if (!creds) throw new Error('Session expired. Please sign up again.')
      const loginResult = await loginUser({ email: creds.email, password: creds.password })
      const token = loginResult.token
      if (!token) throw new Error('Login did not return a token.')
      saveToken(token)
      clearTempCredentials()

      // Step 3 — activate account
      setVerifyStatus('activating')
      setStatusMsg('Activating your account…')
      await activateAccount(token)

      // Done — redirect to dashboard
      setVerifyStatus('done')
      setStatusMsg('All done! Loading your dashboard…')
      setTimeout(() => navigate('/dashboard', { replace: true }), 1000)

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
        <Logo />
        <Steps current={1} />

        <div className={styles.card}>
          {/* Header */}
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Verify your account</h1>
            <p className={styles.emailChip}>{email}</p>
            <p className={styles.subtitle}>
              Scan the QR code on any device to open your verification link,
              then click <strong>Done</strong> to activate your account.
            </p>
          </div>

          {/* ── Fetch loading ── */}
          {fetchStatus === 'loading' && (
            <div className={styles.stateBox}>
              <div className={styles.spinner} />
              <p className={styles.stateText}>Generating your verification…</p>
            </div>
          )}

          {/* ── Fetch error ── */}
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

              {/* Step progress during verification */}
              {isBusy && (
                <div className={styles.progressBox}>
                  <div className={styles.spinner} />
                  <p className={styles.progressText}>{statusMsg}</p>
                </div>
              )}

              {/* Verify error */}
              {verifyStatus === 'error' && verifyError && (
                <div className={styles.inlineError} role="alert">
                  <span>✕</span> {verifyError}
                </div>
              )}

              {/* Divider */}
              <div className={styles.divider}><span>when done on your device</span></div>

              {/* Done button — triggers full flow */}
              <button
                type="button"
                className={styles.doneBtn}
                disabled={isBusy}
                onClick={handleDone}
              >
                {isBusy ? <><span className={styles.btnSpinner} />{statusMsg}</> : 'Done — Activate my account'}
              </button>
            </div>
          )}

          {/* ── Success state ── */}
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
