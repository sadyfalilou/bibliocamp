import * as Sentry from '@sentry/nextjs'

export async function POST(request) {
  const { phone } = await request.json()
  if (!phone) return Response.json({ error: 'Numéro manquant.' }, { status: 400 })

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
