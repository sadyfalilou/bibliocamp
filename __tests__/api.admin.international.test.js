import { GET, PATCH } from '../app/api/admin/international/route'

const mockGetUser = jest.fn()
const mockOrder = jest.fn()
const mockEq = jest.fn()
const mockUpdate = jest.fn(() => ({ eq: mockEq }))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ order: mockOrder })),
      update: mockUpdate,
    })),
  })),
}))

function makeRequest(withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { headers }
}

function makePatchRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { headers, json: async () => body }
}

describe('GET /api/admin/international', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV, ADMIN_EMAILS: 'admin@example.com' }
    mockOrder.mockResolvedValue({ data: [{ id: 1 }], error: null })
    mockEq.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  test('sans auth → 403', async () => {
    const res = await GET(makeRequest(false))
    expect(res.status).toBe(403)
  })

  test('utilisateur non-admin → 403', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: 'etudiant@example.com' } } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(403)
  })

  test('admin → 200 avec liste', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: 'admin@example.com' } } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.diagnostics).toHaveLength(1)
  })

  test('erreur Supabase → 500', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: 'admin@example.com' } } })
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})

describe('PATCH /api/admin/international', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV, ADMIN_EMAILS: 'admin@example.com' }
    mockEq.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  test('sans auth → 403', async () => {
    const res = await PATCH(makePatchRequest({ id: 1, status: 'termine' }, false))
    expect(res.status).toBe(403)
  })

  test('utilisateur non-admin → 403', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: 'etudiant@example.com' } } })
    const res = await PATCH(makePatchRequest({ id: 1, status: 'termine' }))
    expect(res.status).toBe(403)
  })

  test('statut invalide → 400', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: 'admin@example.com' } } })
    const res = await PATCH(makePatchRequest({ id: 1, status: 'inexistant' }))
    expect(res.status).toBe(400)
  })

  test('id manquant → 400', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: 'admin@example.com' } } })
    const res = await PATCH(makePatchRequest({ status: 'termine' }))
    expect(res.status).toBe(400)
  })

  test('admin avec statut valide → 200', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: 'admin@example.com' } } })
    const res = await PATCH(makePatchRequest({ id: 1, status: 'termine' }))
    expect(res.status).toBe(200)
  })

  test('erreur Supabase → 500', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { email: 'admin@example.com' } } })
    mockEq.mockResolvedValue({ error: { message: 'DB error' } })
    const res = await PATCH(makePatchRequest({ id: 1, status: 'termine' }))
    expect(res.status).toBe(500)
  })
})
