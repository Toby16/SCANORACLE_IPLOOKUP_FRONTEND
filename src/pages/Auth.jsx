import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signupUser, loginUser, storeTempCredentials, initiateGoogleSSO,
} from '../services/authService.js'
import GhostLogo from '../components/GhostLogo.jsx'
import styles from './Auth.module.css'

// ── Toast ─────────────────────────────────────────────────────────────────────
let _tid = 0
function useToast() {
  const [toasts, setToasts] = useState([])
  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), [])
  const push = useCallback((message, type = 'info', ms = 5000) => {
    const id = ++_tid
    setToasts(p => [...p, { id, message, type }])
    if (ms) setTimeout(() => remove(id), ms)
  }, [remove])
  return { toasts, push, remove }
}

function ToastStack({ toasts, remove }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
          <span className={styles.toastIcon}>
            {t.type === 'error' ? '✕' : t.type === 'success' ? '✓' : 'ℹ'}
          </span>
          <span className={styles.toastMsg}>{t.message}</span>
          <button className={styles.toastClose} onClick={() => remove(t.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmail  = (v) => EMAIL_RE.test(v.trim())

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconGoogle = () => (
  <svg viewBox="0 0 24 24" width="14" height="14">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
const IconTwitter = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="#e6edf3">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
const IconEyeOn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const IconLock = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
    <path d="M4 4v1.5h-.5A1.5 1.5 0 002 7v6.5A1.5 1.5 0 003.5 15h9a1.5 1.5 0 001.5-1.5V7a1.5 1.5 0 00-1.5-1.5H12V4a4 4 0 10-8 0zm1.5 0a2.5 2.5 0 015 0v1.5h-5V4zM8 10a1 1 0 110-2 1 1 0 010 2z"/>
  </svg>
)

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ id, label, type = 'text', value, onChange, placeholder, autoComplete, disabled, hint }) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldInputWrap}>
        <input
          id={id} type={isPw && show ? 'text' : type}
          className={styles.fieldInput} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          disabled={disabled} spellCheck={false}
        />
        {isPw && (
          <button type="button" className={styles.eyeBtn}
            onClick={() => setShow(s => !s)} tabIndex={-1}>
            {show ? <IconEyeOff /> : <IconEyeOn />}
          </button>
        )}
      </div>
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </div>
  )
}

// ── Auth Page ─────────────────────────────────────────────────────────────────
export default function Auth() {
  const navigate             = useNavigate()
  const { toasts, push, remove } = useToast()

  const [tab,      setTab]      = useState('login')
  const [identity, setIdentity] = useState('')   // login: email or username
  const [email,    setEmail]    = useState('')   // signup: email
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [action,   setAction]   = useState(null)

  const pushDouble = (e, m, type = 'error') => {
    if (e) push(e, type)
    if (m && m !== e) setTimeout(() => push(m, type), 350)
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!identity.trim()) { push('Please enter your email or username.', 'error'); return }
    if (!password.trim()) { push('Please enter your password.', 'error'); return }
    setLoading(true); setAction('login')
    try {
      await loginUser({ email: identity.trim(), password })
      push('Welcome back!', 'success')
      setTimeout(() => navigate('/dashboard', { replace: true }), 700)
    } catch (err) {
      pushDouble(err.errorField, err.messageField, 'error')
    } finally { setLoading(false); setAction(null) }
  }

  // ── Signup ─────────────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!email.trim()) { push('Please enter your email address.', 'error'); return }
    if (!isEmail(email)) {
      push('Sign-up requires a valid email address.', 'error')
      setTimeout(() => push('Usernames are for login — use your email to register.', 'info'), 350)
      return
    }
    if (!password.trim()) { push('Please enter a password.', 'error'); return }
    setLoading(true); setAction('signup')
    try {
      const result = await signupUser({ email: email.trim(), password })
      if (result.alreadyExists) {
        pushDouble(result.error, result.message, 'info')
        setTimeout(() => setTab('login'), 800)
      } else {
        storeTempCredentials(email.trim(), password)
        push(result.message || 'Account created! Proceeding to verification…', 'success')
        setTimeout(() => navigate('/verify', { state: { email: email.trim() } }), 1100)
      }
    } catch (err) {
      pushDouble(err.errorField, err.messageField, 'error')
    } finally { setLoading(false); setAction(null) }
  }

  const switchTab = (t) => { setTab(t); setIdentity(''); setEmail(''); setPassword('') }

  return (
    <div className={styles.page}>
      <ToastStack toasts={toasts} remove={remove} />
      <div className={styles.glowBg} aria-hidden="true" />

      <div className={styles.wrapper}>
        {/* Left brand panel */}
        <aside className={styles.brand}>
          <GhostLogo size={56} showText showSub />
          <p className={styles.brandDesc}>One account. Every app.<br />Secured by Ghostroute.</p>
          <ul className={styles.brandFeatures}>
            {['IP Lookup Intelligence', 'Unified Payments', 'Multi-app Access', 'End-to-end Encrypted'].map(f => (
              <li key={f} className={styles.brandFeature}>
                <span className={styles.featureDot} />{f}
              </li>
            ))}
          </ul>
        </aside>

        {/* Right form card */}
        <main className={styles.card}>
          <div className={styles.cardLogoMobile}><GhostLogo size={44} showText showSub={false} /></div>

          {/* Tabs */}
          <div className={styles.tabs} role="tablist">
            <button role="tab" aria-selected={tab === 'login'}
              className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
              onClick={() => switchTab('login')} type="button">Sign in</button>
            <button role="tab" aria-selected={tab === 'signup'}
              className={`${styles.tab} ${tab === 'signup' ? styles.tabActive : ''}`}
              onClick={() => switchTab('signup')} type="button">Create account</button>
          </div>

          <p className={styles.cardSubtitle}>
            {tab === 'login' ? 'Welcome back. Sign in to continue.' : 'Join Ghostroute. One account for every app.'}
          </p>

          {/* Social buttons */}
          <div className={styles.socialRow}>
            <button type="button" className={`${styles.socialBtn} ${styles.socialGoogle}`}
              onClick={initiateGoogleSSO}>
              <IconGoogle /> <span>Google</span>
            </button>
            <button type="button" className={styles.socialBtn}>
              <IconFacebook /> <span>Facebook</span>
            </button>
            <button type="button" className={styles.socialBtn}>
              <IconTwitter /> <span>Twitter</span>
            </button>
          </div>

          <div className={styles.divider}><span>or continue with email</span></div>

          {/* Fields */}
          <div className={styles.fields}>
            {tab === 'login' ? (
              <>
                <Field id="login-id" label="Email address or Username"
                  value={identity} onChange={e => setIdentity(e.target.value)}
                  placeholder="ghostroute.security@gmail.com"
                  autoComplete="username" disabled={loading} />
                <Field id="login-pw" label="Password" type="password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="password" autoComplete="current-password" disabled={loading} />
                <div className={styles.forgotRow}>
                  <a href="#" className={styles.forgotLink}>Forgot password?</a>
                </div>
              </>
            ) : (
              <>
                <Field id="signup-email" label="Email address" type="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ghostroute.security@gmail.com"
                  autoComplete="email" disabled={loading}
                  hint="Your username is auto-generated from this email." />
                <Field id="signup-pw" label="Password" type="password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="password" autoComplete="new-password" disabled={loading} />
              </>
            )}
          </div>

          <button type="button" className={styles.submitBtn} disabled={loading}
            onClick={tab === 'login' ? handleLogin : handleSignup}>
            {loading && action
              ? <><span className={styles.btnSpinner} />{action === 'login' ? 'Signing in…' : 'Creating account…'}</>
              : <><IconLock /> {tab === 'login' ? 'Sign in' : 'Create account'}</>
            }
          </button>

          <p className={styles.cardFooter}>
            {tab === 'login' ? 'New to Ghostroute? ' : 'Already have an account? '}
            <button type="button" className={styles.switchLink}
              onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}>
              {tab === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>

          <p className={styles.secureNote}><IconLock /> Protected by Ghostroute Security</p>
        </main>
      </div>
    </div>
  )
}
