'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '../../components/Logo'
import Footer from '../../components/Footer'
import { BADGE_LABELS } from '../../lib/tutorBadge'
import { useTutorList, todayKey } from '../../components/useTutorList'

const DOMAINS = ['Sciences', 'Santé', 'Droit', 'Arts', 'Éducation', 'Génie', 'Commerce', 'Autres']

function StarRating({ rating, count }) {
  if (!count) return <span style={{ fontSize: 12, color: '#a0aec0' }}>Aucun avis</span>
  const full = Math.round(rating)
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
      <span style={{ color: '#f59e0b' }}>{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <span style={{ color: '#64748b', fontWeight: 600 }}>{rating} <span style={{ fontWeight: 400 }}>({count})</span></span>
    </span>
  )
}

function TutorCard({ tutor, onClick }) {
  const name = `${tutor.first_name || ''} ${tutor.last_name?.[0] || ''}.`.trim()
  const modes = [
    tutor.meet_campus && { icon: '🏫', label: 'Campus' },
    tutor.meet_online && { icon: '💻', label: 'En ligne' },
    tutor.meet_city   && { icon: '🏙️', label: 'Ville' },
  ].filter(Boolean)

  const availableToday = (tutor.availabilities?.[todayKey()] || []).length > 0

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white', borderRadius: 14,
        border: '1px solid #e2e8f0', padding: '18px 20px',
        cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s',
        display: 'flex', flexDirection: 'column', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Badge Pro */}
      {tutor.is_pro && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderBottomLeftRadius: 10 }}>PRO</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {tutor.avatar_url
            ? <img src={tutor.avatar_url} alt={name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', fontWeight: 700 }}>
                {(tutor.first_name?.[0] || '?').toUpperCase()}
              </div>
          }
          {tutor.is_verified && (
            <div style={{ position: 'absolute', bottom: -1, right: -1, background: '#00c9a7', borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, border: '2px solid white', color: 'white', fontWeight: 700 }}>✓</div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2e4a' }}>{name}</div>
            {tutor.response_badge && BADGE_LABELS[tutor.response_badge] && (
              <span style={{ fontSize: 10, fontWeight: 700, background: BADGE_LABELS[tutor.response_badge].bg, color: BADGE_LABELS[tutor.response_badge].color, borderRadius: 20, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                {BADGE_LABELS[tutor.response_badge].label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {[tutor.domains?.[0], tutor.institution || tutor.campus].filter(Boolean).join(' · ')}
          </div>
          <div style={{ marginTop: 4 }}>
            <StarRating rating={tutor.avg_rating} count={tutor.review_count} />
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#00c9a7' }}>{tutor.rate_per_hour}$</div>
          <div style={{ fontSize: 11, color: '#a0aec0' }}>/heure</div>
        </div>
      </div>

      {/* Matières */}
      {tutor.subjects?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tutor.subjects.slice(0, 5).map(s => (
            <span key={s} style={{ fontSize: 11, fontWeight: 600, background: '#f0f9ff', color: '#0369a1', borderRadius: 6, padding: '3px 8px' }}>{s}</span>
          ))}
          {tutor.subjects.length > 5 && <span style={{ fontSize: 11, color: '#a0aec0', alignSelf: 'center' }}>+{tutor.subjects.length - 5}</span>}
        </div>
      )}

      {/* Bio */}
      {tutor.bio && (
        <p style={{ fontSize: 13, color: '#4a5568', margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {tutor.bio}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 10, gap: 8 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {modes.map(m => (
            <span key={m.label} style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>{m.icon} {m.label}</span>
          ))}
        </div>
        {availableToday && (
          <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf9', color: '#00c9a7', borderRadius: 20, padding: '2px 10px', border: '1px solid #a7f3d0' }}>
            Dispo aujourd'hui
          </span>
        )}
      </div>
    </div>
  )
}

export default function TuteursPage() {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  // Chargement + filtrage partagés avec la vue in-app via le hook.
  const {
    user, filtered, loading, isTutor, hasFilters, resetFilters,
    search, setSearch,
    filterDomain, setFilterDomain,
    filterMode, setFilterMode,
    filterPrice, setFilterPrice,
    filterDispoToday, setFilterDispoToday,
    filterLang, setFilterLang,
    sortBy, setSortBy,
  } = useTutorList()

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const selectStyle = {
    padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    background: 'white', color: '#1a2e4a', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', outline: 'none',
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa', colorScheme: 'light' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 16 }}>
          <button onClick={() => router.push('/app')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 4 }}>←</button>
          <Logo variant="dark" size="sm" onClick={() => router.push('/')} style={{ cursor: 'pointer' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a2e4a' }}>Tuteurs</span>
          <div style={{ flex: 1 }} />
          {user
            ? isTutor
              ? <button onClick={() => router.push('/tuteurs/modifier')} style={{ fontSize: 13, fontWeight: 600, color: '#6c63ff', background: 'none', border: '1.5px solid #6c63ff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Mon profil tuteur</button>
              : <button onClick={() => router.push('/tuteurs/devenir-tuteur')} style={{ fontSize: 13, fontWeight: 700, color: 'white', background: '#1a2e4a', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>Devenir tuteur</button>
            : <button onClick={() => router.push('/login')} style={{ fontSize: 13, fontWeight: 700, color: 'white', background: '#1a2e4a', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>Se connecter</button>
          }
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,#1a2e4a 0%,#2d4a6b 100%)', borderRadius: 16, padding: isMobile ? '24px 20px' : '32px 40px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, fontSize: 140, opacity: 0.05 }}>🎓</div>
          <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: 'white', margin: '0 0 6px' }}>Trouve un tuteur et réussis tes cours</h1>
          <p style={{ fontSize: 13, color: '#a0c4d8', margin: '0 0 16px' }}>Des étudiants qui ont réussi avant toi, prêts à t'aider.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Cours, matière, nom du tuteur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 38px', borderRadius: 10, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#1a2e4a' }}
              />
            </div>
            {search && (
              <button onClick={() => setSearch('')} style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontSize: 20, fontWeight: 300 }}>×</button>
            )}
          </div>
        </div>

        {/* Barre de filtres */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Tri */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
              <option value="recommended">⭐ Recommandés</option>
              <option value="rating">Mieux notés</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="recent">Plus récents</option>
            </select>

            {/* Domaine */}
            <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)} style={{ ...selectStyle, borderColor: filterDomain ? '#1a2e4a' : '#e2e8f0', background: filterDomain ? '#1a2e4a' : 'white', color: filterDomain ? 'white' : '#1a2e4a' }}>
              <option value="">Tous les domaines</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Mode */}
            <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{ ...selectStyle, borderColor: filterMode ? '#1a2e4a' : '#e2e8f0', background: filterMode ? '#1a2e4a' : 'white', color: filterMode ? 'white' : '#1a2e4a' }}>
              <option value="">Tous les modes</option>
              <option value="campus">🏫 Campus</option>
              <option value="online">💻 En ligne</option>
              <option value="city">🏙️ Ville</option>
            </select>

            {/* Prix */}
            <select value={filterPrice} onChange={e => setFilterPrice(e.target.value)} style={{ ...selectStyle, borderColor: filterPrice ? '#1a2e4a' : '#e2e8f0', background: filterPrice ? '#1a2e4a' : 'white', color: filterPrice ? 'white' : '#1a2e4a' }}>
              <option value="">Tous les prix</option>
              <option value="10-20">Moins de 20$/h</option>
              <option value="20-35">20 – 35$/h</option>
              <option value="35-999">35$/h et plus</option>
            </select>

            {/* Langue */}
            <select value={filterLang} onChange={e => setFilterLang(e.target.value)} style={{ ...selectStyle, borderColor: filterLang ? '#1a2e4a' : '#e2e8f0', background: filterLang ? '#1a2e4a' : 'white', color: filterLang ? 'white' : '#1a2e4a' }}>
              <option value="">Toutes les langues</option>
              <option value="Français">Français</option>
              <option value="Anglais">Anglais</option>
              <option value="Espagnol">Espagnol</option>
              <option value="Arabe">Arabe</option>
            </select>

            {/* Dispo aujourd'hui */}
            <button
              onClick={() => setFilterDispoToday(v => !v)}
              style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${filterDispoToday ? '#00c9a7' : '#e2e8f0'}`, background: filterDispoToday ? '#f0fdf9' : 'white', color: filterDispoToday ? '#00c9a7' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {filterDispoToday ? '✓ ' : ''}Dispo aujourd'hui
            </button>

            {/* Reset */}
            {hasFilters && (
              <button onClick={resetFilters} style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #fed7d7', background: '#fff5f5', color: '#e53e3e', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
                Réinitialiser ×
              </button>
            )}
          </div>
        </div>

        {/* Résultats header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          {!loading && (
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
              {filtered.length === 0
                ? 'Aucun tuteur trouvé'
                : `${filtered.length} tuteur${filtered.length > 1 ? 's' : ''} disponible${filtered.length > 1 ? 's' : ''}`}
              {hasFilters && <span style={{ color: '#a0aec0', fontWeight: 400 }}> · <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#00c9a7', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>tout voir</button></span>}
            </span>
          )}
          <a href="/tuteurs/faq" style={{ fontSize: 13, color: '#00c9a7', fontWeight: 600, textDecoration: 'none' }}>FAQ →</a>
        </div>

        {/* Grille */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px', height: 180 }}>
                <div style={{ background: '#f1f5f9', borderRadius: 8, height: 14, width: '60%', marginBottom: 10 }} />
                <div style={{ background: '#f1f5f9', borderRadius: 8, height: 10, width: '40%', marginBottom: 8 }} />
                <div style={{ background: '#f1f5f9', borderRadius: 8, height: 10, width: '80%' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2e4a', marginBottom: 8 }}>
              {hasFilters ? 'Aucun tuteur ne correspond' : 'Aucun tuteur pour le moment'}
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              {hasFilters ? 'Essaie de modifier tes filtres.' : 'Sois le premier tuteur de BiblioCamp !'}
            </div>
            {!hasFilters && user && !isTutor && (
              <button onClick={() => router.push('/tuteurs/devenir-tuteur')} style={{ padding: '12px 24px', background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Devenir tuteur →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filtered.map(tutor => (
              <TutorCard key={tutor.id} tutor={tutor} onClick={() => router.push(`/tuteurs/${tutor.id}`)} />
            ))}
          </div>
        )}

        {/* CTA bas */}
        {!loading && filtered.length > 0 && user && !isTutor && (
          <div style={{ marginTop: 40, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a2e4a', marginBottom: 6 }}>Tu as réussi des cours ? Aide les autres !</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Inscris-toi comme tuteur gratuitement et gagne de l'argent en aidant tes collègues.</div>
            <button onClick={() => router.push('/tuteurs/devenir-tuteur')} style={{ padding: '12px 28px', background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Devenir tuteur gratuitement →
            </button>
          </div>
        )}

      </div>

      <Footer />
    </div>
  )
}
