'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Logo from './Logo'
import Footer from './Footer'

export default function BookPageClient() {
  const router = useRouter()
  const { isbn } = useParams()
  const [book, setBook] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [userId, setUserId] = useState(null)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [sellerProfiles, setSellerProfiles] = useState({})
  const [tutors, setTutors] = useState([])
  const [tutorsLoading, setTutorsLoading] = useState(false)
  const [tutorsCourseMatch, setTutorsCourseMatch] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) return
      setUserId(data.user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_verified')
        .eq('id', data.user.id)
        .single()
      if (profile?.phone_verified) setPhoneVerified(true)
    })
  }, [])

  const handleContactSeller = async (e, listing) => {
    if (e) e.stopPropagation()
    if (!userId) { router.push('/login'); return }
    if (!phoneVerified) { router.push('/app?verify=1'); return }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ listing_id: listing.id, seller_id: listing.user_id })
      })
      const d = await res.json()
      if (d.conversation_id) {
        router.push(`/inbox?conv=${d.conversation_id}`)
      } else {
        router.push('/inbox')
      }
    } catch {
      router.push('/inbox')
    }
  }

  const handleSell = () => {
    const params = new URLSearchParams({ isbn })
    if (displayTitle && displayTitle !== 'Titre inconnu') params.set('title', displayTitle)
    if (displayAuthors) params.set('authors', displayAuthors)
    if (displayCover) params.set('cover', displayCover)
    if (!userId) { router.push(`/login?redirect=/create&${params.toString()}`); return }
    if (!phoneVerified) { router.push('/app?verify=1'); return }
    router.push(`/create?${params.toString()}`)
  }

  useEffect(() => {
    if (!isbn) return
    const load = async () => {
      setLoading(true)
      const [bookRes, listingsRes] = await Promise.all([
        fetch(`/api/isbn?isbn=${isbn}`),
        fetch(`/api/book?isbn=${isbn}`)
      ])
      if (bookRes.ok) {
        const d = await bookRes.json()
        if (d.found) setBook(d.book)
      }
      if (listingsRes.ok) {
        const d = await listingsRes.json()
        const ls = d.listings ?? []
        setListings(ls)
        // Charger les profils des vendeurs
        const userIds = [...new Set(ls.map(l => l.user_id).filter(Boolean))]
        if (userIds.length > 0) {
          const profiles = {}
          await Promise.all(userIds.map(async uid => {
            const r = await fetch(`/api/seller?id=${uid}`)
            if (r.ok) {
              const sd = await r.json()
              if (sd.profile) profiles[uid] = sd.profile
            }
          }))
          setSellerProfiles(profiles)
        }
      }
      setLoading(false)

      // Charger les tuteurs liés au cours
      setTutorsLoading(true)
      try {
        const courseCode = ls[0]?.course_code || null
        if (courseCode) {
          const { data: tutorData } = await supabase
            .from('tutors_with_rating')
            .select('*')
            .eq('is_active', true)
            .contains('subjects', [courseCode])
            .order('avg_rating', { ascending: false })
            .limit(4)
          setTutors(tutorData ?? [])
          if ((tutorData ?? []).length > 0) setTutorsCourseMatch(true)
        } else {
          // Pas de code de cours — charger quelques tuteurs actifs bien notés
          const { data: tutorData } = await supabase
            .from('tutors_with_rating')
            .select('*')
            .eq('is_active', true)
            .order('avg_rating', { ascending: false })
            .limit(4)
          setTutors(tutorData ?? [])
        }
      } catch (e) { /* silencieux */ }
      setTutorsLoading(false)
    }
    load()
  }, [isbn])

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} jours`
    return new Date(dateStr).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })
  }

  const cheapest = listings.length > 0 ? Math.min(...listings.map(l => l.price)) : null

  // Fallback sur les données de la première annonce si Google Books n'a rien retourné
  const displayTitle = book?.title || listings[0]?.title || 'Titre inconnu'
  const displayAuthors = book?.authors || listings[0]?.authors || null
  const displayCover = book?.cover || listings[0]?.image_url || null
  const displayPublisher = book?.publisher || null

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f8fafc', color: '#1a2e4a' }}>

      {/* HEADER */}
      <header style={{
        background: '#1a2e4a', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <Logo variant="light" size="sm" onClick={() => router.push('/')} style={{ cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: 10 }}>
          {userId ? (
            <button onClick={() => router.push('/app')} style={{
              background: '#00c9a7', border: 'none', borderRadius: 8,
              padding: '6px 14px', fontSize: 13, fontWeight: 700,
              color: 'white', cursor: 'pointer'
            }}>← Accueil</button>
          ) : (
            <>
              <button onClick={() => router.push('/login')} style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.8)', cursor: 'pointer'
              }}>Se connecter</button>
              <button onClick={() => router.push('/login?tab=signup')} style={{
                background: '#00c9a7', border: 'none', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 700,
                color: 'white', cursor: 'pointer'
              }}>Rejoindre</button>
            </>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '24px 16px' : '36px 24px' }}>

        {/* BREADCRUMB */}
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
          <span onClick={() => router.push(userId ? '/app' : '/')} style={{ cursor: 'pointer', color: '#00c9a7' }}>Accueil</span>
          {' / '}
          <span onClick={() => router.push('/app')} style={{ cursor: 'pointer', color: '#00c9a7' }}>Manuels</span>
          {' / '}
          <span style={{ color: '#1a2e4a', fontWeight: 600 }}>
            {loading ? isbn : (displayTitle !== 'Titre inconnu' ? displayTitle : isbn)}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
            Chargement...
          </div>
        ) : (
          <>
            {/* INFOS DU LIVRE */}
            <div style={{
              background: 'white', borderRadius: 16, padding: isMobile ? '20px' : '28px',
              border: '1px solid #e8edf2', marginBottom: 24,
              display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}>
              {/* Couverture */}
              <div style={{ flexShrink: 0 }}>
                {displayCover
                  ? <img src={displayCover} alt={displayTitle} style={{ width: isMobile ? 90 : 120, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }} />
                  : <div style={{
                      width: isMobile ? 90 : 120, height: isMobile ? 115 : 150,
                      background: 'linear-gradient(135deg, #1a2e4a, #0d4f6b)',
                      borderRadius: 8, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 48
                    }}>📖</div>
                }
              </div>

              {/* Détails */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Manuel universitaire
                </div>
                <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, margin: '0 0 8px', lineHeight: 1.2 }}>
                  {displayTitle}
                </h1>
                {displayAuthors && (
                  <div style={{ fontSize: 15, color: '#1a2e4a', fontWeight: 600, marginBottom: 6 }}>
                    {displayAuthors}
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                  ISBN : <span style={{ fontWeight: 600, color: '#1a2e4a' }}>{isbn}</span>
                </div>
                {displayPublisher && (
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                    Éditeur : {displayPublisher}{book?.publishedDate ? ` (${book.publishedDate.slice(0, 4)})` : ''}
                  </div>
                )}

                {/* Boutons */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleSell}
                    style={{
                      background: '#1a2e4a', border: 'none', borderRadius: 9,
                      padding: '10px 20px', fontSize: 14, fontWeight: 700,
                      color: 'white', cursor: 'pointer', transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#00c9a7'}
                    onMouseLeave={e => e.currentTarget.style.background = '#1a2e4a'}
                  >
                    💰 Vendre mon exemplaire
                  </button>
                </div>
              </div>
            </div>

            {/* VENDEURS */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8edf2', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f4f8' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  Acheter d'occasion chez {listings.length} vendeur{listings.length !== 1 ? 's' : ''}
                </h2>
              </div>

              {listings.length === 0 ? (
                <div style={{
                  padding: '48px 24px', textAlign: 'center',
                  background: 'linear-gradient(135deg, #f0f4ff, #f0fdf9)'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>
                    Aucun exemplaire disponible pour l'instant
                  </h3>
                  <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>
                    Tu as ce manuel ? Sois le premier à le vendre !
                  </p>
                  <button
                    onClick={handleSell}
                    style={{
                      background: '#00c9a7', border: 'none', borderRadius: 10,
                      padding: '12px 28px', fontSize: 15, fontWeight: 800,
                      color: 'white', cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(0,201,167,0.35)'
                    }}
                  >
                    💰 Vendre mon exemplaire
                  </button>
                </div>
              ) : (
                listings.map((listing, idx) => (
                  <div
                    key={listing.id}
                    style={{
                      padding: '18px 24px',
                      borderTop: idx > 0 ? '1px solid #f0f4f8' : 'none',
                      display: 'flex', alignItems: 'center', gap: 16,
                      transition: 'background 0.15s',
                      cursor: 'default'
                    }}
                  >
                    {/* Vendeur : avatar + infos + prix */}
                    {(() => {
                      const prof = sellerProfiles[listing.user_id]
                      const name = prof?.first_name ? `${prof.first_name} ${prof.last_name || ''}`.trim() : 'Étudiant BiblioCamp'
                      const campus = listing.campus || prof?.campus || prof?.institution
                      return (
                        <>
                          {/* Avatar */}
                          <div style={{ flexShrink: 0 }}>
                            {prof?.avatar_url ? (
                              <img src={prof.avatar_url} alt={name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid #00c9a7' }} />
                            ) : (
                              <div style={{
                                width: 42, height: 42, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1a2e4a, #00c9a7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 18, color: 'white', fontWeight: 800
                              }}>
                                {name[0].toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Infos */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                              {listing.user_id === userId ? (
                                <span style={{ color: '#1a2e4a' }}>{name}</span>
                              ) : (
                                <span
                                  onClick={() => router.push(`/seller/${listing.user_id}`)}
                                  style={{ cursor: 'pointer', color: '#1a2e4a' }}
                                  onMouseEnter={e => e.currentTarget.style.color = '#00c9a7'}
                                  onMouseLeave={e => e.currentTarget.style.color = '#1a2e4a'}
                                >
                                  {name}
                                </span>
                              )}
                              {campus && <span style={{ color: '#64748b', fontWeight: 500 }}> · {campus}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              {listing.description && (
                                <span style={{
                                  fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                                  background: listing.description === 'Neuf' ? '#dcfce7' : listing.description === 'Très bon état' ? '#dbeafe' : '#f1f5f9',
                                  color: listing.description === 'Neuf' ? '#16a34a' : listing.description === 'Très bon état' ? '#2563eb' : '#475569'
                                }}>
                                  {listing.description}
                                </span>
                              )}
                              {listing.meet_campus && <span style={{ fontSize: 12, color: '#6c63ff', fontWeight: 600 }}>🏫 Campus</span>}
                              {listing.meet_city && <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>🏙️ Ville</span>}
                              {listing.post && <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>📦 Envoi</span>}
                              <span style={{ fontSize: 11, color: '#cbd5e0' }}>{timeAgo(listing.created_at)}</span>
                            </div>
                          </div>

                          {/* Prix */}
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#1a2e4a' }}>{listing.price} $</div>
                            {listing.original_price && listing.original_price > listing.price && (
                              <div style={{
                                background: '#00c9a7', color: 'white',
                                borderRadius: 20, padding: '2px 8px',
                                fontSize: 11, fontWeight: 700, marginTop: 2
                              }}>
                                Save {Math.round(((listing.original_price - listing.price) / listing.original_price) * 100)}%
                              </div>
                            )}
                            {listing.user_id === userId ? (
                              <div
                                style={{
                                  marginTop: 8, background: '#f0fdf9', border: '1px solid #00c9a7',
                                  borderRadius: 7, padding: '6px 14px', fontSize: 12,
                                  fontWeight: 700, color: '#00c9a7', textAlign: 'center',
                                  cursor: 'default'
                                }}>
                                Ton annonce
                              </div>
                            ) : (
                              <button
                                onClick={(e) => handleContactSeller(e, listing)}
                                style={{
                                  marginTop: 8, background: '#1a2e4a', border: 'none',
                                  borderRadius: 7, padding: '6px 14px', fontSize: 12,
                                  fontWeight: 700, color: 'white', cursor: 'pointer'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#00c9a7'}
                                onMouseLeave={e => e.currentTarget.style.background = '#1a2e4a'}
                              >
                                Contacter →
                              </button>
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ))
              )}
            </div>

            {/* TUTEURS DISPONIBLES */}
            {(tutorsLoading || tutors.length > 0) && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8edf2', overflow: 'hidden', marginTop: 24 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a2e4a' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c9a7" strokeWidth="2.5" style={{ verticalAlign: 'middle', marginRight: 8 }}>
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                      {tutorsCourseMatch ? 'Tuteurs disponibles pour ce cours' : 'Besoin d\'aide pour ce manuel ?'}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                      {tutorsCourseMatch ? 'Des étudiants peuvent t\'aider à comprendre ce manuel' : 'Trouve un tuteur et maîtrise la matière rapidement'}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/tuteurs')}
                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Voir tous →
                  </button>
                </div>

                {tutorsLoading ? (
                  <div style={{ padding: '20px 24px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ flex: '1 1 200px', minWidth: 180, background: '#f8fafc', borderRadius: 12, padding: '16px', height: 90, animation: 'pulse 1.5s infinite' }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {tutors.map(t => {
                      const name = `${t.first_name || ''} ${(t.last_name || '')[0] || ''}.`.trim()
                      const stars = t.avg_rating ? '★'.repeat(Math.round(t.avg_rating)) + '☆'.repeat(5 - Math.round(t.avg_rating)) : null
                      const meetModes = [t.meet_campus && 'Campus', t.meet_online && 'En ligne', t.meet_city && 'Ville'].filter(Boolean).join(' · ')
                      return (
                        <div
                          key={t.id}
                          onClick={() => router.push(`/tuteurs/${t.id}`)}
                          style={{ border: '1px solid #e8edf2', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', background: '#fafcff' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,201,167,0.15)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8edf2'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            {t.avatar_url ? (
                              <img src={t.avatar_url} alt={name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2e4a,#00c9a7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'white', fontWeight: 800 }}>
                                {(t.first_name || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.campus || t.institution || ''}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              {stars && (
                                <div style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 1 }}>
                                  {stars} <span style={{ color: '#64748b', fontWeight: 600 }}>{t.avg_rating}</span>
                                  {t.review_count > 0 && <span style={{ color: '#94a3b8' }}> ({t.review_count})</span>}
                                </div>
                              )}
                              {meetModes && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{meetModes}</div>}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#00c9a7', whiteSpace: 'nowrap' }}>{t.rate_per_hour} $/h</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div style={{ padding: '12px 24px', borderTop: '1px solid #f0f4f8', background: '#fafcff', textAlign: 'center' }}>
                  <button
                    onClick={() => router.push('/tuteurs')}
                    style={{ background: '#1a2e4a', border: 'none', borderRadius: 9, padding: '10px 24px', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#00c9a7'}
                    onMouseLeave={e => e.currentTarget.style.background = '#1a2e4a'}
                  >
                    Explorer tous les tuteurs →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
