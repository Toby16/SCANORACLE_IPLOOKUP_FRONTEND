import { useState } from 'react'
import IPLookupForm from '../components/IPLookupForm.jsx'
import IPResultCard from '../components/IPResultCard.jsx'
import { lookupIP } from '../services/ipService.js'
import styles from './Home.module.css'

export default function Home() {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleLookup = async (ip) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await lookupIP(ip)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Lookup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Ambient background grid */}
      <div className={styles.grid} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoAccent}>SCAN</span>ORACLE
        </div>
        <p className={styles.tagline}>IP Lookup Intelligence</p>
      </header>

      <section className={styles.content}>
        <IPLookupForm onLookup={handleLookup} loading={loading} />

        {error && (
          <div className={styles.error} role="alert">
            <span>⚠</span> {error}
          </div>
        )}

        {loading && (
          <div className={styles.loadingState} aria-live="polite">
            <div className={styles.spinner} />
            <p>Scanning target...</p>
          </div>
        )}

        {result && !loading && (
          <IPResultCard data={result} />
        )}
      </section>

      <footer className={styles.footer}>
        <p>SCANORACLE © {new Date().getFullYear()} — Intelligence at the edge</p>
      </footer>
    </div>
  )
}
