'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Logo from '../../../components/Logo'

const DAYS = [
  { key: 'lundi', label: 'Lun' },
  { key: 'mardi', label: 'Mar' },
  { key: 'mercredi', label: 'Mer' },
  { key: 'jeudi', label: 'Jeu' },
  { key: 'vendredi', label: 'Ven' },
  { key: 'samedi', label: 'Sam' },
  { key: 'dimanche', label: 'Dim' },
]

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

export default function TuteurProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [tutor, setTutor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOwn, setIsOwn] = useState(false)
  const [contacting, setContacting] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: tutorData, error } = await supabase
        .from('tutors_with_rating')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !tutorData) { router.push('/tuteurs'); return }
      setTutor(tutorData)
      setIsOwn(user?.id === tutorData.user_id)

      // Incrémenter les vues
      if (user?.id !== tutorData.user_id) {
        await supabase.from('tutors').update({ views_count: (tutorData.views_count || 0) + 1 }).eq('id', id)
      }

      // Charger les avis
      const { data: reviewsData } = await supabase
        .from('tutor_reviews')
        .select('*, profiles(first_name, last_name, avatar_url)')
        .eq('tutor_id', id)
        .order('created_at', { ascending: false })

      setReviews(reviewsData || [])
      setLoading(false)
    }
    load()
  }, [id])

  const handleContact = async () => {
    if (!user) { router.push('/login'); return }
    if (isOwn) return
    setContacting(true)
    try {
      // Chercher une conversation existante
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${tutor.user_id}),and(user1_id.eq.${tutor.user_id},user2_id.eq.${user.id})`)
        .single()

      let convId = existing?.id
      if (!convId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ user1_id: user.id, user2_id: tutor.user_id })
          .select('id')
          .single()
        convId = newConv?.id
      }
      router.push(`/inbox?conv=${convId}`)
    } catch {
      setContacting(false)
    }
  }

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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#64748b' }}>
      Chargement...
    </div>
  )

  if (!tutor) return null

  const name = `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim()
  const modes = [
    tutor.meet_campus && { icon: '🏫', label: 'Sur campus' },
    tutor.meet_online && { icon: '💻', label: 'En ligne (Zoom/Teams)' },
    tutor.meet_city   && { icon: '🏙️', label: 'En ville' },
  ].filter(Boolean)

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa', colorScheme: 'light' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 16 }}>
          <button onClick={() => router.push('/tuteurs')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 4 }}>← Tuteurs</button>
          <div style={{ flex: 1 }} />
          <Logo variant="dark" size="sm" />
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Carte principale */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* Bandeau top */}
          <div style={{ background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', height: 80 }} />

          <div style={{ padding: '0 24px 24px' }}>
            {/* Photo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -36, marginBottom: 12 }}>
              <div style={{ position: 'relative' }}>
                {tutor.avatar_url
                  ? <img src={tutor.avatar_url} alt={name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid white' }} />
                  : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#00c9a7,#0099ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'white', fontWeight: 700, border: '3px solid white' }}>
                      {(tutor.first_name?.[0] || '?').toUpperCase()}
                    </div>
                }
                {tutor.is_verified && (
                  <div style={{ position: 'absolute', bottom: 2, right: 2, background: '#00c9a7', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, border: '2px solid white', color: 'white', fontWeight: 700 }}>✓</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#00c9a7' }}>{tutor.rate_per_hour} $</div>
                <div style={{ fontSize: 12, color: '#a0aec0' }}>par heure</div>
              </div>
            </div>

            {/* Nom & badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a2e4a', margin: 0 }}>{name}</h1>
              {tutor.is_pro && (
                <span style={{ fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', color: 'white', borderRadius: 8, padding: '3px 9px' }}>PRO</span>
              )}
              {tutor.is_verified && (
                <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf9', color: '#00c9a7', borderRadius: 8, padding: '3px 9px', border: '1px solid #a7f3d0' }}>Tuteur vérifié</span>
              )}
            </div>

            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
              {[tutor.domains?.join(' · '), tutor.institution || tutor.campus].filter(Boolean).join(' — ')}
            </div>

            <div style={{ marginBottom: 16 }}>
              <Stars rating={tutor.avg_rating} count={tutor.review_count} />
            </div>

            {/* Boutons */}
            {!isOwn ? (
              <button
                onClick={handleContact}
                disabled={contacting}
                style={{ width: '100%', padding: '14px', background: contacting ? '#e2e8f0' : 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', color: contacting ? '#94a3b8' : 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: contacting ? 'default' : 'pointer' }}
              >
                {contacting ? 'Redirection...' : `💬 Contacter ${tutor.first_name}`}
              </button>
            ) : (
              <button
                onClick={() => router.push('/tuteurs/modifier')}
                style={{ width: '100%', padding: '14px', background: 'none', color: '#6c63ff', border: '2px solid #6c63ff', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
              >
                Modifier mon profil tuteur
              </button>
            )}
          </div>
        </div>

        {/* À propos */}
        {tutor.bio && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>À propos</h2>
            <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.7, margin: 0 }}>{tutor.bio}</p>
          </div>
        )}

        {/* Matières */}
        {tutor.subjects?.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Matières enseignées</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tutor.subjects.map(s => (
                <span key={s} style={{ fontSize: 13, fontWeight: 600, background: '#f0f9ff', color: '#0369a1', borderRadius: 8, padding: '6px 12px', border: '1px solid #bae6fd' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Modes + Disponibilités en flex */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

          {/* Modes de rencontre */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', flex: 1, minWidth: 220 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Modes de rencontre</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'campus', icon: '🏫', label: 'Sur campus', active: tutor.meet_campus },
                { key: 'online', icon: '💻', label: 'En ligne (Zoom/Teams)', active: tutor.meet_online },
                { key: 'city',   icon: '🏙️', label: 'En ville', active: tutor.meet_city },
              ].map(m => (
                <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <span style={{ fontSize: 14, color: m.active ? '#1a2e4a' : '#cbd5e0', fontWeight: m.active ? 600 : 400, textDecoration: m.active ? 'none' : 'line-through' }}>{m.label}</span>
                  {m.active && <span style={{ marginLeft: 'auto', color: '#00c9a7', fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Disponibilités */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', flex: 1, minWidth: 220 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Disponibilités</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAYS.map(({ key, label }) => {
                const slots = tutor.availabilities?.[key] || []
                const hasMatin = slots.includes('matin')
                const hasSoir = slots.includes('soir')
                if (!hasMatin && !hasSoir) return null
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a', width: 36 }}>{label}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {hasMatin && <span style={{ fontSize: 11, background: '#fef3c7', color: '#d97706', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>Matin</span>}
                      {hasSoir  && <span style={{ fontSize: 11, background: '#ede9fe', color: '#7c3aed', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>Soir</span>}
                    </div>
                  </div>
                )
              })}
              {!DAYS.some(({ key }) => tutor.availabilities?.[key]?.length > 0) && (
                <span style={{ fontSize: 13, color: '#a0aec0' }}>Non précisées — contacte le tuteur</span>
              )}
            </div>
          </div>
        </div>

        {/* Langues */}
        {tutor.languages?.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Langues</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {tutor.languages.map(l => (
                <span key={l} style={{ fontSize: 13, fontWeight: 600, background: '#f8fafc', color: '#1a2e4a', borderRadius: 8, padding: '4px 12px', border: '1px solid #e2e8f0' }}>{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* Avis */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>
            Avis ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#a0aec0', fontSize: 14 }}>
              Aucun avis pour l'instant. Sois le premier à laisser un avis !
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayedReviews.map(r => (
                <div key={r.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {r.profiles?.avatar_url
                      ? <img src={r.profiles.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                          {r.profiles?.first_name?.[0]?.toUpperCase() || '?'}
                        </div>
                    }
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a' }}>
                        {r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name?.[0] || ''}.` : 'Étudiant'}
                      </div>
                      <div style={{ fontSize: 11, color: '#a0aec0' }}>{timeAgo(r.created_at)}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  </div>
                  {r.comment && <p style={{ fontSize: 13, color: '#4a5568', margin: 0, lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
              ))}
              {reviews.length > 3 && (
                <button onClick={() => setShowAllReviews(!showAllReviews)} style={{ background: 'none', border: 'none', color: '#6c63ff', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0 }}>
                  {showAllReviews ? 'Voir moins' : `Voir tous les avis (${reviews.length})`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sécurité */}
        <div style={{ background: '#fafbff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 24px' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Conseils de sécurité</h2>
          {[
            'Rencontrez-vous dans un lieu public (bibliothèque, café, campus)',
            'Discutez du tarif et du contenu avant la session',
            'Payez en personne ou par virement — jamais à l\'avance en ligne',
            'Signalez tout comportement suspect via le bouton de signalement',
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13, color: '#4a5568' }}>
              <span style={{ color: '#00c9a7', fontWeight: 700, flexShrink: 0 }}>💡</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )

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
}
