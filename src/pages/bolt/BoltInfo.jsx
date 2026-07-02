import { useNavigate } from 'react-router-dom';
import styles from './Bolt.module.css';
import infoStyles from './BoltInfo.module.css';

const CARDS = [
  {
    title: 'Peak',
    body: 'The highest smoothed speed reached during any single test chunk. A high peak shows what your connection is capable of under ideal conditions.',
  },
  {
    title: 'Average',
    body: 'A rolling 5-second average of your real-time speed. This is a better predictor of everyday performance than peak alone.',
  },
  {
    title: 'Signal',
    body: 'Compares average to peak. Stable means your speed holds steady near its peak; Poor means it swings widely, which can point to congestion or a flaky link.',
  },
];

export default function BoltInfo() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/bolt')}
            aria-label="Back to Bolt"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
        <div className={styles.brand}>
          <span className={styles.brandBolt}>⚡</span>
          <span className={styles.brandName}>Understanding Bolt</span>
        </div>
        <div className={styles.headerRight} />
      </header>

      <main className={infoStyles.main}>
        {CARDS.map((c) => (
          <div key={c.title} className={infoStyles.card}>
            <h3 className={infoStyles.cardTitle}>{c.title}</h3>
            <p className={infoStyles.cardBody}>{c.body}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
