import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'

// Pages
import Auth         from './pages/Auth.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import Verify       from './pages/Verify.jsx'
import Dashboard    from './pages/Dashboard.jsx'
import IPLookup     from './pages/scanoracle/IPLookup.jsx'
import NotFound     from './pages/NotFound.jsx'

// Auth guard
import PrivateRoute from './components/PrivateRoute.jsx'

function App() {
  // Default title — each page overrides it with useEffect
  useEffect(() => { document.title = 'Ghostroute Security' }, [])

  return (
    <div className="app">
      <main className="app-main">
        <Routes>
          {/* ── Public ── */}
          <Route path="/auth"          element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/verify"        element={<Verify />} />

          {/* ── Protected: Dashboard is the root ── */}
          <Route path="/" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />

          {/* ── Protected: SCANORACLE mini-app ── */}
          <Route path="/scanoracle/iplookup" element={
            <PrivateRoute><IPLookup /></PrivateRoute>
          } />

          {/* Future mini-apps slot in here: */}
          {/* <Route path="/scanoracle/maclookup"       element={<PrivateRoute><MacLookup /></PrivateRoute>} /> */}
          {/* <Route path="/scanoracle/useragentlookup" element={<PrivateRoute><UserAgentLookup /></PrivateRoute>} /> */}

          {/* ── 404 ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
