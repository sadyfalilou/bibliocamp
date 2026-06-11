import { NextResponse } from 'next/server'

export async function GET(request) {
  const isbn = new URL(request.url).searchParams.get('isbn')
  if (!isbn || !/^\d{10,13}$/.test(isbn.replace(/[-\s]/g, ''))) {
    return NextResponse.json({ error: 'ISBN invalide' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&langRestrict=fr`,
      { next: { revalidate: 3600 } } // cache 1h
    )
    const data = await res.json()

    if (!data.totalItems || data.totalItems === 0) {
      // Essayer sans restriction de langue
      const res2 = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
      const data2 = await res2.json()
      if (!data2.totalItems || data2.totalItems === 0) {
        return NextResponse.json({ found: false })
      }
      const book = data2.items[0].volumeInfo
      return NextResponse.json({ found: true, book: extractBook(book) })
    }

    const book = data.items[0].volumeInfo
    return NextResponse.json({ found: true, book: extractBook(book) })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function extractBook(v) {
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
