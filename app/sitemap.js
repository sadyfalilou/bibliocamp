import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://www.bibliocamp.ca'

export default async function sitemap() {
  const staticRoutes = [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/login`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/manuels/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/tuteurs/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/tuteurs`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/a-propos`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/international`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/international/mon-histoire`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/cgu`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/confidentialite`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return staticRoutes

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const [{ data: listings }, { data: sellers }, { data: tutors }] = await Promise.all([
    supabase.from('listings').select('isbn, created_at').eq('status', 'active').not('isbn', 'is', null),
    supabase.from('listings').select('user_id, created_at').eq('status', 'active'),
    supabase.from('tutors_with_rating').select('id').eq('is_active', true),
  ])

  const bookRoutes = (listings ?? [])
    .filter(l => l.isbn)
    .map(l => ({
      url: `${BASE_URL}/book/${l.isbn}`,
      lastModified: l.created_at,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  const uniqueSellerIds = [...new Set((sellers ?? []).map(s => s.user_id))]
  const sellerRoutes = uniqueSellerIds.map(id => ({
    url: `${BASE_URL}/seller/${id}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const tutorRoutes = (tutors ?? []).map(t => ({
    url: `${BASE_URL}/tuteurs/${t.id}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...bookRoutes, ...sellerRoutes, ...tutorRoutes]
}
