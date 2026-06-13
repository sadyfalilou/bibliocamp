import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const isbn = new URL(request.url).searchParams.get('isbn')?.replace(/[-\s]/g, '')
  if (!isbn) return NextResponse.json({ error: 'ISBN manquant' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, authors, price, original_price, description, image_url, meet_campus, meet_city, post, campus, created_at, user_id, course_code')
    .eq('isbn', isbn)
    .eq('status', 'active')
    .order('price', { ascending: true })

  return NextResponse.json({ listings: listings ?? [] })
}
