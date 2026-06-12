import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

export async function POST(request) {
  const { phone, code } = await request.json()
  if (!phone || !code) return Response.json({ error: 'Numéro ou code manquant.' }, { status: 400 })

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!accountSid || !authToken || !serviceSid) {
    return Response.json({ error: 'Configuration Twilio manquante.' }, { status: 500 })
  }

  // 1. Vérifier le code avec Twilio Verify
  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: phone, Code: code }),
      }
    )
    const data = await res.json()
    if (!res.ok || data.status !== 'approved') {
      return Response.json({ error: 'Code incorrect ou expiré. Réessaie.' }, { status: 400 })
    }
  } catch (err) {
    Sentry.captureException(err, { extra: { route: 'POST /api/verify-otp', phone } })
    return Response.json({ error: 'Erreur réseau. Réessaie.' }, { status: 500 })
  }

  // 2. Identifier l'utilisateur via son token JWT
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return Response.json({ error: 'Non authentifié.' }, { status: 401 })
  }
  const token = auth.replace('Bearer ', '')

  // Récupérer l'utilisateur depuis le token (avec le client anon)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error: userErr } = await anonClient.auth.getUser(token)
  if (userErr || !user) {
    return Response.json({ error: 'Session invalide.' }, { status: 401 })
  }

  // 3. Marquer phone_verified dans profiles + user_metadata (double persistance)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Dans la table profiles (persistant après reconnexion)
  const { error: profileErr } = await adminClient
    .from('profiles')
    .update({ phone_verified: true })
    .eq('id', user.id)
  if (profileErr) {
    Sentry.captureException(profileErr, { extra: { route: 'POST /api/verify-otp', action: 'updateProfile', userId: user.id } })
    return Response.json({ error: 'Erreur lors de la mise à jour du profil.' }, { status: 500 })
  }

  // Dans user_metadata (pour la session courante)
  await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, phone_verified: true }
  })

  return Response.json({ ok: true })
}
