'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function Landing() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [stats, setStats] = useState({ listings: 0, users: 0 }) // eslint-disable-line
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Si déjà connecté, aller à la marketplace
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) router.push('/app')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Charger quelques annonces récentes (public)
  useEffect(() => {
    const load = async () => {
      // Passe par l'API serveur pour contourner les restrictions RLS (visiteurs non connectés)
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings ?? [])
      }
    }
    load()
  }, [])

  const institutions = [
    'UQAM', 'HEC Montréal', 'Université de Montréal',
    'McGill', 'Concordia', 'Université Laval',
    'Polytechnique', 'ÉTS', 'Université de Sherbrooke',
  ]

  const benefits = [
    { icon: '💸', title: 'Économise sur tes manuels', desc: 'Jusqu\'à 80% moins cher qu\'en librairie' },
    { icon: '📦', title: 'Vends tes anciens manuels', desc: 'Transforme tes livres en argent de poche' },
    { icon: '🎓', title: 'Entre étudiants seulement', desc: 'Une communauté de confiance au Québec' },
    { icon: '💬', title: 'Messagerie intégrée', desc: 'Contacte les vendeurs directement' },
  ]

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#ffffff', color: '#1a2e4a' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e8edf2',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 64,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
      }}>
        <Logo variant="dark" size="md" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'transparent', border: '1.5px solid #e8edf2',
              borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600,
              color: '#1a2e4a', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.color = '#00c9a7' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8edf2'; e.currentTarget.style.color = '#1a2e4a' }}
          >
            Se connecter
          </button>
          <button
            onClick={() => router.push('/login?tab=signup')}
            style={{
              background: '#1a2e4a', border: 'none',
              borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 700,
              color: 'white', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#00c9a7'}
            onMouseLeave={e => e.currentTarget.style.background = '#1a2e4a'}
          >
            Rejoindre gratuitement
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(160deg, #0f1f35 0%, #1a2e4a 50%, #0d4f6b 100%)',
        padding: isMobile ? '60px 20px 80px' : '80px 40px 100px',
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Cercles déco */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(0,201,167,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(0,201,167,0.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(0,201,167,0.15)',
            border: '1px solid rgba(0,201,167,0.3)', borderRadius: 20,
            padding: '6px 16px', fontSize: 13, fontWeight: 600,
            color: '#00c9a7', marginBottom: 24, letterSpacing: 0.3
          }}>
            ✅ 100% gratuit — aucune carte requise
          </div>

          <h1 style={{
            color: 'white', fontSize: isMobile ? 32 : 52,
            fontWeight: 900, lineHeight: 1.15, margin: '0 0 20px',
            letterSpacing: -1
          }}>
            La marketplace des manuels{' '}
            <span style={{ color: '#00c9a7' }}>étudiants du Québec</span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.7)', fontSize: isMobile ? 16 : 19,
            margin: '0 0 40px', lineHeight: 1.6, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto'
          }}>
            Achète et vends tes manuels directement entre étudiants.
            Économise jusqu'à 80% sur tes livres.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/login?tab=signup')}
              style={{
                background: '#00c9a7', border: 'none', borderRadius: 10,
                padding: '14px 32px', fontSize: 16, fontWeight: 800,
                color: 'white', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,201,167,0.4)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,201,167,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,201,167,0.4)' }}
            >
              Créer mon compte gratuit
            </button>
            <button
              onClick={() => router.push('/login')}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)',
                borderRadius: 10, padding: '14px 32px', fontSize: 16, fontWeight: 700,
                color: 'white', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              Se connecter
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{
        background: '#f8fafc', borderBottom: '1px solid #e8edf2',
        padding: '28px 24px'
      }}>
        <div style={{
          maxWidth: 860, margin: '0 auto',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: isMobile ? 20 : 48, flexWrap: 'wrap', textAlign: 'center'
        }}>
          {[
            { icon: '📚', value: '100% gratuit', label: 'Aucune commission sur tes ventes' },
            { icon: '⚡', value: 'Inscription rapide', label: 'Prêt en moins de 30 secondes' },
            { icon: '💸', value: 'Jusqu\'à 80%', label: 'D\'économies vs la librairie' },
            { icon: '🎓', value: 'Québec seulement', label: 'Communauté étudiante locale' },
          ].map((s, i) => (
            <div key={i} style={{ minWidth: isMobile ? 130 : 160 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: '#1a2e4a' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ANNONCES RÉCENTES */}
      <section style={{ padding: isMobile ? '48px 16px' : '64px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 900, margin: '0 0 10px', letterSpacing: -0.5 }}>
            Manuels disponibles maintenant
          </h2>
          <p style={{ color: '#64748b', fontSize: 16, margin: 0 }}>
            Découvre les dernières annonces sans créer de compte
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 16
        }}>
          {listings.length === 0
            ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#f8fafc', borderRadius: 12, height: 200, animation: 'pulse 1.5s infinite' }} />
            ))
            : listings.map(listing => (
              <div
                key={listing.id}
                onClick={() => router.push('/login')}
                style={{
                  background: 'white', borderRadius: 12, overflow: 'hidden',
                  border: '1px solid #e8edf2', cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                {/* Image */}
                <div style={{ height: 120, background: '#f0f4f8', position: 'relative', overflow: 'hidden' }}>
                  {listing.images?.[0]
                    ? <img src={listing.images[0]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📚</div>
                  }
                  {/* Badge transaction */}
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: listing.transaction_type === 'Don' ? '#10b981' : listing.transaction_type === 'Prêt' ? '#6366f1' : '#1a2e4a',
                    color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700
                  }}>
                    {listing.transaction_type || 'Vente'}
                  </div>
                </div>
                {/* Infos */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a', lineHeight: 1.3, marginBottom: 6,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {listing.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#00c9a7' }}>
                      {listing.transaction_type === 'Don' ? 'Gratuit' : listing.transaction_type === 'Prêt' ? 'Prêt' : `${listing.price ?? '—'}$`}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{listing.etat}</span>
                  </div>
                </div>
              </div>
            ))
          }
        </div>

        {/* CTA voir plus */}
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background: 'white', border: '2px solid #1a2e4a',
              borderRadius: 10, padding: '13px 32px', fontSize: 15, fontWeight: 700,
              color: '#1a2e4a', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1a2e4a'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#1a2e4a' }}
          >
            Voir toutes les annonces →
          </button>
        </div>
      </section>

      {/* AVANTAGES */}
      <section style={{ background: '#f8fafc', padding: isMobile ? '48px 16px' : '64px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: isMobile ? 24 : 34, fontWeight: 900, margin: '0 0 48px', letterSpacing: -0.5 }}>
            Pourquoi choisir BiblioCamp ?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 20
          }}>
            {benefits.map((b, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 14, padding: '24px',
                border: '1px solid #e8edf2', display: 'flex', gap: 16, alignItems: 'flex-start',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: 36, flexShrink: 0 }}>{b.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#1a2e4a', marginBottom: 6 }}>{b.title}</div>
                  <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UNIVERSITÉS */}
      <section style={{ padding: isMobile ? '48px 16px' : '64px 40px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 900, margin: '0 0 12px', letterSpacing: -0.5 }}>
          Disponible dans toutes les universités québécoises
        </h2>
        <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 36px' }}>
          Rejoins des étudiants de partout au Québec
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {institutions.map(inst => (
            <span key={inst} style={{
              background: '#f0f4f8', border: '1px solid #e8edf2',
              borderRadius: 20, padding: '8px 18px', fontSize: 14,
              fontWeight: 600, color: '#1a2e4a'
            }}>
              {inst}
            </span>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{
        background: 'linear-gradient(135deg, #1a2e4a 0%, #0d4f6b 100%)',
        padding: isMobile ? '56px 24px' : '80px 40px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: 'white', fontSize: isMobile ? 26 : 40, fontWeight: 900, margin: '0 0 16px', letterSpacing: -0.5 }}>
          Prêt à économiser sur tes manuels ?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, margin: '0 0 36px' }}>
          Rejoins BiblioCamp gratuitement en moins de 30 secondes.
        </p>
        <button
          onClick={() => router.push('/login?tab=signup')}
          style={{
            background: '#00c9a7', border: 'none', borderRadius: 12,
            padding: '16px 40px', fontSize: 17, fontWeight: 800,
            color: 'white', cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(0,201,167,0.4)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,201,167,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,201,167,0.4)' }}
        >
          Créer mon compte — c'est gratuit
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#0f1f35', padding: '32px 24px',
        textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13
      }}>
        <Logo variant="light" size="sm" style={{ marginBottom: 16, opacity: 0.7 }} />
        <p style={{ margin: '12px 0 8px' }}>© 2026 BiblioCamp — Fait pour les étudiants, par des étudiants</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
          <a href="/cgu" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Conditions d'utilisation</a>
          <a href="/confidentialite" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Confidentialité</a>
        </div>
      </footer>
    </div>
  )
}
