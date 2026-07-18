import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST { roommate_listing_id } — trouve ou crée une conversation, retourne { conversation_id }
export async function POST(request) {
  const { roommate_listing_id } = await request.json()
  if (!roommate_listing_id) {
    return NextResponse.json({ error: 'roommate_listing_id requis' }, { status: 400 })
  }

  const auth = request.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const token = auth.replace('Bearer ', '')

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user } } = await supabaseAnon.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Le propriétaire de l'annonce est TOUJOURS dérivé côté serveur, jamais d'un
  // champ fourni par le client.
  const { data: listing } = await supabase
    .from('roommate_listings')
    .select('user_id')
    .eq('id', roommate_listing_id)
    .single()
  if (!listing) {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  }
  const owner_id = listing.user_id

  if (user.id === owner_id) {
    return NextResponse.json({ error: 'Impossible de se contacter soi-même' }, { status: 400 })
  }

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('phone_verified')
    .eq('id', user.id)
    .single()
  if (!requesterProfile?.phone_verified) {
    return NextResponse.json({ error: 'Numéro de téléphone non vérifié' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('roommate_listing_id', roommate_listing_id)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ conversation_id: existing.id })
  }

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      user1_id: user.id,
      user2_id: owner_id,
      context_type: 'colocation',
      roommate_listing_id,
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ conversation_id: created.id })
}
