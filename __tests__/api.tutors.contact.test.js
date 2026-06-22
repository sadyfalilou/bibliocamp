import { POST } from '../app/api/tutors/contact/route'

const mockGetUser = jest.fn()
const mockMaybeSingle = jest.fn()
const mockInsert = jest.fn()
const mockSingle = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
        single: mockSingle,
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

describe('POST /api/tutors/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'student-123' } } })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null }) // pas de conv existante
    mockInsert.mockResolvedValue({ data: { id: 88 }, error: null })
    mockSingle.mockResolvedValue({ data: { phone_verified: true }, error: null })
  })

  test('sans auth → 401', async () => {
    const req = makeRequest({ tutor_id: 1, owner_id: 'tutor-user-1' }, false)
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  test('sans tutor_id → 400', async () => {
    const req = makeRequest({ owner_id: 'tutor-user-1' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('sans owner_id → 400', async () => {
    const req = makeRequest({ tutor_id: 1 })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('auto-contact (étudiant === tuteur) → 400', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'tutor-user-1' } } })
    const req = makeRequest({ tutor_id: 1, owner_id: 'tutor-user-1' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('téléphone non vérifié → 403', async () => {
    mockSingle.mockResolvedValue({ data: { phone_verified: false }, error: null })
    const req = makeRequest({ tutor_id: 1, owner_id: 'tutor-user-1' })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  test('conversation existante → retourne id existant', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 33 }, error: null })
    const req = makeRequest({ tutor_id: 1, owner_id: 'tutor-user-1' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.conversation_id).toBe(33)
  })

  test('nouvelle conversation → 200 avec id', async () => {
    const req = makeRequest({ tutor_id: 1, owner_id: 'tutor-user-1' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.conversation_id).toBe(88)
  })

  test('erreur Supabase insert → 500', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const req = makeRequest({ tutor_id: 1, owner_id: 'tutor-user-1' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
