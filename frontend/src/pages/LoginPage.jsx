import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'
import Auth from '../components/Auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuth()

  useEffect(() => {
    if (currentUser) {
      const from = location.state?.from?.pathname || '/app'
      navigate(from, { replace: true })
    }
  }, [currentUser, navigate, location])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      minHeight: '70vh'
    }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>Welcome to CtrlChic</h1>
      <Auth />
    </div>
  )
}
