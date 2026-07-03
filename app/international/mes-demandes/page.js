'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import Logo from '../../../components/Logo'
import Footer from '../../../components/Footer'

const CALENDLY_URL = 'https://calendly.com/sadyfalilou1988/consultation-diagnostic-international'

const FORFAIT_LABELS = {
  selection_programmes: 'Sélection de programmes',
  accompagnement_admission: 'Accompagnement admission essentiel',
  preparation_arrivee: "Préparation à l'arrivée",
  service_complet: 'Service complet',
}
const FORFAIT_PRICES = {
  'Sélection de programmes': '99',
  'Accompagnement admission essentiel': '149',
  "Préparation à l'arrivée": '99',
  'Service complet': '449',
}
const FORFAIT_PRIORITY = ['service_complet', 'accompagnement_admission', 'preparation_arrivee', 'selection_programmes']

function suggestedForfait(needs) {
  if (!needs || needs.length === 0) return ''
  const top = FORFAIT_PRIORITY.find(key => needs.includes(key))
  return top ? FORFAIT_LABELS[top] : ''
}

const STEPS = [
  { key: 'soumis', label: 'Soumis' },
  { key: 'en_analyse', label: 'En analyse' },
  { key: 'resultat_disponible', label: 'Résultat disponible' },
  { key: 'consultation_planifiee', label: 'Consultation planifiée' },
  { key: 'termine', label: 'Terminé' },
]

const STATUS_BADGE = {
  soumis: { bg: '#eef2f6', text: '#0c447c', emoji: '🔵', label: 'Soumis' },
  en_analyse: { bg: '#fdf3e7', text: '#854f0b', emoji: '🟡', label: 'En analyse' },
  resultat_disponible: { bg: '#fdf3e7', text: '#854f0b', emoji: '🟡', label: 'En analyse' },
  consultation_planifiee: { bg: '#e1f5ee', text: '#085041', emoji: '🟢', label: 'Consultation planifiée' },
  termine: { bg: '#f1f5f9', text: '#475569', emoji: '⚪', label: 'Terminé' },
}

const NEXT_STEP_TEXT = {
  soumis: "Ton diagnostic vient d'être reçu. Il sera analysé sous peu.",
  en_analyse: "Ton diagnostic est en cours d'analyse. Tu recevras un courriel dès qu'une consultation pourra être planifiée.",
  resultat_disponible: 'Ton résultat préliminaire est disponible. Réserve une consultation pour en discuter.',
  consultation_planifiee: 'Ta consultation est planifiée — rendez-vous à ton créneau Calendly.',
  termine: 'Ton accompagnement pour cette demande est terminé.',
}

function stepIndex(status) {
  const i = STEPS.findIndex(s => s.key === status)
  return i === -1 ? 0 : i
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ color: '#1a2e4a', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Timeline({ status }) {
  const current = stepIndex(status)
  const finished = status === 'termine'
  return (
    <div style={{ marginBottom: 18 }}>
      {STEPS.map((step, i) => {
        const done = i < current || (finished && i === current)
        const active = i === current && !finished
        const isLast = i === STEPS.length - 1
        return (
          <div key={step.key} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                background: done ? '#00c9a7' : active ? '#854f0b' : 'white',
                border: done || active ? 'none' : '2px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 10, fontWeight: 700
              }}>
                {done ? '✓' : active ? '●' : ''}
              </div>
              {!isLast && <div style={{ width: 2, flex: 1, minHeight: 28, background: done ? '#00c9a7' : '#e2e8f0' }} />}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 18 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: done || active ? '#1a2e4a' : '#94a3b8', margin: 0 }}>
                {step.label}
              </p>
              {active && <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>En cours</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function MesDemandesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState([])
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

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

  const handleDelete = async (id) => {
    setConfirmDeleteId(null)
    setActionError('')
    setDeletingId(id)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/international-diagnostics/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    const json = await res.json()
    setDeletingId(null)
    if (!res.ok) { setActionError(json.error || 'Erreur lors de la suppression.'); return }
    setDiagnostics(prev => prev.filter(d => d.id !== id))
  }

  if (loading) return null

  const firstName = diagnostics[0]?.first_name

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px 64px' }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/app" style={{ textDecoration: 'none' }}>
            <Logo variant="dark" />
          </Link>
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 6px' }}>
          Mes demandes d'accompagnement
        </p>
        {firstName && (
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e4a', margin: '0 0 4px' }}>
            Salut {firstName} 👋
          </h1>
        )}
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
          Voici l'avancement de {diagnostics.length > 1 ? 'tes demandes' : 'ta demande'}.
        </p>

        {error && <p style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
        {actionError && <p style={{ color: '#b91c1c', fontSize: 13 }}>{actionError}</p>}

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

        <div style={{ display: 'grid', gap: 16 }}>
          {diagnostics.map(d => {
            const badge = STATUS_BADGE[d.status] || STATUS_BADGE.soumis
            const estimatedForfait = suggestedForfait(d.needs)
            const estimatedPrix = FORFAIT_PRICES[estimatedForfait]
            return (
              <div key={d.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#1a2e4a', margin: '0 0 3px' }}>
                      {[d.target_level, d.target_field].filter(Boolean).join(' · ')}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                      Soumis le {new Date(d.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span style={{ background: badge.bg, color: badge.text, fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                    {badge.emoji} {badge.label}
                  </span>
                </div>

                <Timeline status={d.status} />

                <div style={{ border: '1px solid #e8edf2', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1a2e4a', margin: '0 0 8px' }}>Forfait et paiement</p>
                  {d.forfait ? (
                    <Row label="Forfait" value={d.forfait} />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Forfait</span>
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        {estimatedForfait ? `${estimatedForfait} (estimation)` : 'À déterminer après analyse'}
                      </span>
                    </div>
                  )}
                  {d.prix != null ? (
                    <Row label="Montant à payer" value={`${d.prix} ${d.devise || 'CAD'}`} />
                  ) : estimatedPrix && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Montant estimé</span>
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{estimatedPrix} $ (à confirmer)</span>
                    </div>
                  )}
                  {d.payment_method && <Row label="Méthode" value={d.payment_method} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '6px 0' }}>
                    <span style={{ color: '#64748b' }}>Statut</span>
                    <span style={{
                      background: d.payment_status === 'paye' ? '#e1f5ee' : '#faeeda',
                      color: d.payment_status === 'paye' ? '#085041' : '#854f0b',
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20
                    }}>
                      {d.payment_status === 'paye' ? 'Payé' : 'Non payé'}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1a2e4a', margin: '0 0 4px' }}>Prochaine étape</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px', lineHeight: 1.5 }}>
                    {NEXT_STEP_TEXT[d.status] || NEXT_STEP_TEXT.soumis}
                  </p>
                  {!['consultation_planifiee', 'termine'].includes(d.status) && (
                    <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer"
                       style={{ fontSize: 12, fontWeight: 700, color: '#0f6e56', textDecoration: 'none' }}>
                      Réserver ma consultation →
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <span
                    onClick={() => router.push(`/international/resultat/${d.id}`)}
                    style={{ fontSize: 12, fontWeight: 700, color: '#0f6e56', cursor: 'pointer' }}
                  >
                    Voir le diagnostic →
                  </span>
                  {d.status === 'soumis' && (
                    <div style={{ display: 'flex', gap: 14 }}>
                      <span
                        onClick={() => router.push(`/international/diagnostic?edit=${d.id}`)}
                        style={{ fontSize: 12, fontWeight: 700, color: '#0c447c', cursor: 'pointer' }}
                      >
                        Modifier
                      </span>
                      <span
                        onClick={() => deletingId !== d.id && setConfirmDeleteId(d.id)}
                        style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', cursor: 'pointer', opacity: deletingId === d.id ? 0.5 : 1 }}
                      >
                        {deletingId === d.id ? 'Suppression…' : 'Supprimer'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100
        }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px 28px', maxWidth: 380, width: '100%' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e4a', margin: '0 0 8px' }}>Supprimer cette demande ?</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 22px', lineHeight: 1.6 }}>
              Cette action est définitive. Toutes les informations associées à cette demande seront supprimées et ne pourront pas être récupérées.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ background: 'white', color: '#1a2e4a', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                style={{ background: '#b91c1c', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
