import { Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import RevealPage from './components/RevealPage'
import './App.css'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reveal/:encoded" element={<RevealPage />} />
      </Routes>
    </div>
  )
}

export default App
