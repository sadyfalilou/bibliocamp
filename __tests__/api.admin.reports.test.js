import { GET } from '../app/api/admin/reports/route'

// Vérifie le contrôle d'accès admin unifié sur profiles.is_admin.
const mockGetUser = jest.fn()
const mockIsAdminSingle = jest.fn()
const mockReportsResult = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockIsAdminSingle })) })) }
      }
      // reports
      return { select: jest.fn(() => ({ order: mockReportsResult })) }
    }),
  })),
}))

function makeRequest(withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { headers, url: 'http://localhost/api/admin/reports' }
}

describe('GET /api/admin/reports — contrôle is_admin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockReportsResult.mockResolvedValue({ data: [], error: null })
  })

  test('sans token → 403', async () => {
    const res = await GET(makeRequest(false))
    expect(res.status).toBe(403)
  })

  test('utilisateur non-admin → 403', async () => {
    mockIsAdminSingle.mockResolvedValue({ data: { is_admin: false } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(403)
  })

  test('admin (is_admin=true) → 200', async () => {
    mockIsAdminSingle.mockResolvedValue({ data: { is_admin: true } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.listings).toEqual([])
  })
})
