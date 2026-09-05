import { GET } from '../app/api/newsletter/unsubscribe/route'

const mockMaybeSingle = jest.fn()
const mockTokenLookup = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => {
      if (table === 'profile_tokens') {
        return {
          select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: mockTokenLookup })) })),
        }
      }
      return {
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({ maybeSingle: mockMaybeSingle })),
          })),
        })),
      }
    }),
  })),
}))

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

function makeRequest(url) {
  return { url }
}

describe('GET /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTokenLookup.mockResolvedValue({ data: { user_id: 'user-1' }, error: null })
  })

  test('sans token → 400', async () => {
    const res = await GET(makeRequest('https://www.bibliocamp.ca/api/newsletter/unsubscribe'))
    expect(res.status).toBe(400)
  })

  test('token inconnu de profile_tokens → 404', async () => {
    mockTokenLookup.mockResolvedValue({ data: null, error: null })
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await GET(makeRequest('https://www.bibliocamp.ca/api/newsletter/unsubscribe?token=1c3cbf8e-d341-4829-943b-67eae16aa3f4'))
    expect(res.status).toBe(404)
  })

  test('token valide → 200', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    const res = await GET(makeRequest('https://www.bibliocamp.ca/api/newsletter/unsubscribe?token=1c3cbf8e-d341-4829-943b-67eae16aa3f4'))
    expect(res.status).toBe(200)
  })

  test('erreur supabase → 500', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const res = await GET(makeRequest('https://www.bibliocamp.ca/api/newsletter/unsubscribe?token=1c3cbf8e-d341-4829-943b-67eae16aa3f4'))
    expect(res.status).toBe(500)
  })
})
