'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Logo from '../../../components/Logo'

export default function InvitePage() {
  const router = useRouter()
  const { code } = useParams()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleSignup = () => {
    router.push(`/login?tab=signup&ref=${code}`)
  }

  const handleLogin = () => {
    router.push(`/login?ref=${code}`)
  }

  return (
    <div style={{
      fontFamily: "'Segoe UI', sans-serif",
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f1e35 0%, #1a2e4a 50%, #0d4f6b 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* HEADER */}
      <header style={{
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Logo variant="light" size="md" onClick={() => router.push('/')} style={{ cursor: 'pointer' }} />
        <button onClick={handleLogin} style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8, padding: '7px 16px',
          fontSize: 13, fontWeight: 600,
          color: 'rgba(255,255,255,0.75)',
          cursor: 'pointer'
        }}>
          J'ai déjà un compte
        </button>
      </header>

      {/* HERO */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '40px 24px' : '60px 32px',
        textAlign: 'center'
      }}>
        {/* Badge invitation */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,201,167,0.15)',
          border: '1px solid rgba(0,201,167,0.4)',
          borderRadius: 40, padding: '8px 18px',
          fontSize: 13, fontWeight: 700, color: '#00c9a7',
          marginBottom: 28
        }}>
          🎉 Tu as été invité(e) à rejoindre BiblioCamp
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize: isMobile ? 32 : 52,
          fontWeight: 900,
          lineHeight: 1.1,
          margin: '0 0 20px',
          maxWidth: 700
        }}>
          Achète et vends tes manuels{' '}
          <span style={{ color: '#00c9a7' }}>entre étudiants</span>
        </h1>

        <p style={{
          fontSize: isMobile ? 16 : 19,
          color: 'rgba(255,255,255,0.7)',
          maxWidth: 520,
          lineHeight: 1.6,
          margin: '0 0 40px'
        }}>
          La marketplace universitaire québécoise. Économise jusqu'à 70% sur tes manuels de cours. Rejoins des milliers d'étudiants.
        </p>

        {/* CTA principal */}
        <button
          onClick={handleSignup}
          style={{
            background: '#00c9a7',
            border: 'none',
            borderRadius: 14,
            padding: isMobile ? '16px 36px' : '18px 48px',
            fontSize: isMobile ? 17 : 19,
            fontWeight: 800,
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,201,167,0.4)',
            transition: 'all 0.2s',
            marginBottom: 14
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#00b396'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#00c9a7'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Créer mon compte gratuitement →
        </button>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Gratuit · Aucune carte de crédit requise
        </p>

        {/* 3 arguments */}
        <div style={{
          display: 'flex',
          gap: isMobile ? 12 : 24,
          marginTop: 56,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 700
        }}>
          {[
            { emoji: '💰', title: "Économise jusqu'à 70%", desc: "Des manuels d'occasion à prix d'ami" },
            { emoji: '🏫', title: 'Sur ton campus', desc: "Rencontre-toi avec l'acheteur/vendeur facilement" },
            { emoji: '✅', title: 'Sécurisé & gratuit', desc: 'Aucuns frais, aucune commission' }
          ].map(({ emoji, title, desc }) => (
            <div key={title} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, padding: '20px 24px',
              flex: isMobile ? '1 1 100%' : '1 1 180px',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '20px 32px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        © 2025 BiblioCamp · Pour les étudiants, par les étudiants
      </div>
    </div>
  )
}
