import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../services/authService.js'

/**
 * Wraps any route that requires authentication.
 * Saves the attempted URL so we can redirect back after login.
 */
export default function PrivateRoute({ children }) {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}
