import axios from 'axios'

const BASE_URL = 'https://ipapi.co'

/**
 * Look up IP/domain geolocation data.
 * Defaults to the caller's own IP when target is "self" or empty.
 */
export async function lookupIP(target = '') {
  const clean = target.trim().toLowerCase()
  const url = clean === '' || clean === 'self' || clean === 'me'
    ? `${BASE_URL}/json/`
    : `${BASE_URL}/${encodeURIComponent(clean)}/json/`

  const response = await axios.get(url, {
    timeout: 10_000,
  })

  const data = response.data

  if (data.error) {
    throw new Error(data.reason || 'Invalid IP or domain.')
  }

  return data
}
