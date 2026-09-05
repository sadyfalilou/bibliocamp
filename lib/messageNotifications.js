import { escapeHtml } from './sendEmail'

// Fenêtres de la notification courriel « nouveau message ».
// Partagées entre la route d'envoi et les textes affichés à l'utilisateur, pour
// qu'un libellé ne puisse jamais mentir sur la cadence réelle.

// Le destinataire a lu la conversation il y a moins de ça : il l'a sous les
// yeux, le badge et le son suffisent, on n'envoie pas de courriel.
export const ACTIVE_WINDOW_MS = 3 * 60_000

// Au plus un courriel par conversation dans cette fenêtre, même si dix messages
// arrivent d'affilée.
export const NOTIF_COOLDOWN_MS = 15 * 60_000

export const NOTIF_COOLDOWN_MINUTES = Math.round(NOTIF_COOLDOWN_MS / 60_000)

export const BASE_URL = 'https://www.bibliocamp.ca'

// Aperçu du message dans le courriel : assez pour reconnaître la conversation,
// pas assez pour rendre la lecture sur BiblioCamp inutile.
const PREVIEW_MAX = 140

export function buildPreview(content) {
  return content.length > PREVIEW_MAX ? `${content.slice(0, PREVIEW_MAX)}…` : content
}

// Gabarit du courriel « nouveau message ». Tous les champs venant de
// l'utilisateur (nom, aperçu) sont échappés : ils atterrissent dans la boîte
// d'un tiers.
export function buildMessageEmail({ senderName, preview, conversationId, unsubToken }) {
  const unsubLine = unsubToken
    ? `· <a href="${BASE_URL}/api/newsletter/unsubscribe?type=messages&token=${unsubToken}" style="color:#888;">Ne plus recevoir ces courriels</a>`
    : ''
  return {
    subject: `💬 ${senderName} t'a envoyé un message sur BiblioCamp`,
    html: `
    <p>Salut !</p>
    <p><strong>${escapeHtml(senderName)}</strong> t'a envoyé un message sur BiblioCamp :</p>
    <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #00c9a7;background:#f8fafc;color:#334155;">
      ${escapeHtml(preview)}
    </blockquote>
    <p style="margin:24px 0;">
      <a href="${BASE_URL}/inbox?conv=${conversationId}" style="background:#00c9a7;color:white;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none;">Répondre →</a>
    </p>
    <p style="color:#888;font-size:12px;margin-top:32px;">
      Tu reçois ce courriel parce qu'un autre étudiant t'a écrit sur BiblioCamp.
      Si la conversation se poursuit, on ne t'enverra pas d'autre avis avant ${NOTIF_COOLDOWN_MINUTES} minutes :
      ouvre ta messagerie pour voir la suite. ${unsubLine}
    </p>
  `,
  }
}
