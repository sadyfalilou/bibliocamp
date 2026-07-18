'use client'

import { useRouter } from 'next/navigation'
import { BADGE_LABELS } from '../lib/tutorBadge'
import { useTutorList, todayKey } from './useTutorList'

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
        background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
        padding: '16px 18px', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.15s',
        display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {tutor.is_pro && (
        <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderBottomLeftRadius: 10 }}>PRO</div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {tutor.avatar_url
            ? <img src={tutor.avatar_url} alt={name} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white', fontWeight: 700 }}>
                {(tutor.first_name?.[0] || '?').toUpperCase()}
              </div>
          }
          {tutor.is_verified && (
            <div style={{ position: 'absolute', bottom: -1, right: -1, background: '#00c9a7', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, border: '2px solid white', color: 'white', fontWeight: 700 }}>✓</div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e4a' }}>{name}</div>
            {tutor.response_badge && BADGE_LABELS[tutor.response_badge] && (
              <span style={{ fontSize: 10, fontWeight: 700, background: BADGE_LABELS[tutor.response_badge].bg, color: BADGE_LABELS[tutor.response_badge].color, borderRadius: 20, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                {BADGE_LABELS[tutor.response_badge].label}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {[tutor.domains?.[0], tutor.institution || tutor.campus].filter(Boolean).join(' · ')}
          </div>
          <div style={{ marginTop: 3 }}>
            <StarRating rating={tutor.avg_rating} count={tutor.review_count} />
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#00c9a7' }}>{tutor.rate_per_hour}$</div>
          <div style={{ fontSize: 11, color: '#a0aec0' }}>/heure</div>
        </div>
      </div>

      {tutor.subjects?.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {tutor.subjects.slice(0, 4).map(s => (
            <span key={s} style={{ fontSize: 11, fontWeight: 600, background: '#f0f9ff', color: '#0369a1', borderRadius: 5, padding: '2px 7px' }}>{s}</span>
          ))}
          {tutor.subjects.length > 4 && <span style={{ fontSize: 11, color: '#a0aec0', alignSelf: 'center' }}>+{tutor.subjects.length - 4}</span>}
        </div>
      )}

      {tutor.bio && (
        <p style={{ fontSize: 12, color: '#4a5568', margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {tutor.bio}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 8, gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {modes.map(m => (
            <span key={m.label} style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 2 }}>{m.icon} {m.label}</span>
          ))}
        </div>
        {availableToday && (
          <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf9', color: '#00c9a7', borderRadius: 20, padding: '2px 9px', border: '1px solid #a7f3d0' }}>
            Dispo aujourd'hui
          </span>
        )}
      </div>
    </div>
  )
}

export default function TuteursView({ user, setView, onSelectTutor, initialSearch }) {
  const router = useRouter()
  // Chargement + filtrage partagés avec la liste publique via le hook.
  const {
    filtered, loading, isTutor, hasFilters, resetFilters,
    search, setSearch,
    filterDomain, setFilterDomain,
    filterMode, setFilterMode,
    filterPrice, setFilterPrice,
    filterDispoToday, setFilterDispoToday,
    filterLang, setFilterLang,
    sortBy, setSortBy,
  } = useTutorList({ initialSearch })

  const selectStyle = {
    padding: '7px 11px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    background: 'white', color: '#1a2e4a', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', outline: 'none',
  }

  return (
    <div>
      {/* Hero compact */}
      <div style={{ background: 'linear-gradient(135deg,#1a2e4a 0%,#2d4a6b 100%)', borderRadius: 14, padding: '20px 24px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 100, opacity: 0.05 }}>🎓</div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: 'white', margin: '0 0 4px' }}>Trouve un tuteur</h1>
        <p style={{ fontSize: 13, color: '#a0c4d8', margin: '0 0 14px' }}>Des étudiants qui ont réussi avant toi, prêts à t'aider.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Cours, matière, nom du tuteur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 34px', borderRadius: 9, border: 'none', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1a2e4a' }}
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')} style={{ padding: '0 14px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontSize: 18 }}>×</button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: '10px 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
            <option value="recommended">⭐ Recommandés</option>
            <option value="rating">Mieux notés</option>
            <option value="price_asc">Prix ↑</option>
            <option value="price_desc">Prix ↓</option>
            <option value="recent">Récents</option>
          </select>

          <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)} style={{ ...selectStyle, borderColor: filterDomain ? '#1a2e4a' : '#e2e8f0', background: filterDomain ? '#1a2e4a' : 'white', color: filterDomain ? 'white' : '#1a2e4a' }}>
            <option value="">Tous les domaines</option>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{ ...selectStyle, borderColor: filterMode ? '#1a2e4a' : '#e2e8f0', background: filterMode ? '#1a2e4a' : 'white', color: filterMode ? 'white' : '#1a2e4a' }}>
            <option value="">Tous les modes</option>
            <option value="campus">🏫 Campus</option>
            <option value="online">💻 En ligne</option>
            <option value="city">🏙️ Ville</option>
          </select>

          <select value={filterPrice} onChange={e => setFilterPrice(e.target.value)} style={{ ...selectStyle, borderColor: filterPrice ? '#1a2e4a' : '#e2e8f0', background: filterPrice ? '#1a2e4a' : 'white', color: filterPrice ? 'white' : '#1a2e4a' }}>
            <option value="">Tous les prix</option>
            <option value="10-20">{'< 20$/h'}</option>
            <option value="20-35">20–35$/h</option>
            <option value="35-999">35$/h+</option>
          </select>

          <select value={filterLang} onChange={e => setFilterLang(e.target.value)} style={{ ...selectStyle, borderColor: filterLang ? '#1a2e4a' : '#e2e8f0', background: filterLang ? '#1a2e4a' : 'white', color: filterLang ? 'white' : '#1a2e4a' }}>
            <option value="">Toutes les langues</option>
            <option value="Français">Français</option>
            <option value="Anglais">Anglais</option>
            <option value="Espagnol">Espagnol</option>
            <option value="Arabe">Arabe</option>
          </select>

          <button
            onClick={() => setFilterDispoToday(v => !v)}
            style={{ padding: '7px 12px', borderRadius: 8, border: `1.5px solid ${filterDispoToday ? '#00c9a7' : '#e2e8f0'}`, background: filterDispoToday ? '#f0fdf9' : 'white', color: filterDispoToday ? '#00c9a7' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {filterDispoToday ? '✓ ' : ''}Dispo aujourd'hui
          </button>

          {hasFilters && (
            <button onClick={resetFilters} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #fed7d7', background: '#fff5f5', color: '#e53e3e', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
              Réinitialiser ×
            </button>
          )}
        </div>
      </div>

      {/* Compteur */}
      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            {filtered.length === 0 ? 'Aucun tuteur trouvé' : `${filtered.length} tuteur${filtered.length > 1 ? 's' : ''} disponible${filtered.length > 1 ? 's' : ''}`}
            {hasFilters && <> · <button onClick={resetFilters} style={{ background: 'none', border: 'none', color: '#00c9a7', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>tout voir</button></>}
          </span>
          <button onClick={() => setView('faq')} style={{ background: 'none', border: 'none', color: '#00c9a7', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>FAQ →</button>
        </div>
      )}

      {/* Grille */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 18px', height: 160 }}>
              <div style={{ background: '#f1f5f9', borderRadius: 8, height: 12, width: '55%', marginBottom: 8 }} />
              <div style={{ background: '#f1f5f9', borderRadius: 8, height: 10, width: '35%', marginBottom: 8 }} />
              <div style={{ background: '#f1f5f9', borderRadius: 8, height: 10, width: '75%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🎓</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1a2e4a', marginBottom: 6 }}>
            {hasFilters ? 'Aucun tuteur ne correspond' : 'Aucun tuteur pour le moment'}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>
            {hasFilters ? 'Essaie de modifier tes filtres.' : 'Sois le premier tuteur de BiblioCamp !'}
          </div>
          {!hasFilters && user && !isTutor && (
            <button onClick={() => setView('devenir-tuteur')} style={{ padding: '11px 22px', background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Devenir tuteur →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(tutor => (
            <TutorCard key={tutor.id} tutor={tutor} onClick={() => onSelectTutor ? onSelectTutor(tutor.id) : router.push(`/tuteurs/${tutor.id}`)} />
          ))}
        </div>
      )}

      {/* CTA bas */}
      {!loading && filtered.length > 0 && user && !isTutor && (
        <div style={{ marginTop: 32, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2e4a', marginBottom: 4 }}>Tu as réussi des cours ? Aide les autres !</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>Inscris-toi comme tuteur gratuitement et gagne de l'argent.</div>
          <button onClick={() => setView('devenir-tuteur')} style={{ padding: '11px 24px', background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Devenir tuteur gratuitement →
          </button>
        </div>
      )}
    </div>
  )
}
