import { POST } from '../app/api/book-alerts/route'

const mockUpsert = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({ upsert: mockUpsert })),
  })),
}))

function makeRequest(body) {
  return { json: async () => body }
}

describe('POST /api/book-alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

  test('erreur supabase → 500', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'boom' } })
    const res = await POST(makeRequest({ email: 'a@b.com', isbn: '9781234567890' }))
    expect(res.status).toBe(500)
  })
})
