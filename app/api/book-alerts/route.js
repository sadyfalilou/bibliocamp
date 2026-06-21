import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request) {
  const { email, isbn, title } = await request.json()

  if (!email || !EMAIL_RE.test(email)) return Response.json({ error: 'Courriel invalide.' }, { status: 400 })
  if (!isbn || !/^\d{10,13}$/.test(isbn.replace(/[-\s]/g, ''))) return Response.json({ error: 'ISBN invalide.' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

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
