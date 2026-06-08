'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)

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

  const handleAction = async (reportId, action, confirmMsg) => {
    if (confirmMsg && !confirm(confirmMsg)) return
    setActingId(reportId)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/admin/reports?id=${reportId}&action=${action}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    if (!res.ok) alert('Erreur lors du traitement.')
    else setReports(prev => prev.filter(r => r.id !== reportId))
    setActingId(null)
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: "'Segoe UI', sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>🚩 Annonces signalées</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Gère les signalements envoyés par les utilisateurs : ignore-les ou retire l'annonce concernée.
      </p>

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
          display: 'flex', gap: 16, alignItems: 'center',
          border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 12
        }}>
          {r.listing?.image_url ? (
            <img src={r.listing.image_url} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8 }} />
          ) : (
            <div style={{ width: 70, height: 70, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📚</div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{r.listing?.title || 'Annonce introuvable (déjà supprimée ?)'}</div>
            {r.listing?.price != null && <div style={{ color: '#6b7280', fontSize: 14 }}>{r.listing.price} $</div>}
            <div style={{ marginTop: 6, fontSize: 14 }}>
              <strong>Motif :</strong> {r.reason}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
              Signalé le {new Date(r.created_at).toLocaleString('fr-CA')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              disabled={actingId === r.id}
              onClick={() => handleAction(r.id, 'dismiss')}
              style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              Ignorer
            </button>
            <button
              disabled={actingId === r.id}
              onClick={() => handleAction(r.id, 'remove-listing', "Supprimer définitivement cette annonce et son image ?")}
              style={{ padding: '8px 14px', background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              🗑️ Retirer l'annonce
            </button>
          </div>
        </div>
      ))}
    </main>
  )
}
