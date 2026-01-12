import { useState } from 'react'

export default function AIStylistPrompt() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    console.log('AI Prompt:', prompt)
    alert('AI Stylist feature coming soon!')
    setLoading(false)
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <p style={{
        textAlign: 'center',
        color: '#666',
        marginBottom: '2rem',
        fontSize: '1.1rem'
      }}>
        Describe your ideal outfit and let AI help you style it.
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., 'I need a casual outfit for a coffee date' or 'Something professional for a job interview'"
          rows={5}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            resize: 'vertical',
            marginBottom: '1rem',
            boxSizing: 'border-box'
          }}
        />
        <button
          type="submit"
          disabled={!prompt.trim() || loading}
          style={{
            width: '100%',
            backgroundColor: prompt.trim() && !loading ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            padding: '1rem',
            fontSize: '1rem',
            borderRadius: '8px',
            cursor: prompt.trim() && !loading ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? 'Processing...' : 'Get Suggestions'}
        </button>
      </form>
    </div>
  )
}
