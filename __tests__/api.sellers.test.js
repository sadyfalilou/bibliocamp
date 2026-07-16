import { GET } from '../app/api/sellers/route'

const mockIn = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ in: mockIn })),
    })),
  })),
}))

function makeRequest(query = '') {
  return { url: `http://localhost/api/sellers${query}` }
}

describe('GET /api/sellers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIn.mockResolvedValue({
      data: [
        { id: 'a', first_name: 'Sophie', last_name: 'Tremblay', avatar_url: null, campus: 'UQAM', institution: null },
        { id: 'b', first_name: 'Marc', last_name: 'Aurele', avatar_url: null, campus: null, institution: 'HEC' },
      ],
      error: null,
    })
  })

  test('sans ids → { profiles: {} }', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profiles).toEqual({})
  })

  test('ids valides → profils indexés par id, nom en initiale', async () => {
    const res = await GET(makeRequest('?ids=a,b'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profiles.a.first_name).toBe('Sophie')
    expect(body.profiles.a.last_name).toBe('T') // initiale seulement
    expect(body.profiles.b.last_name).toBe('A')
  })

  test('erreur Supabase → 500', async () => {
    mockIn.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const res = await GET(makeRequest('?ids=a'))
    expect(res.status).toBe(500)
  })
})
