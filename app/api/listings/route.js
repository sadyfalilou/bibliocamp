import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { sendEmail, escapeHtml } from '../../../lib/sendEmail'
import { validateListingFields, validateBundleFields, parseBundleItems, MAX_BUNDLE_IMAGES, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '../../../lib/validation'
import { uploadImages } from '../../../lib/storage'

// Champs communs aux deux formes d'annonce, extraits du formulaire.
function readFields(formData) {
  return {
    title: formData.get('title') || '',
    authors: formData.get('authors') || '',
    isbn: formData.get('isbn') || '',
    course_code: formData.get('course_code') || '',
    price: formData.get('price'),
    original_price: formData.get('original_price') || null,
    description: formData.get('description') || '',
    campus: formData.get('campus') || '',
    meet_campus: formData.get('meet_campus') === 'true',
    meet_city: formData.get('meet_city') === 'true',
    post: formData.get('post') === 'true',
    is_bundle: formData.get('is_bundle') === 'true',
    bundle_items: formData.get('bundle_items') || '',
  }
}

// Une annonce de lot n'a pas d'ISBN : ce qui l'identifie, c'est sa liste de
// titres. La validation bifurque donc selon la forme de l'annonce.
function validateFields(fields) {
  return fields.is_bundle ? validateBundleFields(fields) : validateListingFields(fields)
}

// Colonnes communes envoyées en base, pour la création comme la modification.
function toRow(fields, images) {
  const items = fields.is_bundle ? parseBundleItems(fields.bundle_items) : []
  return {
    title: fields.title.trim(),
    authors: fields.is_bundle ? '' : fields.authors.trim(),
    isbn: fields.is_bundle ? null : (fields.isbn.replace(/[-\s]/g, '') || null),
    course_code: fields.course_code.trim().toUpperCase() || null,
    price: Number(fields.price),
    original_price: fields.original_price ? Number(fields.original_price) : null,
    description: fields.description,
    campus: fields.campus.trim(),
    meet_campus: fields.meet_campus,
    meet_city: fields.meet_city,
    post: fields.post,
    is_bundle: fields.is_bundle,
    bundle_items: fields.is_bundle ? items.join('\n') : null,
    image_url: images[0] || null,
    image_urls: images,
  }
}

async function notifyBookAlerts(supabase, listing) {
  if (!listing.isbn) return
  const { data: alerts } = await supabase
    .from('book_alerts')
    .select('id, email')
    .eq('isbn', listing.isbn)
    .eq('notified', false)
  if (!alerts || alerts.length === 0) return

  const safeTitle = escapeHtml(listing.title)
  const safeIsbn = encodeURIComponent(listing.isbn)
  for (const alert of alerts) {
    try {
      await sendEmail({
        to: alert.email,
        subject: `📚 "${listing.title}" est maintenant disponible sur BiblioCamp`,
        html: `
          <p>Bonne nouvelle !</p>
          <p>Le manuel <strong>${safeTitle}</strong> que tu attendais vient d'être mis en vente sur BiblioCamp, à <strong>${Number(listing.price)} $</strong>.</p>
          <p><a href="https://www.bibliocamp.ca/book/${safeIsbn}">Voir l'annonce →</a></p>
          <p style="color:#888;font-size:12px">Tu reçois ce courriel parce que tu t'es inscrit à une alerte pour ce manuel sur BiblioCamp.</p>
        `,
      })
    } catch (err) {
      Sentry.captureException(err, { extra: { route: 'POST /api/listings', action: 'notifyBookAlerts', alertId: alert.id } })
    }
  }

  await supabase
    .from('book_alerts')
    .update({ notified: true, notified_at: new Date().toISOString() })
    .in('id', alerts.map(a => a.id))
}

// Rassemble les URLs d'images finales d'une annonce.
// Une annonce simple garde une image (couverture ou fichier) ; un lot en accepte
// plusieurs, comme les annonces de colocs.
async function collectImages(supabase, formData, fields, userId, route) {
  const kept = formData.getAll('keepImages').filter(Boolean)
  const files = formData.getAll('images').filter(f => f && f.size > 0)
  const single = formData.get('image')
  if (single && single.size > 0) files.push(single)

  const max = fields.is_bundle ? MAX_BUNDLE_IMAGES : 1
  if (kept.length + files.length > max) {
    return { error: `Maximum ${max} photo${max > 1 ? 's' : ''} par annonce.`, status: 400 }
  }

  const bad = files.find(f => !ALLOWED_IMAGE_TYPES.includes(f.type) || f.size > MAX_IMAGE_SIZE)
  if (bad) {
    return {
      error: ALLOWED_IMAGE_TYPES.includes(bad.type)
        ? "L'image ne peut pas dépasser 5 MB."
        : 'Format image non supporté. Utilise JPG, PNG ou WebP.',
      status: 400,
    }
  }

  const uploaded = files.length
    ? await uploadImages(supabase, files, { userId, route, prefix: fields.is_bundle ? 'lot-' : '' })
    : { urls: [] }
  if (uploaded.error) return { error: uploaded.error, status: 500 }

  // Repli sur l'URL de couverture (Google Books) ou l'image déjà en place.
  const fallback = formData.get('image_url') || formData.get('existing_image_url') || null
  const images = [...kept, ...uploaded.urls]
  if (images.length === 0 && fallback) images.push(fallback)
  return { images }
}

async function getUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  return user
}

// POST /api/listings — créer une annonce
export async function POST(request) {
  const user = await getUser(request)
  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('phone_verified')
    .eq('id', user.id)
    .single()
  if (!sellerProfile?.phone_verified) {
    return Response.json({ error: 'Numéro de téléphone non vérifié' }, { status: 403 })
  }

  const formData = await request.formData()
  const fields = readFields(formData)

  const err = validateFields(fields)
  if (err) return Response.json({ error: err }, { status: 400 })

  const imageResult = await collectImages(supabase, formData, fields, user.id, 'POST /api/listings')
  if (imageResult.error) return Response.json({ error: imageResult.error }, { status: imageResult.status })

  const { data, error } = await supabase.from('listings').insert([{
    ...toRow(fields, imageResult.images),
    user_id: user.id
  }]).select().single()

  if (error) {
    Sentry.captureException(error, { extra: { route: 'POST /api/listings', action: 'insert', userId: user.id } })
    return Response.json({ error: 'Erreur lors de la création.' }, { status: 500 })
  }

  await notifyBookAlerts(supabase, data)

  return Response.json({ listing: data })
}

// PATCH /api/listings — modifier une annonce
export async function PATCH(request) {
  const user = await getUser(request)
  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const formData = await request.formData()
  const listingId = formData.get('listing_id')
  if (!listingId) return Response.json({ error: 'ID annonce manquant.' }, { status: 400 })

  const fields = readFields(formData)

  const err = validateFields(fields)
  if (err) return Response.json({ error: err }, { status: 400 })

  const imageResult = await collectImages(supabase, formData, fields, user.id, 'PATCH /api/listings')
  if (imageResult.error) return Response.json({ error: imageResult.error }, { status: imageResult.status })

  const { data, error } = await supabase
    .from('listings')
    .update(toRow(fields, imageResult.images))
    .eq('id', listingId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) {
    if (error) Sentry.captureException(error, { extra: { route: 'PATCH /api/listings', action: 'update', userId: user.id, listingId } })
    return Response.json({ error: 'Annonce introuvable ou accès refusé.' }, { status: 403 })
  }
  return Response.json({ listing: data })
}

// DELETE /api/listings?id=xxx — supprimer une annonce et son image associée
export async function DELETE(request) {
  const user = await getUser(request)
  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  const listingId = new URL(request.url).searchParams.get('id')
  if (!listingId) return Response.json({ error: 'ID annonce manquant.' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: listing, error: fetchErr } = await supabase
    .from('listings')
    .select('id, image_url, image_urls, user_id')
    .eq('id', listingId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !listing) return Response.json({ error: 'Annonce introuvable ou accès refusé.' }, { status: 403 })

  // Un lot porte plusieurs photos : on les supprime toutes du bucket.
  const urls = listing.image_urls?.length ? listing.image_urls : (listing.image_url ? [listing.image_url] : [])
  const fileNames = urls.map(u => u.split('/').pop()).filter(Boolean)
  if (fileNames.length) await supabase.storage.from('images').remove(fileNames)

  const { error: deleteErr } = await supabase.from('listings').delete().eq('id', listingId).eq('user_id', user.id)
  if (deleteErr) {
    Sentry.captureException(deleteErr, { extra: { route: 'DELETE /api/listings', action: 'delete', userId: user.id, listingId } })
    return Response.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
