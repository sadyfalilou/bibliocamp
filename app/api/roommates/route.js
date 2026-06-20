import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

const VALID_ROOM_TYPES = ['chambre_privee', 'chambre_partagee', 'appartement_complet']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_IMAGES = 6

function validate({ title, rent_price, room_type }) {
  if (!title || title.trim().length === 0) return 'Le titre est obligatoire.'
  if (title.trim().length > 150) return 'Le titre ne peut pas dépasser 150 caractères.'
  if (!rent_price || isNaN(Number(rent_price)) || Number(rent_price) <= 0 || Number(rent_price) > 9999) return 'Le loyer doit être entre 1 $ et 9 999 $.'
  if (!room_type || !VALID_ROOM_TYPES.includes(room_type)) return 'Type de logement invalide.'
  return null
}

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

// Upload une liste de File vers le bucket 'images', retourne {error} ou {urls}
async function uploadImages(supabase, imageFiles, userId, route) {
  const urls = []
  for (const imageFile of imageFiles) {
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return { error: 'Format image non supporté. Utilise JPG, PNG ou WebP.' }
    }
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return { error: "Chaque image ne peut pas dépasser 5 MB." }
    }
    const fileName = `coloc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const bytes = await imageFile.arrayBuffer()
    const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, bytes, { contentType: imageFile.type })
    if (uploadErr) {
      Sentry.captureException(uploadErr, { extra: { route, action: 'image-upload', userId } })
      return { error: "Erreur lors de l'upload d'une image." }
    }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
    urls.push(urlData.publicUrl)
  }
  return { urls }
}

// GET /api/roommates — liste publique des annonces actives, avec filtres optionnels
export async function GET(request) {
  const url = new URL(request.url)
  const city = url.searchParams.get('city')
  const maxPrice = url.searchParams.get('maxPrice')
  const roomType = url.searchParams.get('roomType')

  const supabase = adminClient()
  let query = supabase
    .from('roommate_listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (city) query = query.ilike('city', `%${city}%`)
  if (maxPrice) query = query.lte('rent_price', Number(maxPrice))
  if (roomType) query = query.eq('room_type', roomType)

  const { data, error } = await query
  if (error) return Response.json({ error: 'Erreur lors du chargement.' }, { status: 500 })
  return Response.json({ listings: data || [] })
}

// POST /api/roommates — publier une annonce
export async function POST(request) {
  const user = await getUser(request)
  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  const supabase = adminClient()
  const formData = await request.formData()
  const fields = {
    title: formData.get('title') || '',
    description: formData.get('description') || '',
    rent_price: formData.get('rent_price'),
    room_type: formData.get('room_type') || '',
    campus: formData.get('campus') || '',
    city: formData.get('city') || '',
    available_from: formData.get('available_from') || null,
    num_spots: formData.get('num_spots') || 1,
  }

  const err = validate(fields)
  if (err) return Response.json({ error: err }, { status: 400 })

  const imageFiles = formData.getAll('images').filter(f => f && f.size > 0)
  if (imageFiles.length > MAX_IMAGES) {
    return Response.json({ error: `Maximum ${MAX_IMAGES} photos par annonce.` }, { status: 400 })
  }

  const uploadResult = await uploadImages(supabase, imageFiles, user.id, 'POST /api/roommates')
  if (uploadResult.error) return Response.json({ error: uploadResult.error }, { status: 500 })
  const imageUrls = uploadResult.urls

  const { data, error } = await supabase.from('roommate_listings').insert([{
    title: fields.title.trim(),
    description: fields.description.trim() || null,
    rent_price: Number(fields.rent_price),
    room_type: fields.room_type,
    campus: fields.campus.trim() || null,
    city: fields.city.trim() || null,
    available_from: fields.available_from || null,
    num_spots: Number(fields.num_spots) || 1,
    image_url: imageUrls[0] || null,
    image_urls: imageUrls,
    user_id: user.id,
  }]).select().single()

  if (error) {
    Sentry.captureException(error, { extra: { route: 'POST /api/roommates', action: 'insert', userId: user.id } })
    return Response.json({ error: 'Erreur lors de la création.' }, { status: 500 })
  }
  return Response.json({ listing: data })
}

// PATCH /api/roommates — modifier le statut (JSON) ou l'annonce complete (multipart)
export async function PATCH(request) {
  const user = await getUser(request)
  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  const supabase = adminClient()
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const id = formData.get('id')
    if (!id) return Response.json({ error: 'ID annonce manquant.' }, { status: 400 })

    const { data: existing, error: fetchErr } = await supabase
      .from('roommate_listings')
      .select('id, image_url, image_urls, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (fetchErr || !existing) return Response.json({ error: 'Annonce introuvable ou accès refusé.' }, { status: 403 })

    const fields = {
      title: formData.get('title') || '',
      description: formData.get('description') || '',
      rent_price: formData.get('rent_price'),
      room_type: formData.get('room_type') || '',
      campus: formData.get('campus') || '',
      city: formData.get('city') || '',
      available_from: formData.get('available_from') || null,
      num_spots: formData.get('num_spots') || 1,
    }
    const err = validate(fields)
    if (err) return Response.json({ error: err }, { status: 400 })

    const keptImages = formData.getAll('keepImages').filter(Boolean)
    const newFiles = formData.getAll('images').filter(f => f && f.size > 0)
    if (keptImages.length + newFiles.length > MAX_IMAGES) {
      return Response.json({ error: `Maximum ${MAX_IMAGES} photos par annonce.` }, { status: 400 })
    }

    const uploadResult = await uploadImages(supabase, newFiles, user.id, 'PATCH /api/roommates')
    if (uploadResult.error) return Response.json({ error: uploadResult.error }, { status: 500 })

    const finalImages = [...keptImages, ...uploadResult.urls]
    const previousImages = existing.image_urls?.length ? existing.image_urls : (existing.image_url ? [existing.image_url] : [])
    const removedImages = previousImages.filter(u => !finalImages.includes(u))
    const removedFileNames = removedImages.map(u => u.split('/').pop()).filter(Boolean)
    if (removedFileNames.length) await supabase.storage.from('images').remove(removedFileNames)

    const { data, error } = await supabase.from('roommate_listings').update({
      title: fields.title.trim(),
      description: fields.description.trim() || null,
      rent_price: Number(fields.rent_price),
      room_type: fields.room_type,
      campus: fields.campus.trim() || null,
      city: fields.city.trim() || null,
      available_from: fields.available_from || null,
      num_spots: Number(fields.num_spots) || 1,
      image_url: finalImages[0] || null,
      image_urls: finalImages,
    }).eq('id', id).eq('user_id', user.id).select().single()

    if (error) {
      Sentry.captureException(error, { extra: { route: 'PATCH /api/roommates', action: 'update', userId: user.id, id } })
      return Response.json({ error: 'Erreur lors de la modification.' }, { status: 500 })
    }
    return Response.json({ listing: data })
  }

  const { id, status } = await request.json()
  if (!id || !['active', 'rented'].includes(status)) {
    return Response.json({ error: 'Paramètres invalides.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('roommate_listings')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) return Response.json({ error: 'Annonce introuvable ou accès refusé.' }, { status: 403 })
  return Response.json({ listing: data })
}

// DELETE /api/roommates?id=xxx
export async function DELETE(request) {
  const user = await getUser(request)
  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'ID annonce manquant.' }, { status: 400 })

  const supabase = adminClient()
  const { data: listing, error: fetchErr } = await supabase
    .from('roommate_listings')
    .select('id, image_url, image_urls, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !listing) return Response.json({ error: 'Annonce introuvable ou accès refusé.' }, { status: 403 })

  const urls = listing.image_urls?.length ? listing.image_urls : (listing.image_url ? [listing.image_url] : [])
  const fileNames = urls.map(u => u.split('/').pop()).filter(Boolean)
  if (fileNames.length) await supabase.storage.from('images').remove(fileNames)

  const { error: deleteErr } = await supabase.from('roommate_listings').delete().eq('id', id).eq('user_id', user.id)
  if (deleteErr) {
    Sentry.captureException(deleteErr, { extra: { route: 'DELETE /api/roommates', action: 'delete', userId: user.id, id } })
    return Response.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })
  }
  return Response.json({ ok: true })
}
