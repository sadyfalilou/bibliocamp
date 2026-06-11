import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const auth = request.headers.get('Authorization')
  const token = auth?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user } } = await supabaseUser.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Vérifie que l'utilisateur est admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Stats globales
  const [
    { count: total_users },
    { count: referred_users },
    { count: users_with_code }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).not('referred_by', 'is', null),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).not('invite_code', 'is', null)
  ])

  // Tous les profils avec un invite_code
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, invite_code, institution')
    .not('invite_code', 'is', null)

  // Compte les invités par code
  const { data: referredProfiles } = await supabase
    .from('profiles')
    .select('referred_by')
    .not('referred_by', 'is', null)

  const inviteCountMap = {}
  referredProfiles?.forEach(p => {
    if (p.referred_by) inviteCountMap[p.referred_by] = (inviteCountMap[p.referred_by] || 0) + 1
  })

  // Récupère les emails depuis auth.users via la table profiles (on n'a pas accès direct à auth.users)
  // On utilise l'email stocké dans les profils si disponible, sinon on laisse vide
  const topInviters = (allProfiles || [])
    .map(p => ({
      ...p,
      invited_count: inviteCountMap[p.invite_code] || 0
    }))
    .filter(p => p.invited_count > 0 || p.invite_code)
    .sort((a, b) => b.invited_count - a.invited_count)
    .slice(0, 50)

  // Nombre de fondateurs (3+ invités)
  const founders = Object.values(inviteCountMap).filter(c => c >= 3).length

  return NextResponse.json({
    stats: {
      total_users: total_users || 0,
      referred_users: referred_users || 0,
      users_with_code: users_with_code || 0,
      founders
    },
    top_inviters: topInviters
  })
}
