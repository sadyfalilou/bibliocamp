'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROOM_TYPE_LABELS = {
  chambre_privee: 'Chambre privée',
  chambre_partagee: 'Chambre partagée',
  appartement_complet: 'Appartement complet',
}

const REPORT_REASONS = ['Annonce frauduleuse', 'Logement inexistant', 'Prix abusif', 'Contenu inapproprié', 'Déjà louée', 'Autre']

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`
  return new Date(dateStr).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
}

export default function RoommatesView({ user, setView, initialSearch, phoneSaved, setVerifyRedirect }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState(initialSearch || '')
  const [maxPrice, setMaxPrice] = useState('')
  const [roomType, setRoomType] = useState('')
  const [reportModal, setReportModal] = useState(null) // listing id
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [selected, setSelected] = useState(null) // annonce ouverte dans le panneau de détail
  const [photoIdx, setPhotoIdx] = useState(0)

  const load = async (filters) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.city) params.set('city', filters.city)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.roomType) params.set('roomType', filters.roomType)
    const res = await fetch(`/api/roommates?${params.toString()}`)
    const json = await res.json()
    setListings(json.listings || [])
    setLoading(false)
  }

  useEffect(() => {
    const timeout = setTimeout(() => load({ city, maxPrice, roomType }), 300)
    return () => clearTimeout(timeout)
  }, [city, maxPrice, roomType])

  const handleContact = async (listing) => {
    if (!user) return
    if (!phoneSaved) {
      setVerifyRedirect('/inbox')
      setSelected(null)
      setView('vendre')
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/roommates/contact', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ roommate_listing_id: listing.id, owner_id: listing.user_id })
    })
    const json = await res.json()
    if (res.ok) window.location.href = `/inbox?conv=${json.conversation_id}`
  }

  const closeReportModal = () => { setReportModal(null); setReportReason(''); setReportSent(false) }

  const handleReport = async () => {
    if (!reportReason) return
    setReportLoading(true)
    const { error } = await supabase.from('roommate_reports').insert({
      roommate_listing_id: reportModal,
      reporter_id: user.id,
      reason: reportReason
    })
    setReportLoading(false)
    if (error?.code === '23505') {
      setReportSent(true)
    } else if (error) {
      alert('Erreur lors du signalement.')
    } else {
      setReportSent(true)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 20px' }}>
        Trouver un coloc
      </h1>

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Ville, secteur ou mot-clé"
          style={{ flex: '1 1 160px', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
        />
        <input
          type="number"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          placeholder="Loyer max $"
          style={{ flex: '0 1 130px', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
        />
        <select
          value={roomType}
          onChange={e => setRoomType(e.target.value)}
          style={{ flex: '0 1 180px', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
        >
          <option value="">Tous les types</option>
          {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <button onClick={() => setView('publier-coloc')} style={{ background: '#00c9a7', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 20 }}>
        + Publier une annonce
      </button>

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Chargement...</p>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#a0aec0' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
          Aucune annonce trouvée.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {listings.map(item => (
            <div
              key={item.id}
              onClick={() => { setSelected(item); setPhotoIdx(0) }}
              style={{
                background: 'white', borderRadius: 10, padding: 16,
                border: '1px solid #e2e8f0', display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer'
              }}
            >
              {item.image_url ? (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={item.image_url} alt={item.title} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                  {item.image_urls?.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 20 }}>
                      +{item.image_urls.length - 1}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#1a2e4a,#0d4f6b)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏠</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#1a2e4a', fontSize: 15 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#718096' }}>
                  {ROOM_TYPE_LABELS[item.room_type]} {item.city && `· ${item.city}`} {item.campus && `· ${item.campus}`}
                </div>
                <div style={{ fontSize: 11, color: '#b0bec5', marginTop: 2 }}>{timeAgo(item.created_at)}</div>
              </div>
              <div onClick={e => e.stopPropagation()} style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1a2e4a' }}>{item.rent_price} $/mois</div>
                <button
                  onClick={() => handleContact(item)}
                  disabled={item.user_id === user?.id}
                  style={{
                    marginTop: 6, background: item.user_id === user?.id ? '#e2e8f0' : '#1a2e4a',
                    color: 'white', border: 'none', borderRadius: 7, padding: '7px 14px',
                    fontSize: 12, fontWeight: 600, cursor: item.user_id === user?.id ? 'not-allowed' : 'pointer'
                  }}
                >
                  {item.user_id === user?.id ? 'Ton annonce' : 'Contacter'}
                </button>
                {item.user_id !== user?.id && (
                  <div style={{ marginTop: 6 }}>
                    <button
                      onClick={() => { setReportModal(item.id); setReportSent(false); setReportReason('') }}
                      style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      🚩 Signaler
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL SIGNALEMENT */}
      {reportModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={closeReportModal}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: '28px 32px',
            maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            {reportSent ? (
              <>
                <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 10 }}>✅</div>
                <p style={{ textAlign: 'center', color: '#1a2e4a', fontWeight: 600, marginBottom: 20 }}>
                  Merci, ton signalement a été envoyé à l'équipe BiblioCamp.
                </p>
                <button onClick={closeReportModal} style={{ width: '100%', padding: 11, borderRadius: 9, border: 'none', background: '#1a2e4a', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Fermer
                </button>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: '#1a2e4a' }}>Signaler cette annonce</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {REPORT_REASONS.map(r => (
                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
                      <input type="radio" name="reportReason" checked={reportReason === r} onChange={() => setReportReason(r)} />
                      {r}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={closeReportModal} style={{ flex: 1, padding: 11, borderRadius: 9, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    Annuler
                  </button>
                  <button disabled={!reportReason || reportLoading} onClick={handleReport} style={{ flex: 1, padding: 11, borderRadius: 9, border: 'none', background: reportReason ? '#e53e3e' : '#fca5a5', color: 'white', fontWeight: 700, fontSize: 14, cursor: reportReason ? 'pointer' : 'not-allowed' }}>
                    {reportLoading ? 'Envoi...' : 'Signaler'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PANNEAU DE DETAIL */}
      {selected && (() => {
        const photos = selected.image_urls?.length ? selected.image_urls : (selected.image_url ? [selected.image_url] : [])
        return (
          <>
            <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
            <div style={{
              position: 'fixed', top: 0, right: 0,
              width: 460, maxWidth: '100vw', height: '100vh',
              background: '#f5f7fa', zIndex: 201,
              boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column', overflowY: 'auto',
            }}>
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', background: 'white', flexShrink: 0, position: 'sticky', top: 0, zIndex: 1 }}>
                <div style={{ fontSize: 12, color: '#a0aec0' }}>
                  <span onClick={() => setSelected(null)} style={{ cursor: 'pointer' }}>Colocs</span> / <strong style={{ color: '#1a2e4a' }}>Annonce</strong>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: '#f0f4f8', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#718096' }}>×</button>
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Galerie photos */}
                <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: 260, background: 'linear-gradient(135deg,#1a2e4a,#0d4f6b)' }}>
                  {photos.length > 0 ? (
                    <img src={photos[photoIdx]} alt={selected.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 48 }}>🏠</div>
                  )}
                  {photos.length > 1 && (
                    <>
                      <button onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>‹</button>
                      <button onClick={() => setPhotoIdx(i => (i + 1) % photos.length)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>›</button>
                      <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        {photoIdx + 1} / {photos.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Infos principales */}
                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <h1 style={{ fontSize: 19, fontWeight: 900, color: '#1a2e4a', margin: 0 }}>{selected.title}</h1>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a', whiteSpace: 'nowrap' }}>{selected.rent_price} $<span style={{ fontSize: 12, color: '#a0aec0', fontWeight: 600 }}>/mois</span></div>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
                    {[ROOM_TYPE_LABELS[selected.room_type], selected.city, selected.campus].filter(Boolean).join(' · ')}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#374151', marginBottom: selected.description ? 14 : 0 }}>
                    {selected.available_from && <div>📅 Dispo dès le {new Date(selected.available_from).toLocaleDateString('fr-CA')}</div>}
                    <div>👥 {selected.num_spots} place{selected.num_spots > 1 ? 's' : ''}</div>
                  </div>
                  {selected.description && (
                    <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{selected.description}</p>
                  )}
                </div>

                {selected.user_id !== user?.id ? (
                  <button onClick={() => handleContact(selected)} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    💬 Contacter
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: 13, color: '#a0aec0' }}>Ceci est ton annonce</div>
                )}

                {selected.user_id !== user?.id && (
                  <button
                    onClick={() => { setReportModal(selected.id); setReportSent(false); setReportReason('') }}
                    style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', alignSelf: 'center' }}
                  >
                    🚩 Signaler cette annonce
                  </button>
                )}
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
