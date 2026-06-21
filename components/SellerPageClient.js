'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import Logo from './Logo'
import BadgeList from './BadgeList'

const RATING_LABELS = { 1: 'Très décevant', 2: 'Décevant', 3: 'Correct', 4: 'Bien', 5: 'Excellent !' }

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{
            fontSize: 32, cursor: 'pointer', transition: 'transform 0.1s',
            color: n <= (hovered || value) ? '#f59e0b' : '#e2e8f0',
            transform: n <= (hovered || value) ? 'scale(1.15)' : 'scale(1)',
            userSelect: 'none',
          }}
        >★</span>
      ))}
    </div>
  )
}

export default function SellerPageClient() {
  const router = useRouter()
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  const [myReview, setMyReview] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUser(data.user)
    })
  }, [])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const res = await fetch(`/api/seller?id=${id}`)
      if (res.ok) {
        const d = await res.json()
        setProfile(d.profile)
        setListings(d.listings ?? [])
        setReviews(d.reviews ?? [])
        setAvgRating(d.avgRating ?? null)
        setReviewCount(d.reviewCount ?? 0)
      }
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!currentUser) return
    const existing = reviews.find(r => r.reviewer_id === currentUser.id)
    if (existing) setMyReview(existing)
  }, [currentUser, reviews])

  const refreshReviews = async () => {
    const res = await fetch(`/api/seller?id=${id}`)
    if (res.ok) {
      const d = await res.json()
      setReviews(d.reviews ?? [])
      setAvgRating(d.avgRating ?? null)
      setReviewCount(d.reviewCount ?? 0)
    }
  }

  const submitReview = async () => {
    setReviewError('')
    if (reviewRating === 0) { setReviewError('Choisis une note.'); return }
    if (reviewComment.trim().length > 0 && reviewComment.trim().length < 10) {
      setReviewError('Le commentaire doit faire au moins 10 caractères.')
      return
    }
    setSubmittingReview(true)
    try {
      if (myReview) {
        const { error } = await supabase.from('seller_reviews')
          .update({ rating: reviewRating, comment: reviewComment.trim() || null })
          .eq('id', myReview.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('seller_reviews').insert({
          seller_id: id,
          reviewer_id: currentUser.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        })
        if (error) throw error
      }
      await refreshReviews()
      setReviewSuccess(true)
      setShowReviewForm(false)
      setReviewComment('')
    } catch {
      setReviewError("Erreur lors de l'envoi. Réessaie.")
    } finally {
      setSubmittingReview(false)
    }
  }

  const openEditReview = () => {
    setReviewRating(myReview.rating)
    setReviewComment(myReview.comment || '')
    setReviewSuccess(false)
    setShowReviewForm(true)
  }

  const deleteReview = async () => {
    if (!myReview) return
    await supabase.from('seller_reviews').delete().eq('id', myReview.id)
    setMyReview(null)
    setReviewRating(0)
    setReviewComment('')
    await refreshReviews()
  }

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
          {currentUser ? (
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
          <span onClick={() => router.push(currentUser ? '/app' : '/')} style={{ cursor: 'pointer', color: '#00c9a7' }}>Accueil</span>
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
                {reviewCount > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ color: '#f59e0b', fontSize: 14 }}>{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a' }}>{avgRating}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>({reviewCount} avis)</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 4 }}>Aucun avis pour l'instant</div>
                )}
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
                </div>
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
                      display: 'flex', alignItems: 'center', gap: 16, cursor: listing.isbn ? 'pointer' : 'default',
                      transition: 'background 0.15s'
                    }}
                    onClick={() => { if (listing.isbn) router.push(`/book/${listing.isbn}`) }}
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

            {/* AVIS */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8edf2', padding: isMobile ? '20px' : '24px', marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1a2e4a' }}>Avis ({reviews.length})</h2>
                {currentUser && currentUser.id !== id && !showReviewForm && (
                  myReview ? (
                    <button onClick={openEditReview} style={{ fontSize: 12, fontWeight: 600, color: '#6c63ff', background: 'none', border: '1px solid #6c63ff', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
                      Modifier mon avis
                    </button>
                  ) : (
                    <button onClick={() => { setShowReviewForm(true); setReviewSuccess(false) }} style={{ fontSize: 12, fontWeight: 700, color: 'white', background: '#1a2e4a', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
                      + Laisser un avis
                    </button>
                  )
                )}
              </div>

              {reviewSuccess && (
                <div style={{ background: '#f0fdf9', border: '1px solid #a7f3d0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#065f46', fontWeight: 600 }}>
                  ✓ Ton avis a été publié. Merci !
                </div>
              )}

              {showReviewForm && (
                <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a2e4a', margin: '0 0 16px' }}>
                    {myReview ? 'Modifier ton avis' : `Ton avis sur ${displayName}`}
                  </h3>
                  <div style={{ marginBottom: 12 }}>
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                    {reviewRating > 0 && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginTop: 6 }}>{RATING_LABELS[reviewRating]}</div>
                    )}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    maxLength={300}
                    rows={3}
                    placeholder="Décris ton expérience avec ce vendeur (optionnel)..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6, color: '#1a2e4a' }}
                  />
                  <div style={{ textAlign: 'right', fontSize: 11, color: '#a0aec0', marginBottom: 12 }}>{reviewComment.length}/300</div>
                  {reviewError && <p style={{ fontSize: 12, color: '#e53e3e', margin: '0 0 10px' }}>{reviewError}</p>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={submitReview} disabled={submittingReview} style={{ padding: '10px 20px', background: submittingReview ? '#e2e8f0' : '#1a2e4a', color: submittingReview ? '#94a3b8' : 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: submittingReview ? 'default' : 'pointer' }}>
                      {submittingReview ? 'Envoi...' : myReview ? 'Mettre à jour' : 'Publier'}
                    </button>
                    <button onClick={() => { setShowReviewForm(false); setReviewError(''); setReviewRating(myReview?.rating || 0); setReviewComment(myReview?.comment || '') }} style={{ padding: '10px 16px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Annuler
                    </button>
                    {myReview && (
                      <button onClick={deleteReview} style={{ padding: '10px 16px', background: 'white', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              )}

              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#a0aec0', fontSize: 14 }}>
                  Aucun avis pour l'instant.{currentUser && currentUser.id !== id && ' Sois le premier !'}
                </div>
              ) : (
                <div>
                  {(showAllReviews ? reviews : reviews.slice(0, 3))
                    .filter(r => r.reviewer_id !== currentUser?.id).concat(reviews.filter(r => r.reviewer_id === currentUser?.id))
                    .map((r, i, arr) => (
                      <div key={r.id} style={{ padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          {r.profiles?.avatar_url
                            ? <img src={r.profiles.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                                {r.profiles?.first_name?.[0]?.toUpperCase() || '?'}
                              </div>
                          }
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a' }}>
                                {r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name?.[0] || ''}.` : 'Étudiant'}
                              </span>
                              {r.reviewer_id === currentUser?.id && <span style={{ fontSize: 10, background: '#f0fdf9', color: '#00c9a7', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>Toi</span>}
                            </div>
                            <div style={{ fontSize: 11, color: '#a0aec0' }}>{timeAgo(r.created_at)}</div>
                          </div>
                          <div style={{ color: '#f59e0b', fontSize: 15, flexShrink: 0 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                        </div>
                        {r.comment && <p style={{ fontSize: 13, color: '#4a5568', margin: '0 0 0 42px', lineHeight: 1.6 }}>{r.comment}</p>}
                      </div>
                    ))}
                  {reviews.length > 3 && (
                    <button onClick={() => setShowAllReviews(!showAllReviews)} style={{ background: 'none', border: 'none', color: '#6c63ff', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '10px 0 0', textAlign: 'left' }}>
                      {showAllReviews ? 'Voir moins ↑' : `Voir tous les avis (${reviews.length}) ↓`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
