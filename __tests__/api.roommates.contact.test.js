import { POST } from '../app/api/roommates/contact/route'

const mockGetUser = jest.fn()
const mockMaybeSingle = jest.fn()
const mockInsert = jest.fn()
const mockListingSingle = jest.fn()
const mockProfileSingle = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table) => ({
      select: jest.fn(() => ({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
        single: table === 'profiles' ? mockProfileSingle : mockListingSingle,
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({ single: mockInsert })),
      })),
    })),
  })),
}))

function makeRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { json: () => Promise.resolve(body), headers }
}

describe('POST /api/roommates/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'tenant-123' } } })
    mockListingSingle.mockResolvedValue({ data: { user_id: 'owner-1' }, error: null })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null }) // pas de conv existante
    mockInsert.mockResolvedValue({ data: { id: 77 }, error: null })
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: true }, error: null })
  })

  test('sans auth → 401', async () => {
    const req = makeRequest({ roommate_listing_id: 1 }, false)
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  test('sans roommate_listing_id → 400', async () => {
    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('annonce introuvable → 404', async () => {
    mockListingSingle.mockResolvedValue({ data: null, error: null })
    const req = makeRequest({ roommate_listing_id: 1 })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  test('auto-contact (le propriétaire dérivé === locataire) → 400', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'owner-1' } } })
    const req = makeRequest({ roommate_listing_id: 1 })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('téléphone non vérifié → 403', async () => {
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: false }, error: null })
    const req = makeRequest({ roommate_listing_id: 1 })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  test('conversation existante → retourne id existant', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 55 }, error: null })
    const req = makeRequest({ roommate_listing_id: 1 })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.conversation_id).toBe(55)
  })

  test('nouvelle conversation → 200 avec id', async () => {
    const req = makeRequest({ roommate_listing_id: 1 })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.conversation_id).toBe(77)
  })

  test('erreur Supabase insert → 500', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const req = makeRequest({ roommate_listing_id: 1 })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
