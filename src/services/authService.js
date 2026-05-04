// ── Ghostroute Auth + User Service ───────────────────────────────────────────
const BASE_URL  = 'http://0.0.0.0:9000/api/v1.0/auth'
const USER_URL  = 'http://0.0.0.0:9000/api/v1.0/user'
const TOKEN_KEY = 'ghostroute_token'

// ── Token helpers ─────────────────────────────────────────────────────────────
export const saveToken       = (t) => localStorage.setItem(TOKEN_KEY, t)
export const getToken        = ()  => localStorage.getItem(TOKEN_KEY)
export const clearToken      = ()  => localStorage.removeItem(TOKEN_KEY)
export const isAuthenticated = ()  => Boolean(getToken())

// ── Temp credentials (sessionStorage — auto-cleared on tab close) ─────────────
export const storeTempCredentials = (email, password) =>
  sessionStorage.setItem('gr_tmp', JSON.stringify({ email, password }))

export function getTempCredentials() {
  try { return JSON.parse(sessionStorage.getItem('gr_tmp')) ?? null }
  catch { return null }
}
export const clearTempCredentials = () => sessionStorage.removeItem('gr_tmp')

// ── Error helper ──────────────────────────────────────────────────────────────
function buildError(data, fallback = 'Request failed.') {
  const detail     = data?.detail ?? {}
  const err        = new Error(detail.message || detail.error || data?.message || fallback)
  err.errorField   = detail.error   ?? data?.message ?? null
  err.messageField = detail.message ?? null
  return err
}

// ── Sign up ───────────────────────────────────────────────────────────────────
export async function signupUser({ email, password }) {
  const res    = await fetch(`${BASE_URL}/signup/`, {
    method: 'POST',
    headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username: null, password }),
  })
  const data        = await res.json()
  const detail      = data?.detail ?? {}
  const error       = detail.error   ?? null
  const message     = detail.message ?? null
  const alreadyExists = error === 'Kindly login!'
  if (!res.ok && !alreadyExists) throw buildError(data, 'Signup failed.')
  return { ok: true, alreadyExists, error, message }
}

// ── Login ─────────────────────────────────────────────────────────────────────
// Backend expects { username: <email>, password }
export async function loginUser({ email, password }) {
  const res  = await fetch(`${BASE_URL}/login/`, {
    method: 'POST',
    headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  })
  const data  = await res.json()
  if (!res.ok) throw buildError(data, 'Login failed.')
  const token = data.token ?? data.access_token ?? data.data?.token ?? null
  if (token) saveToken(token)
  return { ok: true, token, data }
}

// ── Google SSO ────────────────────────────────────────────────────────────────
// Redirects browser to backend OAuth — backend handles Google and calls back.
// On callback success the backend returns { access_token, ... }
// The callback page reads the token from URL search params and saves it.
export function initiateGoogleSSO() {
  window.location.href = 'http://127.0.0.1:9000/api/v1.0/auth/google/'
}

// ── Request verification ──────────────────────────────────────────────────────
export async function requestVerification({ email }) {
  const res  = await fetch(`${BASE_URL}/verification/request`, {
    method: 'POST',
    headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email }),
  })
  const data = await res.json()
  if (!res.ok) throw buildError(data, 'Verification request failed.')
  return {
    ok: true,
    message:         data.message,
    verificationUrl: data.verification_url,
    qrCode:          data.qr_code,
  }
}

// ── Verify account ────────────────────────────────────────────────────────────
export async function verifyAccount(verificationUrl) {
  const res  = await fetch(verificationUrl, {
    method: 'GET',
    headers: { 'accept': 'application/json' },
  })
  const data = await res.json()
  if (!res.ok || data.statusCode !== 200) throw buildError(data, 'Verification failed.')
  if (data.token) saveToken(data.token)
  return { ok: true, message: data.message, token: data.token }
}

// ── Activate account ──────────────────────────────────────────────────────────
export async function activateAccount(token) {
  const res  = await fetch(`${BASE_URL}/activate`, {
    method: 'GET',
    headers: { 'accept': 'application/json', 'Authorization': `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok || data.statusCode !== 200) throw buildError(data, 'Activation failed.')
  return { ok: true, message: data.message, userId: data.user_id }
}

// ── Get user profile ──────────────────────────────────────────────────────────
export async function getUserProfile(token) {
  const res  = await fetch(`${USER_URL}/get/profile`, {
    method: 'GET',
    headers: { 'accept': 'application/json', 'Authorization': `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok || data.statusCode !== 200) throw buildError(data, 'Failed to load profile.')
  if (data.token) saveToken(data.token)
  return { ok: true, user: data.data, token: data.token }
}

// ── Update username ───────────────────────────────────────────────────────────
export async function updateUsername(token, username) {
  const res  = await fetch(`${USER_URL}/update/profile/`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  })
  const data = await res.json()
  if (!res.ok || data.statusCode !== 200) throw buildError(data, 'Failed to update username.')
  if (data.token) saveToken(data.token)
  return { ok: true, username: data.username, token: data.token }
}

// ── Update profile photo ──────────────────────────────────────────────────────
export async function updateProfilePhoto(token, file) {
  const form = new FormData()
  form.append('file', file)

  const res  = await fetch(`${USER_URL}/update/profile_photo`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      // Do NOT set Content-Type — browser sets it with the correct boundary
    },
    body: form,
  })
  const data = await res.json()
  if (!res.ok || data.statusCode !== 200) throw buildError(data, 'Failed to update photo.')
  if (data.token) saveToken(data.token)
  return { ok: true, photoUrl: data.profile_photo, token: data.token }
}
