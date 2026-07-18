import { POST } from '../app/api/book-alerts/route'

const mockUpsert = jest.fn()
const mockGte = jest.fn()
const mockRateLimitInsert = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => {
      if (table === 'rate_limits') {
        return {
          select: jest.fn(() => ({ eq: jest.fn(() => ({ gte: mockGte })) })),
          insert: mockRateLimitInsert,
        }
      }
      return { upsert: mockUpsert }
    }),
  })),
}))

function makeRequest(body, ip = '1.2.3.4') {
  const headers = new Headers()
  if (ip) headers.set('x-forwarded-for', ip)
  return { json: async () => body, headers }
}

describe('POST /api/book-alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGte.mockResolvedValue({ count: 0, error: null }) // sous la limite
    mockRateLimitInsert.mockResolvedValue({ error: null })
    mockUpsert.mockResolvedValue({ error: null })
  })

  test('courriel invalide → 400', async () => {
    const res = await POST(makeRequest({ email: 'pas-un-email', isbn: '9781234567890' }))
    expect(res.status).toBe(400)
  })

  test('ISBN invalide → 400', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', isbn: 'abc' }))
    expect(res.status).toBe(400)
  })

  test('inscription valide → 200 et upsert appelé', async () => {
    const res = await POST(makeRequest({ email: 'Etudiant@Exemple.com', isbn: '978-1234567890', title: 'Calculus' }))
    expect(res.status).toBe(200)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'etudiant@exemple.com', isbn: '9781234567890', title: 'Calculus' }),
      { onConflict: 'email,isbn' }
    )
  })

  test('limite de débit dépassée → 429', async () => {
    mockGte.mockResolvedValue({ count: 10, error: null })
    const res = await POST(makeRequest({ email: 'a@b.com', isbn: '9781234567890' }))
    expect(res.status).toBe(429)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  test('erreur supabase → 500', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'boom' } })
    const res = await POST(makeRequest({ email: 'a@b.com', isbn: '9781234567890' }))
    expect(res.status).toBe(500)
  })
})
