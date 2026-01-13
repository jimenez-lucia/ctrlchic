import { useState } from 'react'
import MannequinUpload from './MannequinUpload'
import WardrobeManager from './WardrobeManager'

export default function OutfitSelector() {
  const [selectedTop, setSelectedTop] = useState(null)
  const [selectedBottom, setSelectedBottom] = useState(null)

  const canGenerate = selectedTop && selectedBottom

  const handleTopSelect = (item) => {
    setSelectedTop(selectedTop?.id === item.id ? null : item)
  }

  const handleBottomSelect = (item) => {
    setSelectedBottom(selectedBottom?.id === item.id ? null : item)
  }

  const handleGenerate = () => {
    console.log('Generate outfit with:', { selectedTop, selectedBottom })
    alert(`AI generation coming soon!\n\nSelected:\n- Top: ${selectedTop?.id}\n- Bottom: ${selectedBottom?.id}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <MannequinUpload />

      <WardrobeManager
        selectionMode={true}
        onTopSelect={handleTopSelect}
        onBottomSelect={handleBottomSelect}
        selectedTop={selectedTop}
        selectedBottom={selectedBottom}
      />

      {canGenerate && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleGenerate}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1.25rem',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            Generate Outfit
          </button>
        </div>
      )}
    </div>
  )
}
