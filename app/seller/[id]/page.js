import { createClient } from '@supabase/supabase-js'
import SellerPageClient from '../../../components/SellerPageClient'

async function getSellerData(id) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const [{ data: profile }, { data: reviews }] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, institution, campus, avatar_url')
      .eq('id', id)
      .single(),
    supabase
      .from('seller_reviews')
      .select('rating')
      .eq('seller_id', id),
  ])
  if (!profile) return null
  const reviewList = reviews ?? []
  const avgRating = reviewList.length
    ? Math.round((reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length) * 10) / 10
    : null
  return { ...profile, avgRating, reviewCount: reviewList.length }
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const profile = await getSellerData(id)

  if (!profile) {
    return {
      title: 'Profil vendeur — BiblioCamp',
      description: 'Consulte les annonces de manuels scolaires de ce vendeur sur BiblioCamp.',
    }
  }

  const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Vendeur BiblioCamp'
  const place = profile.campus || profile.institution
  const title = `${name}${place ? ` — ${place}` : ''} | Vendeur BiblioCamp`
  const description = `Consulte les manuels scolaires en vente par ${name}${place ? ` (${place})` : ''} sur BiblioCamp, ainsi que ses avis.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  }
}

export default async function SellerPage({ params }) {
  const { id } = await params
  const profile = await getSellerData(id)

  const name = profile ? (`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Vendeur BiblioCamp') : null
  const jsonLd = profile ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(profile.avatar_url ? { image: profile.avatar_url } : {}),
    url: `https://www.bibliocamp.ca/seller/${id}`,
    ...(profile.reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: profile.avgRating,
        reviewCount: profile.reviewCount,
      },
    } : {}),
  } : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SellerPageClient />
    </>
  )
}
