'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Logo from '../../../components/Logo'
import BadgeList from '../../../components/BadgeList'

export default function SellerPage() {
  const router = useRouter()
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const res = await fetch(`/api/seller?id=${id}`)
      if (res.ok) {
        const d = await res.json()
        setProfile(d.profile)
        setListings(d.listings ?? [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} jours`
    return new Date(dateStr).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })
  }

  const displayName = profile
    ? (profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Étudiant BiblioCamp')
    : '...'

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
          <button onClick={() => router.push('/login')} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600,
            color: 'rgba(255,255,255,0.8)', cursor: 'pointer'
          }}>Se connecter</button>
          <button onClick={() => router.push('/app')} style={{
            background: '#00c9a7', border: 'none', borderRadius: 8,
            padding: '6px 14px', fontSize: 13, fontWeight: 700,
            color: 'white', cursor: 'pointer'
          }}>Marketplace</button>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '24px 16px' : '36px 24px' }}>

        {/* BREADCRUMB */}
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
          <span onClick={() => router.push('/')} style={{ cursor: 'pointer', color: '#00c9a7' }}>Accueil</span>
          {' / '}
          <span style={{ color: '#1a2e4a', fontWeight: 600 }}>{displayName}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
            Chargement...
          </div>
        ) : !profile ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            Vendeur introuvable.
          </div>
        ) : (
          <>
            {/* CARTE VENDEUR */}
            <div style={{
              background: 'white', borderRadius: 16, padding: isMobile ? '20px' : '28px',
              border: '1px solid #e8edf2', marginBottom: 24,
              display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap'
            }}>
              {/* Avatar */}
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName}
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid #00c9a7' }} />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #1a2e4a, #00c9a7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, color: 'white', fontWeight: 900,
                  border: '3px solid #00c9a7'
                }}>
                  {displayName[0]?.toUpperCase() || '?'}
                </div>
              )}

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, margin: '0 0 4px' }}>
                  {displayName}
                </h1>
                {profile.institution && (
                  <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
                    🏫 {profile.institution}{profile.campus ? ` · ${profile.campus}` : ''}
                  </div>
                )}
                {profile.program && (
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
                    📋 {profile.program}
                  </div>
                )}
                <BadgeList userId={id} mode="card" />

                {/* Stats rapides */}
                <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1a2e4a' }}>{listings.length}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>annonce{listings.length !== 1 ? 's' : ''}</div>
                  </div>
                  {listings.length > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#00c9a7' }}>
                        {Math.min(...listings.map(l => l.price))} $
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>à partir de</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bouton contacter */}
              <div style={{ flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
                <button
                  onClick={() => router.push('/login')}
                  style={{
                    background: '#1a2e4a', border: 'none', borderRadius: 10,
                    padding: '12px 24px', fontSize: 14, fontWeight: 700,
                    color: 'white', cursor: 'pointer', width: isMobile ? '100%' : 'auto',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#00c9a7'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1a2e4a'}
                >
                  Contacter ce vendeur →
                </button>
              </div>
            </div>

            {/* ANNONCES */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8edf2', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f4f8' }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                  {listings.length > 0
                    ? `${listings.length} manuel${listings.length > 1 ? 's' : ''} en vente`
                    : 'Aucun manuel en vente'}
                </h2>
              </div>

              {listings.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                  Ce vendeur n'a pas d'annonce active pour l'instant.
                </div>
              ) : (
                listings.map((listing, idx) => (
                  <div
                    key={listing.id}
                    style={{
                      padding: '16px 24px', borderTop: idx > 0 ? '1px solid #f0f4f8' : 'none',
                      display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onClick={() => listing.isbn ? router.push(`/book/${listing.isbn}`) : router.push('/login')}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    {/* Cover */}
                    {listing.image_url ? (
                      <img src={listing.image_url} alt={listing.title}
                        style={{ width: 44, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    ) : (
                      <div style={{ width: 44, height: 56, background: 'linear-gradient(135deg, #1a2e4a, #0d4f6b)', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📖</div>
                    )}

                    {/* Infos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e4a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.title}
                      </div>
                      {listing.authors && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{listing.authors}</div>}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {listing.description && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                            background: listing.description === 'Neuf' ? '#dcfce7' : listing.description === 'Très bon état' ? '#dbeafe' : '#f1f5f9',
                            color: listing.description === 'Neuf' ? '#16a34a' : listing.description === 'Très bon état' ? '#2563eb' : '#475569'
                          }}>
                            {listing.description}
                          </span>
                        )}
                        {listing.course_code && <span style={{ fontSize: 11, color: '#94a3b8' }}>{listing.course_code}</span>}
                        {listing.meet_campus && <span style={{ fontSize: 11, color: '#6c63ff', fontWeight: 600 }}>🏫</span>}
                        {listing.meet_city && <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>🏙️</span>}
                        {listing.post && <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>📦</span>}
                        <span style={{ fontSize: 11, color: '#cbd5e0' }}>{timeAgo(listing.created_at)}</span>
                      </div>
                    </div>

                    {/* Prix */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a' }}>{listing.price} $</div>
                      {listing.original_price && listing.original_price > listing.price && (
                        <div style={{ background: '#00c9a7', color: 'white', borderRadius: 20, padding: '2px 7px', fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                          -{Math.round(((listing.original_price - listing.price) / listing.original_price) * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
