import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getUserProfile, updateUsername, updateProfilePhoto,
  getToken, clearToken,
} from '../services/authService.js'
import { useTokenRefresh } from '../hooks/useTokenRefresh.js'
import GhostLogo from '../components/GhostLogo.jsx'
import styles from './Dashboard.module.css'

// ── usePageTitle ──────────────────────────────────────────────────────────────
function usePageTitle(title) {
  useEffect(() => { document.title = title }, [title])
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let _tid = 0
function useToast() {
  const [toasts, setToasts] = useState([])
  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), [])
  const push   = useCallback((message, type = 'info', ms = 4500) => {
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
          <span>{t.type === 'error' ? '✕' : t.type === 'success' ? '✓' : 'ℹ'}</span>
          <span className={styles.toastMsg}>{t.message}</span>
          <button className={styles.toastClose} onClick={() => remove(t.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

// ── Animated particle background ──────────────────────────────────────────────
function ParticleBg() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create nodes
    const COUNT = 55
    const nodes = Array.from({ length: COUNT }, () => ({
      x:   Math.random() * canvas.width,
      y:   Math.random() * canvas.height,
      vx:  (Math.random() - 0.5) * 0.35,
      vy:  (Math.random() - 0.5) * 0.35,
      r:   Math.random() * 1.5 + 0.5,
    }))

    const LINK_DIST = 140
    const NODE_COL  = 'rgba(167,139,250,'   // purple
    const LINK_COL  = 'rgba(124,58,237,'

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Move
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0) n.x = canvas.width
        if (n.x > canvas.width)  n.x = 0
        if (n.y < 0) n.y = canvas.height
        if (n.y > canvas.height) n.y = 0
      })

      // Links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx   = nodes[i].x - nodes[j].x
          const dy   = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.18
            ctx.beginPath()
            ctx.strokeStyle = LINK_COL + alpha + ')'
            ctx.lineWidth   = 0.8
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Nodes
      nodes.forEach(n => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = NODE_COL + '0.45)'
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />
}

// ── App Card ──────────────────────────────────────────────────────────────────
function AppCard({ name, desc, color, icon, onClick, disabled, tag }) {
  return (
    <div
      className={`${styles.appCard} ${disabled ? styles.appDisabled : ''}`}
      onClick={disabled ? undefined : onClick}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={e => !disabled && e.key === 'Enter' && onClick?.()}
    >
      <div className={styles.appIconWrap} data-color={color}>{icon}</div>
      <div className={styles.appText}>
        <p className={styles.appName}>{name}</p>
        <p className={styles.appDesc}>{desc}</p>
      </div>
      {disabled
        ? <span className={styles.appBadge}>{tag || 'Soon'}</span>
        : <span className={styles.appArrow}>→</span>
      }
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  usePageTitle('Ghostroute — Dashboard')
  useTokenRefresh()

  const navigate             = useNavigate()
  const { toasts, push, remove } = useToast()
  const photoInputRef        = useRef(null)

  const [user,           setUser]           = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [editingName,    setEditingName]    = useState(false)
  const [newUsername,    setNewUsername]    = useState('')
  const [savingName,     setSavingName]     = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview,   setPhotoPreview]   = useState(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { navigate('/auth', { replace: true }); return }
    getUserProfile(token)
      .then(r  => { setUser(r.user); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [navigate])

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) { push('Username cannot be empty.', 'error'); return }
    if (newUsername.trim() === user?.username) { setEditingName(false); return }
    setSavingName(true)
    try {
      const r = await updateUsername(getToken(), newUsername.trim())
      setUser(u => ({ ...u, username: r.username }))
      push('Username updated!', 'success')
      setEditingName(false)
    } catch (e) { push(e.message, 'error') }
    finally { setSavingName(false) }
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
    setUploadingPhoto(true)
    try {
      const r = await updateProfilePhoto(getToken(), file)
      setUser(u => ({ ...u, photo_url: r.photoUrl }))
      setPhotoPreview(null)
      push('Profile photo updated!', 'success')
    } catch (e) { setPhotoPreview(null); push(e.message, 'error') }
    finally { setUploadingPhoto(false) }
  }

  const handleLogout = () => { clearToken(); navigate('/auth', { replace: true }) }

  if (loading) return (
    <div className={styles.centerPage}>
      <div className={styles.spinner} />
      <p className={styles.loadingText}>Loading your dashboard…</p>
    </div>
  )

  if (error) return (
    <div className={styles.centerPage}>
      <div className={styles.errBox}>
        <p className={styles.errText}>{error}</p>
        <button className={styles.backBtn} onClick={() => navigate('/auth')}>Back to sign in</button>
      </div>
    </div>
  )

  const photo = photoPreview || user?.photo_url
  const initial = (user?.username ?? '?')[0].toUpperCase()

  return (
    <div className={styles.page}>
      <ToastStack toasts={toasts} remove={remove} />
      <ParticleBg />

      {/* ── Top Nav ── */}
      <nav className={styles.nav}>
        <GhostLogo size={34} showText showSub={false} />

        {/* Balances — top right of nav */}
        <div className={styles.navBalances}>
          <div className={styles.balance}>
            <span className={styles.balanceCurrency}>₦</span>
            <span className={styles.balanceVal}>{(user?.naira_balance ?? 0).toLocaleString()}</span>
            <span className={styles.balanceLbl}>NGN</span>
          </div>
          <div className={styles.balanceDivider} />
          <div className={styles.balance}>
            <span className={styles.balanceCurrency}>$</span>
            <span className={styles.balanceVal}>{(user?.dollar_balance ?? 0).toLocaleString()}</span>
            <span className={styles.balanceLbl}>USD</span>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
      </nav>

      {/* ── Main layout ── */}
      <div className={styles.layout}>

        {/* ── Left sidebar ── */}
        <aside className={styles.sidebar}>
          {/* Avatar */}
          <div className={styles.avatarSection}>
            <div
              className={styles.avatarRing}
              onClick={() => photoInputRef.current?.click()}
              title="Click to change photo"
              role="button" tabIndex={0}
            >
              {uploadingPhoto
                ? <div className={styles.avatarSpinner}><div className={styles.spinner} /></div>
                : photo
                  ? <img src={photo} alt={user?.username} className={styles.avatarImg} />
                  : <div className={styles.avatarFallback}><span>{initial}</span></div>
              }
              <div className={styles.avatarEdit}>
                <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                  <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 00-.064.108l-.558 1.953 1.953-.558a.253.253 0 00.108-.064l6.286-6.286zm1.238-3.763a.25.25 0 00-.354 0L10.811 3.65l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086z"/>
                </svg>
              </div>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*"
              className={styles.hiddenInput} onChange={handlePhotoChange} />
          </div>

          {/* Username */}
          <div className={styles.sideProfile}>
            {editingName ? (
              <div className={styles.editBlock}>
                <input
                  className={styles.editInput}
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  autoFocus disabled={savingName}
                  placeholder="new username"
                  onKeyDown={e => {
                    if (e.key === 'Enter')  handleSaveUsername()
                    if (e.key === 'Escape') setEditingName(false)
                  }}
                />
                <div className={styles.editActions}>
                  <button className={styles.saveBtn} onClick={handleSaveUsername} disabled={savingName}>
                    {savingName ? <span className={styles.btnSpinner} /> : 'Save'}
                  </button>
                  <button className={styles.cancelBtn} onClick={() => setEditingName(false)} disabled={savingName}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className={styles.usernameRow}>
                <span className={styles.sideUsername}>@{user?.username}</span>
                <button className={styles.editPencil}
                  onClick={() => { setNewUsername(user?.username ?? ''); setEditingName(true) }}
                  title="Edit username">
                  <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
                    <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 00-.064.108l-.558 1.953 1.953-.558a.253.253 0 00.108-.064l6.286-6.286zm1.238-3.763a.25.25 0 00-.354 0L10.811 3.65l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086z"/>
                  </svg>
                </button>
              </div>
            )}
            <p className={styles.sideEmail}>{user?.email}</p>
            <span className={styles.activePill}>● Active</span>
          </div>

          {/* Sidebar nav */}
          <nav className={styles.sideNav}>
            <p className={styles.sideNavTitle}>Navigation</p>
            <button className={`${styles.sideNavItem} ${styles.sideNavActive}`}>
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M1.5 3.25a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zm5.677-.177L9.573.677A.25.25 0 0110 .854V2.5h1A2.5 2.5 0 0113.5 5v5.628a2.251 2.251 0 11-1.5 0V5a1 1 0 00-1-1h-1v1.646a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354z"/>
              </svg>
              Dashboard
            </button>
            <button className={styles.sideNavItem} onClick={() => navigate('/scanoracle/iplookup')}>
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
              </svg>
              IP Lookup
            </button>
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className={styles.main}>
          {/* Welcome strip */}
          <div className={styles.welcomeStrip}>
            <div>
              <h1 className={styles.welcomeTitle}>Welcome back{user?.username ? `, ${user.username.split(/\d/)[0]}` : ''}.</h1>
              <p className={styles.welcomeSub}>Here's what's available in your Ghostroute account.</p>
            </div>
          </div>

          {/* Mini Apps grid */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Mini Apps</h2>
            <div className={styles.appsGrid}>
              <AppCard
                name="SCANORACLE — IP Lookup"
                desc="Geolocate any IP address or domain with full intelligence."
                color="blue"
                icon={
                  <svg viewBox="0 0 16 16" fill="currentColor" width="20" height="20">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zm7-3.25v1.5H10v1H8.5V10H7V7.25H5.5v-1H7V4.75h1.5z"/>
                  </svg>
                }
                onClick={() => navigate('/scanoracle/iplookup')}
              />
              <AppCard name="MAC Lookup" desc="Vendor lookup from MAC address." color="purple" disabled tag="Soon"
                icon={<svg viewBox="0 0 16 16" fill="currentColor" width="20" height="20"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm.75 11.25h-1.5v-4.5h1.5v4.5zm0-6h-1.5v-1.5h1.5v1.5z"/></svg>}
              />
              <AppCard name="User-Agent Lookup" desc="Parse and identify any user-agent string." color="green" disabled tag="Soon"
                icon={<svg viewBox="0 0 16 16" fill="currentColor" width="20" height="20"><path d="M10.5 5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm.061 3.073a4 4 0 10-5.123 0 6.004 6.004 0 00-3.431 5.142.75.75 0 001.498.07 4.5 4.5 0 018.99 0 .75.75 0 101.498-.07 6.005 6.005 0 00-3.432-5.142z"/></svg>}
              />
            </div>
          </section>

          {/* Account info */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Account</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>Email</p>
                <p className={styles.infoVal}>{user?.email}</p>
              </div>
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>Username</p>
                <p className={styles.infoVal}>@{user?.username}</p>
              </div>
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>Account Status</p>
                <p className={`${styles.infoVal} ${styles.infoActive}`}>● Active &amp; Verified</p>
              </div>
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>Platform</p>
                <p className={styles.infoVal}>Ghostroute Security</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
