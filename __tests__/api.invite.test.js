import { GET, POST } from '../app/api/invite/route'

const mockSelect = jest.fn()
const mockUpdate = jest.fn()
const mockMaybeSingle = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table) => ({
      select: jest.fn(() => ({
        eq: jest.fn().mockReturnThis(),
        single: mockSelect,
        maybeSingle: mockMaybeSingle,
        then: (resolve) => resolve({ count: 0, data: null, error: null }),
      })),
      update: jest.fn(() => ({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn(() => ({ single: mockUpdate })),
      })),
    })),
  })),
}))

// L'identité vient toujours du token : on simule un header Authorization.
function makeAuthedRequest({ body } = {}) {
  return {
    headers: { get: (h) => (h.toLowerCase() === 'authorization' ? 'Bearer valid-token' : null) },
    json: () => Promise.resolve(body || {}),
  }
}

function makeAnonRequest({ body } = {}) {
  return {
    headers: { get: () => null },
    json: () => Promise.resolve(body || {}),
  }
}

describe('GET /api/invite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  test('sans token → 401', async () => {
    const res = await GET(makeAnonRequest())
    expect(res.status).toBe(401)
  })

  test('user avec code existant → retourne le code', async () => {
    mockSelect.mockResolvedValue({
      data: { invite_code: 'ABC1234', id: 'user-1' }, error: null
    })
    const res = await GET(makeAuthedRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe('ABC1234')
  })
})

describe('POST /api/invite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  test('sans token → 401', async () => {
    const res = await POST(makeAnonRequest({ body: { ref_code: 'ABC1234' } }))
    expect(res.status).toBe(401)
  })

  test('sans ref_code → 400', async () => {
    const res = await POST(makeAuthedRequest({ body: {} }))
    expect(res.status).toBe(400)
  })

  test('parrain introuvable → 404', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await POST(makeAuthedRequest({ body: { ref_code: 'INVALID' } }))
    expect(res.status).toBe(404)
  })

  test('auto-référencement → 400', async () => {
    // Le parrain retourné a le même id que l'utilisateur connecté (user-1)
    mockMaybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    const res = await POST(makeAuthedRequest({ body: { ref_code: 'OWN_CODE' } }))
    expect(res.status).toBe(400)
  })
})
