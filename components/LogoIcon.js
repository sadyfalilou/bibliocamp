/**
 * Icône seule du logo BiblioCamp (sans le wordmark) — utilisée comme
 * avatar, ex. pour représenter "Support BiblioCamp" dans la messagerie.
 */
export default function LogoIcon({ size = 28, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect width="40" height="40" rx="10" fill="#00c9a7"/>
      <path d="M8 11C8 9.9 8.9 9 10 9H19V31H10C8.9 31 8 30.1 8 29V11Z" fill="white" fillOpacity="0.9"/>
      <path d="M32 11C32 9.9 31.1 9 30 9H21V31H30C31.1 31 32 30.1 32 29V11Z" fill="white" fillOpacity="0.7"/>
      <rect x="19" y="9" width="2" height="22" fill="#00c9a7"/>
      <rect x="11" y="14" width="5" height="1.5" rx="0.75" fill="#00c9a7" fillOpacity="0.5"/>
      <rect x="11" y="17.5" width="6" height="1.5" rx="0.75" fill="#00c9a7" fillOpacity="0.5"/>
      <rect x="11" y="21" width="4" height="1.5" rx="0.75" fill="#00c9a7" fillOpacity="0.5"/>
      <rect x="22" y="14" width="6" height="1.5" rx="0.75" fill="#1a2e4a" fillOpacity="0.2"/>
      <rect x="22" y="17.5" width="5" height="1.5" rx="0.75" fill="#1a2e4a" fillOpacity="0.2"/>
      <rect x="22" y="21" width="6" height="1.5" rx="0.75" fill="#1a2e4a" fillOpacity="0.2"/>
    </svg>
  )
}
