import { NextResponse } from 'next/server'

// Proxy l'image de couverture pour éviter les blocages CSP
export async function GET(request) {
  const url = new URL(request.url).searchParams.get('url')
  if (!url) return new Response('Missing url', { status: 400 })

  // N'autorise que les domaines connus
  const allowed = ['books.google.com', 'covers.openlibrary.org', 'lh3.googleusercontent.com', 'books.googleusercontent.com']
  try {
    const parsed = new URL(url)
    if (!allowed.some(d => parsed.hostname.endsWith(d))) {
      return new Response('Domain not allowed', { status: 403 })
    }
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  const res = await fetch(url)
  if (!res.ok) return new Response('Image not found', { status: 404 })

  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = await res.arrayBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    }
  })
}
