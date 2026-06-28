import { GET, PATCH, DELETE } from '../app/api/international-diagnostics/[id]/route'

const mockGetUser = jest.fn()
const mockSingle = jest.fn()
const mockUpdateEq = jest.fn()
const mockDeleteEq = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({ single: mockSingle })),
      })),
      update: jest.fn(() => ({
        eq: mockUpdateEq,
      })),
      delete: jest.fn(() => ({
        eq: mockDeleteEq,
      })),
    })),
  })),
}))

function makeRequest({ body, withAuth = true } = {}) {
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

describe('GET /api/international-diagnostics/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  test('sans auth → 401', async () => {
    const res = await GET(makeRequest({ withAuth: false }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  test('diagnostic introuvable → 404', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(404)
  })

  test("appartient à un autre utilisateur → 403", async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'other', status: 'soumis' }, error: null })
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  test('propriétaire → 200', async () => {
    mockSingle.mockResolvedValue({ data: { id: '1', user_id: 'user-1', status: 'soumis' }, error: null })
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/international-diagnostics/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpdateEq.mockResolvedValue({ error: null })
  })

  test('sans auth → 401', async () => {
    const res = await PATCH(makeRequest({ body: validBody, withAuth: false }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  test('diagnostic introuvable → 404', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const res = await PATCH(makeRequest({ body: validBody }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(404)
  })

  test("appartient à un autre utilisateur → 403", async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'other', status: 'soumis' }, error: null })
    const res = await PATCH(makeRequest({ body: validBody }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  test('statut déjà en traitement → 409', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'user-1', status: 'en_analyse' }, error: null })
    const res = await PATCH(makeRequest({ body: validBody }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(409)
  })

  test('informations incomplètes → 400', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'user-1', status: 'soumis' }, error: null })
    const res = await PATCH(makeRequest({ body: { ...validBody, first_name: '' } }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(400)
  })

  test('consentement manquant → 400', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'user-1', status: 'soumis' }, error: null })
    const res = await PATCH(makeRequest({ body: { ...validBody, consent_terms: false } }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(400)
  })

  test('modification valide → 200', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'user-1', status: 'soumis' }, error: null })
    const res = await PATCH(makeRequest({ body: validBody }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
  })

  test('erreur Supabase update → 500', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'user-1', status: 'soumis' }, error: null })
    mockUpdateEq.mockResolvedValue({ error: { message: 'DB error' } })
    const res = await PATCH(makeRequest({ body: validBody }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(500)
  })
})

describe('DELETE /api/international-diagnostics/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockDeleteEq.mockResolvedValue({ error: null })
  })

  test('sans auth → 401', async () => {
    const res = await DELETE(makeRequest({ withAuth: false }), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  test("appartient à un autre utilisateur → 403", async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'other', status: 'soumis' }, error: null })
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  test('statut déjà en traitement → 409', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'user-1', status: 'en_analyse' }, error: null })
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(409)
  })

  test('suppression valide → 200', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'user-1', status: 'soumis' }, error: null })
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
  })

  test('erreur Supabase delete → 500', async () => {
    mockSingle.mockResolvedValue({ data: { user_id: 'user-1', status: 'soumis' }, error: null })
    mockDeleteEq.mockResolvedValue({ error: { message: 'DB error' } })
    const res = await DELETE(makeRequest(), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(500)
  })
})
