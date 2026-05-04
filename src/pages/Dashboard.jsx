import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getUserProfile, updateUsername, updateProfilePhoto,
  getToken, clearToken, saveToken,
} from '../services/authService.js'
import GhostLogo from '../components/GhostLogo.jsx'
import styles from './Dashboard.module.css'

// ── Toast ─────────────────────────────────────────────────────────────────────
let _tid = 0
function useToast() {
  const [toasts, setToasts] = useState([])
  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), [])
  const push   = useCallback((message, type = 'info', ms = 4000) => {
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

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ photoUrl, username, size = 72, onClick }) {
  const initial = (username ?? '?')[0].toUpperCase()
  return (
    <div className={styles.avatarWrap} style={{ width: size, height: size }} onClick={onClick}
      title={onClick ? 'Click to change photo' : undefined}
      role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {photoUrl
        ? <img src={photoUrl} alt={username} className={styles.avatarImg} />
        : <div className={styles.avatarFallback}><span>{initial}</span></div>
      }
      {onClick && (
        <div className={styles.avatarOverlay}>
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <path d="M1.5 14.25c0 .138.112.25.25.25H9A.75.75 0 009 13H1.75a.25.25 0 01-.25-.25V1.75a.25.25 0 01.25-.25h7.5a.25.25 0 01.25.25v.5a.75.75 0 001.5 0v-.5A1.75 1.75 0 009.25 0h-7.5A1.75 1.75 0 000 1.75v12.5zm5.03-9.03l5.5 5.5a.75.75 0 01.22.53v3a.75.75 0 01-.75.75h-3a.75.75 0 01-.53-.22l-5.5-5.5a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z"/>
          </svg>
        </div>
      )}
    </div>
  )
}

// ── Mini App Card ─────────────────────────────────────────────────────────────
function AppCard({ name, desc, color, icon, onClick, disabled }) {
  return (
    <div
      className={`${styles.appCard} ${disabled ? styles.appDisabled : ''}`}
      onClick={disabled ? undefined : onClick}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
    >
      <div className={styles.appIcon} data-color={color}>{icon}</div>
      <div className={styles.appText}>
        <p className={styles.appName}>{name}</p>
        <p className={styles.appDesc}>{desc}</p>
      </div>
      {disabled
        ? <span className={styles.appBadge}>Soon</span>
        : <span className={styles.appArrow}>→</span>
      }
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate            = useNavigate()
  const { toasts, push, remove } = useToast()
  const photoInputRef       = useRef(null)

  const [user,         setUser]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  // Username edit
  const [editingName,  setEditingName]  = useState(false)
  const [newUsername,  setNewUsername]  = useState('')
  const [savingName,   setSavingName]   = useState(false)

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview,   setPhotoPreview]   = useState(null)

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken()
    if (!token) { navigate('/auth', { replace: true }); return }
    getUserProfile(token)
      .then(r  => { setUser(r.user); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [navigate])

  // ── Save username ───────────────────────────────────────────────────────────
  const handleSaveUsername = async () => {
    if (!newUsername.trim()) { push('Username cannot be empty.', 'error'); return }
    if (newUsername.trim() === user?.username) { setEditingName(false); return }
    setSavingName(true)
    try {
      const token  = getToken()
      const result = await updateUsername(token, newUsername.trim())
      setUser(u => ({ ...u, username: result.username }))
      push('Username updated!', 'success')
      setEditingName(false)
    } catch (e) {
      push(e.message, 'error')
    } finally { setSavingName(false) }
  }

  // ── Photo upload ────────────────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview immediately
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)

    setUploadingPhoto(true)
    try {
      const token  = getToken()
      const result = await updateProfilePhoto(token, file)
      setUser(u => ({ ...u, photo_url: result.photoUrl }))
      setPhotoPreview(null)
      push('Profile photo updated!', 'success')
    } catch (e) {
      setPhotoPreview(null)
      push(e.message, 'error')
    } finally { setUploadingPhoto(false) }
  }

  const handleLogout = () => { clearToken(); navigate('/auth', { replace: true }) }

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) return (
    <div className={styles.centerPage}>
      <div className={styles.spinner} />
      <p className={styles.loadingText}>Loading your dashboard…</p>
    </div>
  )
  if (error) return (
    <div className={styles.centerPage}>
      <div className={styles.errorBox}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={() => navigate('/auth')}>Back to sign in</button>
      </div>
    </div>
  )

  const displayPhoto = photoPreview || user?.photo_url

  return (
    <div className={styles.page}>
      <ToastStack toasts={toasts} remove={remove} />
      <div className={styles.glowBg} aria-hidden="true" />

      {/* Nav */}
      <nav className={styles.nav}>
        <GhostLogo size={36} showText showSub={false} />
        <div className={styles.navRight}>
          <span className={styles.navUser}>@{user?.username}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      <div className={styles.content}>

        {/* ── Profile card ── */}
        <section className={styles.profileCard}>
          <div className={styles.profileCardTop} />

          <div className={styles.profileBody}>
            {/* Avatar with upload overlay */}
            <div className={styles.avatarArea}>
              {uploadingPhoto
                ? <div className={styles.avatarSpinnerWrap}><div className={styles.spinner} /></div>
                : <Avatar
                    photoUrl={displayPhoto}
                    username={user?.username}
                    size={80}
                    onClick={() => photoInputRef.current?.click()}
                  />
              }
              <input
                ref={photoInputRef} type="file" accept="image/*"
                className={styles.hiddenInput} onChange={handlePhotoChange}
              />
              <button
                className={styles.photoHint}
                onClick={() => photoInputRef.current?.click()}
                type="button"
              >
                {uploadingPhoto ? 'Uploading…' : 'Change photo'}
              </button>
            </div>

            {/* Username area */}
            <div className={styles.profileInfo}>
              {editingName ? (
                <div className={styles.editRow}>
                  <input
                    className={styles.editInput}
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveUsername()
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                    disabled={savingName}
                    placeholder="new username"
                  />
                  <button className={styles.saveBtn} onClick={handleSaveUsername} disabled={savingName}>
                    {savingName ? <span className={styles.btnSpinner} /> : 'Save'}
                  </button>
                  <button className={styles.cancelBtn} onClick={() => setEditingName(false)} disabled={savingName}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className={styles.usernameRow}>
                  <h1 className={styles.username}>@{user?.username}</h1>
                  <button
                    className={styles.editBtn}
                    onClick={() => { setNewUsername(user?.username ?? ''); setEditingName(true) }}
                    type="button"
                    title="Edit username"
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
                      <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 00-.064.108l-.558 1.953 1.953-.558a.253.253 0 00.108-.064l6.286-6.286zm1.238-3.763a.25.25 0 00-.354 0L10.811 3.65l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086z"/>
                    </svg>
                    Edit
                  </button>
                </div>
              )}
              <p className={styles.email}>{user?.email}</p>
              <span className={styles.activeBadge}>● Active</span>
            </div>
          </div>
        </section>

        {/* ── Balances ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Balances</h2>
          <div className={styles.balanceGrid}>
            <div className={`${styles.balanceCard} ${styles.balanceAccent}`}>
              <p className={styles.balanceLabel}>Naira</p>
              <p className={styles.balanceAmount}>₦{(user?.naira_balance ?? 0).toLocaleString()}</p>
            </div>
            <div className={styles.balanceCard}>
              <p className={styles.balanceLabel}>Dollar</p>
              <p className={styles.balanceAmount}>${(user?.dollar_balance ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* ── Mini Apps ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Apps</h2>
          <div className={styles.appsGrid}>
            <AppCard
              name="SCANORACLE" desc="IP Lookup Intelligence" color="blue"
              icon={
                <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
                  <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zm5-3.25v1.5h-1.5v1H6.5V10H8V7.25H9.5v-1H8V4.75H6.5z"/>
                </svg>
              }
              onClick={() => navigate('/')}
            />
            <AppCard
              name="More Apps" desc="Coming soon to Ghostroute" color="purple" disabled
              icon={
                <svg viewBox="0 0 16 16" fill="currentColor" width="18" height="18">
                  <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm.75 11.25h-1.5v-4.5h1.5v4.5zm0-6h-1.5v-1.5h1.5v1.5z"/>
                </svg>
              }
            />
          </div>
        </section>
      </div>
    </div>
  )
}
