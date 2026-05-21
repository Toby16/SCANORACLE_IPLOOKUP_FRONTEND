import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import IPLookupForm from '../../components/IPLookupForm.jsx'
import IPResultCard from '../../components/IPResultCard.jsx'
import { lookupIP } from '../../services/ipService.js'
import { clearToken, getToken } from '../../services/authService.js'
import { getUserProfile } from '../../services/authService.js'
import { useTokenRefresh } from '../../hooks/useTokenRefresh.js'
import styles from './IPLookup.module.css'
import { useAuthGuard } from '../../hooks/useAuthGuard.js'

function usePageTitle(t) { useEffect(() => { document.title = t }, [t]) }

// ── SCANORACLE SVG Logo ──────────────────────────────────────────────────────
function ScanOracleLogo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.logoSvg}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx="24" cy="24" r="22" stroke="#0069ff" strokeWidth="1.5" opacity="0.4" />
      {/* Inner ring */}
      <circle cx="24" cy="24" r="15" stroke="#0069ff" strokeWidth="1" opacity="0.6" />
      {/* Core dot */}
      <circle cx="24" cy="24" r="4" fill="#0069ff" />
      {/* Scan lines — cross-hair */}
      <line x1="24" y1="2" x2="24" y2="10" stroke="#0069ff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="38" x2="24" y2="46" stroke="#0069ff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="24" x2="10" y2="24" stroke="#0069ff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="24" x2="46" y2="24" stroke="#0069ff" strokeWidth="1.5" strokeLinecap="round" />
      {/* Corner brackets */}
      <path d="M6 14 L6 6 L14 6" stroke="#0069ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d="M42 14 L42 6 L34 6" stroke="#0069ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d="M6 34 L6 42 L14 42" stroke="#0069ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d="M42 34 L42 42 L34 42" stroke="#0069ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {/* Orbit arc */}
      <path
        d="M 8 24 A 16 16 0 0 1 24 8"
        stroke="#0069ff"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.35"
        strokeDasharray="3 4"
      />
      <path
        d="M 40 24 A 16 16 0 0 1 24 40"
        stroke="#0069ff"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.35"
        strokeDasharray="3 4"
      />
    </svg>
  )
}

export default function IPLookup() {
  usePageTitle('SCANORACLE — IP Lookup | Ghostroute')
  useAuthGuard()
  useTokenRefresh()
  const navigate  = useNavigate()
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [user,    setUser]    = useState(null)

  // Fetch balance for nav display
  useEffect(() => {
    const token = getToken()
    if (!token) return
    getUserProfile(token)
      .then(r => setUser(r.user))
      .catch(() => {})
  }, [])

  const handleLookup = async (ip) => {
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await lookupIP(ip)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Lookup failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      {/* Background layers */}
      <div className={styles.bgGrid} aria-hidden="true" />
      <div className={styles.bgGlow1} aria-hidden="true" />
      <div className={styles.bgGlow2} aria-hidden="true" />

      {/* ── Navigation ── */}
      <nav className={styles.nav}>
        {/* Left: back + brand */}
        <div className={styles.navLeft}>
          <button className={styles.navBack} onClick={() => navigate('/')}>
            <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
              <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" />
            </svg>
            Dashboard
          </button>
          <div className={styles.navDivider} />
          <div className={styles.navBrand}>
            <ScanOracleLogo size={22} />
            <span className={styles.navBrandText}>
              <span className={styles.navBrandScan}>SCAN</span>ORACLE
            </span>
            <span className={styles.navBrandPill}>IP Lookup</span>
          </div>
        </div>

        {/* Right: balances + signout */}
        <div className={styles.navRight}>
          <div className={styles.navBalances}>
            <div className={styles.navBalance}>
              <span className={styles.navBalanceCurr}>₦</span>
              <span className={styles.navBalanceAmt}>{(user?.naira_balance ?? 0).toLocaleString()}</span>
              <span className={styles.navBalanceLbl}>NGN</span>
            </div>
            <div className={styles.navBalanceSep} />
            <div className={styles.navBalance}>
              <span className={styles.navBalanceCurr}>$</span>
              <span className={styles.navBalanceAmt}>{(user?.dollar_balance ?? 0).toLocaleString()}</span>
              <span className={styles.navBalanceLbl}>USD</span>
            </div>
          </div>
          <button
            className={styles.signOutBtn}
            onClick={() => { clearToken(); navigate('/auth') }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Hero Header ── */}
      <header className={styles.header}>
        <div className={styles.heroLogoWrap}>
          <ScanOracleLogo size={64} />
          <div className={styles.heroPulse} aria-hidden="true" />
        </div>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroAccent}>SCAN</span>ORACLE
        </h1>
        <p className={styles.heroSub}>IP Lookup Intelligence</p>
        <div className={styles.heroDivider}>
          <span />
          <span className={styles.heroDividerDot} />
          <span />
        </div>
      </header>

      {/* ── Main Content ── */}
      <section className={styles.content}>
        <IPLookupForm onLookup={handleLookup} loading={loading} />

        {error && (
          <div className={styles.error} role="alert">
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575zm1.763.707a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368zm-.53 3.996v2.5a.75.75 0 011.5 0v-2.5a.75.75 0 01-1.5 0zM9 11a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            {error}
          </div>
        )}

        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.scanRing}>
              <div className={styles.scanRingInner} />
              <div className={styles.scanBeam} />
            </div>
            <p className={styles.loadingText}>Scanning target…</p>
            <p className={styles.loadingSubText}>Resolving geolocation &amp; intelligence data</p>
          </div>
        )}

        {result && !loading && <IPResultCard data={result} />}
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        SCANORACLE · Part of{' '}
        <span className={styles.footerAccent}>Ghostroute</span>{' '}
        Security Suite · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
