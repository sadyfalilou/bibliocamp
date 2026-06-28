import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { id } = await params

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

  const { data, error } = await supabase
    .from('international_diagnostics')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Diagnostic introuvable' }, { status: 404 })
  if (data.user_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  return NextResponse.json({ diagnostic: data })
}

async function getOwnedDiagnostic(request, id) {
  const auth = request.headers.get('authorization')
  if (!auth) return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) }
  const token = auth.replace('Bearer ', '')

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user } } = await supabaseAnon.auth.getUser(token)
  if (!user) return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('international_diagnostics')
    .select('user_id, status')
    .eq('id', id)
    .single()

  if (error || !data) return { error: NextResponse.json({ error: 'Diagnostic introuvable' }, { status: 404 }) }
  if (data.user_id !== user.id) return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 403 }) }

  return { supabase, diagnostic: data }
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const { error, supabase, diagnostic } = await getOwnedDiagnostic(request, id)
  if (error) return error

  if (diagnostic.status !== 'soumis') {
    return NextResponse.json({ error: 'Cette demande est déjà en traitement et ne peut plus être modifiée.' }, { status: 409 })
  }

  const body = await request.json()
  const {
    first_name, last_name, email, phone, country, preferred_language, timezone,
    last_diploma, current_level, diploma_country, field_of_study, academic_description,
    target_level, target_field, target_cities, target_session,
    french_level, english_level,
    annual_budget, budget_currency,
    needs,
    consent_data_processing, consent_terms, consent_marketing,
  } = body

  if (!first_name?.trim() || !last_name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || !country?.trim() || !preferred_language || !timezone?.trim()) {
    return NextResponse.json({ error: 'Informations personnelles incomplètes' }, { status: 400 })
  }
  if (!target_level) {
    return NextResponse.json({ error: 'Niveau recherché requis' }, { status: 400 })
  }
  if (!consent_data_processing || !consent_terms) {
    return NextResponse.json({ error: 'Le consentement au traitement des données et aux conditions est requis' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('international_diagnostics')
    .update({
      first_name: first_name.trim(), last_name: last_name.trim(), email: email.trim().toLowerCase(),
      phone: phone || null, country: country.trim(), preferred_language, timezone: timezone.trim(),
      last_diploma: last_diploma || null, current_level: current_level || null, diploma_country: diploma_country || null,
      field_of_study: field_of_study || null, academic_description: academic_description || null,
      target_level, target_field: target_field || null, target_cities: target_cities || [], target_session: target_session || null,
      french_level: french_level || null, english_level: english_level || null,
      annual_budget: annual_budget ?? null, budget_currency: budget_currency || 'CAD',
      needs: needs || [],
      consent_data_processing, consent_terms, consent_marketing: !!consent_marketing,
    })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request, { params }) {
  const { id } = await params
  const { error, supabase, diagnostic } = await getOwnedDiagnostic(request, id)
  if (error) return error

  if (diagnostic.status !== 'soumis') {
    return NextResponse.json({ error: 'Cette demande est déjà en traitement et ne peut plus être supprimée.' }, { status: 409 })
  }

  const { error: deleteError } = await supabase
    .from('international_diagnostics')
    .delete()
    .eq('id', id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
