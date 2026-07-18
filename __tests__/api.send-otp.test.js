import { POST } from '../app/api/send-otp/route'

const mockGetUser = jest.fn()
const mockRateCount = jest.fn() // { count, error } pour la fenêtre de rate-limit
const mockInsert = jest.fn(() => Promise.resolve({ error: null }))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({ gte: jest.fn(() => mockRateCount()) })),
      })),
      insert: mockInsert,
    })),
  })),
}))

global.fetch = jest.fn()

function makeRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { headers, json: () => Promise.resolve(body) }
}

describe('POST /api/send-otp', () => {
  const OLD = process.env
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...OLD,
      TWILIO_ACCOUNT_SID: 'sid', TWILIO_AUTH_TOKEN: 'token', TWILIO_VERIFY_SERVICE_SID: 'vs',
    }
    // Par défaut : pas de clé service → checkRateLimit laisse passer
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) })
  })
  afterEach(() => { process.env = OLD })

  test('sans token → 401', async () => {
    const res = await POST(makeRequest({ phone: '+15141234567' }, false))
    expect(res.status).toBe(401)
  })

  test('token invalide → 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } })
    const res = await POST(makeRequest({ phone: '+15141234567' }))
    expect(res.status).toBe(401)
  })

  test('utilisateur connecté sans numéro → 400', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  test('config Twilio manquante → 500', async () => {
    delete process.env.TWILIO_ACCOUNT_SID
    const res = await POST(makeRequest({ phone: '+15141234567' }))
    expect(res.status).toBe(500)
  })

  test('envoi valide → 200 { ok: true }', async () => {
    const res = await POST(makeRequest({ phone: '+15141234567' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  test('rate-limit dépassé → 429', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    mockRateCount.mockResolvedValue({ count: 5, error: null }) // >= RATE_LIMIT
    const res = await POST(makeRequest({ phone: '+15141234567' }))
    expect(res.status).toBe(429)
  })
})
