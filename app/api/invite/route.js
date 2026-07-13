import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Identifie l'utilisateur via son token JWT. L'identité vient TOUJOURS du token,
// jamais d'un paramètre fourni par le client, pour empêcher l'usurpation.
async function getUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user } } = await anon.auth.getUser(auth.slice(7))
  return user
}

// Génère un code aléatoire lisible (ex: "abc123")
function generateCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// GET /api/invite → retourne ou génère le code d'invitation de l'utilisateur connecté
export async function GET(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = user.id

  const supabase = supabaseAdmin()

  // Récupère le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('invite_code, first_name, last_name')
    .eq('id', userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  // Si pas de code encore, on en génère un unique
  let code = profile.invite_code
  if (!code) {
    let unique = false
    while (!unique) {
      code = generateCode()
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('invite_code', code)
        .single()
      if (!existing) unique = true
    }
    await supabase.from('profiles').update({ invite_code: code }).eq('id', userId)
  }

  // Compte les amis invités (profils ayant referred_by = ce code)
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by', code)

  return NextResponse.json({ code, invited_count: count || 0 })
}

// POST /api/invite → enregistre le parrainage lors de l'inscription
// Body: { ref_code } — le filleul est l'utilisateur connecté (dérivé du token)
export async function POST(request) {
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { ref_code } = await request.json()
  if (!ref_code) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  const user_id = user.id
  const supabase = supabaseAdmin()

  // Vérifie que le code existe et n'est pas le sien propre
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('invite_code', ref_code)
    .maybeSingle()

  if (!referrer) {
    return NextResponse.json({ error: 'Code de parrainage introuvable' }, { status: 404 })
  }
  if (referrer.id === user_id) {
    return NextResponse.json({ error: 'Auto-parrainage interdit' }, { status: 400 })
  }

  // Enregistre le parrainage (seulement si pas déjà parrainé)
  const { data: existing } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('id', user_id)
    .single()

  if (existing?.referred_by) {
    return NextResponse.json({ ok: false, reason: 'Déjà parrainé' })
  }

  await supabase.from('profiles').update({ referred_by: ref_code }).eq('id', user_id)

  return NextResponse.json({ ok: true })
}
