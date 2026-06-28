'use client'

import { DiagnosticCardLink } from './InternationalCta'

const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20, display: 'block', textDecoration: 'none' }

function CardInner({ icon, title, desc }) {
  return (
    <>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#1a2e4a', margin: '0 0 4px' }}>{title}</p>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>{desc}</p>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f6e56' }}>Commencer →</span>
    </>
  )
}

export default function ServiceCard({ icon, title, desc, action, href }) {
  if (action === 'diagnostic') {
    return (
      <DiagnosticCardLink style={cardStyle}>
        <CardInner icon={icon} title={title} desc={desc} />
      </DiagnosticCardLink>
    )
  }
  if (action === 'external') {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={cardStyle}>
        <CardInner icon={icon} title={title} desc={desc} />
      </a>
    )
  }
  return (
    <a href={href} style={cardStyle}>
      <CardInner icon={icon} title={title} desc={desc} />
    </a>
  )
}
