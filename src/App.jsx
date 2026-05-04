import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home      from './pages/Home.jsx'
import Auth      from './pages/Auth.jsx'
import Verify    from './pages/Verify.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotFound  from './pages/NotFound.jsx'

function App() {
  return (
    <div className="app">
      <main className="app-main">
        <Routes>
          <Route path="/auth"      element={<Auth />}      />
          <Route path="/verify"    element={<Verify />}    />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/"          element={<Home />}      />
          <Route path="*"          element={<NotFound />}  />
        </Routes>
      </main>
    </div>
  )
}

export default App
