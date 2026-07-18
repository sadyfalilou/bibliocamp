import { createClient } from '@supabase/supabase-js'
import TutorProfilePageClient from '../../../components/TutorProfilePageClient'

const BASE_URL = 'https://www.bibliocamp.ca'

async function getTutorData(id) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data } = await supabase
    .from('tutors_with_rating')
    .select('id, user_id, first_name, last_name, avatar_url, rate_per_hour, domains, subjects, institution, campus, bio, avg_rating, review_count, is_active')
    .eq('id', id)
    .single()
  if (!data || !data.is_active) return null
  return data
}

// Nom public : prénom + initiale du nom (confidentialité, Loi 25) — identique à
// ce qu'affiche la fiche, pour que les données structurées correspondent au visible.
function publicName(t) {
  return `${t.first_name || ''}${t.last_name ? ' ' + t.last_name[0].toUpperCase() + '.' : ''}`.trim() || 'Tuteur'
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const tutor = await getTutorData(id)

  if (!tutor) {
    return {
      title: 'Tuteur introuvable — BiblioCamp',
      description: 'Ce profil de tuteur n’est plus disponible sur BiblioCamp.',
      robots: { index: false, follow: true },
    }
  }

  const name = publicName(tutor)
  const domaine = tutor.domains?.length ? tutor.domains.join(', ') : (tutor.subjects?.length ? tutor.subjects.slice(0, 3).join(', ') : 'plusieurs matières')
  const title = `${name} — Tuteur ${domaine} dès ${tutor.rate_per_hour} $/h | BiblioCamp`
  const description = tutor.bio
    ? `${tutor.bio.slice(0, 155)}${tutor.bio.length > 155 ? '…' : ''}`
    : `${name} donne des cours de ${domaine} à ${tutor.rate_per_hour} $/h. Réserve un tuteur étudiant sur BiblioCamp.`
  const url = `${BASE_URL}/tuteurs/${id}`
  const image = tutor.avatar_url && tutor.avatar_url.startsWith('http') ? tutor.avatar_url : undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      title,
      description,
      url,
      images: image ? [image] : undefined,
    },
    twitter: { card: 'summary', title, description, images: image ? [image] : undefined },
  }
}

export default async function TuteurProfilePage({ params }) {
  const { id } = await params
  const tutor = await getTutorData(id)

  const name = tutor ? publicName(tutor) : null
  const jsonLd = tutor ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(tutor.avatar_url?.startsWith('http') ? { image: tutor.avatar_url } : {}),
    ...(tutor.bio ? { description: tutor.bio } : {}),
    jobTitle: 'Tuteur',
    ...(tutor.institution || tutor.campus ? { affiliation: { '@type': 'Organization', name: tutor.institution || tutor.campus } } : {}),
    ...(tutor.subjects?.length ? { knowsAbout: tutor.subjects } : {}),
    makesOffer: {
      '@type': 'Offer',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: tutor.rate_per_hour,
        priceCurrency: 'CAD',
        unitCode: 'HUR',
      },
      itemOffered: {
        '@type': 'Service',
        name: `Cours particuliers${tutor.domains?.length ? ' — ' + tutor.domains.join(', ') : ''}`,
      },
    },
    ...(tutor.review_count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: tutor.avg_rating,
        reviewCount: tutor.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    url: `${BASE_URL}/tuteurs/${id}`,
  } : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <TutorProfilePageClient id={id} />
    </>
  )
}
