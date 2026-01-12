import { useRef } from 'react'
import SectionNav from '../components/SectionNav'
import OutfitSelector from '../components/OutfitSelector'
import AIStylistPrompt from '../components/AIStylistPrompt'

export default function StudioPage() {
  const tryOnRef = useRef(null)
  const aiStylistRef = useRef(null)

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <SectionNav
        onTryOnClick={() => scrollToSection(tryOnRef)}
        onAIStylistClick={() => scrollToSection(aiStylistRef)}
      />

      <section
        ref={tryOnRef}
        id="try-on"
        style={{
          minHeight: '100vh',
          padding: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Try On Your Outfits</h2>
        <OutfitSelector />
      </section>

      <section
        ref={aiStylistRef}
        id="ai-stylist"
        style={{
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>AI Stylist</h2>
        <AIStylistPrompt />
      </section>
    </div>
  )
}
