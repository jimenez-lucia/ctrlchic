import { useAuth } from '../contexts/AuthContext'
import WardrobeManager from '../components/WardrobeManager'

export default function ProfilePage() {
  const { currentUser } = useAuth()

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '1.5rem', color: '#333' }}>My Profile</h1>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Email:</strong> {currentUser?.email}
        </p>
      </div>

      <WardrobeManager />

      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h2 style={{ marginTop: 0 }}>Favorite Outfits</h2>
        <p style={{ color: '#666' }}>Coming soon...</p>
      </div>
    </div>
  )
}
