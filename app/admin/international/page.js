'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const STATUS_LABELS = {
  soumis: 'Soumis',
  en_analyse: 'En analyse',
  resultat_disponible: 'Résultat disponible',
  consultation_planifiee: 'Consultation planifiée',
  termine: 'Terminé',
}

export default function AdminInternationalPage() {
  const [loading, setLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState([])
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Tu dois être connecté.'); setLoading(false); return }
      const res = await fetch('/api/admin/international', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      if (!res.ok) {
        setError(res.status === 403 ? "Accès refusé — tu n'es pas administrateur." : (json.error || 'Erreur de chargement.'))
        setLoading(false)
        return
      }
      setDiagnostics(json.diagnostics || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleStatusChange = async (id, status) => {
    setSavingId(id)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/international', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setDiagnostics(prev => prev.map(d => d.id === id ? { ...d, status } : d))
    }
    setSavingId(null)
  }

  if (loading) return <div style={{ padding: 40, fontFamily: "'Segoe UI', sans-serif" }}>Chargement…</div>
  if (error) return <div style={{ padding: 40, fontFamily: "'Segoe UI', sans-serif", color: '#b91c1c' }}>{error}</div>

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e4a', margin: '0 0 6px' }}>Diagnostics internationaux</h1>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>{diagnostics.length} demande{diagnostics.length === 1 ? '' : 's'} reçue{diagnostics.length === 1 ? '' : 's'}.</p>

      {diagnostics.length === 0 && <p style={{ color: '#94a3b8' }}>Aucune demande pour l'instant.</p>}

      <div style={{ display: 'grid', gap: 14 }}>
        {diagnostics.map(d => (
          <div key={d.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ fontWeight: 700, color: '#1a2e4a', margin: '0 0 4px' }}>{d.first_name} {d.last_name}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{d.country} · {d.target_level}{d.target_field ? ` · ${d.target_field}` : ''}</p>
              </div>
              <a href={`mailto:${d.email}`} style={{ fontSize: 12, fontWeight: 700, color: '#0f6e56', textDecoration: 'none', border: '1px solid #9fe1cb', borderRadius: 8, padding: '6px 12px' }}>
                ✉️ {d.email}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                Soumis le {new Date(d.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <select
                value={d.status}
                disabled={savingId === d.id}
                onChange={e => handleStatusChange(d.id, e.target.value)}
                style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 8px', fontSize: 12, color: '#1a2e4a', background: 'white' }}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {(d.needs || []).length > 0 && (
              <p style={{ fontSize: 12, color: '#374151', margin: '8px 0 0' }}>Besoins : {d.needs.join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
