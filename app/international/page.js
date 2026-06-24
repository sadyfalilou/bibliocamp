import Link from 'next/link'
import Footer from '../../components/Footer'
import AuthAwareLoginButton from '../../components/AuthAwareLoginButton'
import InternationalCta from '../../components/InternationalCta'

export const metadata = {
  title: 'Étudiants internationaux — BiblioCamp',
  description: "Trouve une formation, prépare ton admission et organise ton arrivée au Québec avec BiblioCamp : diagnostic gratuit, recherche de programmes, accompagnement administratif et mentorat étudiant.",
}

const SERVICES = [
  { icon: '🧭', title: 'Diagnostic du projet', desc: 'Profil académique, budget, objectifs' },
  { icon: '🎓', title: 'Recherche de programmes', desc: 'Cégep, université, comparatif' },
  { icon: '📄', title: "Dossier d'admission scolaire", desc: 'Checklist, documents, suivi' },
  { icon: '✈️', title: "Préparation à l'arrivée", desc: 'Logement, banque, hiver, accueil à l\'aéroport' },
  { icon: '🤝', title: 'Mentorat étudiant', desc: 'Consultation avec un ancien étudiant international' },
  { icon: '🏠', title: 'Logement et installation', desc: 'Colocs BiblioCamp, démarches' },
  { icon: '💰', title: 'Services et tarification', desc: 'Forfaits à la carte, prix en CAD' },
]

const FORFAITS = [
  { nom: 'Diagnostic personnalisé', prix: '39 $', desc: 'Analyse du profil, forces et points à améliorer, liste de documents, plan d\'action.' },
  { nom: 'Sélection de programmes', prix: '99 $', desc: 'Diagnostic + 3 programmes potentiels comparés, conditions d\'admission, dates importantes.' },
  { nom: "Accompagnement admission essentiel", prix: '149 $', desc: 'Checklist personnalisée, organisation des documents, révision du CV et de la lettre, une rencontre vidéo.' },
  { nom: 'Préparation à l\'arrivée', prix: '99 $', desc: 'Checklist avant le départ, budget d\'installation, logement, téléphone, séance d\'orientation.' },
  { nom: 'Mentorat (consultation)', prix: 'Sur réservation', desc: 'Une consultation avec un ancien étudiant international, par visioconférence.' },
]

export default function InternationalPage() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#fff', color: '#222' }}>

      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 17, color: '#1a2e4a', textDecoration: 'none', letterSpacing: -0.3 }}>
          📚 BIBLIOCAMP
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/faq" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>FAQ</Link>
          <AuthAwareLoginButton />
        </div>
      </header>

      <div style={{ background: 'linear-gradient(135deg,#1a2e4a,#23375a)', padding: '64px 24px', textAlign: 'center', color: 'white' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
          🌍 International
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.25 }}>
          Ton projet d'études au Québec commence ici
        </h1>
        <p style={{ fontSize: 16, color: '#cdd7e6', margin: '0 0 32px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Trouve une formation, prépare ton admission et organise ton arrivée au Québec avec BiblioCamp.
        </p>
        <InternationalCta />
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 24px 0' }}>
        <Link href="/international/mon-histoire" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', textDecoration: 'none' }}>
          <span style={{ fontSize: 14, color: '#1a2e4a', fontWeight: 600 }}>
            📖 Pourquoi j'ai créé ce programme — mon histoire en arrivant au Québec
          </span>
          <span style={{ fontSize: 13, color: '#0f6e56', fontWeight: 700, whiteSpace: 'nowrap' }}>Lire mon histoire →</span>
        </Link>
      </div>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 24px 24px' }} id="services">
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
          Ton parcours, étape par étape
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
          {SERVICES.map(s => (
            <div key={s.title} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a2e4a', margin: '0 0 4px' }}>{s.title}</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
          Forfaits et tarification
        </p>
        <div style={{ display: 'grid', gap: 14, marginBottom: 48 }}>
          {FORFAITS.map(f => (
            <div key={f.nom} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ maxWidth: 560 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1a2e4a', margin: '0 0 4px' }}>{f.nom}</p>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#0f6e56', margin: 0, whiteSpace: 'nowrap' }}>{f.prix}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 48px' }}>
          Prix indicatifs en dollars canadiens (CAD), à confirmer avant tout paiement. Tu choisis ta méthode de paiement parmi virement bancaire, Sendwave ou Western Union — les détails te sont envoyés après ta demande.
        </p>

        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
          Questions fréquentes
        </p>
        <div style={{ marginBottom: 48 }}>
          <details style={{ borderBottom: '1px solid #e2e8f0', padding: '14px 0' }}>
            <summary style={{ fontSize: 14, fontWeight: 600, color: '#1a2e4a', cursor: 'pointer' }}>BiblioCamp m'aide-t-il à obtenir mon permis d'études ou mon visa ?</summary>
            <p style={{ fontSize: 13, color: '#64748b', margin: '10px 0 0', lineHeight: 1.6 }}>Non. BiblioCamp ne fournit pas de conseils juridiques ou de conseils réglementés en immigration. Pour toute question liée à un permis d'études ou un visa, consulte un conseiller en immigration agréé ou un avocat.</p>
          </details>
          <details style={{ borderBottom: '1px solid #e2e8f0', padding: '14px 0' }}>
            <summary style={{ fontSize: 14, fontWeight: 600, color: '#1a2e4a', cursor: 'pointer' }}>Le diagnostic est-il vraiment gratuit ?</summary>
            <p style={{ fontSize: 13, color: '#64748b', margin: '10px 0 0', lineHeight: 1.6 }}>Oui. Le questionnaire et le résultat préliminaire sont gratuits. Seuls les services d'accompagnement détaillés (sélection de programmes, révision de documents, etc.) sont payants.</p>
          </details>
          <details style={{ borderBottom: '1px solid #e2e8f0', padding: '14px 0' }}>
            <summary style={{ fontSize: 14, fontWeight: 600, color: '#1a2e4a', cursor: 'pointer' }}>Qui répond à mes questions ?</summary>
            <p style={{ fontSize: 13, color: '#64748b', margin: '10px 0 0', lineHeight: 1.6 }}>Une personne ayant elle-même vécu l'expérience d'étudiant international au Québec — pas un centre d'appels.</p>
          </details>
        </div>

        <div style={{ background: '#eef2f6', borderRadius: 10, padding: '16px 18px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 32 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            BiblioCamp offre des services d'accompagnement scolaire, administratif et d'installation. BiblioCamp ne garantit aucune admission et ne fournit pas de conseils juridiques ou de conseils réglementés en immigration. Pour toute question liée à un permis d'études ou un visa, consulte un conseiller en immigration agréé ou un avocat.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
