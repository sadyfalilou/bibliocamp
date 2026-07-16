import { GET } from '../app/api/tutors/badges/route'

// Mock du calcul de badge : conversations vides → tous "nouveau".
const mockOr = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ or: mockOr })),
    })),
  })),
}))

function makeRequest(query = '') {
  return { url: `http://localhost/api/tutors/badges${query}` }
}

const UUID1 = '11111111-1111-1111-1111-111111111111'
const UUID2 = '22222222-2222-2222-2222-222222222222'

describe('GET /api/tutors/badges', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOr.mockResolvedValue({ data: [] }) // aucune conversation → badge "nouveau"
  })

  test('sans ids → { badges: {} }', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    expect((await res.json()).badges).toEqual({})
  })

  test('ids valides → badges calculés', async () => {
    const res = await GET(makeRequest(`?ids=${UUID1},${UUID2}`))
    expect(res.status).toBe(200)
    const { badges } = await res.json()
    expect(badges[UUID1]).toBe('nouveau')
    expect(badges[UUID2]).toBe('nouveau')
  })

  test('anti-injection : les valeurs non-UUID sont ignorées', async () => {
    // Un seul UUID valide + fragments d'injection PostgREST → seul l'UUID survit
    const res = await GET(makeRequest(`?ids=${UUID1},evil.eq.x,)or(user1_id.not.is.null`))
    expect(res.status).toBe(200)
    const { badges } = await res.json()
    expect(Object.keys(badges)).toEqual([UUID1])
  })

  test('que des valeurs invalides → { badges: {} } sans requête', async () => {
    const res = await GET(makeRequest('?ids=evil.eq.x,not-a-uuid'))
    expect(res.status).toBe(200)
    expect((await res.json()).badges).toEqual({})
    expect(mockOr).not.toHaveBeenCalled() // court-circuit avant toute requête
  })
})
