import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const isbn = new URL(request.url).searchParams.get('isbn')
  const cleaned = isbn?.replace(/[-\s]/g, '')
  if (!cleaned || !/^\d{10,13}$/.test(cleaned)) {
    return NextResponse.json({ error: 'ISBN invalide' }, { status: 400 })
  }

  // 1. Catalogue maison (Coop UQAM, Chenelière) — prioritaire, car
  // mieux couvert que les API généralistes pour les manuels québécois
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { data: catalogBook } = await supabase
      .from('book_catalog')
      .select('title, authors, publisher, course_code, cover_url')
      .eq('isbn', cleaned)
      .maybeSingle()

    if (catalogBook) {
      return NextResponse.json({
        found: true,
        book: {
          title: catalogBook.title,
          authors: catalogBook.authors || '',
          publisher: catalogBook.publisher || '',
          publishedDate: '',
          course: catalogBook.course_code || '',
          cover: catalogBook.cover_url || null,
        }
      })
    }
  } catch { /* passe au fallback */ }

  // 2. Essayer Google Books
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleaned}`)
    const data = await res.json()
    if (data.totalItems > 0) {
      const v = data.items[0].volumeInfo
      return NextResponse.json({ found: true, book: extractGoogle(v) })
    }
  } catch { /* passe au fallback */ }

  // 3. Fallback : Open Library (meilleure couverture francophone)
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleaned}&format=json&jscmd=data`)
    const data = await res.json()
    const key = `ISBN:${cleaned}`
    if (data[key]) {
      const book = data[key]
      const cover = book.cover?.large || book.cover?.medium || book.cover?.small || null
      return NextResponse.json({
        found: true,
        book: {
          title: book.title || '',
          authors: (book.authors || []).map(a => a.name).join(', '),
          publisher: (book.publishers || [])[0]?.name || '',
          publishedDate: book.publish_date || '',
          cover: proxyUrl(cover),
        }
      })
    }
  } catch { /* échec total */ }

  return NextResponse.json({ found: false })
}

function proxyUrl(url) {
  if (!url) return null
  const https = url.replace('http://', 'https://').replace('&edge=curl', '')
  return `/api/cover?url=${encodeURIComponent(https)}`
}

function extractGoogle(v) {
  const cover = v.imageLinks?.extraLarge
    || v.imageLinks?.large
    || v.imageLinks?.medium
    || v.imageLinks?.thumbnail
    || null
  return {
    title: v.title || '',
    authors: (v.authors || []).join(', '),
    publisher: v.publisher || '',
    publishedDate: v.publishedDate || '',
    cover: proxyUrl(cover),
  }
}
