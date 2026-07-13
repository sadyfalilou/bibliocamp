import { createClient } from '@supabase/supabase-js'

const RATE_LIMIT = 5
const WINDOW_MS = 3_600_000 // 1h

// Exporté pour les tests unitaires (fallback en mémoire quand Supabase indisponible)
export const ipCallCount = new Map()

async function checkRateLimit(ip) {
  // En test ou sans Supabase service key, fallback mémoire
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return useFallback(ip)

  const supabase = createClient(supabaseUrl, serviceKey)
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('key', ip)
    .gte('created_at', windowStart)

  if (error) return useFallback(ip)

  if (count >= RATE_LIMIT) return false

  await supabase.from('rate_limits').insert({ key: ip })
  return true
}

function useFallback(ip) {
  const now = Date.now()
  const calls = ipCallCount.get(ip) || []
  const recent = calls.filter(t => now - t < WINDOW_MS)
  if (recent.length >= RATE_LIMIT) return false
  ipCallCount.set(ip, [...recent, now])
  return true
}

export async function POST(request) {
  // x-forwarded-for peut contenir une chaîne "client, proxy1, proxy2" ; seule la
  // première entrée est l'IP réelle du client. Prendre toute la chaîne
  // permettrait de la faire varier pour contourner la limite de débit.
  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return Response.json(
      { valid: false, error: 'Trop de tentatives. Réessaie dans une heure.' },
      { status: 429 }
    )
  }

  const { phone } = await request.json()
  if (!phone) {
    return Response.json({ valid: false, error: 'Numéro manquant.' }, { status: 400 })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return Response.json({ valid: true })
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const res = await fetch(
      `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(phone)}?Type=carrier`,
      { headers: { Authorization: `Basic ${credentials}` } }
    )

    if (!res.ok) {
      return Response.json({ valid: false, error: 'Numéro de téléphone invalide ou inexistant.' })
    }

    const data = await res.json()
    const lineType = data?.carrier?.type

    if (lineType === 'voip' || lineType === 'nonfix') {
      return Response.json({
        valid: false,
        error: 'Les numéros VoIP ou obtenus en ligne ne sont pas acceptés. Utilise ton numéro de téléphone personnel.'
      })
    }

    return Response.json({ valid: true, lineType })
  } catch {
    return Response.json({ valid: true })
  }
}
