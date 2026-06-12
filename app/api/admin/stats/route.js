import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const auth = request.headers.get('Authorization')
  const token = auth?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user } } = await anonClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé — admin uniquement.' }, { status: 403 })

  const now = new Date()
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7); startOfWeek.setHours(0,0,0,0)
  const startOfMonth = new Date(now); startOfMonth.setDate(now.getDate() - 30); startOfMonth.setHours(0,0,0,0)

  // Générer les 8 dernières semaines pour les graphiques
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = new Date(now); end.setDate(now.getDate() - i * 7)
    const start = new Date(end); start.setDate(end.getDate() - 7)
    return { label: `S-${i}`, start: start.toISOString(), end: end.toISOString() }
  }).reverse()

  const [
    // Utilisateurs
    { count: total_users },
    { count: users_week },
    { count: users_month },
    { count: phone_verified },

    // Annonces
    { count: listings_active },
    { count: listings_sold },
    { data: listings_by_etat },
    { data: listings_prices },

    // Transactions
    { count: meet_campus },
    { count: meet_city },
    { count: meet_post },

    // Conversations & messages
    { count: total_conversations },
    { count: total_messages },
    { count: conv_week },
    { count: msg_week },

    // Parrainages
    { count: referred_users },
    { data: top_inviters_raw },

  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('phone_verified', true),

    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('listings').select('description'),
    supabase.from('listings').select('price').eq('status', 'active'),

    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('meet_campus', true),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('meet_city', true),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('post', true),

    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),

    supabase.from('profiles').select('*', { count: 'exact', head: true }).not('referred_by', 'is', null),
    supabase.from('profiles').select('first_name, last_name, invite_code, institution').not('invite_code', 'is', null),
  ])

  // Stats par état du livre
  const etat_counts = {}
  listings_by_etat?.forEach(l => {
    if (l.description) etat_counts[l.description] = (etat_counts[l.description] || 0) + 1
  })

  // Prix moyen des annonces actives
  const prices = listings_prices?.map(l => l.price).filter(Boolean) || []
  const avg_price = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0
  const min_price = prices.length ? Math.min(...prices) : 0
  const max_price = prices.length ? Math.max(...prices) : 0

  // Top parrains
  const { data: referredProfiles } = await supabase
    .from('profiles').select('referred_by').not('referred_by', 'is', null)
  const inviteCountMap = {}
  referredProfiles?.forEach(p => {
    if (p.referred_by) inviteCountMap[p.referred_by] = (inviteCountMap[p.referred_by] || 0) + 1
  })
  const top_inviters = (top_inviters_raw || [])
    .map(p => ({ ...p, invited_count: inviteCountMap[p.invite_code] || 0 }))
    .filter(p => p.invited_count > 0)
    .sort((a, b) => b.invited_count - a.invited_count)
    .slice(0, 10)

  const founders = Object.values(inviteCountMap).filter(c => c >= 3).length

  // Croissance semaine par semaine (users)
  const growth = await Promise.all(weeks.map(async w => {
    const [{ count: new_users }, { count: new_listings }, { count: new_messages }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', w.start).lt('created_at', w.end),
      supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', w.start).lt('created_at', w.end),
      supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', w.start).lt('created_at', w.end),
    ])
    return { label: w.label, new_users: new_users || 0, new_listings: new_listings || 0, new_messages: new_messages || 0 }
  }))

  return NextResponse.json({
    users: { total: total_users || 0, week: users_week || 0, month: users_month || 0, phone_verified: phone_verified || 0 },
    listings: {
      active: listings_active || 0, sold: listings_sold || 0,
      total: (listings_active || 0) + (listings_sold || 0),
      by_etat: etat_counts, avg_price, min_price, max_price,
      meet_campus: meet_campus || 0, meet_city: meet_city || 0, meet_post: meet_post || 0
    },
    messages: {
      conversations: total_conversations || 0, total: total_messages || 0,
      conv_week: conv_week || 0, msg_week: msg_week || 0,
      avg_per_conv: total_conversations ? Math.round((total_messages || 0) / total_conversations) : 0
    },
    referrals: { total: referred_users || 0, founders, top_inviters },
    growth,
  })
}
