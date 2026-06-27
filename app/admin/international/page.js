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

const FORFAITS = ['Diagnostic seul (gratuit)', 'Accompagnement complet', 'Préparation des documents']
const PAYMENT_METHODS = ['Sendwave', 'Virement bancaire', 'Western Union']

function suggestedForfait(needs) {
  if (!needs || needs.length === 0) return 'Diagnostic seul (gratuit)'
  if (needs.length === 1 && needs[0] === 'preparation_documents') return 'Préparation des documents'
  return 'Accompagnement complet'
}

const inputStyle = { border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 8px', fontSize: 12, color: '#1a2e4a', background: 'white', width: '100%' }

export default function AdminInternationalPage() {
  const [loading, setLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState([])
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [paymentDrafts, setPaymentDrafts] = useState({})

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
      setPaymentDrafts(Object.fromEntries((json.diagnostics || []).map(d => [d.id, {
        forfait: d.forfait || suggestedForfait(d.needs),
        prix: d.prix ?? '',
        payment_method: d.payment_method || '',
        payment_status: d.payment_status || 'non_paye',
      }])))
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

  const handleDraftChange = (id, field, value) => {
    setPaymentDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const handleSavePayment = async (id) => {
    setSavingId(id)
    const draft = paymentDrafts[id]
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/international', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id, ...draft }),
    })
    if (res.ok) {
      setDiagnostics(prev => prev.map(d => d.id === id ? { ...d, ...draft, prix: draft.prix === '' ? null : Number(draft.prix) } : d))
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

            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 14, paddingTop: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, margin: '0 0 8px' }}>
                Forfait et paiement
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 8 }}>
                <div>
                  <select
                    value={paymentDrafts[d.id]?.forfait || ''}
                    onChange={e => handleDraftChange(d.id, 'forfait', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Forfait —</option>
                    {FORFAITS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {!d.forfait && paymentDrafts[d.id]?.forfait && (
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '3px 0 0' }}>Suggéré selon les besoins — à confirmer</p>
                  )}
                </div>
                <input
                  type="number"
                  placeholder="Prix (CAD)"
                  value={paymentDrafts[d.id]?.prix ?? ''}
                  onChange={e => handleDraftChange(d.id, 'prix', e.target.value)}
                  style={inputStyle}
                />
                <select
                  value={paymentDrafts[d.id]?.payment_method || ''}
                  onChange={e => handleDraftChange(d.id, 'payment_method', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Méthode —</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  value={paymentDrafts[d.id]?.payment_status || 'non_paye'}
                  onChange={e => handleDraftChange(d.id, 'payment_status', e.target.value)}
                  style={inputStyle}
                >
                  <option value="non_paye">Non payé</option>
                  <option value="paye">Payé</option>
                </select>
              </div>
              <button
                onClick={() => handleSavePayment(d.id)}
                disabled={savingId === d.id}
                style={{
                  background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 7,
                  padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}
              >
                {savingId === d.id ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
