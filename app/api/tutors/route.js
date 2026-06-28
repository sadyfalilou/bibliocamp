import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

const VALID_DOMAINS = ['Sciences', 'Santé', 'Droit', 'Arts', 'Éducation', 'Génie', 'Commerce', 'Autres']

function validate({ domains, subjects, rate_per_hour, bio, meet_campus, meet_online, meet_city }) {
  if (!Array.isArray(domains) || domains.length === 0) return 'Choisis au moins un domaine.'
  if (!domains.every(d => VALID_DOMAINS.includes(d))) return 'Domaine invalide.'
  if (!Array.isArray(subjects) || subjects.length === 0) return 'Ajoute au moins une matière ou un code de cours.'
  if (isNaN(Number(rate_per_hour)) || Number(rate_per_hour) < 10 || Number(rate_per_hour) > 150) return 'Le tarif doit être entre 10 $ et 150 $.'
  if (!bio || bio.trim().length < 30) return 'Ta présentation doit faire au moins 30 caractères.'
  if (!meet_campus && !meet_online && !meet_city) return 'Choisis au moins un mode de rencontre.'
  return null
}

async function getUser(request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7))
  return user
}

// POST /api/tutors — créer un profil tuteur
export async function POST(request) {
  const user = await getUser(request)
  if (!user) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified')
    .eq('id', user.id)
    .single()
  if (!profile?.phone_verified) {
    return Response.json({ error: 'Numéro de téléphone non vérifié' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('tutors')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (existing) {
    return Response.json({ error: 'Tu as déjà un profil tuteur.' }, { status: 409 })
  }

  const body = await request.json()
  const fields = {
    domains: body.domains || [],
    subjects: body.subjects || [],
    rate_per_hour: body.rate_per_hour,
    meet_campus: !!body.meet_campus,
    meet_online: !!body.meet_online,
    meet_city: !!body.meet_city,
    bio: body.bio || '',
  }

  const err = validate(fields)
  if (err) return Response.json({ error: err }, { status: 400 })

  const { data, error } = await supabase.from('tutors').insert({
    user_id: user.id,
    domains: fields.domains,
    subjects: fields.subjects,
    rate_per_hour: Number(fields.rate_per_hour),
    meet_campus: fields.meet_campus,
    meet_online: fields.meet_online,
    meet_city: fields.meet_city,
    availabilities: body.availabilities || {},
    bio: fields.bio.trim(),
    languages: body.languages || [],
    is_active: true,
  }).select().single()

  if (error) {
    Sentry.captureException(error, { extra: { route: 'POST /api/tutors', action: 'insert', userId: user.id } })
    return Response.json({ error: 'Erreur lors de la création.' }, { status: 500 })
  }

  return Response.json({ tutor: data })
}
