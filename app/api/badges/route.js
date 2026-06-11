import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const BADGE_DEFS = [
  {
    id: 'early_adopter',
    emoji: '🚀',
    label: 'Early Adopter',
    desc: "Parmi les 100 premiers membres de BiblioCamp"
  },
  {
    id: 'verified_profile',
    emoji: '✅',
    label: 'Profil vérifié',
    desc: "A complété son profil à 100%"
  },
  {
    id: 'founder',
    emoji: '🏅',
    label: 'Fondateur',
    desc: "A invité 3+ amis à rejoindre BiblioCamp"
  },
  {
    id: 'ambassador',
    emoji: '🔗',
    label: 'Ambassadeur',
    desc: "A invité 10+ amis à rejoindre BiblioCamp"
  },
  {
    id: 'librarian',
    emoji: '📚',
    label: 'Bibliothécaire',
    desc: "A publié 5+ annonces de manuels"
  },
  {
    id: 'active_seller',
    emoji: '⭐',
    label: 'Vendeur actif',
    desc: "A publié 10+ annonces de manuels"
  },
]

export async function GET(request) {
  const userId = new URL(request.url).searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id requis' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Récupère le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, campus, institution, program, avatar_url, invite_code, created_at')
    .eq('id', userId)
    .single()

  if (!profile) return NextResponse.json({ badges: [] })

  const earned = []

  // 1. Early Adopter — parmi les 100 premiers
  const { count: rank } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', profile.created_at)

  if ((rank ?? 0) < 100) earned.push('early_adopter')

  // 2. Profil vérifié — tous les champs remplis
  const fields = [profile.first_name, profile.last_name, profile.campus, profile.institution, profile.program, profile.avatar_url]
  if (fields.every(f => f && f.toString().trim() !== '')) earned.push('verified_profile')

  // 3. Fondateur + Ambassadeur — invitations
  if (profile.invite_code) {
    const { count: inviteCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', profile.invite_code)

    if ((inviteCount ?? 0) >= 3) earned.push('founder')
    if ((inviteCount ?? 0) >= 10) earned.push('ambassador')
  }

  // 4. Bibliothécaire + Vendeur actif — toutes annonces (actives + vendues)
  const { count: listingCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((listingCount ?? 0) >= 5) earned.push('librarian')
  if ((listingCount ?? 0) >= 10) earned.push('active_seller')

  // Retourne les badges gagnés avec leur définition complète
  const badges = BADGE_DEFS.filter(b => earned.includes(b.id))

  return NextResponse.json({ badges, all: BADGE_DEFS, earned })
}
