import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestVerification, verifyAccount, forgotPassword, saveToken } from '../services/authService.js'
import styles from './ForgotPassword.module.css'

/**
 * ForgotPassword — 3-step modal overlay
 *
 * Step 1 — Enter username or email → request verification
 * Step 2 — Show QR code + "Done" button → hit verification URL to get token
 * Step 3 — Enter new password → POST /user/forgot/password/ with token → redirect to dashboard
 *
 * Props:
 *   onClose — called when the user dismisses the modal
 */
export default function ForgotPassword({ onClose }) {
  const navigate = useNavigate()

  const [step,       setStep]       = useState(1)         // 1 | 2 | 3
  const [identity,   setIdentity]   = useState('')         // email or username
  const [verifyUrl,  setVerifyUrl]  = useState(null)       // full verification URL
  const [qrCode,     setQrCode]     = useState(null)       // base64 QR
  const [resetToken, setResetToken] = useState(null)       // token from verification
  const [newPass,    setNewPass]    = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // ── Step 1: Request verification ──────────────────────────────────────────
  const handleRequest = useCallback(async () => {
    if (!identity.trim()) { setError('Please enter your username or email address.'); return }
    setError(null); setLoading(true)
    try {
      const result = await requestVerification({ email: identity.trim() })
      setVerifyUrl(result.verificationUrl)
      setQrCode(result.qrCode)
      setStep(2)
    } catch (err) {
      setError(err.message || 'Could not send verification. Try again.')
    } finally { setLoading(false) }
  }, [identity])

  // ── Step 2: Verify identity (hit the verification URL) ────────────────────
  const handleVerify = useCallback(async () => {
    if (!verifyUrl) return
    setError(null); setLoading(true)
    try {
      const result = await verifyAccount(verifyUrl)
      // Save the verification token temporarily — we don't use it as a session yet
      setResetToken(result.token)
      setStep(3)
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.')
    } finally { setLoading(false) }
  }, [verifyUrl])

  // ── Step 3: Set new password ──────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    if (!newPass.trim())        { setError('Please enter a new password.'); return }
    if (newPass.trim().length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!resetToken)            { setError('Verification token missing. Please start over.'); return }

    setError(null); setLoading(true)
    try {
      const result = await forgotPassword(resetToken, newPass.trim())
      // Backend returns a login token — user is now authenticated
      if (result.token) saveToken(result.token)
      setSuccessMsg(result.message || 'Password updated successfully!')
      setTimeout(() => {
        onClose?.()
        navigate('/', { replace: true })
      }, 1400)
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally { setLoading(false) }
  }, [newPass, resetToken, navigate, onClose])

  // ── Step indicator ────────────────────────────────────────────────────────
  const stepLabels = ['Identify', 'Verify', 'Reset']

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Forgot password">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>Reset Password</h2>
            <p className={styles.subtitle}>
              {step === 1 && 'Enter your username or email to begin.'}
              {step === 2 && 'Scan the QR code or open the link to verify your identity.'}
              {step === 3 && 'Choose a new password for your account.'}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Step indicator */}
        <div className={styles.steps}>
          {stepLabels.map((label, i) => (
            <div key={label} className={styles.stepItem}>
              <div className={`${styles.stepDot}
                ${i + 1 < step  ? styles.stepDone   : ''}
                ${i + 1 === step ? styles.stepActive : ''}
              `}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span className={`${styles.stepLabel} ${i + 1 === step ? styles.stepLabelActive : ''}`}>
                {label}
              </span>
              {i < stepLabels.length - 1 && (
                <div className={`${styles.stepLine} ${i + 1 < step ? styles.stepLineDone : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* Error / success banners */}
          {error && (
            <div className={styles.banner} data-type="error" role="alert">
              <span>✕</span> {error}
            </div>
          )}
          {successMsg && (
            <div className={styles.banner} data-type="success" role="status">
              <span>✓</span> {successMsg}
            </div>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className={styles.stepBody}>
              <div className={styles.field}>
                <label htmlFor="fp-identity" className={styles.fieldLabel}>
                  Username or email address
                </label>
                <input
                  id="fp-identity"
                  type="text"
                  className={styles.input}
                  value={identity}
                  onChange={e => setIdentity(e.target.value)}
                  placeholder="ghostroute.security@gmail.com"
                  autoComplete="username"
                  disabled={loading}
                  spellCheck={false}
                  onKeyDown={e => e.key === 'Enter' && handleRequest()}
                />
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                disabled={loading}
                onClick={handleRequest}
              >
                {loading
                  ? <><span className={styles.btnSpinner} /> Sending…</>
                  : 'Proceed →'
                }
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className={styles.stepBody}>
              <p className={styles.hint}>
                Scan this QR code on any device, or open the verification link below.
                Once you've verified your identity, click <strong>Done</strong>.
              </p>

              {qrCode && (
                <div className={styles.qrSection}>
                  <div className={styles.qrFrame}>
                    <img src={qrCode} alt="Verification QR code" className={styles.qrImg} />
                  </div>
                  <p className={styles.qrCaption}>Scan to verify on another device</p>
                </div>
              )}

              {verifyUrl && (
                <a
                  href={verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkBtn}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                    <path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"/>
                  </svg>
                  Open verification link
                </a>
              )}

              <button
                type="button"
                className={styles.primaryBtn}
                disabled={loading}
                onClick={handleVerify}
              >
                {loading
                  ? <><span className={styles.btnSpinner} /> Verifying…</>
                  : 'Done — I\'ve verified my identity'
                }
              </button>

              <button type="button" className={styles.ghostBtn} onClick={() => setStep(1)}>
                ← Back
              </button>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && !successMsg && (
            <div className={styles.stepBody}>
              <p className={styles.hint}>
                Identity confirmed. Choose a strong new password for your account.
              </p>

              <div className={styles.field}>
                <label htmlFor="fp-newpass" className={styles.fieldLabel}>
                  New password
                </label>
                <div className={styles.passWrap}>
                  <input
                    id="fp-newpass"
                    type={showPass ? 'text' : 'password'}
                    className={styles.input}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    disabled={loading}
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPass(s => !s)}
                    tabIndex={-1}
                  >
                    {showPass ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className={styles.fieldHint}>At least 8 characters.</p>
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                disabled={loading}
                onClick={handleReset}
              >
                {loading
                  ? <><span className={styles.btnSpinner} /> Updating password…</>
                  : 'Update password'
                }
              </button>
            </div>
          )}

          {/* ── Success (step 3 done) ── */}
          {successMsg && (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✓</div>
              <p className={styles.successTitle}>Password updated!</p>
              <p className={styles.successSub}>Signing you in to your dashboard…</p>
              <div className={styles.spinner} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
