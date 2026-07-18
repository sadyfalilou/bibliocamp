import { createClient } from '@supabase/supabase-js'

async function getAdminUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const token = auth.replace('Bearer ', '')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null

  // Source de vérité unique des droits admin : la colonne profiles.is_admin
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return null

  return user
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// GET /api/admin/book-catalog — les 30 derniers manuels ajoutés
export async function GET(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('book_catalog')
    .select('isbn, title, authors, publisher, course_code, source, created_at')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ books: data || [] })
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

// POST /api/admin/book-catalog — ajoute ou met à jour un manuel (upsert sur isbn)
// Accepte du JSON (cover_url déjà connue) ou du multipart/form-data (cover, fichier image)
export async function POST(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const contentType = request.headers.get('content-type') || ''
  const supabase = adminClient()

  let fields
  let coverUrl = null

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    fields = {
      isbn: formData.get('isbn'),
      title: formData.get('title'),
      authors: formData.get('authors'),
      publisher: formData.get('publisher'),
      course_code: formData.get('course_code'),
      source: formData.get('source'),
    }
    const imageFile = formData.get('cover')
    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > MAX_IMAGE_SIZE) {
        return Response.json({ error: "L'image ne peut pas dépasser 5 MB." }, { status: 400 })
      }
      const fileName = `catalog-${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const bytes = await imageFile.arrayBuffer()
      const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, bytes, { contentType: imageFile.type })
      if (uploadErr) return Response.json({ error: "Erreur lors de l'upload de l'image." }, { status: 500 })
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
      coverUrl = urlData.publicUrl
    }
  } else {
    fields = await request.json()
    coverUrl = fields.cover_url?.trim() || null
  }

  const isbn = fields.isbn?.replace(/[-\s]/g, '')
  if (!isbn || !/^\d{10,13}$/.test(isbn)) {
    return Response.json({ error: 'ISBN invalide — doit contenir 10 ou 13 chiffres.' }, { status: 400 })
  }
  if (!fields.title?.trim()) {
    return Response.json({ error: 'Le titre est requis.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('book_catalog')
    .upsert({
      isbn,
      title: fields.title.trim(),
      authors: fields.authors?.trim() || null,
      publisher: fields.publisher?.trim() || null,
      course_code: fields.course_code?.trim() || null,
      cover_url: coverUrl,
      source: fields.source || 'manual',
    })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

// DELETE /api/admin/book-catalog?isbn=xxx
export async function DELETE(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const isbn = new URL(request.url).searchParams.get('isbn')
  if (!isbn) return Response.json({ error: 'ISBN manquant.' }, { status: 400 })

  const supabase = adminClient()
  const { error } = await supabase.from('book_catalog').delete().eq('isbn', isbn)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
