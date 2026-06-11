import { NextResponse } from 'next/server'

export async function GET(request) {
  const isbn = new URL(request.url).searchParams.get('isbn')
  const cleaned = isbn?.replace(/[-\s]/g, '')
  if (!cleaned || !/^\d{10,13}$/.test(cleaned)) {
    return NextResponse.json({ error: 'ISBN invalide' }, { status: 400 })
  }

  // 1. Essayer Google Books
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleaned}`)
    const data = await res.json()
    if (data.totalItems > 0) {
      const v = data.items[0].volumeInfo
      return NextResponse.json({ found: true, book: extractGoogle(v) })
    }
  } catch { /* passe au fallback */ }

  // 2. Fallback : Open Library (meilleure couverture francophone)
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
          cover: cover || null,
        }
      })
    }
  } catch { /* échec total */ }

  return NextResponse.json({ found: false })
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
    cover: cover ? cover.replace('http://', 'https://').replace('&edge=curl', '') : null,
  }
}
