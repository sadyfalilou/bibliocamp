import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { sendBatchEmails, escapeHtml } from '../../../../lib/sendEmail'
import { validateListingFields } from '../../../../lib/validation'

export const MAX_PER_BATCH = 20
export const MAX_PER_DAY = 40
const DAY_MS = 86_400_000

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function getUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const { data: { user } } = await adminClient().auth.getUser(auth.slice(7))
  return user
}

// Nombre d'annonces déjà publiées par ce vendeur dans les 24 dernières heures.
// Publier en lot rend l'inondation du marketplace bon marché : on plafonne.
async function countToday(supabase, userId) {
  const since = new Date(Date.now() - DAY_MS).toISOString()
  const { count, error } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since)
  if (error) return 0 // ne pas bloquer une publication légitime si le comptage échoue
  return count ?? 0
}

// Une seule requête pour toutes les alertes du lot, puis un seul appel batch à
// Resend — au lieu d'une vague d'envois séquentiels par annonce.
async function notifyBookAlerts(supabase, listings) {
  const isbns = [...new Set(listings.map(l => l.isbn).filter(Boolean))]
  if (isbns.length === 0) return

  const { data: alerts } = await supabase
    .from('book_alerts')
    .select('id, email, isbn')
    .in('isbn', isbns)
    .eq('notified', false)
  if (!alerts || alerts.length === 0) return

  const byIsbn = {}
  listings.forEach(l => { if (l.isbn) byIsbn[l.isbn] = l })

  const emails = alerts
    .map(alert => {
      const listing = byIsbn[alert.isbn]
      if (!listing) return null
      return {
        to: alert.email,
        subject: `📚 "${listing.title}" est maintenant disponible sur BiblioCamp`,
        html: `
          <p>Bonne nouvelle !</p>
          <p>Le manuel <strong>${escapeHtml(listing.title)}</strong> que tu attendais vient d'être mis en vente sur BiblioCamp, à <strong>${Number(listing.price)} $</strong>.</p>
          <p><a href="https://www.bibliocamp.ca/book/${encodeURIComponent(listing.isbn)}">Voir l'annonce →</a></p>
          <p style="color:#888;font-size:12px">Tu reçois ce courriel parce que tu t'es inscrit à une alerte pour ce manuel sur BiblioCamp.</p>
        `,
      }
    })
    .filter(Boolean)
  if (emails.length === 0) return

  await sendBatchEmails(emails)
  await supabase
    .from('book_alerts')
    .update({ notified: true, notified_at: new Date().toISOString() })
    .in('id', alerts.map(a => a.id))
}

// POST { items: [...] } — publie plusieurs annonces d'un coup.
// Succès partiel assumé : les lignes valides sont publiées, les autres sont
// renvoyées avec leur motif pour que le vendeur ne reperde pas sa saisie.
export async function POST(request) {
  const user = await getUser(request)
  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  const supabase = adminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified')
    .eq('id', user.id)
    .single()
  if (!profile?.phone_verified) {
    return Response.json({ error: 'Numéro de téléphone non vérifié' }, { status: 403 })
  }

  const { items } = await request.json()
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: 'Aucun manuel à publier.' }, { status: 400 })
  }
  if (items.length > MAX_PER_BATCH) {
    return Response.json({ error: `Maximum ${MAX_PER_BATCH} manuels par lot.` }, { status: 400 })
  }

  const alreadyToday = await countToday(supabase, user.id)
  if (alreadyToday >= MAX_PER_DAY) {
    return Response.json({ error: `Tu as atteint la limite de ${MAX_PER_DAY} annonces par jour.` }, { status: 429 })
  }
  const remaining = MAX_PER_DAY - alreadyToday

  // Annonces actives déjà publiées par ce vendeur : on refuse les doublons
  // d'ISBN plutôt que d'encombrer son propre catalogue.
  const { data: existing } = await supabase
    .from('listings')
    .select('isbn')
    .eq('user_id', user.id)
    .eq('status', 'active')
  const existingIsbns = new Set((existing ?? []).map(l => l.isbn).filter(Boolean))

  const rejected = []
  const toInsert = []
  const seenInBatch = new Set()

  items.forEach((item, index) => {
    const fields = {
      title: item.title || '',
      authors: item.authors || '',
      isbn: item.isbn || '',
      course_code: item.course_code || '',
      price: item.price,
      original_price: item.original_price || null,
      description: item.description || '',
      campus: item.campus || '',
      meet_campus: !!item.meet_campus,
      meet_city: !!item.meet_city,
      post: !!item.post,
    }

    const err = validateListingFields(fields)
    if (err) return rejected.push({ index, error: err })

    const cleanIsbn = fields.isbn.replace(/[-\s]/g, '')
    if (existingIsbns.has(cleanIsbn)) {
      return rejected.push({ index, error: 'Tu as déjà une annonce active pour cet ISBN.' })
    }
    if (seenInBatch.has(cleanIsbn)) {
      return rejected.push({ index, error: 'Cet ISBN apparaît deux fois dans le lot.' })
    }
    if (toInsert.length >= remaining) {
      return rejected.push({ index, error: `Limite de ${MAX_PER_DAY} annonces par jour atteinte.` })
    }
    seenInBatch.add(cleanIsbn)

    toInsert.push({
      title: fields.title.trim(),
      authors: fields.authors.trim(),
      isbn: cleanIsbn || null,
      course_code: fields.course_code.trim().toUpperCase() || null,
      price: Number(fields.price),
      original_price: fields.original_price ? Number(fields.original_price) : null,
      description: fields.description,
      campus: fields.campus.trim(),
      meet_campus: fields.meet_campus,
      meet_city: fields.meet_city,
      post: fields.post,
      image_url: item.image_url || null,
      user_id: user.id,
    })
  })

  if (toInsert.length === 0) {
    return Response.json({ created: [], rejected }, { status: 400 })
  }

  const { data: created, error } = await supabase.from('listings').insert(toInsert).select()
  if (error) {
    Sentry.captureException(error, { extra: { route: 'POST /api/listings/batch', action: 'insert', userId: user.id, count: toInsert.length } })
    return Response.json({ error: 'Erreur lors de la publication.' }, { status: 500 })
  }

  try {
    await notifyBookAlerts(supabase, created)
  } catch (err) {
    Sentry.captureException(err, { extra: { route: 'POST /api/listings/batch', action: 'notifyBookAlerts', userId: user.id } })
  }

  return Response.json({ created, rejected })
}
