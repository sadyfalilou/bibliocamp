'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'
import Carousel from '../components/Carousel'
import Footer from '../components/Footer'
import { BADGE_LABELS } from '../lib/tutorBadge'

export default function Landing() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [tutors, setTutors] = useState([])
  const [roommates, setRoommates] = useState([])
  const [searchBuy, setSearchBuy] = useState('')
  const [searchSell, setSearchSell] = useState('')
  const [searchTutor, setSearchTutor] = useState('')
  const [searchColoc, setSearchColoc] = useState('')
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
        setTutors(data.tutors ?? [])
        setRoommates(data.roommates ?? [])
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

  const handleTutorSearch = (e) => {
    e.preventDefault()
    router.push(`/login?redirect=/app&view=tuteurs&q=${encodeURIComponent(searchTutor)}`)
  }

  const handleColocSearch = (e) => {
    e.preventDefault()
    router.push(`/login?redirect=/app&view=colocs&q=${encodeURIComponent(searchColoc)}`)
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

  const coverGradients = [
    'linear-gradient(135deg,#1a2e4a,#0d4f6b)',
    'linear-gradient(135deg,#993c1d,#d85a30)',
    'linear-gradient(135deg,#534ab7,#7f77dd)',
    'linear-gradient(135deg,#0f6e56,#1d9e75)',
    'linear-gradient(135deg,#854f0b,#ef9f27)',
  ]

  const tutorColors = ['#1a2e4a', '#993c1d', '#0f6e56', '#534ab7', '#854f0b']

  const benefits = [
    { icon: '💸', title: 'Économise sur tes manuels', desc: "Jusqu'à 80% moins cher qu'en librairie" },
    { icon: '🎓', title: 'Trouve un tuteur', desc: "Des étudiants qui ont réussi avant toi, prêts à t'aider" },
    { icon: '🏠', title: 'Trouve un coloc', desc: 'Annonces de chambres et logements entre étudiants' },
    { icon: '⭐', title: 'Vendeurs notés', desc: 'Avis et notation pour acheter en toute confiance' },
    { icon: '📦', title: 'Vends tes anciens manuels', desc: 'Transforme tes livres en argent de poche' },
    { icon: '💬', title: 'Messagerie intégrée', desc: 'Contacte vendeurs, tuteurs et colocs directement' },
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
          .benefits-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
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
            La plateforme tout-en-un des{' '}
            <span style={{ color: '#00c9a7' }}>étudiants du Québec</span>
          </h1>

          <p className="hero-sub" style={{
            color: 'rgba(255,255,255,0.75)',
            margin: '0 0 36px', lineHeight: 1.6
          }}>
            Manuels, tuteurs et colocs — économise jusqu'à 80% et connecte-toi avec ta communauté étudiante.
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
                { key: 'tuteurs', label: '🎓 Tuteurs' },
                { key: 'colocs', label: '🏠 Colocs' },
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

            {activeTab === 'tuteurs' && (
              <form onSubmit={handleTutorSearch}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                  Matière, code de cours ou nom du tuteur
                </label>
                <div className="search-row" style={{ display: 'flex' }}>
                  <input
                    value={searchTutor}
                    onChange={e => setSearchTutor(e.target.value)}
                    placeholder="ex: BIO201, Calcul différentiel, Python..."
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
                    Trouver →
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'colocs' && (
              <form onSubmit={handleColocSearch}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                  Ville, secteur ou mot-clé
                </label>
                <div className="search-row" style={{ display: 'flex' }}>
                  <input
                    value={searchColoc}
                    onChange={e => setSearchColoc(e.target.value)}
                    placeholder="ex: Montréal, UQAM, 4 1/2..."
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
                    Chercher →
                  </button>
                </div>
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
      <section id="manuels" className="listings-section" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div
          onClick={() => router.push('/login')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 16 }}
        >
          <h2 className="section-title" style={{ fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
            Derniers manuels ajoutés
          </h2>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        <Carousel onSeeAll={() => router.push('/login')} seeAllImages={listings.slice(0, 3).map(l => l.image_url)}>
          {listings.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ flex: '0 0 170px', scrollSnapAlign: 'start' }}>
                <div style={{ background: '#f1f5f9', borderRadius: 12, height: 130, marginBottom: 8 }} />
                <div style={{ background: '#f1f5f9', borderRadius: 6, height: 12, width: '80%', marginBottom: 6 }} />
                <div style={{ background: '#f1f5f9', borderRadius: 6, height: 10, width: '50%' }} />
              </div>
            ))
            : listings.map((listing, idx) => (
              <div
                key={listing.id}
                onClick={() => router.push('/login')}
                style={{ flex: '0 0 170px', scrollSnapAlign: 'start', cursor: 'pointer' }}
              >
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 130, background: coverGradients[idx % coverGradients.length], marginBottom: 8 }}>
                  {listing.image_url && (
                    <img src={listing.image_url} alt={listing.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {!listing.image_url && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 30, opacity: 0.5 }}>📖</div>
                  )}
                  {listing.original_price && listing.original_price > listing.price && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'white', fontSize: 10, fontWeight: 700, color: '#1a2e4a', padding: '3px 8px', borderRadius: 20 }}>
                      -{Math.round(((listing.original_price - listing.price) / listing.original_price) * 100)}%
                    </div>
                  )}
                  <div
                    onClick={e => { e.stopPropagation(); router.push('/login') }}
                    style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2.3"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>
                  {listing.title}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
                  {listing.meet_campus ? 'Campus' : listing.post ? 'Envoi' : 'Ville'} · {listing.created_at ? timeAgo(listing.created_at) : ''}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a' }}>
                  {listing.price ? `${listing.price} $` : '—'}
                </div>
              </div>
            ))
          }
        </Carousel>
      </section>

      {/* ── TUTEURS DISPONIBLES ── */}
      {tutors.length > 0 && (
        <section id="tuteurs" className="listings-section" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div
            onClick={() => router.push('/login')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 16 }}
          >
            <h2 className="section-title" style={{ fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
              Tuteurs disponibles
            </h2>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <Carousel onSeeAll={() => router.push('/login')} seeAllImages={tutors.slice(0, 3).map(t => t.avatar_url)}>
            {tutors.map((t, idx) => {
              const name = `${t.first_name || ''} ${t.last_name?.[0] || ''}.`.trim()
              return (
                <div
                  key={t.id}
                  onClick={() => router.push('/login')}
                  style={{ flex: '0 0 170px', scrollSnapAlign: 'start', cursor: 'pointer' }}
                >
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 130, background: tutorColors[idx % tutorColors.length], marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {t.avatar_url
                      ? <img src={t.avatar_url} alt={name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 36, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{(t.first_name?.[0] || '?').toUpperCase()}</span>
                    }
                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'white', fontSize: 10, fontWeight: 700, color: '#00c9a7', padding: '3px 8px', borderRadius: 20 }}>
                      {t.rate_per_hour} $/h
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {name}
                    </div>
                    {t.response_badge && BADGE_LABELS[t.response_badge] && (
                      <span style={{ fontSize: 9, fontWeight: 700, background: BADGE_LABELS[t.response_badge].bg, color: BADGE_LABELS[t.response_badge].color, borderRadius: 20, padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {BADGE_LABELS[t.response_badge].label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {[t.institution || t.campus, t.subjects?.[0]].filter(Boolean).join(' · ')}
                  </div>
                </div>
              )
            })}
          </Carousel>
        </section>
      )}

      {/* ── ANNONCES COLOCS ── */}
      {roommates.length > 0 && (
        <section id="colocs" className="listings-section" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div
            onClick={() => router.push('/login')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 16 }}
          >
            <h2 className="section-title" style={{ fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
              Annonces colocs
            </h2>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <Carousel onSeeAll={() => router.push('/login')} seeAllImages={roommates.slice(0, 3).map(r => r.image_url)}>
            {roommates.map((r, idx) => (
              <div
                key={r.id}
                onClick={() => router.push('/login')}
                style={{ flex: '0 0 170px', scrollSnapAlign: 'start', cursor: 'pointer' }}
              >
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 130, background: coverGradients[idx % coverGradients.length], marginBottom: 8 }}>
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 30, opacity: 0.5 }}>🏠</div>
                  )}
                  {r.city && (
                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'white', fontSize: 10, fontWeight: 700, color: '#00a88a', padding: '3px 8px', borderRadius: 20 }}>
                      {r.city}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a' }}>
                  {r.rent_price} $/mois
                </div>
              </div>
            ))}
          </Carousel>
        </section>
      )}

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

      <Footer />

    </div>
  )
}
