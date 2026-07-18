import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

export async function GET(request) {
  const admin = await getAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('international_diagnostics')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ diagnostics: data || [] })
}

const VALID_STATUSES = ['soumis', 'en_analyse', 'resultat_disponible', 'consultation_planifiee', 'termine']
const VALID_PAYMENT_STATUSES = ['non_paye', 'paye']

export async function PATCH(request) {
  const admin = await getAdminUser(request)
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { id, status, forfait, prix, devise, payment_method, payment_status } = await request.json()
  if (!id) return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  if (payment_status !== undefined && !VALID_PAYMENT_STATUSES.includes(payment_status)) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const update = {}
  if (status !== undefined) update.status = status
  if (forfait !== undefined) update.forfait = forfait || null
  if (prix !== undefined) update.prix = prix === '' || prix === null ? null : Number(String(prix).replace(',', '.'))
  if (devise !== undefined) update.devise = devise || 'CAD'
  if (payment_method !== undefined) update.payment_method = payment_method || null
  if (payment_status !== undefined) update.payment_status = payment_status

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error } = await supabase
    .from('international_diagnostics')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
