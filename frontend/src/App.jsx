import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...')
  const [backendMessage, setBackendMessage] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${API_URL}/api/health/`)
      .then(res => res.json())
      .then(data => {
        setBackendStatus(data.status)
        setBackendMessage(data.message)
      })
      .catch(() => {
        setBackendStatus('offline')
        setBackendMessage('Cannot connect to backend. Make sure Django server is running.')
      })
  }, [])

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>CtrlChic</h1>
      <p>Virtual Outfit Visualization</p>

      <div style={{
        margin: '2rem auto',
        padding: '1rem',
        maxWidth: '500px',
        border: '1px solid #ccc',
        borderRadius: '8px'
      }}>
        <h3>System Status</h3>
        <p>
          <strong>Frontend:</strong> <span style={{ color: 'green' }}>Running</span>
        </p>
        <p>
          <strong>Backend:</strong> <span style={{
            color: backendStatus === 'healthy' ? 'green' : 'red'
          }}>
            {backendStatus}
          </span>
        </p>
        {backendMessage && <p style={{ fontSize: '0.9rem', color: '#666' }}>{backendMessage}</p>}
      </div>

      <div style={{ marginTop: '2rem', color: '#666' }}>
        <p>Ready for development!</p>
        <p style={{ fontSize: '0.9rem' }}>Next up: Firebase Auth, Wardrobe Upload, AI Outfit Generation</p>
      </div>
    </div>
  )
}

export default App
