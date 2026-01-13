import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'

export default function RootLayout() {
  const { currentUser, signout } = useAuth()
  const navigate = useNavigate()
  const [backendStatus, setBackendStatus] = useState('checking')

  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    if (!API_URL) {
      setBackendStatus('misconfigured')
      console.error('VITE_API_URL environment variable is not set')
      return
    }

    let retryCount = 0
    const maxRetries = 20
    const retryInterval = 5000 // 5 seconds (~100 sec total)

    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health/`)
        if (response.ok) {
          setBackendStatus('online')
          return true
        } else {
          setBackendStatus('offline')
          return false
        }
      } catch (error) {
        if (retryCount < maxRetries) {
          setBackendStatus('spinning up')
        } else {
          setBackendStatus('offline')
        }
        return false
      }
    }

    const startHealthCheck = async () => {
      const isOnline = await checkBackendHealth()
      if (!isOnline && retryCount < maxRetries) {
        retryCount++
        setTimeout(startHealthCheck, retryInterval)
      }
    }

    startHealthCheck()
  }, [API_URL])

  const handleSignout = async () => {
    try {
      await signout()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>CtrlChic</h1>
        </Link>

        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {currentUser ? (
            <>
              <Link to="/app" style={{ color: 'white', textDecoration: 'none' }}>
                Studio
              </Link>
              <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>
                Profile
              </Link>
              <button
                onClick={handleSignout}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid white',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                color: 'white',
                textDecoration: 'none',
                border: '1px solid white',
                padding: '0.5rem 1rem',
                borderRadius: '4px'
              }}
            >
              Sign In
            </Link>
          )}
        </nav>
      </header>

      <div style={{
        padding: '0.5rem 2rem',
        backgroundColor: backendStatus === 'online' ? '#d4edda' :
                        backendStatus === 'offline' || backendStatus === 'misconfigured' ? '#f8d7da' : '#fff3cd',
        color: backendStatus === 'online' ? '#155724' :
               backendStatus === 'offline' || backendStatus === 'misconfigured' ? '#721c24' : '#856404',
        fontSize: '0.875rem',
        textAlign: 'center'
      }}>
        {backendStatus === 'spinning up'
          ? 'Backend: spinning up (this may take a minute)...'
          : backendStatus === 'misconfigured'
          ? 'Backend: VITE_API_URL not configured'
          : `Backend: ${backendStatus}`}
      </div>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  )
}
