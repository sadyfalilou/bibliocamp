import { GET } from '../app/api/newsletter/unsubscribe/route'

const mockMaybeSingle = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({ maybeSingle: mockMaybeSingle })),
        })),
      })),
    })),
  })),
}))

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

function makeRequest(url) {
  return { url }
}

describe('GET /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('sans token → 400', async () => {
    const res = await GET(makeRequest('https://www.bibliocamp.ca/api/newsletter/unsubscribe'))
    expect(res.status).toBe(400)
  })

  test('token invalide → 404', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await GET(makeRequest('https://www.bibliocamp.ca/api/newsletter/unsubscribe?token=abc'))
    expect(res.status).toBe(404)
  })

  test('token valide → 200', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'user-1' }, error: null })
    const res = await GET(makeRequest('https://www.bibliocamp.ca/api/newsletter/unsubscribe?token=abc'))
    expect(res.status).toBe(200)
  })

  test('erreur supabase → 500', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const res = await GET(makeRequest('https://www.bibliocamp.ca/api/newsletter/unsubscribe?token=abc'))
    expect(res.status).toBe(500)
  })
})
