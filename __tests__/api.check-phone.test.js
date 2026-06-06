import { POST, ipCallCount } from '../app/api/check-phone/route'

// ─── Mock fetch ────────────────────────────────────────────────────────────────

global.fetch = jest.fn()

function makeRequest(body, ip = '1.2.3.4') {
  const headers = new Headers()
  headers.set('x-forwarded-for', ip)
  return {
    headers,
    json: () => Promise.resolve(body),
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/check-phone', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ipCallCount.clear()
  })

  test('numéro manquant → 400', async () => {
    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.valid).toBe(false)
    expect(body.error).toMatch(/manquant/i)
  })

  test('sans clés Twilio → valid: true (mode dev)', async () => {
    const savedSid = process.env.TWILIO_ACCOUNT_SID
    const savedToken = process.env.TWILIO_AUTH_TOKEN
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN

    const req = makeRequest({ phone: '+15141234567' }, '2.2.2.2')
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.valid).toBe(true)

    process.env.TWILIO_ACCOUNT_SID = savedSid
    process.env.TWILIO_AUTH_TOKEN = savedToken
  })

  test('Twilio retourne 404 → numéro invalide', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'sid'
    process.env.TWILIO_AUTH_TOKEN = 'token'
    global.fetch.mockResolvedValue({ ok: false })

    const req = makeRequest({ phone: '+15140000000' }, '3.3.3.3')
    const res = await POST(req)
    const body = await res.json()
    expect(body.valid).toBe(false)
    expect(body.error).toMatch(/invalide/i)
  })

  test('numéro VoIP → refusé', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'sid'
    process.env.TWILIO_AUTH_TOKEN = 'token'
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ carrier: { type: 'voip' } }),
    })

    const req = makeRequest({ phone: '+15145550001' }, '4.4.4.4')
    const res = await POST(req)
    const body = await res.json()
    expect(body.valid).toBe(false)
    expect(body.error).toMatch(/voip/i)
  })

  test('numéro mobile valide → valid: true', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'sid'
    process.env.TWILIO_AUTH_TOKEN = 'token'
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ carrier: { type: 'mobile' } }),
    })

    const req = makeRequest({ phone: '+15141234567' }, '5.5.5.5')
    const res = await POST(req)
    const body = await res.json()
    expect(body.valid).toBe(true)
    expect(body.lineType).toBe('mobile')
  })

  test('erreur réseau Twilio → valid: true (fail-open)', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'sid'
    process.env.TWILIO_AUTH_TOKEN = 'token'
    global.fetch.mockRejectedValue(new Error('Network error'))

    const req = makeRequest({ phone: '+15141234567' }, '6.6.6.6')
    const res = await POST(req)
    const body = await res.json()
    expect(body.valid).toBe(true)
  })
})

// ─── Rate limiting ─────────────────────────────────────────────────────────────

describe('POST /api/check-phone — rate limiting', () => {
  beforeEach(() => {
    ipCallCount.clear()
  })

  test('6e requête depuis la même IP → 429', async () => {
    // Sans clés Twilio pour aller vite
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN

    const ip = '9.9.9.9'
    // Les 5 premières passent
    for (let i = 0; i < 5; i++) {
      const req = makeRequest({ phone: '+15141234567' }, ip)
      await POST(req)
    }
    // La 6e est bloquée
    const req = makeRequest({ phone: '+15141234567' }, ip)
    const res = await POST(req)
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.valid).toBe(false)
    expect(body.error).toMatch(/tentatives/i)
  })
})
