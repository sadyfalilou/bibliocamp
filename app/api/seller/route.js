import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const userId = new URL(request.url).searchParams.get('id')
  if (!userId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const [{ data: profile }, { data: listings }] = await Promise.all([
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
      .order('created_at', { ascending: false })
  ])

  if (!profile) return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 })

  return NextResponse.json({ profile, listings: listings ?? [] })
}
