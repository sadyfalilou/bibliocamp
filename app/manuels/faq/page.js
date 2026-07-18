'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '../../../components/Footer'
import { FAQ_MANUELS as FAQ } from '../../../lib/faqData'

function AccordionItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid #f1f5f9' }}>
      <button
        onClick={() => setIsOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a2e4a', lineHeight: 1.4 }}>{question}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {isOpen && (
        <div style={{ padding: '0 0 16px', fontSize: 14, color: '#4a5568', lineHeight: 1.7 }}>{answer}</div>
      )}
    </div>
  )
}

export default function ManuelsFaqPage() {
  const router = useRouter()

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa', colorScheme: 'light' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 16 }}>
          <button onClick={() => router.push('/login?redirect=/app&view=acheter')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 4 }}>← Manuels</button>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#1a2e4a', textAlign: 'center' }}>Foire aux questions</span>
          <div style={{ width: 80 }} />
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 10px' }}>FAQ Manuels</h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>Toutes les réponses à tes questions sur l'achat et la vente de manuels.</p>
        </div>

        {/* Sections FAQ */}
        {FAQ.map(section => (
          <div key={section.section} style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#00c9a7', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>{section.section}</h2>
            <div>
              {section.items.map((item, i) => (
                <AccordionItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        ))}

        {/* Contact */}
        <div style={{ background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', borderRadius: 14, padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>Tu as une autre question ?</div>
          <p style={{ fontSize: 13, color: '#a0c4d8', margin: '0 0 16px' }}>Contacte-nous et on te répondra dans les plus brefs délais.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/login?redirect=/app&view=acheter')} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Voir les manuels
            </button>
            <button onClick={() => router.push('/login?redirect=/app&view=vendre')} style={{ padding: '10px 20px', background: '#00c9a7', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Vendre un manuel →
            </button>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  )
}
