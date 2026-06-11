import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialité — BiblioCamp',
  description: "Découvrez comment BiblioCamp collecte, utilise et protège vos données personnelles, conformément à la Loi 25 du Québec.",
}

export default function ConfidentialitePage() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#fff', color: '#222' }}>

      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 17, color: '#1a2e4a', textDecoration: 'none', letterSpacing: -0.3 }}>
          📚 BIBLIOCAMP
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/cgu" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>{"Conditions d'utilisation"}</Link>
          <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a', textDecoration: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 14px' }}>
            Se connecter
          </Link>
        </div>
      </header>

      {/* ── CONTENU ── */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>

        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          Mentions légales
        </p>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, margin: '0 0 8px', color: '#111', lineHeight: 1.2 }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 48px', fontStyle: 'italic' }}>
          Dernière mise à jour : 11 juin 2026
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.8, color: '#374151', margin: '0 0 48px' }}>
          BiblioCamp (« nous ») respecte votre vie privée et se conforme à la{' '}
          <strong>Loi sur la protection des renseignements personnels dans le secteur privé (Loi 25)</strong>{' '}
          du Québec ainsi qu'à la loi fédérale canadienne <strong>LPRPDE</strong>. La présente politique
          décrit comment nous collectons, utilisons et protégeons vos renseignements personnels.
          Nous ne vendons jamais vos données.
        </p>

        <Section title="1. Données que nous collectons">
          <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>

          <p><strong>Données de compte</strong></p>
          <ul>
            <li>Adresse courriel (identifiant, communications)</li>
            <li>Numéro de téléphone canadien (vérification d'identité, prévention des abus)</li>
            <li>Prénom, nom et photo de profil (optionnelle)</li>
            <li>Établissement scolaire et campus</li>
          </ul>

          <p><strong>Données de contenu</strong></p>
          <ul>
            <li>Annonces publiées (titre, description, photos, prix, ISBN)</li>
            <li>Messages échangés via la messagerie intégrée</li>
            <li>Code de parrainage (si applicable)</li>
          </ul>

          <p><strong>Données techniques</strong></p>
          <ul>
            <li>Adresse IP (sécurité, prévention des abus)</li>
            <li>Journaux d'erreurs techniques anonymisés (Sentry)</li>
            <li>Données de session (gestion de l'authentification)</li>
          </ul>

          <p>
            Nous ne collectons pas de données de localisation précise, d'historique de navigation externe,
            ni d'informations financières — aucun paiement ne transite par BiblioCamp.
          </p>
        </Section>

        <Section title="2. Utilisation de vos données">
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul>
            <li>Authentification et gestion de votre compte</li>
            <li>Affichage de vos annonces aux autres utilisateurs</li>
            <li>Transmission de messages entre acheteurs et vendeurs</li>
            <li>Vérification de votre numéro de téléphone (Twilio)</li>
            <li>Prévention des abus et fraudes</li>
            <li>Surveillance des erreurs techniques (Sentry)</li>
            <li>Communications liées à votre compte</li>
          </ul>
          <p>
            Nous n'utilisons pas vos données à des fins publicitaires, de profilage commercial
            ou de revente à des tiers.
          </p>
        </Section>

        <Section title="3. Partage et sous-traitants">
          <p>
            Vos données ne sont jamais vendues. Elles peuvent être transmises uniquement à nos
            sous-traitants techniques, dans la stricte mesure nécessaire au fonctionnement du service :
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> — base de données, authentification et stockage de fichiers
              (Amérique du Nord) — <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1a2e4a' }}>politique de confidentialité</a>
            </li>
            <li>
              <strong>Twilio</strong> — vérification du numéro de téléphone par SMS
              (États-Unis) — <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1a2e4a' }}>politique de confidentialité</a>
            </li>
            <li>
              <strong>Sentry</strong> — surveillance des erreurs techniques (données anonymisées,
              États-Unis) — <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" style={{ color: '#1a2e4a' }}>politique de confidentialité</a>
            </li>
            <li>
              <strong>Vercel</strong> — hébergement de l'application web
              (États-Unis / mondial) — <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#1a2e4a' }}>politique de confidentialité</a>
            </li>
          </ul>
          <p>
            Ces sous-traitants sont contractuellement tenus de protéger vos données et de ne les
            utiliser qu'aux fins stipulées.
          </p>
        </Section>

        <Section title="4. Conservation des données">
          <ul>
            <li><strong>Compte et profil</strong> : conservés jusqu'à la suppression de votre compte</li>
            <li><strong>Annonces</strong> : supprimées avec le compte ou sur demande</li>
            <li><strong>Messages</strong> : conservés jusqu'à la suppression de la conversation ou du compte</li>
            <li><strong>Journaux de sécurité (IP)</strong> : maximum 90 jours</li>
            <li><strong>Données Sentry</strong> : maximum 90 jours</li>
          </ul>
          <p>
            Après la suppression de votre compte, certaines informations peuvent être conservées
            jusqu'à 30 jours à des fins de sécurité, puis définitivement effacées.
          </p>
        </Section>

        <Section title="5. Sécurité">
          <p>Nous appliquons les mesures suivantes pour protéger vos données :</p>
          <ul>
            <li>Chiffrement en transit (HTTPS/TLS) et au repos</li>
            <li>Contrôle d'accès par ligne (RLS Supabase) : chaque utilisateur n'accède qu'à ses propres données</li>
            <li>Authentification sécurisée : mots de passe hachés, sessions JWT</li>
            <li>Vérification téléphone pour limiter les faux comptes</li>
            <li>Rate limiting pour se protéger des attaques automatisées</li>
          </ul>
          <p>
            En cas de violation de données vous concernant, nous vous en informerons dans les délais
            requis par la Loi 25.
          </p>
        </Section>

        <Section title="6. Vos droits">
          <p>
            Conformément à la Loi 25 et à la LPRPDE, vous disposez des droits suivants :
          </p>
          <ul>
            <li><strong>Droit d'accès</strong> : consulter les données que nous détenons sur vous</li>
            <li><strong>Droit de rectification</strong> : corriger des données inexactes ou incomplètes</li>
            <li><strong>Droit de suppression</strong> : effacer votre compte et vos données</li>
            <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition</strong> : limiter certains traitements</li>
            <li><strong>Droit de déposer plainte</strong> : auprès de la Commission d'accès à l'information du Québec (<a href="https://www.cai.gouv.qc.ca" target="_blank" rel="noopener noreferrer" style={{ color: '#1a2e4a' }}>cai.gouv.qc.ca</a>)</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à{' '}
            <a href="mailto:confidentialite@bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 600 }}>confidentialite@bibliocamp.ca</a>.
            Nous répondrons dans un délai de 30 jours.
          </p>
          <p>
            Vous pouvez également supprimer votre compte directement depuis votre page Profil.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            BiblioCamp utilise uniquement des <strong>cookies fonctionnels strictement nécessaires</strong>{' '}
            pour maintenir votre session de connexion. Ces cookies ne sont pas utilisés à des fins
            publicitaires ou de suivi comportemental.
          </p>
          <p>
            Nous n'utilisons ni Google Analytics, ni Meta Pixel, ni aucun outil de suivi tiers.
          </p>
        </Section>

        <Section title="8. Protection des mineurs">
          <p>
            BiblioCamp est destiné aux personnes de 18 ans et plus. Nous ne collectons pas
            sciemment de données concernant des mineurs. Si vous pensez qu'un mineur a créé un
            compte, contactez-nous à{' '}
            <a href="mailto:confidentialite@bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 600 }}>confidentialite@bibliocamp.ca</a>{' '}
            et nous supprimerons le compte immédiatement.
          </p>
        </Section>

        <Section title="9. Conformité Loi 25 (Québec)">
          <p>
            BiblioCamp applique les exigences de la{' '}
            <strong>Loi modernisant des dispositions législatives en matière de protection des renseignements personnels (Loi 25)</strong>{' '}
            du Québec, notamment en matière de transparence, de minimisation des données, de droits
            des personnes concernées et de gestion des incidents de confidentialité.
          </p>
          <p>
            Notre <strong>responsable de la protection des renseignements personnels</strong> est joignable à{' '}
            <a href="mailto:confidentialite@bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 600 }}>confidentialite@bibliocamp.ca</a>.
          </p>
        </Section>

        <Section title="10. Modifications">
          <p>
            Nous pouvons modifier cette politique à tout moment. La date de mise à jour est indiquée
            en haut de ce document. Pour les changements substantiels, nous vous avertirons par
            courriel au moins 30 jours avant leur entrée en vigueur.
          </p>
        </Section>

        <Section title="11. Nous contacter" last>
          <p>
            Pour toute question relative à la présente politique ou pour exercer vos droits :
          </p>
          <p>
            <strong>Responsable de la protection des données — BiblioCamp</strong><br />
            Courriel vie privée : <a href="mailto:confidentialite@bibliocamp.ca" style={{ color: '#1a2e4a' }}>confidentialite@bibliocamp.ca</a><br />
            Courriel général : <a href="mailto:info@bibliocamp.ca" style={{ color: '#1a2e4a' }}>info@bibliocamp.ca</a><br />
            Site web : <a href="https://www.bibliocamp.ca" style={{ color: '#1a2e4a' }}>www.bibliocamp.ca</a><br />
            Montréal, Québec, Canada
          </p>
        </Section>

        {/* Lien croisé */}
        <div style={{ marginTop: 56, paddingTop: 32, borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 12px' }}>Voir aussi</p>
          <Link href="/cgu" style={{ fontSize: 15, fontWeight: 600, color: '#1a2e4a', textDecoration: 'underline' }}>
            {"Conditions générales d'utilisation →"}
          </Link>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>© 2026 BiblioCamp</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>Accueil</Link>
            <Link href="/cgu" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>{"Conditions d'utilisation"}</Link>
            <Link href="/confidentialite" style={{ fontSize: 13, color: '#111', fontWeight: 600, textDecoration: 'none' }}>Confidentialité</Link>
          </div>
        </div>
      </footer>

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
