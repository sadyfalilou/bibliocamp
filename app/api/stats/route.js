import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  // Utilise la clé service role côté serveur — contourne RLS pour les visiteurs non connectés
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, price, description, image_url, course_code, meet_campus, meet_city, post, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  return NextResponse.json({ listings: listings ?? [] })
}
