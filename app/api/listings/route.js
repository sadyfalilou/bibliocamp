import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { sendEmail } from '../../../lib/sendEmail'

const VALID_ETATS = ['Neuf', 'Très bon état', 'Bon état', 'Acceptable']
const VALID_DOMAINS = ['Sciences', 'Santé', 'Droit', 'Arts', 'Éducation', 'Génie', 'Commerce', 'Autres']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

function validate({ title, authors, isbn, course_code, price, original_price, campus, description, domain, meet_campus, meet_city, post }) {
  if (!title || title.trim().length === 0) return 'Le titre est obligatoire.'
  if (title.trim().length > 150) return 'Le titre ne peut pas dépasser 150 caractères.'
  if (authors && authors.length > 200) return 'Le champ auteurs ne peut pas dépasser 200 caractères.'
  if (!isbn || isbn.trim().length === 0) return "L'ISBN est obligatoire."
  if (!/^\d{10,13}$/.test(isbn.replace(/[-\s]/g, ''))) return 'ISBN invalide — doit contenir 10 ou 13 chiffres.'
  if (course_code && course_code.length > 20) return 'Le code de cours ne peut pas dépasser 20 caractères.'
  if (!price || isNaN(Number(price)) || Number(price) <= 0 || Number(price) > 9999) return 'Le prix doit être entre 1 $ et 9 999 $.'
  if (original_price && (isNaN(Number(original_price)) || Number(original_price) <= 0 || Number(original_price) > 9999)) return 'Le prix neuf doit être entre 1 $ et 9 999 $.'
  if (original_price && Number(original_price) <= Number(price)) return 'Le prix neuf doit être supérieur au prix de vente.'
  if (campus && campus.length > 100) return 'Le campus ne peut pas dépasser 100 caractères.'
  if (!description || description.trim().length === 0) return "L'état du livre est obligatoire."
  if (!VALID_ETATS.includes(description)) return 'État du livre invalide.'
  if (domain && !VALID_DOMAINS.includes(domain)) return 'Domaine invalide.'
  if (!meet_campus && !meet_city && !post) return 'Choisis au moins une méthode de transaction.'
  return null
}

async function notifyBookAlerts(supabase, listing) {
  if (!listing.isbn) return
  const { data: alerts } = await supabase
    .from('book_alerts')
    .select('id, email')
    .eq('isbn', listing.isbn)
    .eq('notified', false)
  if (!alerts || alerts.length === 0) return

  for (const alert of alerts) {
    try {
      await sendEmail({
        to: alert.email,
        subject: `📚 "${listing.title}" est maintenant disponible sur BiblioCamp`,
        html: `
          <p>Bonne nouvelle !</p>
          <p>Le manuel <strong>${listing.title}</strong> que tu attendais vient d'être mis en vente sur BiblioCamp, à <strong>${listing.price} $</strong>.</p>
          <p><a href="https://www.bibliocamp.ca/book/${listing.isbn}">Voir l'annonce →</a></p>
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
  const meetCampus = formData.get('meet_campus') === 'true'
  const meetCity = formData.get('meet_city') === 'true'
  const postVal = formData.get('post') === 'true'
  const fields = {
    title: formData.get('title') || '',
    authors: formData.get('authors') || '',
    isbn: formData.get('isbn') || '',
    course_code: formData.get('course_code') || '',
    price: formData.get('price'),
    original_price: formData.get('original_price') || null,
    description: formData.get('description') || '',
    campus: formData.get('campus') || '',
    domain: formData.get('domain') || '',
    meet_campus: meetCampus,
    meet_city: meetCity,
    post: postVal,
  }

  const err = validate(fields)
  if (err) return Response.json({ error: err }, { status: 400 })

  // Validation et upload image
  let imageUrl = formData.get('image_url') || null // URL Google Books si pas de fichier uploadé
  const imageFile = formData.get('image')
  if (imageFile && imageFile.size > 0) {
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return Response.json({ error: 'Format image non supporté. Utilise JPG, PNG ou WebP.' }, { status: 400 })
    }
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return Response.json({ error: "L'image ne peut pas dépasser 5 MB." }, { status: 400 })
    }
    const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const bytes = await imageFile.arrayBuffer()
    const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, bytes, { contentType: imageFile.type })
    if (uploadErr) {
      Sentry.captureException(uploadErr, { extra: { route: 'POST /api/listings', action: 'image-upload', userId: user.id } })
      return Response.json({ error: "Erreur lors de l'upload de l'image." }, { status: 500 })
    }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
    imageUrl = urlData.publicUrl
  }

  const { data, error } = await supabase.from('listings').insert([{
    title: fields.title.trim(),
    authors: fields.authors.trim(),
    isbn: fields.isbn.replace(/[-\s]/g, '') || null,
    course_code: fields.course_code.trim().toUpperCase() || null,
    price: Number(fields.price),
    original_price: fields.original_price ? Number(fields.original_price) : null,
    description: fields.description,
    campus: fields.campus.trim(),
    domain: fields.domain || null,
    meet_campus: fields.meet_campus,
    meet_city: fields.meet_city,
    post: fields.post,
    image_url: imageUrl,
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

  const meetCampusPatch = formData.get('meet_campus') === 'true'
  const meetCityPatch = formData.get('meet_city') === 'true'
  const postPatch = formData.get('post') === 'true'
  const fields = {
    title: formData.get('title') || '',
    authors: formData.get('authors') || '',
    isbn: formData.get('isbn') || '',
    course_code: formData.get('course_code') || '',
    price: formData.get('price'),
    original_price: formData.get('original_price') || null,
    description: formData.get('description') || '',
    campus: formData.get('campus') || '',
    domain: formData.get('domain') || '',
    meet_campus: meetCampusPatch,
    meet_city: meetCityPatch,
    post: postPatch,
  }

  const err = validate(fields)
  if (err) return Response.json({ error: err }, { status: 400 })

  // Image
  let imageUrl = formData.get('existing_image_url') || null
  const imageFile = formData.get('image')
  if (imageFile && imageFile.size > 0) {
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return Response.json({ error: 'Format image non supporté. Utilise JPG, PNG ou WebP.' }, { status: 400 })
    }
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return Response.json({ error: "L'image ne peut pas dépasser 5 MB." }, { status: 400 })
    }
    const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const bytes = await imageFile.arrayBuffer()
    const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, bytes, { contentType: imageFile.type })
    if (uploadErr) {
      Sentry.captureException(uploadErr, { extra: { route: 'PATCH /api/listings', action: 'image-upload', userId: user.id } })
      return Response.json({ error: "Erreur lors de l'upload de l'image." }, { status: 500 })
    }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
    imageUrl = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('listings')
    .update({
      title: fields.title.trim(),
      authors: fields.authors.trim(),
      isbn: fields.isbn.replace(/[-\s]/g, '') || null,
      course_code: fields.course_code.trim().toUpperCase() || null,
      price: Number(fields.price),
      original_price: fields.original_price ? Number(fields.original_price) : null,
      description: fields.description,
      campus: fields.campus.trim(),
      domain: fields.domain || null,
      meet_campus: fields.meet_campus,
      meet_city: fields.meet_city,
      post: fields.post,
      image_url: imageUrl
    })
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
    .select('id, image_url, user_id')
    .eq('id', listingId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !listing) return Response.json({ error: 'Annonce introuvable ou accès refusé.' }, { status: 403 })

  if (listing.image_url) {
    const fileName = listing.image_url.split('/').pop()
    if (fileName) await supabase.storage.from('images').remove([fileName])
  }

  const { error: deleteErr } = await supabase.from('listings').delete().eq('id', listingId).eq('user_id', user.id)
  if (deleteErr) {
    Sentry.captureException(deleteErr, { extra: { route: 'DELETE /api/listings', action: 'delete', userId: user.id, listingId } })
    return Response.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
