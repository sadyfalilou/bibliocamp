// Cache simple en mémoire pour rate limiting
const ipCallCount = new Map()

export async function POST(request) {
  // Rate limit : max 5 vérifications par IP par heure
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const calls = ipCallCount.get(ip) || []
  const recentCalls = calls.filter(t => now - t < 3600000) // 1h
  if (recentCalls.length >= 5) {
    return Response.json({ valid: false, error: 'Trop de tentatives. Réessaie dans une heure.' }, { status: 429 })
  }
  ipCallCount.set(ip, [...recentCalls, now])

  const { phone } = await request.json()

  if (!phone) {
    return Response.json({ valid: false, error: 'Numéro manquant.' }, { status: 400 })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    // Si pas de clés configurées, on laisse passer (mode dev)
    return Response.json({ valid: true })
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const res = await fetch(
      `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(phone)}?Type=carrier`,
      {
        headers: { Authorization: `Basic ${credentials}` }
      }
    )

    if (!res.ok) {
      // Numéro invalide ou inexistant
      return Response.json({ valid: false, error: 'Numéro de téléphone invalide ou inexistant.' })
    }

    const data = await res.json()
    const lineType = data?.carrier?.type

    // Bloquer VoIP et numéros fictifs
    if (lineType === 'voip' || lineType === 'nonfix') {
      return Response.json({
        valid: false,
        error: 'Les numéros VoIP ou obtenus en ligne ne sont pas acceptés. Utilise ton numéro de téléphone personnel.'
      })
    }

    return Response.json({ valid: true, lineType })
  } catch (e) {
    // En cas d'erreur réseau, on laisse passer
    return Response.json({ valid: true })
  }
}
