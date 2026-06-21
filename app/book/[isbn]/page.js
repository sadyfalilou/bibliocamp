import { createClient } from '@supabase/supabase-js'
import BookPageClient from '../../../components/BookPageClient'

async function getBookData(isbn) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: listings } = await supabase
    .from('listings')
    .select('title, authors, image_url, price')
    .eq('isbn', isbn)
    .eq('status', 'active')
    .order('price', { ascending: true })
    .limit(1)
  return listings?.[0] ?? null
}

const BASE_URL = 'https://www.bibliocamp.ca'

function absoluteUrl(url) {
  if (!url) return null
  return url.startsWith('http') ? url : `${BASE_URL}${url}`
}

export async function generateMetadata({ params }) {
  const { isbn } = await params
  const listing = await getBookData(isbn)

  if (!listing) {
    return {
      title: `Manuel ISBN ${isbn} — BiblioCamp`,
      description: "Achète et vends des manuels scolaires d'occasion entre étudiants québécois sur BiblioCamp.",
    }
  }

  const title = `${listing.title}${listing.authors ? ` — ${listing.authors}` : ''} dès ${listing.price} $ | BiblioCamp`
  const description = `Achète "${listing.title}" d'occasion à partir de ${listing.price} $ entre étudiants québécois. Manuel scolaire, livraison ou rencontre sur campus.`
  const image = absoluteUrl(listing.image_url)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function BookPage({ params }) {
  const { isbn } = await params
  const listing = await getBookData(isbn)

  const image = absoluteUrl(listing?.image_url)
  const jsonLd = listing ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    ...(listing.authors ? { author: { '@type': 'Person', name: listing.authors } } : {}),
    ...(image ? { image: [image] } : {}),
    sku: isbn,
    gtin13: isbn,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'CAD',
      availability: 'https://schema.org/InStock',
      url: `https://www.bibliocamp.ca/book/${isbn}`,
    },
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BookPageClient />
    </>
  )
}
