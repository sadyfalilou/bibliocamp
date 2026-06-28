import { POST } from '../app/api/tutors/route'

const mockGetUser = jest.fn()
const mockProfileSingle = jest.fn()
const mockExistingSingle = jest.fn()
const mockInsert = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockProfileSingle })) })) }
      }
      return {
        select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockExistingSingle })) })),
        insert: jest.fn(() => ({ select: jest.fn(() => ({ single: mockInsert })) })),
      }
    }),
  })),
}))

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

function makeRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { json: () => Promise.resolve(body), headers }
}

const validBody = {
  domains: ['Sciences'],
  subjects: ['BIO201'],
  rate_per_hour: 25,
  meet_campus: true,
  meet_online: false,
  meet_city: false,
  bio: 'Étudiant en biologie avec une bonne moyenne, je donne des cours clairs et adaptés.',
  languages: ['Français'],
  availabilities: {},
}

describe('POST /api/tutors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: true }, error: null })
    mockExistingSingle.mockResolvedValue({ data: null, error: null })
    mockInsert.mockResolvedValue({ data: { id: 'tutor-1', ...validBody }, error: null })
  })

  test('sans auth → 401', async () => {
    const res = await POST(makeRequest(validBody, false))
    expect(res.status).toBe(401)
  })

  test('téléphone non vérifié → 403', async () => {
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: false }, error: null })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/téléphone/i)
  })

  test('déjà tuteur → 409', async () => {
    mockExistingSingle.mockResolvedValue({ data: { id: 'existing' }, error: null })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(409)
  })

  test('domaines manquants → 400', async () => {
    const res = await POST(makeRequest({ ...validBody, domains: [] }))
    expect(res.status).toBe(400)
  })

  test('matières manquantes → 400', async () => {
    const res = await POST(makeRequest({ ...validBody, subjects: [] }))
    expect(res.status).toBe(400)
  })

  test('tarif invalide → 400', async () => {
    const res = await POST(makeRequest({ ...validBody, rate_per_hour: 5 }))
    expect(res.status).toBe(400)
  })

  test('bio trop courte → 400', async () => {
    const res = await POST(makeRequest({ ...validBody, bio: 'trop court' }))
    expect(res.status).toBe(400)
  })

  test('aucun mode de rencontre → 400', async () => {
    const res = await POST(makeRequest({ ...validBody, meet_campus: false, meet_online: false, meet_city: false }))
    expect(res.status).toBe(400)
  })

  test('création valide → 200', async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tutor).toBeDefined()
  })

  test('erreur Supabase insert → 500', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })
})
