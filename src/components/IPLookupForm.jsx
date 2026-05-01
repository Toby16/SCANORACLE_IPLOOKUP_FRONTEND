import { useState } from 'react'
import styles from './IPLookupForm.module.css'

export default function IPLookupForm({ onLookup, loading }) {
  const [ip, setIp] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = ip.trim()
    if (!trimmed) return
    onLookup(trimmed)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor="ip-input" className={styles.label}>
        Enter IP Address or Domain
      </label>
      <div className={styles.inputRow}>
        <input
          id="ip-input"
          type="text"
          className={styles.input}
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="e.g. 8.8.8.8 or example.com"
          spellCheck={false}
          autoComplete="off"
          disabled={loading}
        />
        <button
          type="submit"
          className={styles.button}
          disabled={loading || !ip.trim()}
        >
          {loading ? 'Scanning...' : 'Lookup'}
        </button>
      </div>
    </form>
  )
}
