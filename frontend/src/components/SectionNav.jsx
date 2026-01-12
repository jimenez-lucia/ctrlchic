export default function SectionNav({ onTryOnClick, onAIStylistClick }) {
  const buttonStyle = {
    backgroundColor: 'transparent',
    border: '2px solid #007bff',
    color: '#007bff',
    padding: '0.5rem 1.5rem',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s'
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      backgroundColor: 'white',
      borderBottom: '2px solid #007bff',
      padding: '1rem',
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      zIndex: 100,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <button
        onClick={onTryOnClick}
        style={buttonStyle}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#007bff'
          e.target.style.color = 'white'
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent'
          e.target.style.color = '#007bff'
        }}
      >
        Try On
      </button>
      <button
        onClick={onAIStylistClick}
        style={buttonStyle}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#007bff'
          e.target.style.color = 'white'
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent'
          e.target.style.color = '#007bff'
        }}
      >
        AI Stylist
      </button>
    </nav>
  )
}
