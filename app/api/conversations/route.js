import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST { listing_id } — trouve ou crée une conversation, retourne { conversation_id }
export async function POST(request) {
  const { listing_id } = await request.json()
  if (!listing_id) {
    return NextResponse.json({ error: 'listing_id requis' }, { status: 400 })
  }

  // Auth via Authorization header (token JWT)
  const auth = request.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const token = auth.replace('Bearer ', '')

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user } } = await supabaseAnon.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const buyer_id = user.id

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Le vendeur est TOUJOURS dérivé de l'annonce côté serveur, jamais d'un champ
  // fourni par le client, pour empêcher de forger une conversation avec un tiers.
  const { data: listing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', listing_id)
    .single()
  if (!listing) {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  }
  const seller_id = listing.user_id

  if (buyer_id === seller_id) {
    return NextResponse.json({ error: 'Impossible de se contacter soi-même' }, { status: 400 })
  }

  const { data: buyerProfile } = await supabase
    .from('profiles')
    .select('phone_verified')
    .eq('id', buyer_id)
    .single()
  if (!buyerProfile?.phone_verified) {
    return NextResponse.json({ error: 'Numéro de téléphone non vérifié' }, { status: 403 })
  }

  // Cherche une conversation existante entre ces deux users pour cette annonce
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listing_id)
    .or(`and(user1_id.eq.${buyer_id},user2_id.eq.${seller_id}),and(user1_id.eq.${seller_id},user2_id.eq.${buyer_id})`)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ conversation_id: existing.id })
  }

  // Crée une nouvelle conversation
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      listing_id,
      user1_id: buyer_id,
      user2_id: seller_id,
      context_type: 'manuel',
      last_message_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversation_id: created.id })
}
