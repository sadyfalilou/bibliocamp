'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../../lib/supabase'
import Logo from '../../../../components/Logo'
import Footer from '../../../../components/Footer'

const CALENDLY_URL = 'https://calendly.com/sadyfalilou1988/consultation-diagnostic-international'

const NEEDS_LABELS = {
  selection_programmes: 'Sélection de programmes',
  accompagnement_admission: 'Accompagnement admission essentiel',
  preparation_arrivee: "Préparation à l'arrivée",
  service_complet: 'Service complet',
}

const ACADEMIC_DOCS = [
  'Relevés de notes (et diplôme, ou attestation si encore en cours)',
  'Copie du certificat de naissance avec le nom des parents',
  "Preuve de maîtrise du français si exigée (test reconnu ou parcours d'études reconnu) — les exigences exactes varient selon l'établissement",
  'Traduction certifiée des documents qui ne sont pas en français ou en anglais (consulat, ambassade ou traducteur agréé OTTIAQ)',
  'Toujours des copies officielles ou certifiées conformes — une photo ou une capture d\'écran est refusée par la plupart des établissements',
]

const IMMIGRATION_DOCS = [
  "Permis d'études valide",
  "Certificat d'acceptation du Québec (CAQ) valide",
  'Passeport valide',
]

function readinessLevel(d) {
  const signals = [d.last_diploma, d.field_of_study, d.french_level, d.english_level, d.annual_budget, (d.target_cities || []).length > 0, (d.needs || []).length > 0]
  const score = signals.filter(Boolean).length
  if (score <= 1) return { label: 'Projet à définir', color: '#94a3b8' }
  if (score <= 3) return { label: 'Projet en préparation', color: '#0c447c' }
  if (score <= 5) return { label: 'Dossier partiellement prêt', color: '#854f0b' }
  return { label: "Dossier prêt pour analyse", color: '#0f6e56' }
}

export default function DiagnosticResultPage() {
  const { id } = useParams()
  const router = useRouter()
  const [diagnostic, setDiagnostic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?redirect=/international/diagnostic'); return }
      const res = await fetch(`/api/international-diagnostics/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erreur'); setLoading(false); return }
      setDiagnostic(json.diagnostic)
      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) return null
  if (error || !diagnostic) {
    return (
      <div style={{ padding: 60, textAlign: 'center', fontFamily: "'Segoe UI', sans-serif" }}>
        <p style={{ color: '#b91c1c' }}>{error || 'Diagnostic introuvable.'}</p>
      </div>
    )
  }

  const readiness = readinessLevel(diagnostic)

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px 64px' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/app" style={{ textDecoration: 'none' }}>
            <Logo variant="dark" />
          </Link>
          <span onClick={() => router.push('/international/mes-demandes')} style={{ fontSize: 12, fontWeight: 700, color: '#0f6e56', cursor: 'pointer' }}>
            Mes demandes →
          </span>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>Résultat préliminaire</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e4a', margin: '0 0 6px' }}>
            Merci {diagnostic.first_name}, voici ton résumé
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: readiness.color, fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 20, marginTop: 8 }}>
            {readiness.label}
          </div>

          <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
            <SummaryRow label="Niveau recherché" value={diagnostic.target_level} />
            <SummaryRow label="Domaine" value={diagnostic.target_field} />
            <SummaryRow label="Rentrée souhaitée" value={diagnostic.target_session} />
            <SummaryRow label="Villes envisagées" value={(diagnostic.target_cities || []).join(', ')} />
            <SummaryRow label="Budget déclaré" value={diagnostic.annual_budget ? `${diagnostic.annual_budget} ${diagnostic.budget_currency}` : null} />
            <SummaryRow label="Besoins sélectionnés" value={(diagnostic.needs || []).map(n => NEEDS_LABELS[n] || n).join(', ')} />
          </div>
        </div>

        {diagnostic.forfait && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '24px 32px', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2e4a', margin: '0 0 12px' }}>Forfait et paiement</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <SummaryRow label="Forfait" value={diagnostic.forfait} />
              {diagnostic.prix != null && <SummaryRow label="Montant à payer" value={`${diagnostic.prix} ${diagnostic.devise || 'CAD'}`} />}
              {diagnostic.payment_method && <SummaryRow label="Méthode" value={diagnostic.payment_method} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Statut</span>
                <span style={{
                  background: diagnostic.payment_status === 'paye' ? '#e1f5ee' : '#faeeda',
                  color: diagnostic.payment_status === 'paye' ? '#085041' : '#854f0b',
                  fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20
                }}>
                  {diagnostic.payment_status === 'paye' ? 'Payé' : 'Non payé'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '24px 32px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2e4a', margin: '0 0 12px' }}>Documents scolaires habituellement à préparer</h2>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
            {ACADEMIC_DOCS.map(doc => <li key={doc}>{doc}</li>)}
          </ul>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '12px 0 0' }}>Liste générale — les exigences varient selon l'établissement et le programme visés.</p>

          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 18, paddingTop: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a', margin: '0 0 8px' }}>Documents d'immigration à avoir en main une fois au Québec</h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
              {IMMIGRATION_DOCS.map(doc => <li key={doc}>{doc}</li>)}
            </ul>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>
              Ces documents s'obtiennent uniquement auprès des autorités compétentes (IRCC, ministère de l'Immigration du Québec). BiblioCamp ne prépare pas ces demandes et ne fournit pas de conseils à leur sujet — consulte un conseiller en immigration agréé ou un avocat.
            </p>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '24px 32px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2e4a', margin: '0 0 12px' }}>Prochaines étapes suggérées</h2>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
            <li>Réserve une consultation pour discuter de ton profil avec un mentor BiblioCamp.</li>
            <li>Reçois une analyse personnalisée et des recommandations de programmes.</li>
            <li>Prépare ton dossier d'admission avec une checklist adaptée à ta situation.</li>
          </ol>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer"
             style={{ display: 'inline-block', background: '#00c9a7', color: '#073e35', padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Recevoir une analyse personnalisée
          </a>
        </div>

        <div style={{ background: '#eef2f6', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Cette analyse constitue un service d'accompagnement scolaire et administratif. Elle ne garantit pas une admission, un permis d'études, un visa ou un autre statut. BiblioCamp ne fournit pas de conseils juridiques ou de conseils réglementés en immigration.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function SummaryRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ color: '#1a2e4a', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
