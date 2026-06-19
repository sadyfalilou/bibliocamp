import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { computeTutorBadges } from '../../../lib/tutorBadge'

export async function GET() {
  // Utilise la clé service role côté serveur — contourne RLS pour les visiteurs non connectés
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, authors, isbn, price, original_price, description, image_url, course_code, meet_campus, meet_city, post, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8)

  const { data: tutorsRaw } = await supabase
    .from('tutors_with_rating')
    .select('id, user_id, first_name, last_name, institution, campus, avatar_url, domains, subjects, rate_per_hour, avg_rating, review_count, meet_campus, meet_online, meet_city, is_pro')
    .eq('is_active', true)
    .order('avg_rating', { ascending: false })
    .limit(6)

  const badges = await computeTutorBadges(supabase, (tutorsRaw ?? []).map(t => t.user_id))
  const tutors = (tutorsRaw ?? []).map(t => ({ ...t, response_badge: badges[t.user_id] ?? null }))

  return NextResponse.json({ listings: listings ?? [], tutors })
}
