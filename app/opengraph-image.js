import { ImageResponse } from 'next/og'

// Image Open Graph par défaut de tout le site (aperçu lors du partage d'un lien
// sur WhatsApp, Facebook, iMessage, LinkedIn…). Générée à la volée, aux couleurs
// de la marque. Les pages livre/tuteur qui définissent leur propre openGraph.images
// (photo du manuel / avatar) l'emportent sur celle-ci.

export const alt = 'BiblioCamp — la marketplace étudiante québécoise : manuels, tuteurs, colocs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a2e4a 0%, #2d4a6b 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
          <span style={{ color: 'white' }}>Biblio</span>
          <span style={{ color: '#00c9a7' }}>Camp</span>
        </div>
        <div style={{ marginTop: 24, color: '#cbd8e6', fontSize: 38, fontWeight: 500 }}>
          La marketplace étudiante québécoise
        </div>
        <div style={{ marginTop: 44, display: 'flex', gap: 20 }}>
          {['Manuels', 'Tuteurs', 'Colocs'].map(t => (
            <div
              key={t}
              style={{
                display: 'flex',
                color: '#00c9a7',
                background: 'rgba(0, 201, 167, 0.12)',
                border: '2px solid #00c9a7',
                borderRadius: 999,
                padding: '10px 30px',
                fontSize: 30,
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
