import Link from 'next/link'
import Footer from '../../components/Footer'
import AuthAwareLoginButton from '../../components/AuthAwareLoginButton'

export const metadata = {
  title: "Conditions générales d'utilisation — BiblioCamp",
  description: "Lisez les conditions générales d'utilisation de BiblioCamp, la marketplace de manuels scolaires pour étudiants québécois.",
}

export default function CguPage() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#fff', color: '#222' }}>

      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 17, color: '#1a2e4a', textDecoration: 'none', letterSpacing: -0.3 }}>
          📚 BIBLIOCAMP
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/confidentialite" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>Confidentialité</Link>
          <AuthAwareLoginButton />
        </div>
      </header>

      {/* ── CONTENU ── */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>

        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          Mentions légales
        </p>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, margin: '0 0 8px', color: '#111', lineHeight: 1.2 }}>
          {"Conditions générales d'utilisation"}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 48px', fontStyle: 'italic' }}>
          Dernière mise à jour : 11 juin 2026
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.8, color: '#374151', margin: '0 0 48px' }}>
          En accédant à la plateforme BiblioCamp ou en créant un compte, vous acceptez les présentes
          conditions d'utilisation. Lisez-les attentivement avant d'utiliser le service.
          BiblioCamp est une marketplace gratuite de manuels scolaires destinée aux étudiants des
          universités et cégeps du Québec.
        </p>

        <Section title="1. Présentation du service">
          <p>
            BiblioCamp est un service de petites annonces en ligne exploité par BiblioCamp, accessible à
            l'adresse <strong>www.bibliocamp.ca</strong>. La plateforme permet aux étudiants d'acheter et
            de vendre des manuels scolaires directement entre particuliers, gratuitement et sans commission.
          </p>
          <p>
            Le service est fourni « tel quel » et « tel que disponible », sans garantie de disponibilité continue.
            BiblioCamp se réserve le droit de modifier, suspendre ou interrompre le service à tout moment.
          </p>
        </Section>

        <Section title="2. Acceptation des conditions">
          <p>
            L'utilisation de la plateforme constitue une acceptation pleine et entière des présentes conditions.
            Elles forment un contrat juridiquement contraignant entre vous (l'« Utilisateur ») et BiblioCamp.
          </p>
          <p>
            BiblioCamp peut modifier ces conditions à tout moment. Les modifications prennent effet dès leur
            publication. Votre utilisation continue du service après modification vaut acceptation des nouvelles conditions.
          </p>
        </Section>

        <Section title="3. Éligibilité">
          <p>Pour utiliser BiblioCamp, vous devez :</p>
          <ul>
            <li>Avoir au moins 18 ans</li>
            <li>Être étudiant ou avoir un lien avec un établissement d'enseignement canadien</li>
            <li>Fournir une adresse courriel valide et un numéro de téléphone canadien fonctionnel</li>
            <li>Ne pas avoir été préalablement suspendu ou banni de la plateforme</li>
          </ul>
        </Section>

        <Section title="4. Compte utilisateur">
          <p>
            Un seul compte par personne est autorisé. Vous êtes responsable de la confidentialité de vos
            identifiants et de toutes les activités réalisées depuis votre compte.
          </p>
          <ul>
            <li>Vous vous engagez à fournir des informations exactes et à les maintenir à jour</li>
            <li>Signalez immédiatement tout accès non autorisé à votre compte</li>
            <li>Vous pouvez supprimer votre compte à tout moment depuis votre page Profil</li>
          </ul>
        </Section>

        <Section title="5. Annonces et contenu">
          <p>En publiant une annonce sur BiblioCamp, vous déclarez que :</p>
          <ul>
            <li>Vous êtes propriétaire de l'objet mis en vente ou avez le droit de le vendre</li>
            <li>La description, les photos et le prix sont exacts et non trompeurs</li>
            <li>L'objet est légal au Canada et concerne des manuels ou du matériel académique</li>
          </ul>
          <p>Il est interdit de publier :</p>
          <ul>
            <li>Des contrefaçons ou copies non autorisées de manuels</li>
            <li>Du contenu illégal, offensant, discriminatoire ou protégé par droit d'auteur sans permission</li>
            <li>Des annonces répétées pour un même article (spam)</li>
            <li>Des prix manifestement frauduleux</li>
          </ul>
          <p>
            BiblioCamp se réserve le droit de retirer toute annonce sans préavis ni justification.
          </p>
        </Section>

        <Section title="6. Transactions entre utilisateurs">
          <p>
            BiblioCamp n'est pas partie aux transactions. Le service ne traite aucun paiement et ne garantit
            pas la qualité, la livraison ou la conformité des articles vendus. Les transactions se concluent
            directement entre acheteur et vendeur.
          </p>
          <p>
            Nous vous recommandons de : préférer les échanges en lieu public (campus, bibliothèque),
            inspecter l'article avant paiement et utiliser un moyen de paiement traçable pour les sommes importantes.
          </p>
        </Section>

        <Section title="7. Comportement acceptable">
          <p>Vous vous engagez à ne pas :</p>
          <ul>
            <li>Harceler, menacer ou insulter d'autres utilisateurs</li>
            <li>Utiliser la plateforme à des fins de spam, phishing ou fraude</li>
            <li>Contourner les mesures de sécurité (vérification téléphone, rate limiting, etc.)</li>
            <li>Créer plusieurs comptes pour contourner une suspension</li>
            <li>Automatiser l'accès à la plateforme sans autorisation écrite préalable</li>
            <li>Collecter des données sur les utilisateurs à des fins commerciales</li>
          </ul>
        </Section>

        <Section title="8. Propriété intellectuelle">
          <p>
            BiblioCamp et ses éléments constitutifs (logo, design, code source, marque) sont protégés
            par les lois canadiennes sur la propriété intellectuelle.
          </p>
          <p>
            En publiant du contenu sur la plateforme (photos, descriptions), vous accordez à BiblioCamp
            une licence non exclusive et gratuite pour l'afficher dans le cadre du service.
            Vous conservez l'ensemble de vos droits sur ce contenu.
          </p>
        </Section>

        <Section title="9. Limitation de responsabilité">
          <p>BiblioCamp n'est pas responsable :</p>
          <ul>
            <li>Des pertes financières résultant d'une transaction entre utilisateurs</li>
            <li>Des interruptions de service, bugs ou pertes de données</li>
            <li>Du contenu publié par les utilisateurs</li>
            <li>Des dommages indirects ou consécutifs liés à l'utilisation du service</li>
          </ul>
          <p>
            La responsabilité totale de BiblioCamp ne pourra excéder le montant payé par l'utilisateur
            pour le service au cours des 12 derniers mois (soit 0 $, le service étant gratuit).
          </p>
        </Section>

        <Section title="10. Suspension et résiliation">
          <p>
            BiblioCamp peut suspendre ou supprimer tout compte, sans préavis, en cas de violation des
            présentes conditions ou de comportement préjudiciable à la communauté. En cas de résiliation,
            vos annonces seront supprimées et vous perdrez l'accès à votre historique de messages.
          </p>
          <p>
            Vous pouvez mettre fin à votre utilisation du service à tout moment en supprimant votre compte
            depuis la page Profil.
          </p>
        </Section>

        <Section title="11. Droit applicable et juridiction">
          <p>
            Les présentes conditions sont régies par les lois de la province de Québec et les lois fédérales
            du Canada applicables. Tout litige sera soumis à la compétence exclusive des tribunaux du
            district de Montréal (Québec).
          </p>
        </Section>

        <Section title="12. Nous contacter" last>
          <p>
            Pour toute question relative aux présentes conditions :
          </p>
          <p>
            <strong>BiblioCamp</strong><br />
            Courriel : <a href="mailto:info@bibliocamp.ca" style={{ color: '#1a2e4a' }}>info@bibliocamp.ca</a><br />
            Site web : <a href="https://www.bibliocamp.ca" style={{ color: '#1a2e4a' }}>www.bibliocamp.ca</a><br />
            Montréal, Québec, Canada
          </p>
        </Section>

        {/* Lien croisé */}
        <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 12px' }}>Voir aussi</p>
          <Link href="/confidentialite" style={{ fontSize: 15, fontWeight: 600, color: '#1a2e4a', textDecoration: 'underline' }}>
            Politique de confidentialité →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function Section({ title, children, last = false }) {
  return (
    <section style={{ marginBottom: last ? 0 : 40, paddingBottom: last ? 0 : 40, borderBottom: last ? 'none' : '1px solid #f3f4f6' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 14px', lineHeight: 1.3 }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.8, color: '#374151' }}>
        {children}
      </div>
    </section>
  )
}
