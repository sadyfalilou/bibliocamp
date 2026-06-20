import { GET, POST, PATCH, DELETE } from '../app/api/roommates/route'

// ─── Mock Supabase ─────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()
const mockReadSingle = jest.fn()   // .single() terminal (fetch annonce existante)
const mockReadList = jest.fn()     // terminal awaitable (GET liste)
const mockInsertSingle = jest.fn()
const mockUpdateSingle = jest.fn()
const mockDeleteResult = jest.fn()
const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockRemove = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => {
        const chain = {}
        chain.eq = jest.fn(() => chain)
        chain.ilike = jest.fn(() => chain)
        chain.lte = jest.fn(() => chain)
        chain.or = jest.fn(() => chain)
        chain.order = jest.fn(() => chain)
        chain.single = mockReadSingle
        chain.then = (resolve, reject) => mockReadList().then(resolve, reject)
        return chain
      }),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({ single: mockInsertSingle })),
      })),
      update: jest.fn(() => {
        const chain = {}
        chain.eq = jest.fn(() => chain)
        chain.select = jest.fn(() => ({ single: mockUpdateSingle }))
        return chain
      }),
      delete: jest.fn(() => {
        const chain = {}
        chain.eq = jest.fn(() => chain)
        chain.then = (resolve, reject) => mockDeleteResult().then(resolve, reject)
        return chain
      }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      })),
    },
  })),
}))

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeFormRequest(fields = {}, withAuth = true) {
  const formData = new FormData()
  Object.entries(fields).forEach(([k, v]) => formData.append(k, String(v)))

  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  headers.set('content-type', 'multipart/form-data; boundary=test')

  return { formData: () => Promise.resolve(formData), headers, url: 'http://localhost/api/roommates' }
}

function makeJsonRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  headers.set('content-type', 'application/json')
  return { json: () => Promise.resolve(body), headers }
}

function makeGetRequest(query = '') {
  return { url: `http://localhost/api/roommates${query}` }
}

function makeDeleteRequest(id, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { url: `http://localhost/api/roommates${id !== undefined ? `?id=${id}` : ''}`, headers }
}

const validFields = {
  title: 'Chambre disponible près de l\'UQAM',
  rent_price: '550',
  room_type: 'chambre_privee',
  city: 'Montréal',
  campus: 'UQAM',
}

// ─── GET /api/roommates ────────────────────────────────────────────────────────

describe('GET /api/roommates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReadList.mockResolvedValue({ data: [{ id: 1, title: 'Chambre 4 1/2', status: 'active' }], error: null })
  })

  test('retourne la liste des annonces actives → 200', async () => {
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.listings).toHaveLength(1)
  })

  test('avec filtres (ville, prix, type) → 200', async () => {
    const res = await GET(makeGetRequest('?city=Montreal&maxPrice=600&roomType=chambre_privee'))
    expect(res.status).toBe(200)
  })

  test('erreur Supabase → 500', async () => {
    mockReadList.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(500)
  })
})

// ─── POST /api/roommates ───────────────────────────────────────────────────────

describe('POST /api/roommates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockInsertSingle.mockResolvedValue({ data: { id: 1, ...validFields }, error: null })
  })

  test('sans auth → 401', async () => {
    const req = makeFormRequest(validFields, false)
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  test('titre vide → 400', async () => {
    const req = makeFormRequest({ ...validFields, title: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('loyer à 0 → 400', async () => {
    const req = makeFormRequest({ ...validFields, rent_price: '0' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('loyer supérieur à 9999 → 400', async () => {
    const req = makeFormRequest({ ...validFields, rent_price: '10000' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('type de logement invalide → 400', async () => {
    const req = makeFormRequest({ ...validFields, room_type: 'studio' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('données valides → 200 avec listing', async () => {
    const req = makeFormRequest(validFields)
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.listing).toBeDefined()
  })

  test('erreur Supabase insert → 500', async () => {
    mockInsertSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const req = makeFormRequest(validFields)
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})

// ─── PATCH /api/roommates (changement de statut — JSON) ───────────────────────

describe('PATCH /api/roommates — statut (JSON)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockUpdateSingle.mockResolvedValue({ data: { id: 1, status: 'rented' }, error: null })
  })

  test('sans auth → 401', async () => {
    const req = makeJsonRequest({ id: 1, status: 'rented' }, false)
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  test('statut invalide → 400', async () => {
    const req = makeJsonRequest({ id: 1, status: 'vendu' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  test('annonce introuvable ou accès refusé → 403', async () => {
    mockUpdateSingle.mockResolvedValue({ data: null, error: null })
    const req = makeJsonRequest({ id: 999, status: 'rented' })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
  })

  test('changement de statut valide → 200', async () => {
    const req = makeJsonRequest({ id: 1, status: 'rented' })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.listing.status).toBe('rented')
  })
})

// ─── PATCH /api/roommates (modification complète — multipart) ────────────────

describe('PATCH /api/roommates — édition complète (multipart)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockReadSingle.mockResolvedValue({ data: { id: 1, image_url: null, image_urls: [], user_id: 'user-123' }, error: null })
    mockUpdateSingle.mockResolvedValue({ data: { id: 1, ...validFields }, error: null })
  })

  test('sans auth → 401', async () => {
    const req = makeFormRequest({ id: '1', ...validFields }, false)
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  test('sans id → 400', async () => {
    const req = makeFormRequest(validFields)
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  test('annonce introuvable ou pas propriétaire → 403', async () => {
    mockReadSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const req = makeFormRequest({ id: '999', ...validFields })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
  })

  test('titre vide → 400', async () => {
    const req = makeFormRequest({ id: '1', ...validFields, title: '' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  test('mise à jour valide → 200 avec listing', async () => {
    const req = makeFormRequest({ id: '1', ...validFields })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.listing).toBeDefined()
  })

  test('erreur Supabase update → 500', async () => {
    mockUpdateSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const req = makeFormRequest({ id: '1', ...validFields })
    const res = await PATCH(req)
    expect(res.status).toBe(500)
  })
})

// ─── DELETE /api/roommates ─────────────────────────────────────────────────────

describe('DELETE /api/roommates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockReadSingle.mockResolvedValue({ data: { id: 1, image_url: null, image_urls: [], user_id: 'user-123' }, error: null })
    mockDeleteResult.mockResolvedValue({ error: null })
  })

  test('sans auth → 401', async () => {
    const res = await DELETE(makeDeleteRequest(1, false))
    expect(res.status).toBe(401)
  })

  test('sans id → 400', async () => {
    const res = await DELETE(makeDeleteRequest(undefined))
    expect(res.status).toBe(400)
  })

  test('annonce introuvable ou pas propriétaire → 403', async () => {
    mockReadSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const res = await DELETE(makeDeleteRequest(999))
    expect(res.status).toBe(403)
  })

  test('suppression valide → 200', async () => {
    const res = await DELETE(makeDeleteRequest(1))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  test('erreur Supabase delete → 500', async () => {
    mockDeleteResult.mockResolvedValue({ error: { message: 'DB error' } })
    const res = await DELETE(makeDeleteRequest(1))
    expect(res.status).toBe(500)
  })
})
