import Link from 'next/link'

export const metadata = {
  title: "Conditions générales d'utilisation — BiblioCamp",
  description: "Lisez les conditions générales d'utilisation de BiblioCamp, la marketplace de manuels scolaires pour étudiants québécois.",
}

const sections = [
  { id: 'presentation', label: '1. Présentation' },
  { id: 'acceptation', label: '2. Acceptation' },
  { id: 'eligibilite', label: '3. Éligibilité' },
  { id: 'compte', label: '4. Compte utilisateur' },
  { id: 'annonces', label: '5. Annonces et contenu' },
  { id: 'transactions', label: '6. Transactions' },
  { id: 'comportement', label: '7. Comportement acceptable' },
  { id: 'propriete', label: '8. Propriété intellectuelle' },
  { id: 'responsabilite', label: '9. Responsabilité' },
  { id: 'suspension', label: '10. Suspension et résiliation' },
  { id: 'modifications', label: '11. Modifications' },
  { id: 'droit', label: '12. Droit applicable' },
  { id: 'contact', label: '13. Nous contacter' },
]

export default function CguPage() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#1a2e4a', background: '#fff' }}>

      <style>{`
        * { box-sizing: border-box; }
        .legal-layout { display: flex; gap: 48px; max-width: 1100px; margin: 0 auto; padding: 40px 20px 80px; }
        .legal-sidebar { display: none; }
        .legal-content { flex: 1; min-width: 0; }
        @media (min-width: 900px) {
          .legal-sidebar { display: block; width: 240px; flex-shrink: 0; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: '1px solid #e8edf2',
        background: '#fff',
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#1a2e4a', fontWeight: 900, fontSize: 18 }}>
            <span style={{ fontSize: 22 }}>📚</span> BIBLIOCAMP
          </Link>
          <Link href="/login" style={{
            background: '#1a2e4a', color: 'white', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none'
          }}>
            Se connecter
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(160deg, #0f1f35 0%, #1a2e4a 100%)', padding: '48px 20px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
            Légal
          </div>
          <h1 style={{ color: 'white', fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2, letterSpacing: -0.5 }}>
            {"Conditions générales d'utilisation"}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, margin: 0 }}>
            Dernière mise à jour : <strong style={{ color: 'rgba(255,255,255,0.85)' }}>11 juin 2026</strong>
          </p>
        </div>
      </div>

      {/* ── CORPS ── */}
      <div className="legal-layout">

        {/* Sidebar navigation (desktop) */}
        <aside className="legal-sidebar">
          <div style={{ position: 'sticky', top: 76 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              Sommaire
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} style={{
                  fontSize: 13, color: '#64748b', textDecoration: 'none',
                  padding: '6px 10px', borderRadius: 6, lineHeight: 1.4,
                  transition: 'background 0.15s, color 0.15s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0f4f8'; e.currentTarget.style.color = '#1a2e4a' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Contenu */}
        <main className="legal-content">
          <div style={{ maxWidth: 720 }}>

            {/* Intro */}
            <div style={{
              background: '#f0fdf8', border: '1px solid #bbf7e0', borderRadius: 12,
              padding: '18px 20px', marginBottom: 40, display: 'flex', gap: 12, alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</span>
              <p style={{ margin: 0, fontSize: 14, color: '#065f46', lineHeight: 1.6 }}>
                En accédant à BiblioCamp ou en créant un compte, vous acceptez les présentes conditions.
                Lisez-les attentivement. Si vous n'êtes pas d'accord, n'utilisez pas le service.
              </p>
            </div>

            <Section id="presentation" title="1. Présentation">
              <p>
                BiblioCamp (« la Plateforme ») est un service de petites annonces en ligne exploité par BiblioCamp,
                destiné aux étudiants des universités et cégeps du Québec. La Plateforme permet aux utilisateurs
                d'acheter et de vendre des manuels scolaires entre particuliers, de façon gratuite et sans commission.
              </p>
              <p>
                BiblioCamp est accessible à l'adresse <strong>www.bibliocamp.ca</strong>.
                Le service est fourni « tel quel », gratuitement, sans garantie de disponibilité continue.
              </p>
            </Section>

            <Section id="acceptation" title="2. Acceptation des conditions">
              <p>
                L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes Conditions
                générales d'utilisation (CGU). Ces conditions constituent un contrat juridiquement contraignant
                entre vous (l'« Utilisateur ») et BiblioCamp.
              </p>
              <p>
                BiblioCamp se réserve le droit de modifier ces conditions à tout moment. Les modifications
                prennent effet dès leur publication sur la Plateforme. Votre utilisation continue du service
                après modification vaut acceptation des nouvelles conditions.
              </p>
            </Section>

            <Section id="eligibilite" title="3. Éligibilité">
              <p>Pour utiliser BiblioCamp, vous devez :</p>
              <ul>
                <li>Avoir au moins <strong>18 ans</strong> ou être étudiant majeur inscrit dans un établissement d'enseignement reconnu</li>
                <li>Résider ou être inscrit dans un établissement scolaire au <strong>Canada</strong></li>
                <li>Fournir une adresse courriel valide et un numéro de téléphone canadien fonctionnel</li>
                <li>Ne pas avoir été suspendu ou banni de la Plateforme antérieurement</li>
              </ul>
            </Section>

            <Section id="compte" title="4. Compte utilisateur">
              <p>
                Un seul compte par personne est autorisé. Vous êtes responsable de la confidentialité
                de vos identifiants de connexion et de toutes les activités réalisées depuis votre compte.
              </p>
              <ul>
                <li>Vous vous engagez à fournir des informations exactes et à les maintenir à jour</li>
                <li>Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte</li>
                <li>BiblioCamp ne peut être tenu responsable des pertes résultant d'une utilisation non autorisée de votre compte</li>
                <li>Vous pouvez supprimer votre compte à tout moment depuis la page Profil ou en nous contactant</li>
              </ul>
            </Section>

            <Section id="annonces" title="5. Annonces et contenu">
              <p>
                En publiant une annonce sur BiblioCamp, vous déclarez que :
              </p>
              <ul>
                <li>Vous êtes propriétaire de l'objet mis en vente ou avez le droit de le vendre</li>
                <li>La description, les photos et le prix sont exacts et ne sont pas trompeurs</li>
                <li>L'objet vendu est légal au Canada</li>
                <li>L'annonce concerne uniquement des manuels scolaires ou du matériel académique</li>
              </ul>
              <p>Il est <strong>interdit</strong> de publier :</p>
              <ul>
                <li>Des contrefaçons ou copies non autorisées de manuels</li>
                <li>Du matériel illégal, offensant, discriminatoire ou protégé par le droit d'auteur sans permission</li>
                <li>Des annonces répétées pour le même article (spam)</li>
                <li>Des prix manifestement frauduleux ou artificiellement gonflés</li>
              </ul>
              <p>
                BiblioCamp se réserve le droit de retirer toute annonce sans préavis ni justification,
                et sans obligation de remboursement (le service étant gratuit).
              </p>
            </Section>

            <Section id="transactions" title="6. Transactions entre utilisateurs">
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
                padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10
              }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <p style={{ margin: 0, fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>
                  BiblioCamp n'est pas partie aux transactions. Le service ne traite aucun paiement et
                  ne garantit pas la qualité ou la livraison des articles vendus.
                </p>
              </div>
              <p>
                Les transactions se concluent directement entre acheteur et vendeur. BiblioCamp
                n'intervient pas dans la négociation, la livraison ou le règlement des litiges.
              </p>
              <p><strong>Recommandations de sécurité :</strong></p>
              <ul>
                <li>Préférez les échanges en personne, dans un lieu public (bibliothèque, café, campus)</li>
                <li>Inspectez l'article avant de payer</li>
                <li>Utilisez un moyen de paiement traçable (virement Interac) plutôt que de l'argent comptant pour les sommes importantes</li>
                <li>Méfiez-vous des offres qui semblent trop belles</li>
              </ul>
            </Section>

            <Section id="comportement" title="7. Comportement acceptable">
              <p>Vous vous engagez à ne pas :</p>
              <ul>
                <li>Harceler, menacer ou insulter d'autres utilisateurs via la messagerie</li>
                <li>Utiliser la Plateforme à des fins de spam, phishing ou fraude</li>
                <li>Contourner les mesures de sécurité (rate limiting, vérification téléphone, etc.)</li>
                <li>Créer plusieurs comptes pour contourner une suspension</li>
                <li>Automatiser l'accès à la Plateforme sans autorisation écrite préalable</li>
                <li>Collecter des données sur les utilisateurs à des fins commerciales</li>
              </ul>
              <p>
                Tout comportement inapproprié peut être signalé via le bouton « Signaler » disponible
                sur les annonces. BiblioCamp traitera les signalements dans les meilleurs délais.
              </p>
            </Section>

            <Section id="propriete" title="8. Propriété intellectuelle">
              <p>
                BiblioCamp et ses éléments constitutifs (logo, design, code source, marque) sont
                protégés par les lois canadiennes sur la propriété intellectuelle.
              </p>
              <p>
                En publiant du contenu (photos, descriptions) sur la Plateforme, vous accordez à
                BiblioCamp une licence non exclusive, gratuite et mondiale pour afficher, reproduire
                et distribuer ce contenu dans le cadre du fonctionnement du service.
                Vous conservez tous vos droits de propriété sur ce contenu.
              </p>
            </Section>

            <Section id="responsabilite" title="9. Limitation de responsabilité">
              <p>
                La Plateforme est fournie « en l'état » et « telle que disponible », sans garantie
                d'aucune sorte, expresse ou implicite.
              </p>
              <p>BiblioCamp n'est pas responsable :</p>
              <ul>
                <li>Des pertes financières résultant d'une transaction entre utilisateurs</li>
                <li>Des interruptions de service, bugs ou pertes de données</li>
                <li>Du contenu publié par les utilisateurs</li>
                <li>Des dommages indirects, consécutifs ou accessoires liés à l'utilisation du service</li>
              </ul>
              <p>
                En aucun cas la responsabilité totale de BiblioCamp ne pourra excéder le montant
                payé par l'utilisateur pour le service au cours des douze (12) derniers mois
                (soit 0 $ puisque le service est gratuit).
              </p>
            </Section>

            <Section id="suspension" title="10. Suspension et résiliation">
              <p>
                BiblioCamp se réserve le droit de suspendre ou de supprimer tout compte, sans préavis,
                en cas de violation des présentes CGU ou de comportement jugé préjudiciable à la
                communauté ou à la Plateforme.
              </p>
              <p>
                En cas de résiliation de votre compte, vos annonces seront supprimées et vous perdrez
                l'accès à votre historique de messages. Certaines informations pourront être conservées
                conformément à la Politique de confidentialité.
              </p>
              <p>
                Vous pouvez mettre fin à votre utilisation du service à tout moment en supprimant
                votre compte depuis la page Profil.
              </p>
            </Section>

            <Section id="modifications" title="11. Modifications du service">
              <p>
                BiblioCamp se réserve le droit de modifier, suspendre ou interrompre tout ou partie
                du service à tout moment, sans préavis ni responsabilité. Nous ferons notre possible
                pour informer les utilisateurs de tout changement majeur par courriel ou via la Plateforme.
              </p>
            </Section>

            <Section id="droit" title="12. Droit applicable et juridiction">
              <p>
                Les présentes CGU sont régies par les lois de la province de Québec et les lois
                fédérales du Canada applicables. Tout litige découlant de l'utilisation de la
                Plateforme sera soumis à la compétence exclusive des tribunaux du district de Montréal (Québec).
              </p>
            </Section>

            <Section id="contact" title="13. Nous contacter">
              <p>
                Pour toute question relative aux présentes conditions d'utilisation :
              </p>
              <div style={{
                background: '#f8fafc', border: '1px solid #e8edf2', borderRadius: 12,
                padding: '20px 24px', marginTop: 8
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>BiblioCamp</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 14, color: '#64748b' }}>
                    📧 <a href="mailto:info@bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 600 }}>info@bibliocamp.ca</a>
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>
                    🌐 <a href="https://www.bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 600 }}>www.bibliocamp.ca</a>
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>
                    📍 Montréal, Québec, Canada
                  </div>
                </div>
              </div>
            </Section>

            {/* Lien vers confidentialité */}
            <div style={{
              marginTop: 48, padding: '20px 24px',
              background: '#f8fafc', borderRadius: 12, border: '1px solid #e8edf2',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Voir aussi</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Notre politique de confidentialité et protection des données</div>
              </div>
              <Link href="/confidentialite" style={{
                background: '#1a2e4a', color: 'white', borderRadius: 8,
                padding: '10px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}>
                Politique de confidentialité →
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f1f35', padding: '28px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>📚</span>
          <p style={{ margin: 0 }}>© 2026 BiblioCamp — Montréal, Québec</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Accueil</Link>
            <Link href="/cgu" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 600 }}>{"Conditions d'utilisation"}</Link>
            <Link href="/confidentialite" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Confidentialité</Link>
            <a href="mailto:info@bibliocamp.ca" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 40, scrollMarginTop: 80 }}>
      <h2 style={{
        fontSize: 'clamp(17px, 3vw, 21px)', fontWeight: 800, color: '#1a2e4a',
        margin: '0 0 16px', paddingBottom: 12,
        borderBottom: '2px solid #f0f4f8', lineHeight: 1.3
      }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: '#374151' }}>
        {children}
      </div>
    </section>
  )
}
