'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Logo from '../../components/Logo'

const DOMAINS = ['Sciences', 'Santé', 'Droit', 'Arts', 'Éducation', 'Génie', 'Commerce', 'Autres']
const PRICE_RANGES = [
  { label: 'Tous les prix', value: '' },
  { label: 'Moins de 20 $/h', value: '0-20' },
  { label: '20 – 35 $/h', value: '20-35' },
  { label: '35 $/h et plus', value: '35-999' },
]

function StarRating({ rating, count }) {
  if (!count) return <span style={{ fontSize: 12, color: '#a0aec0' }}>Aucun avis</span>
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
      <span style={{ color: '#f59e0b', fontWeight: 700 }}>{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</span>
      <span style={{ color: '#64748b' }}>{rating} ({count})</span>
    </span>
  )
}

function AvailabilityDots({ availabilities }) {
  const days = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
  const hasAny = days.some(d => availabilities?.[d]?.length > 0)
  if (!hasAny) return null
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {days.map(d => {
        const slots = availabilities?.[d] || []
        const hasMatin = slots.includes('matin')
        const hasSoir = slots.includes('soir')
        const active = hasMatin || hasSoir
        return (
          <div key={d} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#a0aec0', marginBottom: 2, textTransform: 'uppercase' }}>{d}</div>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: active ? '#00c9a7' : '#e2e8f0'
            }} />
          </div>
        )
      })}
    </div>
  )
}

function TutorCard({ tutor, onClick }) {
  const name = `${tutor.first_name || ''} ${tutor.last_name?.[0] || ''}.`.trim()
  const modes = [
    tutor.meet_campus && '🏫 Campus',
    tutor.meet_online && '💻 En ligne',
    tutor.meet_city   && '🏙️ Ville',
  ].filter(Boolean)

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        padding: '20px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {tutor.avatar_url
            ? <img src={tutor.avatar_url} alt={name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', fontWeight: 700 }}>
                {(tutor.first_name?.[0] || '?').toUpperCase()}
              </div>
          }
          {tutor.is_verified && (
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#00c9a7', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, border: '2px solid white' }}>✓</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1a2e4a' }}>{name}</span>
            {tutor.is_pro && (
              <span style={{ fontSize: 10, fontWeight: 700, background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', color: 'white', borderRadius: 8, padding: '2px 7px' }}>PRO</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {[tutor.domains?.[0], tutor.institution || tutor.campus].filter(Boolean).join(' · ')}
          </div>
          <div style={{ marginTop: 4 }}>
            <StarRating rating={tutor.avg_rating} count={tutor.review_count} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#00c9a7' }}>{tutor.rate_per_hour} $</div>
          <div style={{ fontSize: 11, color: '#a0aec0' }}>/ heure</div>
        </div>
      </div>

      {/* Matières */}
      {tutor.subjects?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tutor.subjects.slice(0, 4).map(s => (
            <span key={s} style={{ fontSize: 11, fontWeight: 600, background: '#f0f9ff', color: '#0369a1', borderRadius: 6, padding: '3px 8px' }}>{s}</span>
          ))}
          {tutor.subjects.length > 4 && (
            <span style={{ fontSize: 11, color: '#a0aec0' }}>+{tutor.subjects.length - 4}</span>
          )}
        </div>
      )}

      {/* Bio */}
      {tutor.bio && (
        <p style={{ fontSize: 13, color: '#4a5568', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {tutor.bio}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {modes.map(m => (
            <span key={m} style={{ fontSize: 11, color: '#64748b' }}>{m}</span>
          ))}
        </div>
        <AvailabilityDots availabilities={tutor.availabilities} />
      </div>
    </div>
  )
}

export default function TuteursPage() {
  const [tutors, setTutors] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isTutor, setIsTutor] = useState(false)
  const [search, setSearch] = useState('')
  const [filterDomain, setFilterDomain] = useState('')
  const [filterMode, setFilterMode] = useState('')
  const [filterPrice, setFilterPrice] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

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

      if (user) {
        const { data: tutorProfile } = await supabase
          .from('tutors').select('id').eq('user_id', user.id).single()
        setIsTutor(!!tutorProfile)
      }

      const { data, error } = await supabase
        .from('tutors_with_rating')
        .select('*')
        .eq('is_active', true)
        .order('is_pro', { ascending: false })
        .order('avg_rating', { ascending: false, nullsFirst: false })

      if (!error) setTutors(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Filtrage côté client
  const filtered = tutors.filter(t => {
    if (search) {
      const q = search.toLowerCase()
      const matchName = `${t.first_name} ${t.last_name}`.toLowerCase().includes(q)
      const matchSubjects = t.subjects?.some(s => s.toLowerCase().includes(q))
      const matchDomains = t.domains?.some(d => d.toLowerCase().includes(q))
      const matchBio = t.bio?.toLowerCase().includes(q)
      if (!matchName && !matchSubjects && !matchDomains && !matchBio) return false
    }
    if (filterDomain && !t.domains?.includes(filterDomain)) return false
    if (filterMode === 'campus' && !t.meet_campus) return false
    if (filterMode === 'online' && !t.meet_online) return false
    if (filterMode === 'city' && !t.meet_city) return false
    if (filterPrice) {
      const [min, max] = filterPrice.split('-').map(Number)
      if (t.rate_per_hour < min || t.rate_per_hour > max) return false
    }
    return true
  })

  const hasFilters = search || filterDomain || filterMode || filterPrice

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa', colorScheme: 'light' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 16 }}>
          <button onClick={() => router.push('/app')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 4 }}>←</button>
          <Logo size={28} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a2e4a' }}>Tuteurs</span>
          <div style={{ flex: 1 }} />
          {user ? (
            isTutor
              ? <button onClick={() => router.push('/tuteurs/modifier')} style={{ fontSize: 13, fontWeight: 600, color: '#6c63ff', background: 'none', border: '1px solid #6c63ff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Mon profil tuteur</button>
              : <button onClick={() => router.push('/tuteurs/devenir-tuteur')} style={{ fontSize: 13, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Devenir tuteur</button>
          ) : (
            <button onClick={() => router.push('/login')} style={{ fontSize: 13, fontWeight: 700, color: 'white', background: '#1a2e4a', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Se connecter</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,#1a2e4a 0%,#2d4a6b 100%)', borderRadius: 16, padding: isMobile ? '24px 20px' : '36px 40px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 120, opacity: 0.07 }}>🎓</div>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: 'white', margin: '0 0 8px' }}>
            Trouve un tuteur et réussis tes cours
          </h1>
          <p style={{ fontSize: 14, color: '#a0c4d8', margin: '0 0 20px' }}>
            Des étudiants qui ont réussi avant toi, prêts à t'aider.
          </p>
          {/* Barre de recherche */}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="Recherche un cours, une matière, un nom..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: 'none', fontSize: 14, outline: 'none', background: 'white', color: '#1a2e4a' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontSize: 18 }}>×</button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {/* Domaine */}
          <select
            value={filterDomain}
            onChange={e => setFilterDomain(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${filterDomain ? '#1a2e4a' : '#e2e8f0'}`, background: filterDomain ? '#1a2e4a' : 'white', color: filterDomain ? 'white' : '#1a2e4a', fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
          >
            <option value="">Tous les domaines</option>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Mode */}
          {[
            { value: '', label: 'Tous les modes' },
            { value: 'campus', label: '🏫 Campus' },
            { value: 'online', label: '💻 En ligne' },
            { value: 'city', label: '🏙️ Ville' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterMode(opt.value)}
              style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${filterMode === opt.value ? '#1a2e4a' : '#e2e8f0'}`, background: filterMode === opt.value ? '#1a2e4a' : 'white', color: filterMode === opt.value ? 'white' : '#1a2e4a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {opt.label}
            </button>
          ))}

          {/* Prix */}
          <select
            value={filterPrice}
            onChange={e => setFilterPrice(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${filterPrice ? '#1a2e4a' : '#e2e8f0'}`, background: filterPrice ? '#1a2e4a' : 'white', color: filterPrice ? 'white' : '#1a2e4a', fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
          >
            {PRICE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          {/* Reset */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setFilterDomain(''); setFilterMode(''); setFilterPrice('') }}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #fed7d7', background: '#fff5f5', color: '#e53e3e', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Réinitialiser ×
            </button>
          )}
        </div>

        {/* Résultats */}
        <div style={{ marginBottom: 16 }}>
          {loading ? null : (
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
              {filtered.length === 0 ? 'Aucun tuteur trouvé' : `${filtered.length} tuteur${filtered.length > 1 ? 's' : ''} disponible${filtered.length > 1 ? 's' : ''}`}
            </span>
          )}
        </div>

        {/* Grille */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: '#64748b', fontSize: 16 }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2e4a', marginBottom: 8 }}>
              {hasFilters ? 'Aucun tuteur correspond à ta recherche' : 'Aucun tuteur pour le moment'}
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              {hasFilters ? 'Essaie avec des filtres différents.' : 'Sois le premier tuteur de BiblioCamp !'}
            </div>
            {!hasFilters && user && !isTutor && (
              <button onClick={() => router.push('/tuteurs/devenir-tuteur')} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Devenir tuteur
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(tutor => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                onClick={() => router.push(`/tuteurs/${tutor.id}`)}
              />
            ))}
          </div>
        )}

        {/* CTA devenir tuteur */}
        {!loading && filtered.length > 0 && user && !isTutor && (
          <div style={{ marginTop: 40, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🎓</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2e4a', marginBottom: 6 }}>Tu as réussi des cours ? Aide les autres !</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Inscris-toi comme tuteur et gagne de l'argent en aidant tes collègues étudiants.</div>
            <button onClick={() => router.push('/tuteurs/devenir-tuteur')} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Devenir tuteur gratuitement →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
