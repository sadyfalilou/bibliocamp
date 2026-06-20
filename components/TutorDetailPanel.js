'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BADGE_LABELS } from '../lib/tutorBadge'

const DAYS = [
  { key: 'lundi',     label: 'Lun' },
  { key: 'mardi',    label: 'Mar' },
  { key: 'mercredi', label: 'Mer' },
  { key: 'jeudi',    label: 'Jeu' },
  { key: 'vendredi', label: 'Ven' },
  { key: 'samedi',   label: 'Sam' },
  { key: 'dimanche', label: 'Dim' },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  if (months > 0) return `il y a ${months} mois`
  if (weeks > 0) return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`
  return "aujourd'hui"
}

function Stars({ rating, count }) {
  if (!count) return <span style={{ fontSize: 13, color: '#a0aec0' }}>Aucun avis pour l'instant</span>
  const full = Math.round(rating)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#f59e0b', fontSize: 18 }}>{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <span style={{ fontWeight: 700, color: '#1a2e4a' }}>{rating}</span>
      <span style={{ color: '#64748b', fontSize: 13 }}>({count} avis)</span>
    </div>
  )
}

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

const RATING_LABELS = { 1: 'Très décevant', 2: 'Décevant', 3: 'Correct', 4: 'Bien', 5: 'Excellent !' }

export default function TutorDetailPanel({ tutorId, currentUser, onClose, router }) {
  const [tutor, setTutor]         = useState(null)
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [isOwn, setIsOwn]         = useState(false)
  const [contacting, setContacting] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)

  const [myReview, setMyReview]       = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating]     = useState(0)
  const [reviewComment, setReviewComment]   = useState('')
  const [reviewError, setReviewError]       = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess]   = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: tutorData, error } = await supabase
        .from('tutors_with_rating').select('*').eq('id', tutorId).single()
      if (error || !tutorData) { onClose(); return }
      if (!tutorData.is_active && currentUser?.id !== tutorData.user_id) { onClose(); return }
      setTutor(tutorData)
      setIsOwn(currentUser?.id === tutorData.user_id)

      fetch(`/api/tutors/badges?ids=${tutorData.user_id}`)
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (json) setTutor(prev => prev ? { ...prev, response_badge: json.badges[tutorData.user_id] ?? null } : prev)
        })
        .catch(() => {})

      if (currentUser?.id !== tutorData.user_id) {
        supabase.rpc('increment_tutor_views', { tutor_id: tutorId }).then(() => {})
      }

      const { data: reviewsData } = await supabase
        .from('tutor_reviews')
        .select('*, profiles(first_name, last_name, avatar_url)')
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false })
      setReviews(reviewsData || [])

      if (currentUser) {
        const existing = (reviewsData || []).find(r => r.reviewer_id === currentUser.id)
        if (existing) setMyReview(existing)
      }

      setLoading(false)
    }
    load()
  }, [tutorId])

  const handleContact = async () => {
    if (!currentUser) { router.push('/login'); return }
    if (isOwn) return
    setContacting(true)
    try {
      // Cherche une conversation tuteur existante (filtrée par tutor_id, pas seulement la paire d'users —
      // les deux users peuvent aussi avoir une conversation manuel séparée).
      const { data: existing } = await supabase
        .from('conversations').select('id')
        .eq('tutor_id', tutor.id)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .maybeSingle()

      let convId = existing?.id
      if (!convId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ user1_id: currentUser.id, user2_id: tutor.user_id, context_type: 'tuteur', tutor_id: tutor.id })
          .select('id').single()
        convId = newConv?.id
      }
      router.push(`/inbox?conv=${convId}`)
    } catch { setContacting(false) }
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
        const { error } = await supabase.from('tutor_reviews')
          .update({ rating: reviewRating, comment: reviewComment.trim() || null })
          .eq('id', myReview.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tutor_reviews').insert({
          tutor_id: tutorId,
          reviewer_id: currentUser.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        })
        if (error) throw error
      }

      const { data: refreshed } = await supabase
        .from('tutor_reviews')
        .select('*, profiles(first_name, last_name, avatar_url)')
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false })
      setReviews(refreshed || [])
      const newMine = (refreshed || []).find(r => r.reviewer_id === currentUser.id)
      setMyReview(newMine || null)

      const { data: refreshedTutor } = await supabase
        .from('tutors_with_rating').select('avg_rating, review_count').eq('id', tutorId).single()
      if (refreshedTutor) setTutor(prev => ({ ...prev, ...refreshedTutor }))

      setReviewSuccess(true)
      setShowReviewForm(false)
      setReviewComment('')
    } catch {
      setReviewError('Erreur lors de l\'envoi. Réessaie.')
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
    await supabase.from('tutor_reviews').delete().eq('id', myReview.id)
    setMyReview(null)
    setReviews(prev => prev.filter(r => r.id !== myReview.id))
    setReviewRating(0)
    setReviewComment('')
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />

      {/* Panneau */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 500, maxWidth: '100vw', height: '100vh',
        background: '#f5f7fa', zIndex: 201,
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Segoe UI', sans-serif", overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', background: 'white', flexShrink: 0, position: 'sticky', top: 0, zIndex: 1 }}>
          <div style={{ fontSize: 12, color: '#a0aec0' }}>Tuteurs / <strong style={{ color: '#1a2e4a' }}>Profil</strong></div>
          <button onClick={onClose} style={{ background: '#f0f4f8', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#718096' }}>×</button>
        </div>

        {loading || !tutor ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>Chargement...</div>
        ) : (() => {
          const name = `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim()
          const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)
          return (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Carte principale */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', height: 72 }} />
                <div style={{ padding: '0 24px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ position: 'relative', marginTop: -34 }}>
                      {tutor.avatar_url
                        ? <img src={tutor.avatar_url} alt={name} style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }} />
                        : <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg,#00c9a7,#0099ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: 'white', fontWeight: 700, border: '3px solid white' }}>
                            {(tutor.first_name?.[0] || '?').toUpperCase()}
                          </div>
                      }
                      {tutor.is_verified && (
                        <div style={{ position: 'absolute', bottom: 2, right: 2, background: '#00c9a7', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, border: '2px solid white', color: 'white', fontWeight: 700 }}>✓</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', paddingTop: 12 }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#00c9a7' }}>{tutor.rate_per_hour} $</div>
                      <div style={{ fontSize: 12, color: '#a0aec0' }}>par heure</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a', margin: 0 }}>{name}</h1>
                    {tutor.is_pro && <span style={{ fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', color: 'white', borderRadius: 8, padding: '3px 9px' }}>PRO</span>}
                    {tutor.is_verified && <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf9', color: '#00c9a7', borderRadius: 8, padding: '3px 9px', border: '1px solid #a7f3d0' }}>Vérifié</span>}
                    {tutor.response_badge && BADGE_LABELS[tutor.response_badge] && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: BADGE_LABELS[tutor.response_badge].bg, color: BADGE_LABELS[tutor.response_badge].color, borderRadius: 8, padding: '3px 9px' }}>
                        {BADGE_LABELS[tutor.response_badge].label}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
                    {[tutor.domains?.join(' · '), tutor.institution || tutor.campus].filter(Boolean).join(' — ')}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <Stars rating={tutor.avg_rating} count={tutor.review_count} />
                  </div>

                  {!isOwn ? (
                    <button onClick={handleContact} disabled={contacting} style={{ width: '100%', padding: '13px', background: contacting ? '#e2e8f0' : 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', color: contacting ? '#94a3b8' : 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: contacting ? 'default' : 'pointer' }}>
                      {contacting ? 'Redirection...' : `💬 Contacter ${tutor.first_name}`}
                    </button>
                  ) : (
                    <button onClick={() => router.push('/tuteurs/modifier')} style={{ width: '100%', padding: '13px', background: 'none', color: '#6c63ff', border: '2px solid #6c63ff', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                      Modifier mon profil tuteur
                    </button>
                  )}
                </div>
              </div>

              {/* À propos */}
              {tutor.bio && (
                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>À propos</h2>
                  <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.7, margin: 0 }}>{tutor.bio}</p>
                </div>
              )}

              {/* Matières */}
              {tutor.subjects?.length > 0 && (
                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Matières enseignées</h2>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {tutor.subjects.map(s => (
                      <span key={s} style={{ fontSize: 13, fontWeight: 600, background: '#f0f9ff', color: '#0369a1', borderRadius: 8, padding: '6px 12px', border: '1px solid #bae6fd' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Modes + Dispo */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', flex: 1, minWidth: 200 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 14px' }}>Modes de rencontre</h2>
                  {[
                    { icon: '🏫', label: 'Sur campus', active: tutor.meet_campus },
                    { icon: '💻', label: 'En ligne', active: tutor.meet_online },
                    { icon: '🏙️', label: 'En ville', active: tutor.meet_city },
                  ].map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>{m.icon}</span>
                      <span style={{ fontSize: 13, color: m.active ? '#1a2e4a' : '#cbd5e0', fontWeight: m.active ? 600 : 400, textDecoration: m.active ? 'none' : 'line-through' }}>{m.label}</span>
                      {m.active && <span style={{ marginLeft: 'auto', color: '#00c9a7', fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                  ))}
                </div>

                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', flex: 1, minWidth: 200 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 14px' }}>Disponibilités</h2>
                  {DAYS.map(({ key, label }) => {
                    const slots = tutor.availabilities?.[key] || []
                    if (slots.length === 0) return null
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1a2e4a', width: 32 }}>{label}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {slots.includes('matin') && <span style={{ fontSize: 11, background: '#fef3c7', color: '#d97706', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>Matin</span>}
                          {slots.includes('après-midi') && <span style={{ fontSize: 11, background: '#f0f9ff', color: '#0369a1', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>Après-midi</span>}
                          {slots.includes('soir') && <span style={{ fontSize: 11, background: '#ede9fe', color: '#7c3aed', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>Soir</span>}
                        </div>
                      </div>
                    )
                  })}
                  {!DAYS.some(({ key }) => (tutor.availabilities?.[key] || []).length > 0) && (
                    <span style={{ fontSize: 13, color: '#a0aec0' }}>Contacte le tuteur pour ses dispo</span>
                  )}
                </div>
              </div>

              {/* Langues */}
              {tutor.languages?.length > 0 && (
                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Langues</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {tutor.languages.map(l => (
                      <span key={l} style={{ fontSize: 13, fontWeight: 600, background: '#f8fafc', color: '#1a2e4a', borderRadius: 8, padding: '4px 12px', border: '1px solid #e2e8f0' }}>{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* AVIS */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
                    Avis ({reviews.length})
                  </h2>
                  {currentUser && !isOwn && !showReviewForm && (
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
                  <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a2e4a', margin: '0 0 16px' }}>
                      {myReview ? 'Modifier ton avis' : `Ton avis sur ${tutor.first_name}`}
                    </h3>

                    <div style={{ marginBottom: 12 }}>
                      <StarPicker value={reviewRating} onChange={setReviewRating} />
                      {reviewRating > 0 && (
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginTop: 6 }}>
                          {RATING_LABELS[reviewRating]}
                        </div>
                      )}
                    </div>

                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      maxLength={300}
                      rows={3}
                      placeholder="Décris ton expérience avec ce tuteur (optionnel)..."
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6, color: '#1a2e4a' }}
                      onFocus={e => e.target.style.borderColor = '#00c9a7'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
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

                {myReview && !showReviewForm && (
                  <div style={{ background: '#f0fdf9', borderRadius: 10, border: '1px solid #a7f3d0', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#065f46', marginBottom: 2 }}>Ton avis</div>
                      <div style={{ color: '#f59e0b' }}>{'★'.repeat(myReview.rating)}{'☆'.repeat(5 - myReview.rating)}</div>
                      {myReview.comment && <p style={{ fontSize: 13, color: '#4a5568', margin: '4px 0 0' }}>{myReview.comment}</p>}
                    </div>
                    <button onClick={openEditReview} style={{ fontSize: 12, color: '#00c9a7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>Modifier</button>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#a0aec0', fontSize: 14 }}>
                    Aucun avis pour l'instant.{!isOwn && currentUser && ' Sois le premier !'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {displayedReviews.filter(r => r.reviewer_id !== currentUser?.id).concat(displayedReviews.filter(r => r.reviewer_id === currentUser?.id)).map((r, i, arr) => (
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

              {/* Sécurité */}
              <div style={{ background: '#fafbff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 24px' }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Conseils de sécurité</h2>
                {[
                  'Rencontrez-vous dans un lieu public (bibliothèque, café, campus)',
                  'Discutez du tarif et du contenu avant la session',
                  "Payez en personne — jamais à l'avance en ligne",
                  'Signalez tout comportement suspect',
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#4a5568' }}>
                    <span style={{ color: '#00c9a7', flexShrink: 0 }}>💡</span><span>{tip}</span>
                  </div>
                ))}
              </div>

            </div>
          )
        })()}
      </div>
    </>
  )
}
