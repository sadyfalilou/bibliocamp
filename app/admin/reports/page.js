'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { reportId, action }

  const fetchReports = async () => {
    setLoading(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Tu dois être connecté.'); setLoading(false); return }

    const res = await fetch('/api/admin/reports', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    const json = await res.json()
    if (!res.ok) {
      setError(res.status === 403 ? "Accès refusé — tu n'es pas administrateur." : (json.error || 'Erreur de chargement.'))
      setLoading(false)
      return
    }
    setReports(json.reports || [])
    setLoading(false)
  }

  useEffect(() => { fetchReports() }, [])

  const handleAction = async (reportId, action) => {
    setConfirmAction(null)
    setActingId(reportId)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/admin/reports?id=${reportId}&action=${action}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    if (res.ok) setReports(prev => prev.filter(r => r.id !== reportId))
    setActingId(null)
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: "'Segoe UI', sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>🚩 Annonces signalées</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Gère les signalements envoyés par les utilisateurs : ignore-les ou retire l'annonce concernée.
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
              L'annonce et son image seront définitivement supprimées.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setConfirmAction(null)} style={{
                flex: 1, padding: '11px', borderRadius: 9,
                border: '1.5px solid #e2e8f0', background: 'white',
                color: '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}>Annuler</button>
              <button onClick={() => handleAction(confirmAction.reportId, confirmAction.action)} style={{
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

      {!loading && !error && reports.length === 0 && (
        <div style={{ background: '#f0fdf9', border: '1px solid #00c9a7', color: '#00a88a', borderRadius: 10, padding: 16, fontWeight: 600 }}>
          ✅ Aucun signalement en attente.
        </div>
      )}

      {!loading && !error && reports.map(r => (
        <div key={r.id} style={{
          border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 12
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {r.listing?.image_url ? (
              <img src={r.listing.image_url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 60, height: 60, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📚</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{r.listing?.title || 'Annonce introuvable (déjà supprimée ?)'}</div>
              {r.listing?.price != null && <div style={{ color: '#6b7280', fontSize: 14 }}>{r.listing.price} $</div>}
              <div style={{ marginTop: 6, fontSize: 14 }}>
                <strong>Motif :</strong> {r.reason}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                Signalé le {new Date(r.created_at).toLocaleString('fr-CA')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              disabled={actingId === r.id}
              onClick={() => handleAction(r.id, 'dismiss')}
              style={{ flex: 1, padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              Ignorer
            </button>
            <button
              disabled={actingId === r.id}
              onClick={() => setConfirmAction({ reportId: r.id, action: 'remove-listing' })}
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
