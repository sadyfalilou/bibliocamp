'use client'

import { useEffect, useState } from 'react'
import Carousel from './Carousel'
import RemovedListingNotices from './RemovedListingNotices'
import { BADGE_LABELS } from '../lib/tutorBadge'

const coverGradients = [
  'linear-gradient(135deg,#1a2e4a,#0d4f6b)',
  'linear-gradient(135deg,#993c1d,#d85a30)',
  'linear-gradient(135deg,#534ab7,#7f77dd)',
  'linear-gradient(135deg,#0f6e56,#1d9e75)',
  'linear-gradient(135deg,#854f0b,#ef9f27)',
]
const tutorColors = ['#1a2e4a', '#993c1d', '#0f6e56', '#534ab7', '#854f0b']

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`
  return new Date(dateStr).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
}

export default function AccueilView({ userProfile, userId, router, setView, onSearch, onSearchTutor, onSelectTutor, onSelectListing }) {
  const [listings, setListings] = useState([])
  const [tutors, setTutors] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings ?? [])
        setTutors(data.tutors ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    const qLower = q.toLowerCase()

    const matchesTutor = tutors.some(t =>
      `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase().includes(qLower) ||
      t.institution?.toLowerCase().includes(qLower) ||
      t.campus?.toLowerCase().includes(qLower) ||
      t.subjects?.some(s => s.toLowerCase().includes(qLower)) ||
      t.domains?.some(d => d.toLowerCase().includes(qLower))
    )
    const matchesListing = listings.some(l =>
      l.title?.toLowerCase().includes(qLower) ||
      l.authors?.toLowerCase().includes(qLower) ||
      l.course_code?.toLowerCase().includes(qLower)
    )

    if (matchesTutor && !matchesListing) {
      onSearchTutor?.(q)
    } else {
      onSearch?.(q)
    }
  }

  return (
    <div>
      <RemovedListingNotices userId={userId} />

      {/* Hero compact */}
      <div style={{ background: 'linear-gradient(135deg,#1a2e4a 0%,#2d4a6b 100%)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ color: 'white', fontSize: 17, fontWeight: 800, marginBottom: 4 }}>
          Salut {userProfile?.first_name || ''} 👋
        </div>
        <div style={{ color: '#a0c4d8', fontSize: 13, marginBottom: 14 }}>
          Qu'est-ce qu'on cherche aujourd'hui ?
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cherche un manuel, un cours, un tuteur..."
            style={{ flex: 1, border: 'none', borderRadius: 9, padding: '10px 14px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ background: '#00c9a7', border: 'none', borderRadius: 9, padding: '0 18px', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Chercher
          </button>
        </form>
      </div>

      {/* Manuels */}
      <div
        onClick={() => setView('acheter')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 14 }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 900, color: '#1a2e4a', margin: 0 }}>Derniers manuels ajoutés</h2>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </div>

      <Carousel onSeeAll={() => setView('acheter')} seeAllImages={listings.slice(0, 3).map(l => l.image_url)}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ flex: '0 0 150px', scrollSnapAlign: 'start' }}>
              <div style={{ background: '#f1f5f9', borderRadius: 10, height: 110, marginBottom: 6 }} />
              <div style={{ background: '#f1f5f9', borderRadius: 6, height: 10, width: '80%', marginBottom: 5 }} />
              <div style={{ background: '#f1f5f9', borderRadius: 6, height: 9, width: '50%' }} />
            </div>
          ))
          : listings.map((listing, idx) => (
            <div
              key={listing.id}
              onClick={() => onSelectListing ? onSelectListing(listing) : setView('acheter')}
              style={{ flex: '0 0 150px', scrollSnapAlign: 'start', cursor: 'pointer' }}
            >
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 110, background: coverGradients[idx % coverGradients.length], marginBottom: 6 }}>
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 700, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {listing.title}
                    </span>
                  </div>
                )}
                {listing.original_price && listing.original_price > listing.price && (
                  <div style={{ position: 'absolute', top: 6, left: 6, background: 'white', fontSize: 9, fontWeight: 700, color: '#1a2e4a', padding: '2px 7px', borderRadius: 20 }}>
                    -{Math.round(((listing.original_price - listing.price) / listing.original_price) * 100)}%
                  </div>
                )}
                {listing.course_code && (
                  <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'white', fontSize: 9, fontWeight: 700, color: '#00a88a', padding: '2px 7px', borderRadius: 20 }}>
                    {listing.course_code}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2e4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 1 }}>
                {listing.title}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2e4a' }}>
                {listing.price ? `${listing.price} $` : '—'}
              </div>
            </div>
          ))
        }
      </Carousel>

      {/* Tuteurs */}
      {(loading || tutors.length > 0) && (
        <>
          <div
            onClick={() => setView('tuteurs')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginTop: 28, marginBottom: 14 }}
          >
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#1a2e4a', margin: 0 }}>Tuteurs disponibles</h2>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a2e4a" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <Carousel onSeeAll={() => setView('tuteurs')} seeAllImages={tutors.slice(0, 3).map(t => t.avatar_url)}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ flex: '0 0 150px', scrollSnapAlign: 'start' }}>
                  <div style={{ background: '#f1f5f9', borderRadius: 10, height: 110, marginBottom: 6 }} />
                  <div style={{ background: '#f1f5f9', borderRadius: 6, height: 10, width: '80%', marginBottom: 5 }} />
                  <div style={{ background: '#f1f5f9', borderRadius: 6, height: 9, width: '50%' }} />
                </div>
              ))
              : tutors.map((t, idx) => {
                const name = `${t.first_name || ''} ${t.last_name?.[0] || ''}.`.trim()
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTutor ? onSelectTutor(t.id) : setView('tuteurs')}
                    style={{ flex: '0 0 150px', scrollSnapAlign: 'start', cursor: 'pointer' }}
                  >
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 110, background: tutorColors[idx % tutorColors.length], marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {t.avatar_url
                        ? <img src={t.avatar_url} alt={name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 30, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{(t.first_name?.[0] || '?').toUpperCase()}</span>
                      }
                      <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'white', fontSize: 9, fontWeight: 700, color: '#00c9a7', padding: '2px 7px', borderRadius: 20 }}>
                        {t.rate_per_hour} $/h
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2e4a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {name}
                      </div>
                      {t.response_badge && BADGE_LABELS[t.response_badge] && (
                        <span style={{ fontSize: 8, fontWeight: 700, background: BADGE_LABELS[t.response_badge].bg, color: BADGE_LABELS[t.response_badge].color, borderRadius: 20, padding: '1px 5px', flexShrink: 0 }}>
                          {BADGE_LABELS[t.response_badge].label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {[t.institution || t.campus, t.subjects?.[0]].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                )
              })
            }
          </Carousel>
        </>
      )}
    </div>
  )
}
