import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import './App.css'

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/results/:requestId" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
