import { useState, useEffect } from "react";
import styles from "./SupportModal.module.css";

const SUPPORT_EMAIL = "ghostroute.security@gmail.com";
const EMAIL_SUBJECT = "Support Request — Ghostroute";
const EMAIL_BODY = `Hi Ghostroute Support,

[Describe your issue here]

Username: [your username]
`;

export default function SupportModal({ onClose }) {
  const [copied, setCopied] = useState(null); // "email" | "template" | null
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const handleKey = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 220);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(EMAIL_BODY)}`;

  return (
    <div
      className={`${styles.backdrop} ${visible ? styles.backdropVisible : ""}`}
      onClick={handleBackdropClick}
    >
      <div className={`${styles.modal} ${visible ? styles.modalVisible : ""}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            {/* Headset / support icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11a9 9 0 1 1 18 0"/>
              <path d="M21 11v5a2 2 0 0 1-2 2h-1"/>
              <path d="M3 11v5a2 2 0 0 0 2 2h1"/>
              <rect x="1" y="11" width="4" height="6" rx="2"/>
              <rect x="19" y="11" width="4" height="6" rx="2"/>
            </svg>
          </div>
          <div>
            <h2 className={styles.title}>Contact Support</h2>
            <p className={styles.subtitle}>We're here to help — reach us by email</p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.divider} />

        {/* Body */}
        <div className={styles.body}>
          <p className={styles.intro}>
            Send us a message using the template below and we'll get back to you as soon as possible.
          </p>

          {/* Email address row */}
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Send to</span>
            <div className={styles.copyRow}>
              <span className={styles.fieldValue}>{SUPPORT_EMAIL}</span>
              <button
                className={styles.copyBtn}
                onClick={() => copyToClipboard(SUPPORT_EMAIL, "email")}
              >
                {copied === "email" ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Subject row */}
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Subject</span>
            <div className={styles.copyRow}>
              <span className={styles.fieldValue}>{EMAIL_SUBJECT}</span>
            </div>
          </div>

          {/* Message template */}
          <div className={styles.fieldGroup}>
            <div className={styles.templateHeader}>
              <span className={styles.fieldLabel}>Message template</span>
              <button
                className={styles.copyBtn}
                onClick={() => copyToClipboard(EMAIL_BODY, "template")}
              >
                {copied === "template" ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className={styles.template}>
              <p>Hi Ghostroute Support,</p>
              <p>&nbsp;</p>
              <p><span className={styles.placeholder}>[Describe your issue here]</span></p>
              <p>&nbsp;</p>
              <p>Username: <span className={styles.placeholder}>[your username]</span></p>
            </div>
          </div>

          {/* Info callouts */}
          <div className={styles.callouts}>
            <div className={styles.callout}>
              <span className={styles.calloutIcon}>⚡</span>
              <p><strong>Response time:</strong> We typically reply within 24–48 hours on business days.</p>
            </div>
            <div className={styles.callout}>
              <span className={styles.calloutIcon}>🔐</span>
              <p><strong>Account issues?</strong> Include your username so we can locate your account faster.</p>
            </div>
          </div>

          <p className={styles.note}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            Send from the email address associated with your Ghostroute account.
          </p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={handleClose}>Cancel</button>
          <a className={styles.mailtoBtn} href={mailtoHref}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            Open Email Client
          </a>
        </div>
      </div>
    </div>
  );
}
