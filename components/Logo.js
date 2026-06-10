/**
 * Logo BiblioCamp — composant réutilisable
 * variant: 'light' (texte blanc, pour fonds sombres)
 *          'dark'  (texte foncé, pour fonds clairs)
 *          'color' (texte teal, pour fonds blancs)
 * size: 'sm' | 'md' | 'lg'
 */
export default function Logo({ variant = 'light', size = 'md', style = {} }) {
  const sizes = {
    sm: { icon: 28, fontSize: 14, gap: 8 },
    md: { icon: 34, fontSize: 17, gap: 10 },
    lg: { icon: 44, fontSize: 22, gap: 12 },
  }
  const s = sizes[size]

  const textColor = variant === 'light' ? '#ffffff'
    : variant === 'dark' ? '#1a2e4a'
    : '#00c9a7'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap, ...style }}>
      {/* Icône SVG — livre ouvert stylisé */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Fond arrondi */}
        <rect width="40" height="40" rx="10" fill="#00c9a7"/>

        {/* Page gauche */}
        <path
          d="M8 11C8 9.9 8.9 9 10 9H19V31H10C8.9 31 8 30.1 8 29V11Z"
          fill="white"
          fillOpacity="0.9"
        />
        {/* Page droite */}
        <path
          d="M32 11C32 9.9 31.1 9 30 9H21V31H30C31.1 31 32 30.1 32 29V11Z"
          fill="white"
          fillOpacity="0.7"
        />
        {/* Spine (reliure) */}
        <rect x="19" y="9" width="2" height="22" fill="#00c9a7"/>

        {/* Lignes de texte — page gauche */}
        <rect x="11" y="14" width="5" height="1.5" rx="0.75" fill="#00c9a7" fillOpacity="0.5"/>
        <rect x="11" y="17.5" width="6" height="1.5" rx="0.75" fill="#00c9a7" fillOpacity="0.5"/>
        <rect x="11" y="21" width="4" height="1.5" rx="0.75" fill="#00c9a7" fillOpacity="0.5"/>

        {/* Lignes de texte — page droite */}
        <rect x="22" y="14" width="6" height="1.5" rx="0.75" fill="#1a2e4a" fillOpacity="0.2"/>
        <rect x="22" y="17.5" width="5" height="1.5" rx="0.75" fill="#1a2e4a" fillOpacity="0.2"/>
        <rect x="22" y="21" width="6" height="1.5" rx="0.75" fill="#1a2e4a" fillOpacity="0.2"/>
      </svg>

      {/* Wordmark */}
      <span style={{
        fontFamily: "'Segoe UI', -apple-system, sans-serif",
        fontWeight: 800,
        fontSize: s.fontSize,
        letterSpacing: 0.3,
        color: textColor,
        lineHeight: 1,
        userSelect: 'none',
      }}>
        Biblio<span style={{ fontWeight: 900, color: '#00c9a7', opacity: variant === 'color' ? 1 : 0.9 }}>Camp</span>
      </span>
    </div>
  )
}
