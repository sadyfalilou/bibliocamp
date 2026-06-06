export const metadata = {
  title: 'Politique de confidentialité — BiblioCamp',
}

export default function ConfidentialitePage() {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Politique de confidentialité</h1>
      <p><em>Dernière mise à jour : juin 2026</em></p>

      <p>
        BiblioCamp (« nous ») respecte votre vie privée et se conforme à la{' '}
        <strong>Loi sur la protection des renseignements personnels dans le secteur privé
        (Loi 25)</strong> du Québec ainsi qu'à la loi fédérale canadienne LPRPDE.
      </p>

      <h2>1. Renseignements collectés</h2>
      <ul>
        <li>Adresse courriel et numéro de téléphone (création de compte)</li>
        <li>Annonces publiées (titre, description, photos, localisation générale)</li>
        <li>Messages échangés entre utilisateurs</li>
        <li>Adresse IP (à des fins de sécurité et de limitation d'abus)</li>
      </ul>

      <h2>2. Utilisation des renseignements</h2>
      <ul>
        <li>Authentification et sécurité de votre compte</li>
        <li>Affichage de vos annonces aux autres utilisateurs</li>
        <li>Transmission de messages entre acheteurs et vendeurs</li>
        <li>Détection et prévention des abus</li>
        <li>Surveillance des erreurs techniques (Sentry)</li>
      </ul>

      <h2>3. Partage des renseignements</h2>
      <p>
        Nous ne vendons jamais vos renseignements. Ils peuvent être transmis à nos
        sous-traitants techniques uniquement :
      </p>
      <ul>
        <li><strong>Supabase</strong> — base de données et authentification (serveurs en Amérique du Nord)</li>
        <li><strong>Twilio</strong> — vérification par SMS</li>
        <li><strong>Sentry</strong> — surveillance des erreurs (données anonymisées)</li>
      </ul>

      <h2>4. Conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. Vous pouvez
        demander la suppression de votre compte et de vos données à tout moment.
      </p>

      <h2>5. Vos droits (Loi 25)</h2>
      <ul>
        <li>Accéder à vos renseignements personnels</li>
        <li>Corriger des informations inexactes</li>
        <li>Demander la suppression de vos données</li>
        <li>Retirer votre consentement en tout temps</li>
      </ul>
      <p>
        Pour exercer ces droits, écrivez-nous à :{' '}
        <a href="mailto:confidentialite@bibliocamp.ca">confidentialite@bibliocamp.ca</a>
      </p>

      <h2>6. Sécurité</h2>
      <p>
        Nous appliquons des mesures techniques et organisationnelles pour protéger
        vos renseignements : chiffrement en transit (HTTPS), contrôle d'accès par
        rôle (RLS), limitation du nombre de requêtes, et surveillance continue.
      </p>

      <h2>7. Témoins (cookies)</h2>
      <p>
        Nous utilisons uniquement des témoins fonctionnels nécessaires à
        l'authentification. Aucun témoin publicitaire ou de traçage n'est utilisé.
      </p>

      <h2>8. Contact</h2>
      <p>
        Responsable de la protection des renseignements personnels :{' '}
        <a href="mailto:confidentialite@bibliocamp.ca">confidentialite@bibliocamp.ca</a>
      </p>
    </main>
  )
}
