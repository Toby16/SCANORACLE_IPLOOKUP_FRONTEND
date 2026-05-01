import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <div className="app">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
