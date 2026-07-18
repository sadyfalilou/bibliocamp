import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const userId = new URL(request.url).searchParams.get('id')
  if (!userId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const [{ data: profile }, { data: listings }, { data: reviews }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, institution, campus, program')
      .eq('id', userId)
      .single(),
    supabase
      .from('listings')
      .select('id, title, authors, isbn, price, original_price, description, image_url, meet_campus, meet_city, post, campus, course_code, created_at, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('seller_reviews')
      .select('id, rating, comment, reviewer_id, created_at, profiles(first_name, last_name, avatar_url)')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
  ])

  if (!profile) return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 })

  // Confidentialité : ce profil est public et accessible sans authentification.
  // On n'expose que l'initiale du nom de famille pour éviter l'aspiration en
  // masse des noms complets par énumération d'ID.
  if (profile.last_name) profile.last_name = profile.last_name[0].toUpperCase()

  const reviewList = (reviews ?? []).map(r => (
    r.profiles && r.profiles.last_name
      ? { ...r, profiles: { ...r.profiles, last_name: r.profiles.last_name[0].toUpperCase() } }
      : r
  ))
  const avgRating = reviewList.length
    ? Math.round((reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length) * 10) / 10
    : null

  return NextResponse.json({
    profile,
    listings: listings ?? [],
    reviews: reviewList,
    avgRating,
    reviewCount: reviewList.length,
  })
}
