import { createClient } from '@supabase/supabase-js'

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

async function getAdminUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const token = auth.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user?.email) return null

  const adminEmails = getAdminEmails()
  if (!adminEmails.includes(user.email.toLowerCase())) return null

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

// POST /api/admin/book-catalog — ajoute ou met à jour un manuel (upsert sur isbn)
export async function POST(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const body = await request.json()
  const isbn = body.isbn?.replace(/[-\s]/g, '')
  if (!isbn || !/^\d{10,13}$/.test(isbn)) {
    return Response.json({ error: 'ISBN invalide — doit contenir 10 ou 13 chiffres.' }, { status: 400 })
  }
  if (!body.title?.trim()) {
    return Response.json({ error: 'Le titre est requis.' }, { status: 400 })
  }

  const supabase = adminClient()
  const { error } = await supabase
    .from('book_catalog')
    .upsert({
      isbn,
      title: body.title.trim(),
      authors: body.authors?.trim() || null,
      publisher: body.publisher?.trim() || null,
      course_code: body.course_code?.trim() || null,
      cover_url: body.cover_url?.trim() || null,
      source: body.source || 'manual',
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
