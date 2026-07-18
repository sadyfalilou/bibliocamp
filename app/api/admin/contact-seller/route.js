import { createClient } from '@supabase/supabase-js'

async function getAdminUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const token = auth.replace('Bearer ', '')
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null

  // Source de vérité unique des droits admin : la colonne profiles.is_admin
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return null

  return user
}

// POST { sellerId } — trouve ou crée une conversation admin <-> vendeur,
// taguée context_type='admin'. L'admin est toujours user1_id, le vendeur
// user2_id, pour que l'inbox puisse afficher "Support BiblioCamp" côté
// vendeur sans révéler l'identité personnelle de l'admin.
export async function POST(request) {
  const admin = await getAdminUser(request)
  if (!admin) return Response.json({ error: 'Accès refusé.' }, { status: 403 })

  const { sellerId } = await request.json()
  if (!sellerId) return Response.json({ error: 'sellerId requis.' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('context_type', 'admin')
    .eq('user1_id', admin.id)
    .eq('user2_id', sellerId)
    .maybeSingle()

  if (existing) {
    return Response.json({ conversation_id: existing.id })
  }

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      user1_id: admin.id,
      user2_id: sellerId,
      context_type: 'admin',
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ conversation_id: created.id })
}
