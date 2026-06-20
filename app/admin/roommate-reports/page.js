'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AdminRoommateReportsPage() {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { listingId, action }

  const fetchReports = async () => {
    setLoading(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Tu dois être connecté.'); setLoading(false); return }

    const res = await fetch('/api/admin/roommate-reports', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    const json = await res.json()
    if (!res.ok) {
      setError(res.status === 403 ? "Accès refusé — tu n'es pas administrateur." : (json.error || 'Erreur de chargement.'))
      setLoading(false)
      return
    }
    setGroups(json.listings || [])
    setLoading(false)
  }

  useEffect(() => { fetchReports() }, [])

  const handleAction = async (listingId, action) => {
    setConfirmAction(null)
    setActingId(listingId)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/admin/roommate-reports?listingId=${listingId}&action=${action}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    if (res.ok) setGroups(prev => prev.filter(g => g.listing_id !== listingId))
    setActingId(null)
  }

  const handleContact = async (sellerId) => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/contact-seller', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerId })
    })
    const json = await res.json()
    if (res.ok) {
      window.location.href = `/inbox?conv=${json.conversation_id}`
    } else {
      alert(`Erreur : ${json.error || 'inconnue'}`)
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: "'Segoe UI', sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>🚩 Annonces colocs signalées</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Gère les signalements envoyés par les utilisateurs sur les annonces de colocs : ignore-les,
        ou retire l'annonce concernée. Les annonces les plus signalées apparaissent en premier.
      </p>

      {/* MODAL CONFIRMATION */}
      {confirmAction && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setConfirmAction(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: '28px 32px',
            maxWidth: 380, width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1a2e4a' }}>
              Retirer cette annonce ?
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>
              L'annonce et ses photos seront définitivement supprimées.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmAction(null)} style={{
                flex: 1, padding: '11px', borderRadius: 9,
                border: '1.5px solid #e2e8f0', background: 'white',
                color: '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}>Annuler</button>
              <button onClick={() => handleAction(confirmAction.listingId, confirmAction.action)} style={{
                flex: 1, padding: '11px', borderRadius: 9,
                border: 'none', background: '#e53e3e',
                color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {loading && <p>Chargement...</p>}

      {!loading && error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', borderRadius: 10, padding: 16 }}>
          {error}
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <div style={{ background: '#f0fdf9', border: '1px solid #00c9a7', color: '#00a88a', borderRadius: 10, padding: 16, fontWeight: 600 }}>
          ✅ Aucun signalement en attente.
        </div>
      )}

      {!loading && !error && groups.map(g => (
        <div key={g.listing_id} style={{
          border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 12
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {g.listing?.image_url ? (
              <img src={g.listing.image_url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 60, height: 60, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏠</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700 }}>{g.listing?.title || 'Annonce introuvable (déjà supprimée ?)'}</div>
                {g.reportCount > 1 && (
                  <span style={{ background: '#fff5f5', color: '#e53e3e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                    × {g.reportCount} signalements
                  </span>
                )}
              </div>
              {g.listing?.rent_price != null && <div style={{ color: '#6b7280', fontSize: 14 }}>{g.listing.rent_price} $/mois</div>}
              <div style={{ marginTop: 6, fontSize: 14 }}>
                <strong>Motifs :</strong>{' '}
                {[...new Set(g.reports.map(r => r.reason))].join(' · ')}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                Dernier signalement le {new Date(g.reports[0].created_at).toLocaleString('fr-CA')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              disabled={actingId === g.listing_id || !g.listing?.user_id}
              onClick={() => handleContact(g.listing.user_id)}
              style={{ flex: 1, padding: '8px 14px', background: '#f0fdf9', color: '#00a88a', border: '1px solid #6ee7b7', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              ✉️ Contacter
            </button>
            <button
              disabled={actingId === g.listing_id}
              onClick={() => handleAction(g.listing_id, 'dismiss')}
              style={{ flex: 1, padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              Ignorer
            </button>
            <button
              disabled={actingId === g.listing_id}
              onClick={() => setConfirmAction({ listingId: g.listing_id, action: 'remove-listing' })}
              style={{ flex: 1, padding: '8px 14px', background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              🗑️ Retirer l'annonce
            </button>
          </div>
        </div>
      ))}
    </main>
  )
}
