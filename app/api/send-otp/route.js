import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

const RATE_LIMIT = 5
const WINDOW_MS = 3_600_000 // 1h

// Limite le nombre d'envois de SMS par utilisateur pour éviter la fraude
// (SMS pumping / facture Twilio). S'appuie sur la table rate_limits.
async function checkRateLimit(key) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return true // pas de garde-fou possible en local

  const supabase = createClient(supabaseUrl, serviceKey)
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart)

  if (error) return true // ne pas bloquer un envoi légitime si la table est indisponible
  if (count >= RATE_LIMIT) return false

  await supabase.from('rate_limits').insert({ key })
  return true
}

export async function POST(request) {
  // 1. Exiger un utilisateur connecté (la vérification du téléphone se fait
  //    depuis une page protégée, donc une session existe toujours)
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return Response.json({ error: 'Non authentifié.' }, { status: 401 })
  }
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user }, error: userErr } = await anonClient.auth.getUser(auth.slice(7))
  if (userErr || !user) {
    return Response.json({ error: 'Session invalide.' }, { status: 401 })
  }

  const { phone } = await request.json()
  if (!phone) return Response.json({ error: 'Numéro manquant.' }, { status: 400 })

  // 2. Limiter le débit par utilisateur
  const allowed = await checkRateLimit(`otp:${user.id}`)
  if (!allowed) {
    return Response.json({ error: 'Trop de demandes de code. Réessaie dans une heure.' }, { status: 429 })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!accountSid || !authToken || !serviceSid) {
    return Response.json({ error: 'Configuration Twilio manquante.' }, { status: 500 })
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: phone, Channel: 'sms' }),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      return Response.json({ error: data.message || 'Erreur lors de l\'envoi du SMS.' }, { status: 400 })
    }
    return Response.json({ ok: true })
  } catch (err) {
    Sentry.captureException(err, { extra: { route: 'POST /api/send-otp', phone } })
    return Response.json({ error: 'Erreur réseau. Réessaie.' }, { status: 500 })
  }
}
