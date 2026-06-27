'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Logo from '../../../components/Logo'
import Footer from '../../../components/Footer'

const STATUS_LABELS = {
  soumis: 'Soumis',
  en_analyse: 'En analyse',
  resultat_disponible: 'Résultat disponible',
  consultation_planifiee: 'Consultation planifiée',
  termine: 'Terminé',
}

const STATUS_COLORS = {
  soumis: { bg: '#f1f5f9', text: '#475569' },
  en_analyse: { bg: '#eef2f6', text: '#0c447c' },
  resultat_disponible: { bg: '#eef2f6', text: '#0c447c' },
  consultation_planifiee: { bg: '#e1f5ee', text: '#085041' },
  termine: { bg: '#f1f5f9', text: '#475569' },
}

export default function MesDemandesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?redirect=/international/mes-demandes'); return }
      const res = await fetch('/api/international-diagnostics', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erreur de chargement.'); setLoading(false); return }
      setDiagnostics(json.diagnostics || [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return null

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px 64px' }}>
        <div style={{ marginBottom: 24 }}>
          <Logo variant="dark" />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e4a', margin: '0 0 6px' }}>
          Mes demandes d'accompagnement
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
          Le statut de tes diagnostics envoyés à BiblioCamp International.
        </p>

        {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}

        {!error && diagnostics.length === 0 && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 28px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>Tu n'as pas encore soumis de diagnostic.</p>
            <button onClick={() => router.push('/international/diagnostic')} style={{
              background: '#00c9a7', color: '#073e35', border: 'none', padding: '11px 22px',
              borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}>
              Faire mon diagnostic gratuit
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {diagnostics.map(d => {
            const color = STATUS_COLORS[d.status] || STATUS_COLORS.soumis
            return (
              <div
                key={d.id}
                onClick={() => router.push(`/international/resultat/${d.id}`)}
                style={{
                  background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
                  padding: '16px 20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12, cursor: 'pointer'
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a', margin: '0 0 3px' }}>
                    Diagnostic soumis le {new Date(d.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                    {[d.target_level, d.target_field].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span style={{
                  background: color.bg, color: color.text, fontSize: 11, fontWeight: 700,
                  padding: '5px 12px', borderRadius: 20, whiteSpace: 'nowrap'
                }}>
                  {STATUS_LABELS[d.status] || d.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <Footer />
    </div>
  )
}
