import { GET } from '../app/api/international-diagnostics/[id]/route'

const mockGetUser = jest.fn()
const mockSingle = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({ single: mockSingle })),
      })),
    })),
  })),
}))

function makeRequest(withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { headers }
}

describe('GET /api/international-diagnostics/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  test('sans auth → 401', async () => {
    const res = await GET(makeRequest(false), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  test('diagnostic introuvable → 404', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(404)
  })

  test("diagnostic d'un autre utilisateur → 403", async () => {
    mockSingle.mockResolvedValue({ data: { id: 1, user_id: 'other-user' }, error: null })
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(403)
  })

  test('diagnostic du propriétaire → 200', async () => {
    mockSingle.mockResolvedValue({ data: { id: 1, user_id: 'user-1' }, error: null })
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.diagnostic.id).toBe(1)
  })
})
