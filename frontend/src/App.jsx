import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import MannequinUpload from './components/MannequinUpload'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...')
  const [backendMessage, setBackendMessage] = useState('')
  const { currentUser, signout } = useAuth()

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

  const handleSignout = async () => {
    try {
      await signout()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

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

      {currentUser ? (
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            margin: '0 auto 2rem',
            padding: '1rem',
            maxWidth: '500px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px'
          }}>
            <h3>Welcome!</h3>
            <p><strong>Email:</strong> {currentUser.email}</p>
            {currentUser.backendUser && (
              <>
                <p><strong>User ID:</strong> {currentUser.backendUser.id}</p>
                <p><strong>Firebase UID:</strong> {currentUser.backendUser.firebase_uid}</p>
              </>
            )}
            <button
              onClick={handleSignout}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>

          <MannequinUpload />
        </div>
      ) : (
        <>
          <Auth />
          <div style={{ marginTop: '2rem', color: '#666' }}>
            <p>Sign in to get started</p>
          </div>
        </>
      )}
    </div>
  )
}

export default App
