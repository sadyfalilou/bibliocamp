import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialité — BiblioCamp',
  description: "Découvrez comment BiblioCamp collecte, utilise et protège vos données personnelles, conformément à la Loi 25 du Québec.",
}

const sections = [
  { id: 'intro', label: '1. Introduction' },
  { id: 'collecte', label: '2. Données collectées' },
  { id: 'utilisation', label: '3. Utilisation des données' },
  { id: 'partage', label: '4. Partage et sous-traitants' },
  { id: 'conservation', label: '5. Conservation' },
  { id: 'securite', label: '6. Sécurité' },
  { id: 'droits', label: '7. Vos droits' },
  { id: 'cookies', label: '8. Cookies et traceurs' },
  { id: 'mineurs', label: '9. Mineurs' },
  { id: 'loi25', label: '10. Conformité Loi 25' },
  { id: 'modifications', label: '11. Modifications' },
  { id: 'contact', label: '12. Nous contacter' },
]

export default function ConfidentialitePage() {
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
            Politique de confidentialité
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, margin: 0 }}>
            Dernière mise à jour : <strong style={{ color: 'rgba(255,255,255,0.85)' }}>11 juin 2026</strong>
          </p>
        </div>
      </div>

      {/* ── CORPS ── */}
      <div className="legal-layout">

        {/* Sidebar */}
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

            {/* Badge Loi 25 */}
            <div style={{
              marginTop: 24, padding: '14px 16px',
              background: '#f0fdf8', border: '1px solid #bbf7e0',
              borderRadius: 10, textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>🛡️</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#065f46', lineHeight: 1.4 }}>
                Conforme à la<br />Loi 25 du Québec
              </div>
            </div>
          </div>
        </aside>

        {/* Contenu */}
        <main className="legal-content">
          <div style={{ maxWidth: 720 }}>

            {/* Intro banner */}
            <div style={{
              background: '#f0fdf8', border: '1px solid #bbf7e0', borderRadius: 12,
              padding: '18px 20px', marginBottom: 40, display: 'flex', gap: 12, alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🛡️</span>
              <p style={{ margin: 0, fontSize: 14, color: '#065f46', lineHeight: 1.6 }}>
                BiblioCamp s'engage à protéger vos données personnelles conformément à la{' '}
                <strong>Loi 25 (Québec)</strong> et à la <strong>LPRPDE (Canada)</strong>.
                Nous ne vendons jamais vos données. Jamais.
              </p>
            </div>

            <Section id="intro" title="1. Introduction">
              <p>
                La présente Politique de confidentialité décrit comment BiblioCamp (« nous », « notre »)
                collecte, utilise, conserve et protège les renseignements personnels que vous nous
                fournissez lorsque vous utilisez la Plateforme <strong>www.bibliocamp.ca</strong>.
              </p>
              <p>
                Cette politique s'applique à tous les utilisateurs de la Plateforme, qu'ils aient
                ou non créé un compte.
              </p>
            </Section>

            <Section id="collecte" title="2. Données que nous collectons">
              <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>

              <SubTitle>Données de compte</SubTitle>
              <ul>
                <li>Adresse courriel (identifiant et communications)</li>
                <li>Numéro de téléphone canadien (vérification d'identité, anti-abus)</li>
                <li>Prénom et nom (affichage sur le profil)</li>
                <li>Photo de profil (optionnelle, uploadée par vous)</li>
                <li>Établissement scolaire et campus</li>
              </ul>

              <SubTitle>Données de contenu</SubTitle>
              <ul>
                <li>Annonces publiées (titre, description, photos, prix, ISBN)</li>
                <li>Messages échangés via la messagerie intégrée</li>
                <li>Code de parrainage (si applicable)</li>
              </ul>

              <SubTitle>Données techniques</SubTitle>
              <ul>
                <li>Adresse IP (sécurité, prévention des abus, rate limiting)</li>
                <li>Journaux d'erreurs techniques via Sentry (informations de débogage anonymisées)</li>
                <li>Données de session (gestion de l'authentification)</li>
              </ul>

              <p style={{ marginTop: 16 }}>
                <strong>Nous ne collectons pas</strong> : données de localisation précise, historique
                de navigation externe, informations financières (aucun paiement ne transite par BiblioCamp).
              </p>
            </Section>

            <Section id="utilisation" title="3. Utilisation de vos données">
              <p>Vos données sont utilisées exclusivement pour :</p>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e8edf2', fontWeight: 700, color: '#1a2e4a' }}>Finalité</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #e8edf2', fontWeight: 700, color: '#1a2e4a' }}>Base légale</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Authentification et accès au compte', 'Exécution du contrat'],
                    ['Affichage des annonces aux autres utilisateurs', 'Exécution du contrat'],
                    ['Transmission de messages entre utilisateurs', 'Exécution du contrat'],
                    ['Vérification de numéro de téléphone (Twilio)', 'Intérêt légitime (sécurité)'],
                    ['Prévention des abus et fraudes', 'Intérêt légitime'],
                    ['Surveillance des erreurs techniques (Sentry)', 'Intérêt légitime'],
                    ["Communications liées au compte (email)", 'Exécution du contrat'],
                  ].map(([fin, base], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{fin}</td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 13 }}>{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p style={{ marginTop: 16 }}>
                Nous n'utilisons <strong>pas</strong> vos données à des fins publicitaires,
                de profilage commercial ou de vente à des tiers.
              </p>
            </Section>

            <Section id="partage" title="4. Partage et sous-traitants">
              <p>
                Nous ne vendons jamais vos renseignements personnels. Ils peuvent être transmis
                uniquement à nos sous-traitants techniques, dans la stricte mesure nécessaire :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {[
                  { name: 'Supabase', role: 'Base de données, authentification et stockage de fichiers', location: 'Amérique du Nord', link: 'https://supabase.com/privacy' },
                  { name: 'Twilio', role: 'Vérification du numéro de téléphone par SMS', location: 'États-Unis', link: 'https://www.twilio.com/legal/privacy' },
                  { name: 'Sentry', role: "Surveillance des erreurs techniques (données anonymisées)", location: 'États-Unis', link: 'https://sentry.io/privacy/' },
                  { name: 'Vercel', role: "Hébergement de l'application web", location: 'États-Unis / Monde', link: 'https://vercel.com/legal/privacy-policy' },
                ].map(p => (
                  <div key={p.name} style={{
                    border: '1px solid #e8edf2', borderRadius: 10, padding: '14px 16px',
                    display: 'flex', gap: 14, alignItems: 'flex-start'
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      🔧
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                        {p.name}{' '}
                        <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#00c9a7', fontWeight: 500 }}>
                          Politique ↗
                        </a>
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>{p.role}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>📍 {p.location}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 16, fontSize: 14, color: '#64748b' }}>
                Ces sous-traitants sont contractuellement tenus de protéger vos données et de
                ne les utiliser qu'aux fins stipulées.
              </p>
            </Section>

            <Section id="conservation" title="5. Conservation des données">
              <p>Vos données sont conservées aussi longtemps que votre compte est actif.</p>
              <ul>
                <li><strong>Compte et profil</strong> : conservés jusqu'à la suppression de votre compte</li>
                <li><strong>Annonces publiées</strong> : supprimées avec le compte (ou à votre demande)</li>
                <li><strong>Messages</strong> : conservés jusqu'à la suppression de la conversation ou du compte</li>
                <li><strong>Journaux de sécurité (IP)</strong> : maximum 90 jours</li>
                <li><strong>Données Sentry (erreurs)</strong> : 90 jours maximum</li>
              </ul>
              <p>
                Après la suppression de votre compte, certaines informations peuvent être conservées
                pendant une période limitée (jusqu'à 30 jours) à des fins de sécurité et de prévention
                des abus, puis définitivement effacées.
              </p>
            </Section>

            <Section id="securite" title="6. Sécurité">
              <p>Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données :</p>
              <ul>
                <li><strong>Chiffrement en transit</strong> : toutes les communications utilisent HTTPS/TLS</li>
                <li><strong>Chiffrement au repos</strong> : données stockées chiffrées chez Supabase</li>
                <li><strong>Contrôle d'accès (RLS)</strong> : chaque utilisateur n'accède qu'à ses propres données</li>
                <li><strong>Authentification sécurisée</strong> : mots de passe hachés, sessions JWT</li>
                <li><strong>Vérification téléphone</strong> : réduction du risque de faux comptes</li>
                <li><strong>Rate limiting</strong> : protection contre les attaques automatisées</li>
              </ul>
              <p>
                Malgré ces mesures, aucun système n'est infaillible. En cas de violation de données
                affectant vos renseignements personnels, nous vous en informerons conformément à
                la Loi 25 dans les délais requis.
              </p>
            </Section>

            <Section id="droits" title="7. Vos droits">
              <p>
                Conformément à la Loi 25 et à la LPRPDE, vous disposez des droits suivants sur
                vos renseignements personnels :
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                {[
                  { icon: '👁️', title: 'Droit d'accès', desc: 'Consulter vos données' },
                  { icon: '✏️', title: 'Droit de rectification', desc: 'Corriger vos données' },
                  { icon: '🗑️', title: 'Droit de suppression', desc: 'Effacer votre compte' },
                  { icon: '📦', title: 'Droit à la portabilité', desc: 'Exporter vos données' },
                  { icon: '✋', title: 'Droit d'opposition', desc: 'Limiter certains traitements' },
                  { icon: '📋', title: 'Droit de déposer plainte', desc: 'Auprès de la CAI' },
                ].map(r => (
                  <div key={r.title} style={{
                    border: '1px solid #e8edf2', borderRadius: 10, padding: '14px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{r.desc}</div>
                  </div>
                ))}
              </div>
              <p>
                Pour exercer ces droits, contactez-nous à{' '}
                <a href="mailto:confidentialite@bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 700 }}>
                  confidentialite@bibliocamp.ca
                </a>.
                Nous répondrons dans un délai de 30 jours.
              </p>
              <p>
                Vous pouvez également supprimer votre compte directement depuis votre page Profil.
              </p>
            </Section>

            <Section id="cookies" title="8. Cookies et données de session">
              <p>
                BiblioCamp utilise des <strong>cookies fonctionnels strictement nécessaires</strong> pour
                maintenir votre session de connexion. Ces cookies ne sont pas utilisés à des fins
                publicitaires ou de suivi comportemental.
              </p>
              <div style={{ border: '1px solid #e8edf2', borderRadius: 10, overflow: 'hidden', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e8edf2', fontWeight: 700 }}>Cookie</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e8edf2', fontWeight: 700 }}>Finalité</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e8edf2', fontWeight: 700 }}>Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b' }}>sb-auth-token</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>Session utilisateur (Supabase)</td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>Session / 7 jours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={{ marginTop: 12 }}>
                Nous n'utilisons pas Google Analytics, Meta Pixel, ni aucun outil de suivi tiers.
              </p>
            </Section>

            <Section id="mineurs" title="9. Protection des mineurs">
              <p>
                BiblioCamp est destiné aux personnes de <strong>18 ans et plus</strong>. Nous ne
                collectons pas sciemment de données personnelles concernant des mineurs. Si vous
                pensez qu'un mineur a créé un compte, contactez-nous à{' '}
                <a href="mailto:confidentialite@bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 700 }}>
                  confidentialite@bibliocamp.ca
                </a>{' '}
                et nous supprimerons le compte immédiatement.
              </p>
            </Section>

            <Section id="loi25" title="10. Conformité Loi 25 (Québec)">
              <div style={{
                background: '#f0fdf8', border: '1px solid #bbf7e0', borderRadius: 12,
                padding: '18px 20px', marginBottom: 16, display: 'flex', gap: 12
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🇨🇦</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#065f46', marginBottom: 4 }}>
                    Loi modernisant des dispositions législatives en matière de protection des renseignements personnels (Loi 25)
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#065f46', lineHeight: 1.6 }}>
                    BiblioCamp applique les exigences de la Loi 25 du Québec, notamment en matière
                    de transparence, de minimisation des données, de droits des personnes concernées
                    et de gestion des incidents de confidentialité.
                  </p>
                </div>
              </div>
              <p>En vertu de la Loi 25, vous bénéficiez notamment des droits suivants :</p>
              <ul>
                <li><strong>Droit à l'information</strong> : vous êtes informé de la collecte dès la création de compte</li>
                <li><strong>Droit d'accès et de rectification</strong> : exercez-les via Profil ou par courriel</li>
                <li><strong>Droit à la portabilité</strong> : vos données peuvent être exportées sur demande</li>
                <li><strong>Droit de déposer plainte</strong> : auprès de la Commission d'accès à l'information du Québec (<a href="https://www.cai.gouv.qc.ca" target="_blank" rel="noopener noreferrer" style={{ color: '#1a2e4a' }}>cai.gouv.qc.ca</a>)</li>
              </ul>
              <p>
                Notre <strong>responsable de la protection des renseignements personnels</strong> peut
                être joint à{' '}
                <a href="mailto:confidentialite@bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 700 }}>
                  confidentialite@bibliocamp.ca
                </a>.
              </p>
            </Section>

            <Section id="modifications" title="11. Modifications de cette politique">
              <p>
                Nous pouvons modifier cette Politique de confidentialité à tout moment. La date
                de la dernière mise à jour est indiquée en haut de ce document. Pour les changements
                substantiels, nous vous avertirons par courriel ou via une notification sur la Plateforme
                au moins 30 jours avant leur entrée en vigueur.
              </p>
              <p>
                Votre utilisation continue du service après la date d'entrée en vigueur des modifications
                constitue votre acceptation de la politique révisée.
              </p>
            </Section>

            <Section id="contact" title="12. Nous contacter">
              <p>
                Pour toute question relative à la présente politique ou pour exercer vos droits :
              </p>
              <div style={{ background: '#f8fafc', border: '1px solid #e8edf2', borderRadius: 12, padding: '20px 24px', marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Responsable de la protection des données</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 14, color: '#64748b' }}>
                    📧 <a href="mailto:confidentialite@bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 600 }}>confidentialite@bibliocamp.ca</a>
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>(demandes confidentialité)</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>
                    📧 <a href="mailto:info@bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 600 }}>info@bibliocamp.ca</a>
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>(questions générales)</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>
                    🌐 <a href="https://www.bibliocamp.ca" style={{ color: '#1a2e4a', fontWeight: 600 }}>www.bibliocamp.ca</a>
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>
                    📍 Montréal, Québec, Canada
                  </div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e8edf2', fontSize: 13, color: '#94a3b8' }}>
                  Délai de réponse : maximum 30 jours conformément à la Loi 25
                </div>
              </div>
            </Section>

            {/* Lien vers CGU */}
            <div style={{
              marginTop: 48, padding: '20px 24px',
              background: '#f8fafc', borderRadius: 12, border: '1px solid #e8edf2',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Voir aussi</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{"Nos conditions générales d'utilisation"}</div>
              </div>
              <Link href="/cgu" style={{
                background: '#1a2e4a', color: 'white', borderRadius: 8,
                padding: '10px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}>
                {"Conditions d'utilisation →"}
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
            <Link href="/cgu" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{"Conditions d'utilisation"}</Link>
            <Link href="/confidentialite" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 600 }}>Confidentialité</Link>
            <a href="mailto:confidentialite@bibliocamp.ca" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Contact vie privée</a>
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

function SubTitle({ children }) {
  return (
    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a2e4a', margin: '16px 0 8px' }}>
      {children}
    </h3>
  )
}
