import Link from 'next/link'
import Footer from '../../components/Footer'
import AuthAwareLoginButton from '../../components/AuthAwareLoginButton'

export const metadata = {
  title: 'À propos — BiblioCamp',
  description: "BiblioCamp est la plateforme étudiante québécoise pour les manuels scolaires, le tutorat et la colocation, créée par et pour des étudiants.",
}

export default function AProposPage() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#fff', color: '#222' }}>

      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 17, color: '#1a2e4a', textDecoration: 'none', letterSpacing: -0.3 }}>
          📚 BIBLIOCAMP
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/faq" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>FAQ</Link>
          <AuthAwareLoginButton />
        </div>
      </header>

      {/* ── CONTENU ── */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>

        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          À propos
        </p>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, margin: '0 0 24px', color: '#111', lineHeight: 1.2 }}>
          Une plateforme construite par des étudiants, pour des étudiants
        </h1>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#374151' }}>
          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            BiblioCamp est né d'un constat simple : entre le prix des manuels neufs, la difficulté
            à trouver de l'aide pour un cours difficile et le stress de chercher un logement chaque
            session, la vie étudiante québécoise a besoin d'outils qui se parlent entre eux plutôt
            que d'une dizaine de groupes Facebook éparpillés.
          </p>
          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Ce qui a commencé comme une simple marketplace de manuels scolaires d'occasion s'est
            transformé en une plateforme qui réunit les manuels, le tutorat entre pairs et la
            recherche de colocataires — toujours gratuite, toujours pensée pour la communauté
            étudiante du Québec.
          </p>
          <p style={{ margin: '0 0 20px', textAlign: 'justify' }}>
            Nous croyons que l'entraide étudiante n'a pas besoin de commission ni de publicité pour
            fonctionner. C'est pourquoi BiblioCamp restera gratuit, sans frais cachés, financé par
            la conviction qu'une communauté qui s'entraide directement s'en sort mieux.
          </p>
          <p style={{ margin: 0, textAlign: 'justify' }}>
            Une question, une suggestion, ou simplement envie de dire bonjour ? Écris-nous à{' '}
            <a href="mailto:info@bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 600 }}>info@bibliocamp.ca</a>.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  )
}
