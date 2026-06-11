import { PATCH } from '../app/api/listings/status/route'

const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockUpdate = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn().mockReturnThis(),
        single: mockSelect,
      })),
      update: jest.fn(() => ({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn(() => ({ single: mockUpdate })),
      })),
    })),
  })),
}))

function makeRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { json: () => Promise.resolve(body), headers }
}

describe('PATCH /api/listings/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockSelect.mockResolvedValue({ data: { id: 'listing-1', user_id: 'user-123' }, error: null })
    mockUpdate.mockResolvedValue({ data: { id: 'listing-1', status: 'sold' }, error: null })
  })

  test('sans auth → 401', async () => {
    const req = makeRequest({ listing_id: '1', status: 'sold' }, false)
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  test('sans listing_id → 400', async () => {
    const req = makeRequest({ status: 'sold' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  test('statut invalide → 400', async () => {
    const req = makeRequest({ listing_id: '1', status: 'pending' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  test('annonce introuvable → 404', async () => {
    mockSelect.mockResolvedValue({ data: null, error: null })
    const req = makeRequest({ listing_id: '999', status: 'sold' })
    const res = await PATCH(req)
    expect(res.status).toBe(404)
  })

  test('annonce appartenant à un autre user → 403', async () => {
    mockSelect.mockResolvedValue({ data: { id: '1', user_id: 'autre-user' }, error: null })
    const req = makeRequest({ listing_id: '1', status: 'sold' })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
  })

  test('sold → 200', async () => {
    const req = makeRequest({ listing_id: '1', status: 'sold' })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
  })

  test('active → 200', async () => {
    const req = makeRequest({ listing_id: '1', status: 'active' })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
  })
})
