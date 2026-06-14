import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../../services/authService.js'
import { getUserProfile } from '../../services/authService.js'
import { useTokenRefresh } from '../../hooks/useTokenRefresh.js'
import { useAuthGuard } from '../../hooks/useAuthGuard.js'
import styles from './IPLookup.module.css'

function usePageTitle(t) { useEffect(() => { document.title = t }, [t]) }

function GhostIPLogo({ size = 120, animated = true }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 120 120"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={animated ? styles.logoAnimated : ''}
    >
      <rect x="0" y="0" width="120" height="120" rx="26" fill="#0d1117" />
      <circle cx="60" cy="60" r="29" stroke="#22c7e0" strokeWidth="4" />
      <line x1="60" y1="47" x2="60" y2="70" stroke="#22c7e0" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="55" x2="70" y2="55" stroke="#22c7e0" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

const FIELD_META = {
  asn:                        { label: 'ASN',                          cat: 'Network',  icon: '⬡' },
  hostname:                   { label: 'Hostname',                     cat: 'Network',  icon: '⬡' },
  city:                       { label: 'City',                         cat: 'Location', icon: '◎' },
  region:                     { label: 'Region',                       cat: 'Location', icon: '◎' },
  country:                    { label: 'Country',                      cat: 'Location', icon: '◎' },
  country_name:               { label: 'Country Name',                 cat: 'Location', icon: '◎' },
  latitude:                   { label: 'Latitude',                     cat: 'Location', icon: '◎' },
  longitude:                  { label: 'Longitude',                    cat: 'Location', icon: '◎' },
  organization:               { label: 'Organization',                 cat: 'Network',  icon: '⬡' },
  timezone:                   { label: 'Timezone',                     cat: 'Location', icon: '◎' },
  continent:                  { label: 'Continent',                    cat: 'Location', icon: '◎' },
  continent_name:             { label: 'Continent Name',               cat: 'Location', icon: '◎' },
  ip_version:                 { label: 'IP Version',                   cat: 'Network',  icon: '⬡' },
  country_alpha_3:            { label: 'Country Alpha-3',              cat: 'Country',  icon: '⊞' },
  postal_code:                { label: 'Postal Code',                  cat: 'Location', icon: '◎' },
  country_currency_code:      { label: 'Country Currency Code',        cat: 'Country',  icon: '⊞' },
  country_currency_symbol:    { label: 'Country Currency Symbol',      cat: 'Country',  icon: '⊞' },
  european_union_member:      { label: 'EU Member?',                   cat: 'Country',  icon: '⊞' },
  country_current_time:       { label: 'Country Local Time',           cat: 'Time',     icon: '◷' },
  country_current_time_24hr:  { label: 'Country Local Time (24hr)',    cat: 'Time',     icon: '◷' },
  country_current_time_12hr:  { label: 'Country Local Time (12hr)',    cat: 'Time',     icon: '◷' },
  country_current_time_iso:   { label: 'Country Local Time (ISO)',     cat: 'Time',     icon: '◷' },
  country_flag_icon:          { label: 'Country Flag Icon',            cat: 'Country',  icon: '⊞' },
  network_status:             { label: 'Network Status',               cat: 'Network',  icon: '⬡' },
  network_range:              { label: 'Network Range',                cat: 'Network',  icon: '⬡' },
  network_start_address:      { label: 'Network Start Address',        cat: 'Network',  icon: '⬡' },
  network_end_address:        { label: 'Network End Address',          cat: 'Network',  icon: '⬡' },
  network_registration:       { label: 'Network Registered',           cat: 'Network',  icon: '⬡' },
  network_last_changed:       { label: 'Network Last Changed',         cat: 'Network',  icon: '⬡' },
  network_type:               { label: 'Network Type',                 cat: 'Network',  icon: '⬡' },
  contact_email:              { label: 'Contact Email',                cat: 'Contact',  icon: '✉' },
  contact_phone:              { label: 'Contact Phone',                cat: 'Contact',  icon: '✉' },
  contact_address:            { label: 'Contact Address',              cat: 'Contact',  icon: '✉' },
  is_tor:                     { label: 'TOR Exit Node?',               cat: 'Threat',   icon: '⚑' },
  is_blacklisted:             { label: 'Is Blacklisted?',              cat: 'Threat',   icon: '⚑' },
  is_vpn:                     { label: 'Is VPN?',                      cat: 'Threat',   icon: '⚑' },
  is_proxy:                   { label: 'Is Proxy?',                    cat: 'Threat',   icon: '⚑' },
  threat_score:               { label: 'Threat Score',                 cat: 'Threat',   icon: '⚑' },
  vpn_score:                  { label: 'VPN Score',                    cat: 'Threat',   icon: '⚑' },
  proxy_score:                { label: 'Proxy Score',                  cat: 'Threat',   icon: '⚑' },
  language:                   { label: 'Language',                     cat: 'Country',  icon: '⊞' },
  mobile_calling_code:        { label: 'Country Mobile Calling Code',  cat: 'Country',  icon: '⊞' },
  tld:                        { label: 'TLD',                          cat: 'Country',  icon: '⊞' },
  fifa:                       { label: 'FIFA Country Code',            cat: 'Country',  icon: '⊞' },
  maps:                       { label: 'Map Link',                     cat: 'Location', icon: '◎' },
  population:                 { label: 'Population',                   cat: 'Country',  icon: '⊞' },
}

const CATEGORIES = ['All', 'Network', 'Location', 'Country', 'Time', 'Contact', 'Threat']
const CAT_COLORS = {
  All:      { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.15)', text: '#e2e8f0' },
  Network:  { bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)',  text: '#38bdf8' },
  Location: { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)', text: '#a78bfa' },
  Country:  { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  text: '#fbbf24' },
  Time:     { bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)',  text: '#34d399' },
  Contact:  { bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.25)', text: '#fb7185' },
  Threat:   { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444' },
}

function formatValue(key, val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (key === 'population') return Number(val).toLocaleString()
  if (key === 'country_flag_icon') return null
  if (key === 'maps') return null
  return String(val)
}

function parsePriceUSD(info) {
  if (!info) return null
  const n = parseFloat(info.price)
  return isNaN(n) ? null : n
}

function PriceBadge({ info, rate }) {
  const usd = parsePriceUSD(info)
  if (usd === null) return null
  if (usd === 0) return <span className={styles.priceFree}>FREE</span>
  const ngn = Math.round(usd * parseFloat(rate || 1200))
  return (
    <div className={styles.priceBadge}>
      <span className={styles.priceUsd}>${usd.toFixed(2)}</span>
      <span className={styles.priceNgn}>₦{ngn.toLocaleString()}</span>
      <span className={styles.priceUnit}>/day</span>
    </div>
  )
}

function tierColor(usd) {
  if (usd === null) return '#2d3550'
  if (usd === 0)    return '#34d399'
  if (usd <= 0.10)  return '#38bdf8'
  if (usd <= 0.15)  return '#ef4444'
  if (usd <= 0.20)  return '#a78bfa'
  if (usd <= 0.25)  return '#fb7185'
  if (usd <= 0.30)  return '#fbbf24'
  return '#f97316'
}

function PricingTierLegend({ rate }) {
  const tiers = [
    { label: 'Free',   usd: 0,    color: '#34d399' },
    { label: '$0.10',  usd: 0.10, color: '#38bdf8' },
    { label: '$0.15',  usd: 0.15, color: '#ef4444' },
    { label: '$0.20',  usd: 0.20, color: '#a78bfa' },
    { label: '$0.25',  usd: 0.25, color: '#fb7185' },
    { label: '$0.30',  usd: 0.30, color: '#fbbf24' },
    { label: '$0.35',  usd: 0.35, color: '#f97316' },
  ]
  return (
    <div className={styles.pricingLegend}>
      <div className={styles.pricingLegendTop}>
        <span className={styles.pricingLegendTitle}>PRICING TIERS</span>
        <div className={styles.pricingLegendRate}>
          <span className={styles.rateIcon}>↔</span>
          $1 = ₦{Number(rate || 1200).toLocaleString()} NGN
        </div>
      </div>
      <div className={styles.pricingTiers}>
        {tiers.map(t => (
          <div key={t.label} className={styles.pricingTier}>
            <span className={styles.pricingTierDot} style={{ background: t.color }} />
            <span className={styles.pricingTierLabel}>{t.label}</span>
            {t.usd > 0 && (
              <span className={styles.pricingTierNgn}>
                ₦{Math.round(t.usd * Number(rate || 1200)).toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Live IP Panel ────────────────────────────────────────────────────────────
function LiveIPPanel({ data, loading, error, lookupMeta }) {
  if (loading) return (
    <div className={styles.liveLoading}>
      <div className={styles.radarWrap}>
        <div className={styles.radarRing} />
        <div className={styles.radarRing2} />
        <div className={styles.radarSweep} />
        <div className={styles.radarDot} />
      </div>
      <p className={styles.liveLoadingText}>Scanning your IP…</p>
    </div>
  )
  if (error) return <div className={styles.liveError}><span>⚠</span> {error}</div>
  if (!data) return null

  const d = data.data
  const threatNum = parseInt(d.threat_score) || 0
  const vpnNum    = parseInt(d.vpn_score)    || 0
  const proxyNum  = parseInt(d.proxy_score)  || 0

  const threatColor = threatNum < 30 ? '#34d399' : threatNum < 60 ? '#fbbf24' : '#ef4444'
  const vpnColor    = vpnNum    < 30 ? '#34d399' : vpnNum    < 60 ? '#fbbf24' : '#ef4444'
  const proxyColor  = proxyNum  < 30 ? '#34d399' : proxyNum  < 60 ? '#fbbf24' : '#ef4444'

  const DISPLAY_CATEGORIES = ['Network', 'Location', 'Country', 'Time', 'Contact', 'Threat']

  return (
    <div className={styles.livePanel}>
      <div className={styles.livePanelHeader}>
        <div className={styles.liveIPBadge}>
          <span className={styles.liveIPDot} />
          <span className={styles.liveIPText}>{d.ip_address}</span>
          <span className={styles.liveIPVersion}>{d.ip_version?.toUpperCase()}</span>
        </div>
        {d.country_flag_icon && (
          <img src={d.country_flag_icon} alt={d.country_name} className={styles.liveFlag} />
        )}
      </div>

      {/* ── Multi-score threat block ── */}
      <div className={styles.threatWrap}>
        {/* Threat Score */}
        <div className={styles.threatScoreRow}>
          <div className={styles.threatHeader}>
            <span className={styles.threatLabel}>Threat Score</span>
            <span className={styles.threatVal} style={{ color: threatColor }}>{d.threat_score}</span>
          </div>
          <div className={styles.threatBar}>
            <div className={styles.threatFill} style={{ width: d.threat_score, background: threatColor }} />
          </div>
        </div>

        {/* VPN Score */}
        {d.vpn_score !== undefined && (
          <div className={styles.threatScoreRow}>
            <div className={styles.threatHeader}>
              <span className={styles.threatLabel}>VPN Score</span>
              <span className={styles.threatVal} style={{ color: vpnColor, fontSize: '0.82rem' }}>{d.vpn_score}</span>
            </div>
            <div className={styles.threatBar}>
              <div className={styles.threatFill} style={{ width: d.vpn_score, background: vpnColor }} />
            </div>
          </div>
        )}

        {/* Proxy Score */}
        {d.proxy_score !== undefined && (
          <div className={styles.threatScoreRow}>
            <div className={styles.threatHeader}>
              <span className={styles.threatLabel}>Proxy Score</span>
              <span className={styles.threatVal} style={{ color: proxyColor, fontSize: '0.82rem' }}>{d.proxy_score}</span>
            </div>
            <div className={styles.threatBar}>
              <div className={styles.threatFill} style={{ width: d.proxy_score, background: proxyColor }} />
            </div>
          </div>
        )}

        {/* Badges */}
        <div className={styles.threatBadges}>
          <span className={`${styles.threatBadge} ${d.is_tor ? styles.threatBadgeDanger : styles.threatBadgeSafe}`}>
            {d.is_tor ? '● TOR' : '○ No TOR'}
          </span>
          <span className={`${styles.threatBadge} ${d.is_blacklisted ? styles.threatBadgeDanger : styles.threatBadgeSafe}`}>
            {d.is_blacklisted ? '● Blacklisted' : '○ Clean'}
          </span>
          <span className={`${styles.threatBadge} ${d.is_vpn ? styles.threatBadgeDanger : styles.threatBadgeSafe}`}>
            {d.is_vpn ? '● VPN' : '○ No VPN'}
          </span>
          <span className={`${styles.threatBadge} ${d.is_proxy ? styles.threatBadgeDanger : styles.threatBadgeSafe}`}>
            {d.is_proxy ? '● Proxy' : '○ No Proxy'}
          </span>
          {d.network_status && (
            <span className={`${styles.threatBadge} ${styles.threatBadgeSafe}`}>● {d.network_status}</span>
          )}
          {d.network_type && (
            <span className={`${styles.threatBadge} ${styles.threatBadgeInfo}`}>◈ {d.network_type}</span>
          )}
        </div>
      </div>

      <div className={styles.liveFields}>
        {DISPLAY_CATEGORIES.map(cat => {
          const fields = Object.entries(FIELD_META).filter(([, m]) => m.cat === cat)
          return (
            <div key={cat} className={styles.liveCatGroup}>
              <div className={styles.liveCatLabel} style={{ color: CAT_COLORS[cat].text }}>
                {FIELD_META[Object.keys(FIELD_META).find(k => FIELD_META[k].cat === cat)].icon} {cat}
              </div>
              {fields.map(([key, meta]) => {
                const raw = d[key]
                if (raw === undefined) return null
                if (key === 'country_flag_icon') return null
                if (key === 'maps') return (
                  <div key={key} className={styles.liveRow}>
                    <span className={styles.liveRowKey}>{meta.label}</span>
                    <a href={raw} target="_blank" rel="noreferrer" className={styles.liveLink}>View Map ↗</a>
                  </div>
                )
                return (
                  <div key={key} className={styles.liveRow}>
                    <span className={styles.liveRowKey}>{meta.label}</span>
                    <span className={styles.liveRowVal}>{formatValue(key, raw)}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className={styles.liveDisclaimer}>
        <span>🔒</span> Everything we say is facts!.
      </div>
    </div>
  )
}

// ─── Data Selector Panel ──────────────────────────────────────────────────────
function DataSelectorPanel({ lookupMeta, rate, lookupsLoading, token, onPurchaseSuccess }) {
  const [selected, setSelected] = useState({})
  const [daysFor, setDaysFor] = useState(30)
  const [autoRenew, setAutoRenew] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [txId, setTxId] = useState(null)
  const [activeTab, setActiveTab] = useState('All')

  useEffect(() => {
    const init = {}
    Object.keys(FIELD_META).forEach(k => { init[k] = false })
    setSelected(init)
  }, [])

  const toggleField = key => setSelected(prev => ({ ...prev, [key]: !prev[key] }))
  const selectAll = () => { const n = {}; Object.keys(FIELD_META).forEach(k => { n[k] = true }); setSelected(n) }
  const clearAll  = () => { const n = {}; Object.keys(FIELD_META).forEach(k => { n[k] = false }); setSelected(n) }

  const selectedCount = Object.values(selected).filter(Boolean).length
  const totalFields   = Object.keys(FIELD_META).length

  const totalCostUSD = lookupMeta
    ? Object.entries(selected).reduce((sum, [key, on]) => {
        if (!on) return sum
        const usd = parsePriceUSD(lookupMeta[key])
        return usd !== null ? sum + usd : sum
      }, 0)
    : 0
  const totalCostNGN = Math.round(totalCostUSD * Number(rate || 1200))

  const handleSubmit = async () => {
    if (selectedCount === 0) { setSubmitError('Select at least one data field.'); return }
    setSubmitting(true); setSubmitError(null); setTxId(null)
    try {
      const res = await fetch('https://secure.ghostroute.icu/api/v1.0/scanoracle/payment/create/ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'accept': 'application/json' },
        body: JSON.stringify({ ...selected, days_for: daysFor, auto_renew: autoRenew }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || json.detail || 'Purchase failed.')
      setTxId(json.data?.transaction_id)
      onPurchaseSuccess?.(json.data)
    } catch (e) { setSubmitError(e.message) }
    finally { setSubmitting(false) }
  }

  if (lookupsLoading) return (
    <div className={styles.selectorLoading}>
      <div className={styles.selectorSpinner} />
      <p>Loading data catalog…</p>
    </div>
  )

  if (txId) return (
    <div className={styles.successPanel}>
      <div className={styles.successIcon}>✓</div>
      <h3 className={styles.successTitle}>Purchase Initiated</h3>
      <p className={styles.successSub}>Your data subscription is being activated.</p>
      <div className={styles.successTx}>
        <span className={styles.successTxLabel}>Transaction ID</span>
        <code className={styles.successTxCode}>{txId}</code>
      </div>
      <button className={styles.successReset} onClick={() => { setTxId(null); clearAll() }}>
        Configure New Subscription
      </button>
    </div>
  )

  return (
    <div className={styles.selectorPanel}>
      <div className={styles.selectorHeader}>
        <div className={styles.selectorTitle}>
          <span className={styles.selectorTitleIcon}>⊛</span>
          Build Your Data Package 👨‍🔧
        </div>
        <div className={styles.selectorCount}>
          <span className={styles.selectorCountNum}>{selectedCount}</span>
          <span className={styles.selectorCountOf}>/ {totalFields} fields</span>
        </div>
      </div>

      <PricingTierLegend rate={rate} />

      <div className={styles.selectorActions}>
        <button className={styles.quickBtn} onClick={selectAll}>Select All</button>
        <button className={styles.quickBtn} onClick={clearAll}>Clear</button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`${styles.quickBtn} ${activeTab === cat ? styles.quickBtnActive : ''}`}
            style={activeTab === cat ? { borderColor: CAT_COLORS[cat].text, color: CAT_COLORS[cat].text } : {}}
            onClick={() => setActiveTab(cat)}
          >{cat}</button>
        ))}
      </div>

      <div className={styles.fieldList}>
        {Object.entries(FIELD_META)
          .filter(([, m]) => activeTab === 'All' || m.cat === activeTab)
          .map(([key, meta]) => {
            const info = lookupMeta?.[key]
            const usd = parsePriceUSD(info)
            const isOn = selected[key] || false
            const dot = tierColor(usd)

            return (
              <label
                key={key}
                className={`${styles.fieldRow} ${isOn ? styles.fieldRowOn : ''}`}
                style={isOn ? { borderColor: CAT_COLORS[meta.cat]?.border, background: CAT_COLORS[meta.cat]?.bg } : {}}
              