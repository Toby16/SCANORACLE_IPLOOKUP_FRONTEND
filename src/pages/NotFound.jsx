import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Target Not Found</h1>
      <p className={styles.sub}>This route doesn't exist in the network.</p>
      <Link to="/" className={styles.back}>← Return to Base</Link>
    </div>
  )
}
