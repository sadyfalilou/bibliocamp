// Échappe le texte destiné à être interpolé dans du HTML d'email, pour empêcher
// l'injection de markup/liens via des champs contrôlés par l'utilisateur
// (titre d'annonce, nom, etc.) dans un courriel envoyé à un tiers.
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Envoie jusqu'à 100 emails individuels (chaque destinataire ne voit que
// sa propre adresse) via l'endpoint batch de Resend.
export async function sendBatchEmails(emails) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY manquante.')
  if (emails.length === 0) return
  if (emails.length > 100) throw new Error('sendBatchEmails accepte au maximum 100 emails par appel.')

  const from = `BiblioCamp <${process.env.RESEND_FROM_EMAIL || 'alertes@bibliocamp.ca'}>`
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emails.map(e => ({ from, ...e }))),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Resend (batch) a répondu ${res.status}`)
  }
}

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY manquante.')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `BiblioCamp <${process.env.RESEND_FROM_EMAIL || 'alertes@bibliocamp.ca'}>`,
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Resend a répondu ${res.status}`)
  }
}
