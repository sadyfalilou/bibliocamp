import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { sendEmail } from '../../../lib/sendEmail'

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

export async function POST(request) {
  const body = await request.json()

  const auth = request.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const token = auth.replace('Bearer ', '')

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user } } = await supabaseAnon.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: created, error } = await supabase
    .from('international_diagnostics')
    .insert({
      user_id: user.id,
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
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const adminEmails = getAdminEmails()
  await Promise.allSettled([
    sendEmail({
      to: email.trim(),
      subject: 'Ton diagnostic BiblioCamp International est reçu',
      html: `<p>Salut ${first_name.trim()},</p><p>On a bien reçu ton diagnostic pour ton projet d'études au Québec. On l'analyse et on revient vers toi rapidement avec des recommandations.</p><p>Tu peux consulter ton résultat préliminaire dès maintenant dans ton espace BiblioCamp. Si tu choisis un service payant, tu pourras choisir ta méthode de paiement (virement bancaire, Sendwave ou Western Union) — les détails te seront envoyés directement.</p>`,
    }),
    ...adminEmails.map(to => sendEmail({
      to,
      subject: `Nouveau diagnostic international — ${first_name.trim()} ${last_name.trim()}`,
      html: `<p>Nouveau diagnostic soumis.</p><p><b>Nom :</b> ${first_name.trim()} ${last_name.trim()}<br/><b>Courriel :</b> ${email.trim()}<br/><b>Pays :</b> ${country.trim()}<br/><b>Niveau recherché :</b> ${target_level}</p>`,
    })),
  ]).then(results => {
    results.forEach(r => { if (r.status === 'rejected') Sentry.captureException(r.reason, { extra: { route: 'POST /api/international-diagnostics' } }) })
  })

  return NextResponse.json({ id: created.id })
}
