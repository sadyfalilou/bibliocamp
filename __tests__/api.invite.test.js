import { GET, POST } from '../app/api/invite/route'

const mockSelect = jest.fn()
const mockUpdate = jest.fn()
const mockMaybeSingle = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
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

function makeGetRequest(userId) {
  return { url: `http://localhost/api/invite?user_id=${userId}` }
}

function makePostRequest(body) {
  return { json: () => Promise.resolve(body) }
}

describe('GET /api/invite', () => {
  beforeEach(() => jest.clearAllMocks())

  test('sans user_id → 400', async () => {
    const req = { url: 'http://localhost/api/invite' }
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  test('user avec code existant → retourne le code', async () => {
    mockSelect.mockResolvedValue({
      data: { invite_code: 'ABC1234', id: 'user-1' }, error: null
    })
    const req = makeGetRequest('user-1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe('ABC1234')
  })
})

describe('POST /api/invite', () => {
  beforeEach(() => jest.clearAllMocks())

  test('sans user_id → 400', async () => {
    const req = makePostRequest({ ref_code: 'ABC1234' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('sans ref_code → 400', async () => {
    const req = makePostRequest({ user_id: 'user-1' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('parrain introuvable → 404', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const req = makePostRequest({ user_id: 'user-1', ref_code: 'INVALID' })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  test('auto-référencement → 400', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    const req = makePostRequest({ user_id: 'user-1', ref_code: 'OWN_CODE' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
