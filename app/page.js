'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function Landing() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [searchBuy, setSearchBuy] = useState('')
  const [searchSell, setSearchSell] = useState('')
  const [activeTab, setActiveTab] = useState('acheter')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) router.push('/app')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings ?? [])
      }
    }
    load()
  }, [])

  const handleBuySearch = (e) => {
    e.preventDefault()
    const cleaned = searchBuy.replace(/[-\s]/g, '')
    if (/^\d{10,13}$/.test(cleaned)) {
      router.push(`/book/${cleaned}`)
    } else {
      router.push(`/login?redirect=/app&q=${encodeURIComponent(searchBuy)}`)
    }
  }

  const handleSellSearch = (e) => {
    e.preventDefault()
    const cleaned = searchSell.replace(/[-\s]/g, '')
    if (/^\d{10,13}$/.test(cleaned)) {
      router.push(`/book/${cleaned}`)
    } else {
      router.push(`/login?redirect=/create`)
    }
  }

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`
    return new Date(dateStr).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
  }

  const institutions = [
    'UQAM', 'HEC Montréal', 'Université de Montréal',
    'McGill', 'Concordia', 'Université Laval',
    'Polytechnique', 'ÉTS', 'Université de Sherbrooke',
  ]

  const benefits = [
    { icon: '💸', title: 'Économise sur tes manuels', desc: "Jusqu'à 80% moins cher qu'en librairie" },
    { icon: '📦', title: 'Vends tes anciens manuels', desc: 'Transforme tes livres en argent de poche' },
    { icon: '🎓', title: 'Entre étudiants seulement', desc: 'Une communauté de confiance au Québec' },
    { icon: '💬', title: 'Messagerie intégrée', desc: 'Contacte les vendeurs directement' },
  ]

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#ffffff', color: '#1a2e4a' }}>

      {/* ── STYLE GLOBAL (mobile-first) ── */}
      <style>{`
        * { box-sizing: border-box; }

        .nav-btn-text { display: inline; }
        .nav-cta { display: flex; }

        .hero-title { font-size: 32px; }
        .hero-sub { font-size: 15px; }
        .search-row { flex-direction: column; gap: 10px; }
        .search-row button { width: 100%; }
        .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .benefits-grid { grid-template-columns: 1fr; gap: 16px; }
        .listings-section { padding: 40px 16px; }
        .section-title { font-size: 22px; }
        .cta-title { font-size: 26px; }
        .cta-sub { font-size: 15px; }
        .uni-section { padding: 48px 16px; }
        .advantages-section { padding: 48px 16px; }

        @media (min-width: 480px) {
          .hero-title { font-size: 38px; }
          .search-row { flex-direction: row; gap: 8px; }
          .search-row button { width: auto; }
        }

        @media (min-width: 768px) {
          .nav-cta { display: flex; }
          .hero-title { font-size: 48px; }
          .hero-sub { font-size: 18px; }
          .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 24px; }
          .benefits-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .listings-section { padding: 56px 40px; }
          .section-title { font-size: 30px; }
          .cta-title { font-size: 40px; }
          .cta-sub { font-size: 17px; }
          .uni-section { padding: 64px 40px; }
          .advantages-section { padding: 64px 40px; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e8edf2',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 60,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
      }}>
        <Logo variant="dark" size="md" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => router.push('/login')} style={{
            background: 'transparent', border: '1.5px solid #e8edf2',
            borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600,
            color: '#1a2e4a', cursor: 'pointer', whiteSpace: 'nowrap'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.color = '#00c9a7' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8edf2'; e.currentTarget.style.color = '#1a2e4a' }}
          >
            Connexion
          </button>
          <button onClick={() => router.push('/login?tab=signup')} style={{
            background: '#1a2e4a', border: 'none', borderRadius: 8,
            padding: '8px 12px', fontSize: 13, fontWeight: 700,
            color: 'white', cursor: 'pointer', whiteSpace: 'nowrap'
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#00c9a7'}
            onMouseLeave={e => e.currentTarget.style.background = '#1a2e4a'}
          >
            Rejoindre
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(160deg, #0f1f35 0%, #1a2e4a 50%, #0d4f6b 100%)',
        padding: '52px 20px 64px',
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(0,201,167,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(0,201,167,0.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(0,201,167,0.15)',
            border: '1px solid rgba(0,201,167,0.3)', borderRadius: 20,
            padding: '6px 16px', fontSize: 13, fontWeight: 600,
            color: '#00c9a7', marginBottom: 20, letterSpacing: 0.3
          }}>
            ✅ 100% gratuit — aucune commission
          </div>

          <h1 className="hero-title" style={{
            color: 'white', fontWeight: 900, lineHeight: 1.15,
            margin: '0 0 16px', letterSpacing: -1
          }}>
            La marketplace des manuels{' '}
            <span style={{ color: '#00c9a7' }}>étudiants du Québec</span>
          </h1>

          <p className="hero-sub" style={{
            color: 'rgba(255,255,255,0.75)',
            margin: '0 0 36px', lineHeight: 1.6
          }}>
            Achète et vends tes manuels directement entre étudiants. Économise jusqu'à 80%.
          </p>

          {/* Barre de recherche */}
          <div style={{
            background: 'white', borderRadius: 16,
            padding: '20px 20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxWidth: 620, margin: '0 auto', textAlign: 'left'
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: 18, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
              {[
                { key: 'acheter', label: '🔍 Acheter' },
                { key: 'vendre', label: '📦 Vendre' },
              ].map(tab => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={{
                  flex: 1, padding: '10px 8px', border: 'none',
                  background: activeTab === tab.key ? '#1a2e4a' : 'white',
                  color: activeTab === tab.key ? 'white' : '#64748b',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'acheter' && (
              <form onSubmit={handleBuySearch}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                  ISBN, titre ou auteur
                </label>
                <div className="search-row" style={{ display: 'flex' }}>
                  <input
                    value={searchBuy}
                    onChange={e => setSearchBuy(e.target.value)}
                    placeholder="ex: Comptabilité, Kotler, 9782765..."
                    style={{
                      flex: 1, padding: '12px 14px', border: '1.5px solid #e2e8f0',
                      borderRadius: 9, fontSize: 15, outline: 'none',
                      transition: 'border-color 0.2s', minWidth: 0
                    }}
                    onFocus={e => e.target.style.borderColor = '#00c9a7'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button type="submit" style={{
                    background: '#00c9a7', border: 'none', borderRadius: 9,
                    padding: '12px 20px', color: 'white', fontWeight: 800,
                    fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 14px rgba(0,201,167,0.35)'
                  }}>
                    Rechercher →
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'vendre' && (
              <form onSubmit={handleSellSearch}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                  Entre l'ISBN (au dos du livre) pour auto-remplir les infos
                </label>
                <div className="search-row" style={{ display: 'flex' }}>
                  <input
                    value={searchSell}
                    onChange={e => setSearchSell(e.target.value)}
                    placeholder="ex: 9782765141310"
                    style={{
                      flex: 1, padding: '12px 14px', border: '1.5px solid #e2e8f0',
                      borderRadius: 9, fontSize: 15, outline: 'none',
                      transition: 'border-color 0.2s', minWidth: 0
                    }}
                    onFocus={e => e.target.style.borderColor = '#00c9a7'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button type="submit" style={{
                    background: '#1a2e4a', border: 'none', borderRadius: 9,
                    padding: '12px 20px', color: 'white', fontWeight: 800,
                    fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap'
                  }}>
                    Vendre →
                  </button>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  Pas d'ISBN ?{' '}
                  <span onClick={() => router.push('/login?redirect=/create')}
                    style={{ color: '#00c9a7', cursor: 'pointer', fontWeight: 600 }}>
                    Remplis manuellement →
                  </span>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf2', padding: '24px 20px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="stats-grid" style={{ display: 'grid', textAlign: 'center' }}>
            {[
              { icon: '📚', value: '100% gratuit', label: 'Aucune commission' },
              { icon: '⚡', value: 'Inscription rapide', label: 'Prêt en 30 secondes' },
              { icon: '💸', value: "Jusqu'à 80%", label: "D'économies vs librairie" },
              { icon: '🎓', value: 'Québec seulement', label: 'Communauté locale' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2e4a' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANNONCES RÉCENTES ── */}
      <section className="listings-section" style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 className="section-title" style={{ fontWeight: 900, margin: '0 0 4px', letterSpacing: -0.5 }}>
              Derniers manuels ajoutés
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              Parcours, contacte, économise.
            </p>
          </div>
          <button onClick={() => router.push('/login')} style={{
            background: 'transparent', border: '1.5px solid #00c9a7',
            borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700,
            color: '#00c9a7', cursor: 'pointer'
          }}>
            Voir tout →
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {listings.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: '#f8fafc', borderRadius: 10, height: 76, marginBottom: 1 }} />
            ))
            : listings.map((listing, idx) => (
              <div
                key={listing.id}
                onClick={() => router.push('/login')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'white',
                  borderRadius: idx === 0 ? '12px 12px 0 0' : idx === listings.length - 1 ? '0 0 12px 12px' : 0,
                  border: '1px solid #e8edf2',
                  borderTop: idx === 0 ? '1px solid #e8edf2' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                {/* Cover */}
                <div style={{ flexShrink: 0, width: 40, height: 52 }}>
                  {listing.image_url
                    ? <img src={listing.image_url} alt={listing.title} style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: 4 }} />
                    : <div style={{
                        width: 40, height: 52, borderRadius: 4,
                        background: 'linear-gradient(135deg, #1a2e4a, #0d4f6b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                      }}>📖</div>
                  }
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 14, color: '#1a2e4a',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3
                  }}>
                    {listing.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {listing.authors && (
                      <span style={{ fontSize: 12, color: '#64748b' }}>{listing.authors}</span>
                    )}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20,
                      background: listing.meet_campus ? '#ede9fe' : listing.post ? '#dbeafe' : '#fef3c7',
                      color: listing.meet_campus ? '#6c63ff' : listing.post ? '#2563eb' : '#d97706'
                    }}>
                      {listing.meet_campus ? '🏫 Campus' : listing.post ? '📦 Envoi' : '🏙️ Ville'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#cbd5e0', marginTop: 2 }}>
                    {listing.created_at ? timeAgo(listing.created_at) : ''}
                  </div>
                </div>

                {/* Prix */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#1a2e4a' }}>
                    {listing.price ? `${listing.price} $` : '—'}
                  </div>
                  {listing.original_price && listing.original_price > listing.price && (
                    <div style={{
                      background: '#00c9a7', color: 'white',
                      borderRadius: 20, padding: '2px 7px',
                      fontSize: 11, fontWeight: 700, marginTop: 2
                    }}>
                      -{Math.round(((listing.original_price - listing.price) / listing.original_price) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => router.push('/login')} style={{
            background: 'white', border: '2px solid #1a2e4a',
            borderRadius: 10, padding: '12px 32px', fontSize: 15, fontWeight: 700,
            color: '#1a2e4a', cursor: 'pointer', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1a2e4a'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#1a2e4a' }}
          >
            Voir toutes les annonces →
          </button>
        </div>
      </section>

      {/* ── AVANTAGES ── */}
      <section className="advantages-section" style={{ background: '#f8fafc' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 className="section-title" style={{ textAlign: 'center', fontWeight: 900, margin: '0 0 40px', letterSpacing: -0.5 }}>
            Pourquoi choisir BiblioCamp ?
          </h2>
          <div className="benefits-grid" style={{ display: 'grid' }}>
            {benefits.map((b, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 14, padding: '22px',
                border: '1px solid #e8edf2', display: 'flex', gap: 16, alignItems: 'flex-start',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: 34, flexShrink: 0 }}>{b.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#1a2e4a', marginBottom: 6 }}>{b.title}</div>
                  <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNIVERSITÉS ── */}
      <section className="uni-section" style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 className="section-title" style={{ fontWeight: 900, margin: '0 0 12px', letterSpacing: -0.5 }}>
          Disponible dans toutes les universités québécoises
        </h2>
        <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 32px' }}>
          Rejoins des étudiants de partout au Québec
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {institutions.map(inst => (
            <span key={inst} style={{
              background: '#f0f4f8', border: '1px solid #e8edf2',
              borderRadius: 20, padding: '8px 16px', fontSize: 13,
              fontWeight: 600, color: '#1a2e4a'
            }}>
              {inst}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1a2e4a 0%, #0d4f6b 100%)',
        padding: '56px 24px', textAlign: 'center'
      }}>
        <h2 className="cta-title" style={{ color: 'white', fontWeight: 900, margin: '0 0 16px', letterSpacing: -0.5 }}>
          Prêt à économiser sur tes manuels ?
        </h2>
        <p className="cta-sub" style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 36px' }}>
          Rejoins BiblioCamp gratuitement en moins de 30 secondes.
        </p>
        <button onClick={() => router.push('/login?tab=signup')} style={{
          background: '#00c9a7', border: 'none', borderRadius: 12,
          padding: '16px 36px', fontSize: 17, fontWeight: 800,
          color: 'white', cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0,201,167,0.4)', transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,201,167,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,201,167,0.4)' }}
        >
          Créer mon compte — c'est gratuit
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f1f35', padding: '32px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
        <Logo variant="light" size="sm" style={{ marginBottom: 12, opacity: 0.7 }} />
        <p style={{ margin: '10px 0 8px' }}>© 2026 BiblioCamp — Fait pour les étudiants, par des étudiants</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <a href="/cgu" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Conditions d'utilisation</a>
          <a href="/confidentialite" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Confidentialité</a>
        </div>
      </footer>

    </div>
  )
}
