import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RATE_LIMIT = 10
const WINDOW_MS = 3_600_000 // 1h

// Cette route est publique (un visiteur sans compte laisse son courriel sur une
// fiche manuel). On limite le débit par IP pour empêcher l'inondation de la
// table book_alerts et l'envoi d'alertes à des adresses tierces en masse.
async function checkRateLimit(supabase, ip) {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()
  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('key', ip)
    .gte('created_at', windowStart)

  if (error) return true // ne pas bloquer une inscription légitime si la table est indisponible
  if (count >= RATE_LIMIT) return false

  await supabase.from('rate_limits').insert({ key: ip })
  return true
}

export async function POST(request) {
  const { email, isbn, title } = await request.json()

  if (!email || !EMAIL_RE.test(email)) return Response.json({ error: 'Courriel invalide.' }, { status: 400 })
  if (!isbn || !/^\d{10,13}$/.test(isbn.replace(/[-\s]/g, ''))) return Response.json({ error: 'ISBN invalide.' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // x-forwarded-for peut contenir "client, proxy1, proxy2" ; seule la 1re entrée
  // est l'IP réelle du client (les autres sont contrôlables par l'appelant).
  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
  const allowed = await checkRateLimit(supabase, `book-alert:${ip}`)
  if (!allowed) {
    return Response.json({ error: 'Trop de demandes. Réessaie dans une heure.' }, { status: 429 })
  }

  const { error } = await supabase.from('book_alerts').upsert(
    {
      email: email.trim().toLowerCase(),
      isbn: isbn.replace(/[-\s]/g, ''),
      title: title || null,
      notified: false,
      notified_at: null,
    },
    { onConflict: 'email,isbn' }
  )

  if (error) {
    Sentry.captureException(error, { extra: { route: 'POST /api/book-alerts', isbn } })
    return Response.json({ error: "Erreur lors de l'inscription à l'alerte." }, { status: 500 })
  }

  return Response.json({ ok: true })
}
