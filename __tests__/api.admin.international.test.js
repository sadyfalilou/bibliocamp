import { GET, PATCH } from '../app/api/admin/international/route'

const mockGetUser = jest.fn()
const mockOrder = jest.fn()
const mockSingle = jest.fn() // lookup profiles.is_admin
const mockEq = jest.fn()
const mockUpdate = jest.fn(() => ({ eq: mockEq }))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      // .select('*').order(...) pour la liste ; .select('is_admin').eq().single() pour le contrôle admin
      select: jest.fn(() => ({
        order: mockOrder,
        eq: jest.fn(() => ({ single: mockSingle })),
      })),
      update: mockUpdate,
    })),
  })),
}))

function makeRequest(withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { headers }
}

function makePatchRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { headers, json: async () => body }
}

// Par défaut : utilisateur connecté ET admin. Les cas non-admin surchargent mockSingle.
function asAdmin() {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
  mockSingle.mockResolvedValue({ data: { is_admin: true }, error: null })
}
function asNonAdmin() {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'student-1' } } })
  mockSingle.mockResolvedValue({ data: { is_admin: false }, error: null })
}

describe('GET /api/admin/international', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOrder.mockResolvedValue({ data: [{ id: 1 }], error: null })
    mockEq.mockResolvedValue({ error: null })
  })

  test('sans auth → 403', async () => {
    const res = await GET(makeRequest(false))
    expect(res.status).toBe(403)
  })

  test('utilisateur non-admin → 403', async () => {
    asNonAdmin()
    const res = await GET(makeRequest())
    expect(res.status).toBe(403)
  })

  test('admin → 200 avec liste', async () => {
    asAdmin()
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.diagnostics).toHaveLength(1)
  })

  test('erreur Supabase → 500', async () => {
    asAdmin()
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})

describe('PATCH /api/admin/international', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEq.mockResolvedValue({ error: null })
  })

  test('sans auth → 403', async () => {
    const res = await PATCH(makePatchRequest({ id: 1, status: 'termine' }, false))
    expect(res.status).toBe(403)
  })

  test('utilisateur non-admin → 403', async () => {
    asNonAdmin()
    const res = await PATCH(makePatchRequest({ id: 1, status: 'termine' }))
    expect(res.status).toBe(403)
  })

  test('statut invalide → 400', async () => {
    asAdmin()
    const res = await PATCH(makePatchRequest({ id: 1, status: 'inexistant' }))
    expect(res.status).toBe(400)
  })

  test('id manquant → 400', async () => {
    asAdmin()
    const res = await PATCH(makePatchRequest({ status: 'termine' }))
    expect(res.status).toBe(400)
  })

  test('admin avec statut valide → 200', async () => {
    asAdmin()
    const res = await PATCH(makePatchRequest({ id: 1, status: 'termine' }))
    expect(res.status).toBe(200)
  })

  test('erreur Supabase → 500', async () => {
    asAdmin()
    mockEq.mockResolvedValue({ error: { message: 'DB error' } })
    const res = await PATCH(makePatchRequest({ id: 1, status: 'termine' }))
    expect(res.status).toBe(500)
  })

  test('statut paiement invalide → 400', async () => {
    asAdmin()
    const res = await PATCH(makePatchRequest({ id: 1, payment_status: 'inexistant' }))
    expect(res.status).toBe(400)
  })

  test('aucun champ a mettre a jour → 400', async () => {
    asAdmin()
    const res = await PATCH(makePatchRequest({ id: 1 }))
    expect(res.status).toBe(400)
  })

  test('admin met a jour le forfait et le paiement → 200', async () => {
    asAdmin()
    const res = await PATCH(makePatchRequest({
      id: 1, forfait: 'Accompagnement complet', prix: 250, payment_method: 'Sendwave', payment_status: 'paye'
    }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({
      forfait: 'Accompagnement complet', prix: 250, payment_method: 'Sendwave', payment_status: 'paye'
    })
  })
})
