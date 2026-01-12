import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  return children
}
