import { GET, POST } from '../app/api/international-diagnostics/route'

const mockGetUser = jest.fn()
const mockInsert = jest.fn()
const mockOrder = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({ single: mockInsert })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({ order: mockOrder })),
      })),
    })),
  })),
}))

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))
jest.mock('../lib/sendEmail', () => ({ sendEmail: jest.fn().mockResolvedValue() }))

function makeRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { json: () => Promise.resolve(body), headers }
}

const validBody = {
  first_name: 'Aïcha',
  last_name: 'Diallo',
  email: 'aicha@example.com',
  country: 'Sénégal',
  preferred_language: 'Français',
  timezone: 'GMT',
  target_level: 'Baccalauréat',
  target_cities: [],
  needs: [],
  consent_data_processing: true,
  consent_terms: true,
  consent_marketing: false,
}

describe('POST /api/international-diagnostics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockInsert.mockResolvedValue({ data: { id: 42 }, error: null })
  })

  test('sans auth → 401', async () => {
    const res = await POST(makeRequest(validBody, false))
    expect(res.status).toBe(401)
  })

  test('informations personnelles incomplètes → 400', async () => {
    const res = await POST(makeRequest({ ...validBody, first_name: '' }))
    expect(res.status).toBe(400)
  })

  test('niveau recherché manquant → 400', async () => {
    const res = await POST(makeRequest({ ...validBody, target_level: '' }))
    expect(res.status).toBe(400)
  })

  test('consentement manquant → 400', async () => {
    const res = await POST(makeRequest({ ...validBody, consent_terms: false }))
    expect(res.status).toBe(400)
  })

  test('soumission valide → 200 avec id', async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(42)
  })

  test('erreur Supabase insert → 500', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })
})

describe('GET /api/international-diagnostics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockOrder.mockResolvedValue({ data: [{ id: 1, status: 'soumis' }], error: null })
  })

  test('sans auth → 401', async () => {
    const res = await GET(makeRequest(null, false))
    expect(res.status).toBe(401)
  })

  test('avec auth → 200 avec liste', async () => {
    const res = await GET(makeRequest(null))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.diagnostics).toHaveLength(1)
  })

  test('erreur Supabase → 500', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const res = await GET(makeRequest(null))
    expect(res.status).toBe(500)
  })
})
