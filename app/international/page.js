import Link from 'next/link'
import Footer from '../../components/Footer'
import Logo from '../../components/Logo'
import AuthAwareLoginButton from '../../components/AuthAwareLoginButton'
import InternationalCta, { DiagnosticButton } from '../../components/InternationalCta'
import ServiceCard from '../../components/ServiceCard'

export const metadata = {
  title: 'Étudiants internationaux — BiblioCamp',
  description: "Trouve une formation, prépare ton admission et organise ton arrivée au Québec avec BiblioCamp : diagnostic gratuit, recherche de programmes et accompagnement administratif.",
}

const SERVICES = [
  { icon: '🎯', title: 'Diagnostic de ton projet', desc: 'Profil académique, budget, objectifs', action: 'diagnostic' },
  { icon: '🎓', title: 'Trouver un programme', desc: 'Cégep, université, comparatif', action: 'diagnostic' },
  { icon: '📄', title: "Préparer ton dossier d'admission", desc: 'Checklist, documents, suivi', action: 'diagnostic' },
  { icon: '✈️', title: 'Organiser ton arrivée', desc: 'Logement, banque, hiver, accueil à l\'aéroport', action: 'diagnostic' },
  { icon: '🏠', title: "Trouver un logement et t'installer", desc: 'Colocs BiblioCamp, démarches', action: 'diagnostic' },
  { icon: '💰', title: 'Voir les forfaits', desc: 'Forfaits à la carte, prix en CAD', action: 'anchor', href: '#forfaits' },
]

const ETAPES = [
  { n: 1, title: 'Tu remplis ton diagnostic', desc: 'Tu nous expliques ton parcours, ton budget, ton domaine et ton objectif.' },
  { n: 2, title: 'On analyse ton projet', desc: "On t'aide à identifier les programmes, documents et étapes à préparer." },
  { n: 3, title: 'Tu choisis ton accompagnement', desc: 'Admission, recherche de programme, logement ou préparation à l\'arrivée.' },
  { n: 4, title: 'Tu suis ton dossier', desc: 'Documents, tâches, recommandations et rapport personnalisé dans ton espace.' },
]

const POUR_QUI = [
  'tu veux venir étudier au Québec',
  'tu ne sais pas quel programme choisir',
  'tu veux comprendre les documents à préparer',
  'tu veux éviter d\'oublier une étape',
  'tu veux parler avec quelqu\'un déjà installé au Québec',
  'tu veux préparer ton logement, ton budget et ton arrivée',
]

const CONFIANCE = [
  'Accompagnement pensé pour les étudiants internationaux',
  'Services en français',
  'Suivi étape par étape',
  'Documents et tâches centralisés',
  'Aucun engagement après le diagnostic gratuit',
]

const FORFAITS = [
  { nom: 'Sélection de programmes', prix: '99 $', desc: 'Diagnostic + 3 programmes potentiels comparés, conditions d\'admission, dates importantes.' },
  { nom: "Accompagnement admission essentiel", prix: '149 $', desc: 'Checklist personnalisée, organisation des documents, révision du CV et de la lettre, une rencontre vidéo.' },
  { nom: 'Préparation à l\'arrivée', prix: '99 $', desc: 'Checklist avant le départ, budget d\'installation, logement, téléphone, séance d\'orientation.' },
  { nom: 'Service complet', prix: '449 $', desc: 'Admission, conseils personnalisés, accueil à l\'aéroport, recherche de logement, installation complète au Québec.', highlight: true },
]

const sectionLabelStyle = { fontSize: 13, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }

export default function InternationalPage() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#fff', color: '#222' }}>

      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/app" style={{ textDecoration: 'none' }}>
          <Logo variant="dark" size="md" />
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/faq" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>FAQ</Link>
          <AuthAwareLoginButton />
        </div>
      </header>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#1a2e4a,#23375a)', padding: '56px 24px', color: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 420px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
              🌍 International
            </div>
            <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 38px)', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.25 }}>
              Étudier au Québec devient plus simple
            </h1>
            <p style={{ fontSize: 16, color: '#cdd7e6', margin: '0 0 28px', maxWidth: 460 }}>
              Trouve un programme, prépare ton admission, organise tes documents et planifie ton arrivée avec un accompagnement pensé pour les étudiants internationaux.
            </p>
            <InternationalCta align="left" />
          </div>

          <div style={{ flex: '0 1 320px', minWidth: 280, background: 'white', borderRadius: 16, padding: '24px 26px', color: '#1a2e4a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Diagnostic gratuit</p>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>⏱ 5 minutes</span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tu obtiens :</p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
              {['Ton niveau de préparation', 'Les documents à préparer', 'Les prochaines étapes', 'Les services recommandés'].map(item => (
                <li key={item} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#0f6e56', fontWeight: 800 }}>✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* MON HISTOIRE */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 0' }}>
        <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px' }}>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Mon histoire</p>
            <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>
              Comme beaucoup d'étudiants internationaux, je sais à quel point les démarches peuvent être confuses avant d'arriver au Québec : choix du programme, documents, logement, budget, intégration. BiblioCamp International a été créé pour rendre ce parcours plus simple, plus humain et mieux organisé.
            </p>
          </div>
          <Link href="/international/mon-histoire" style={{ flexShrink: 0, background: '#1a2e4a', color: 'white', padding: '12px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Lire mon histoire →
          </Link>
        </div>
      </div>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px 24px' }}>

        {/* SERVICES */}
        <p style={sectionLabelStyle}>Ton parcours, étape par étape</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 56 }}>
          {SERVICES.map(s => <ServiceCard key={s.title} {...s} />)}
        </div>

        {/* COMMENT ÇA MARCHE */}
        <p style={sectionLabelStyle}>Comment ça marche</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 56 }}>
          {ETAPES.map(e => (
            <div key={e.n} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1a2e4a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, marginBottom: 12 }}>
                {e.n}
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a2e4a', margin: '0 0 4px' }}>{e.title}</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{e.desc}</p>
            </div>
          ))}
        </div>

        {/* POUR QUI */}
        <p style={sectionLabelStyle}>Ce service est fait pour toi si…</p>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 28px', marginBottom: 56 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {POUR_QUI.map(item => (
              <li key={item} style={{ fontSize: 14, color: '#374151', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.5 }}>
                <span style={{ color: '#0f6e56', fontWeight: 800 }}>✓</span>{item}
              </li>
            ))}
          </ul>
        </div>

        {/* FORFAITS */}
        <p style={sectionLabelStyle} id="forfaits">Forfaits et tarification</p>
        <div style={{ display: 'grid', gap: 14, marginBottom: 16 }}>
          {FORFAITS.map(f => (
            <div key={f.nom} style={{
              background: f.highlight ? '#f0fdf9' : '#fff',
              border: f.highlight ? '2px solid #00c9a7' : '1px solid #e2e8f0',
              borderRadius: 14, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap'
            }}>
              <div style={{ maxWidth: 560 }}>
                {f.highlight && (
                  <span style={{ display: 'inline-block', background: '#00c9a7', color: '#073e35', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginBottom: 6 }}>
                    LE PLUS COMPLET
                  </span>
                )}
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1a2e4a', margin: '0 0 4px' }}>{f.nom}</p>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
              <p style={{ fontSize: f.highlight ? 19 : 17, fontWeight: 800, color: '#0f6e56', margin: 0, whiteSpace: 'nowrap' }}>{f.prix}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 56px' }}>
          Prix indicatifs en dollars canadiens (CAD), à confirmer avant tout paiement. Tu choisis ta méthode de paiement parmi virement bancaire, Sendwave ou Western Union — les détails te sont envoyés après ta demande.
        </p>

        {/* BLOC DE CONFIANCE */}
        <p style={sectionLabelStyle}>Pourquoi utiliser BiblioCamp International ?</p>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 28px', marginBottom: 56 }}>
          <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {CONFIANCE.map(item => (
              <li key={item} style={{ fontSize: 14, color: '#374151', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.5 }}>
                <span style={{ color: '#0f6e56', fontWeight: 800 }}>✓</span>{item}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, borderTop: '1px solid #f1f5f9', paddingTop: 14, lineHeight: 1.6 }}>
            BiblioCamp offre un accompagnement scolaire et administratif. Les services réglementés en immigration sont fournis uniquement par des professionnels autorisés.
          </p>
        </div>

        {/* FAQ */}
        <p style={sectionLabelStyle}>Questions fréquentes</p>
        <div style={{ marginBottom: 56 }}>
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

        {/* CTA FINAL */}
        <div style={{ background: 'linear-gradient(135deg,#1a2e4a,#23375a)', borderRadius: 16, padding: '40px 32px', textAlign: 'center', color: 'white', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>Prêt à commencer ton projet d'études au Québec ?</h2>
          <p style={{ fontSize: 14, color: '#cdd7e6', margin: '0 0 24px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Fais ton diagnostic gratuit et découvre les prochaines étapes adaptées à ton profil.
          </p>
          <DiagnosticButton />
        </div>

      </main>

      <Footer />
    </div>
  )
}
