import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import Auth from './components/Auth'
import MannequinUpload from './components/MannequinUpload'
import WardrobeManager from './components/WardrobeManager'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...')
  const [backendMessage, setBackendMessage] = useState('')
  const [isSpinningUp, setIsSpinningUp] = useState(false)
  const { currentUser, signout } = useAuth()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const checkBackendHealth = async () => {
      // Show "spinning up" message after 5 seconds
      const spinUpTimer = setTimeout(() => {
        setIsSpinningUp(true)
        setBackendMessage(
          'Waking up server... This may take 30-60 seconds on first visit or after inactivity.'
        )
      }, 5000)

      try {
        // Allow up to 90 seconds for cold start
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 90000)

        const response = await fetch(`${API_URL}/api/health/`, {
          signal: controller.signal,
        })
        clearTimeout(timeout)
        clearTimeout(spinUpTimer)

        const data = await response.json()
        setBackendStatus(data.status)
        setBackendMessage(data.message)
        setIsSpinningUp(false)
      } catch (error) {
        clearTimeout(spinUpTimer)
        setBackendStatus('offline')
        setIsSpinningUp(false)
        if (error.name === 'AbortError') {
          setBackendMessage(
            'Server took too long to respond. Please refresh the page to try again.'
          )
        } else {
          setBackendMessage('Cannot connect to backend. Please try again later.')
        }
      }
    }

    checkBackendHealth()
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
            color: backendStatus === 'healthy' ? 'green' : isSpinningUp ? 'orange' : 'red'
          }}>
            {backendStatus}
          </span>
          {isSpinningUp && <span style={{ marginLeft: '0.5rem' }}>⏳</span>}
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
          <WardrobeManager />
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
