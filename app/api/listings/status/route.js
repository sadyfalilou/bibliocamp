import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// PATCH /api/listings/status — marquer une annonce comme vendue ou active
// Body: { listing_id, status: 'sold' | 'active' }
export async function PATCH(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })

  const { listing_id, status } = await request.json()
  if (!listing_id || !['sold', 'active'].includes(status)) {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', listing_id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Annonce introuvable ou accès refusé.' }, { status: 403 })

  return NextResponse.json({ ok: true, listing: data })
}
