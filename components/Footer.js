import Logo from './Logo'

export default function Footer({ onManuelsClick, onTuteursClick }) {
  return (
    <footer style={{ background: '#0f1f35', padding: '36px 20px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Logo variant="light" size="sm" style={{ marginBottom: 28, opacity: 0.85 }} />

        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 28 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Produit</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href="/#manuels"
                onClick={(e) => {
                  e.preventDefault()
                  if (onManuelsClick) onManuelsClick()
                  else window.location.href = '/#manuels'
                }}
                style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}
              >Manuels</a>
              <a
                href="/#tuteurs"
                onClick={(e) => {
                  e.preventDefault()
                  if (onTuteursClick) onTuteursClick()
                  else window.location.href = '/#tuteurs'
                }}
                style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none', cursor: 'pointer' }}
              >Tuteurs</a>
            </div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Légal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="/cgu" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none' }}>Conditions d'utilisation</a>
              <a href="/confidentialite" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none' }}>Confidentialité</a>
            </div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Aide</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="/faq" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textDecoration: 'none' }}>FAQ</a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 18, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
          © 2026 BiblioCamp — Fait pour les étudiants, par des étudiants
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
      `}</style>
    </footer>
  )
}
