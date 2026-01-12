import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  useEffect(() => {
    if (currentUser) {
      navigate('/app')
    }
  }, [currentUser, navigate])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#333' }}>
        Welcome to CtrlChic
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem', maxWidth: '600px' }}>
        Try on outfits virtually and get AI-powered styling suggestions.
        Upload your mannequin, add your wardrobe, and see how different combinations look on you.
      </p>
      <button
        onClick={() => navigate('/login')}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '1rem 2rem',
          fontSize: '1.25rem',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
      >
        Get Dressed
      </button>
    </div>
  )
}
