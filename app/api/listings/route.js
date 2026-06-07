import { createClient } from '@supabase/supabase-js'

const VALID_ETATS = ['Neuf', 'Très bon état', 'Bon état', 'Acceptable']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

function validate({ title, authors, isbn, course_code, price, original_price, campus, description }) {
  if (!title || title.trim().length === 0) return 'Le titre est obligatoire.'
  if (title.trim().length > 150) return 'Le titre ne peut pas dépasser 150 caractères.'
  if (authors && authors.length > 200) return 'Le champ auteurs ne peut pas dépasser 200 caractères.'
  if (isbn && !/^\d{10,13}$/.test(isbn.replace(/[-\s]/g, ''))) return 'ISBN invalide — doit contenir 10 ou 13 chiffres.'
  if (course_code && course_code.length > 20) return 'Le code de cours ne peut pas dépasser 20 caractères.'
  if (!price || isNaN(Number(price)) || Number(price) <= 0 || Number(price) > 9999) return 'Le prix doit être entre 1 $ et 9 999 $.'
  if (original_price && (isNaN(Number(original_price)) || Number(original_price) <= 0 || Number(original_price) > 9999)) return 'Le prix neuf doit être entre 1 $ et 9 999 $.'
  if (original_price && Number(original_price) <= Number(price)) return 'Le prix neuf doit être supérieur au prix de vente.'
  if (campus && campus.length > 100) return 'Le campus ne peut pas dépasser 100 caractères.'
  if (description && !VALID_ETATS.includes(description)) return 'État du livre invalide.'
  return null
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

  const formData = await request.formData()
  const fields = {
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
  }

  const err = validate(fields)
  if (err) return Response.json({ error: err }, { status: 400 })

  // Validation et upload image
  let imageUrl = null
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
    if (uploadErr) return Response.json({ error: "Erreur lors de l'upload de l'image." }, { status: 500 })
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
    meet_campus: fields.meet_campus,
    meet_city: fields.meet_city,
    post: fields.post,
    image_url: imageUrl,
    user_id: user.id
  }]).select().single()

  if (error) return Response.json({ error: 'Erreur lors de la création.' }, { status: 500 })
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

  const fields = {
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
    if (uploadErr) return Response.json({ error: "Erreur lors de l'upload de l'image." }, { status: 500 })
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
      meet_campus: fields.meet_campus,
      meet_city: fields.meet_city,
      post: fields.post,
      image_url: imageUrl
    })
    .eq('id', listingId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) return Response.json({ error: 'Annonce introuvable ou accès refusé.' }, { status: 403 })
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
  if (deleteErr) return Response.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })

  return Response.json({ ok: true })
}
