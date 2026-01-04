import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, signin, error: authError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!isLogin && password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signin(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div style={{
      maxWidth: '400px',
      margin: '2rem auto',
      padding: '2rem',
      border: '1px solid #ccc',
      borderRadius: '8px'
    }}>
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>

      {displayError && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>

        {!isLogin && (
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setLocalError('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
}