import { GET } from '../app/api/seller/route'

const mockProfileSingle = jest.fn()
const mockListingsResult = jest.fn()
const mockReviewsResult = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockProfileSingle })) })) }
      }
      const chain = {}
      chain.eq = jest.fn(() => chain)
      chain.order = jest.fn(() => chain)
      chain.then = (resolve, reject) =>
        (table === 'listings' ? mockListingsResult() : mockReviewsResult()).then(resolve, reject)
      return { select: jest.fn(() => chain) }
    }),
  })),
}))

function makeRequest(query = '') {
  return { url: `http://localhost/api/seller${query}` }
}

describe('GET /api/seller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockProfileSingle.mockResolvedValue({ data: { id: 'seller-1', first_name: 'Sady' } })
    mockListingsResult.mockResolvedValue({ data: [] })
    mockReviewsResult.mockResolvedValue({ data: [] })
  })

  test('sans id → 400', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
  })

  test('vendeur introuvable → 404', async () => {
    mockProfileSingle.mockResolvedValue({ data: null })
    const res = await GET(makeRequest('?id=ghost'))
    expect(res.status).toBe(404)
  })

  test('sans avis → avgRating null, reviewCount 0', async () => {
    const res = await GET(makeRequest('?id=seller-1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.avgRating).toBeNull()
    expect(body.reviewCount).toBe(0)
  })

  test('avec avis → calcule avgRating et reviewCount', async () => {
    mockReviewsResult.mockResolvedValue({ data: [{ id: 1, rating: 5 }, { id: 2, rating: 3 }] })
    const res = await GET(makeRequest('?id=seller-1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.avgRating).toBe(4)
    expect(body.reviewCount).toBe(2)
  })
})
