import { POST, PATCH } from '../app/api/listings/route'

// ─── Mock Supabase ─────────────────────────────────────────────────────────────

const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockGetUser = jest.fn()
const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockProfileSingle = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table) => {
      if (table === 'book_alerts') {
        const chain = { eq: jest.fn(() => chain), in: jest.fn(() => Promise.resolve({ data: null })) }
        chain.select = jest.fn(() => ({ ...chain, then: (resolve) => resolve({ data: [] }) }))
        chain.update = jest.fn(() => chain)
        return chain
      }
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ single: mockProfileSingle })),
          })),
        }
      }
      return {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({ single: mockInsert })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn().mockReturnThis(),
          select: jest.fn(() => ({ single: mockUpdate })),
        })),
      }
    }),
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  })),
}))

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(fields = {}, withAuth = true) {
  const formData = new FormData()
  Object.entries(fields).forEach(([k, v]) => formData.append(k, String(v)))

  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')

  return { formData: () => Promise.resolve(formData), headers }
}

const validFields = {
  title: 'Le Marketing',
  authors: 'Philip Kotler',
  isbn: '9782765141310',      // ISBN obligatoire
  course_code: 'MKG3301',
  price: '35',
  original_price: '85',
  campus: 'UQAM',
  description: 'Bon état',   // état obligatoire
  meet_campus: 'true',        // au moins une méthode obligatoire
  meet_city: 'false',
  post: 'false',
}

// ─── POST /api/listings ────────────────────────────────────────────────────────

describe('POST /api/listings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: true }, error: null })
    mockInsert.mockResolvedValue({ data: { id: 'listing-1', ...validFields }, error: null })
  })

  test('sans auth → 401', async () => {
    const req = makeRequest(validFields, false)
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/autorisé/i)
  })

  test('téléphone non vérifié → 403', async () => {
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: false }, error: null })
    const req = makeRequest(validFields)
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/téléphone/i)
  })

  test('titre vide → 400', async () => {
    const req = makeRequest({ ...validFields, title: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  test('isbn manquant → 400', async () => {
    const req = makeRequest({ ...validFields, isbn: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('isbn invalide → 400', async () => {
    const req = makeRequest({ ...validFields, isbn: '123abc' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('état manquant → 400', async () => {
    const req = makeRequest({ ...validFields, description: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('état invalide → 400', async () => {
    const req = makeRequest({ ...validFields, description: 'Cassé' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('aucune méthode de transaction → 400', async () => {
    const req = makeRequest({ ...validFields, meet_campus: 'false', meet_city: 'false', post: 'false' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('prix invalide → 400', async () => {
    const req = makeRequest({ ...validFields, price: '0' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('prix neuf ≤ prix de vente → 400', async () => {
    const req = makeRequest({ ...validFields, price: '50', original_price: '30' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('données valides → 200 avec listing', async () => {
    const req = makeRequest(validFields)
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.listing).toBeDefined()
  })

  test('domaine invalide → 400', async () => {
    const req = makeRequest({ ...validFields, domain: 'Astrologie' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  test('domaine valide → 200', async () => {
    const req = makeRequest({ ...validFields, domain: 'Sciences' })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  test('erreur Supabase → 500', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const req = makeRequest(validFields)
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})

// ─── PATCH /api/listings ───────────────────────────────────────────────────────

describe('PATCH /api/listings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockUpdate.mockResolvedValue({ data: { id: 'listing-1', ...validFields }, error: null })
  })

  test('sans auth → 401', async () => {
    const req = makeRequest({ listing_id: '1', ...validFields }, false)
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  test('sans listing_id → 400', async () => {
    const req = makeRequest(validFields)
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/id annonce/i)
  })

  test('isbn manquant → 400', async () => {
    const req = makeRequest({ listing_id: '1', ...validFields, isbn: '' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  test('état manquant → 400', async () => {
    const req = makeRequest({ listing_id: '1', ...validFields, description: '' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  test('champs invalides → 400', async () => {
    const req = makeRequest({ listing_id: '1', ...validFields, price: '-1' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  test('annonce introuvable (Supabase null) → 403', async () => {
    mockUpdate.mockResolvedValue({ data: null, error: null })
    const req = makeRequest({ listing_id: '999', ...validFields })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
  })

  test('mise à jour valide → 200 avec listing', async () => {
    const req = makeRequest({ listing_id: '1', ...validFields })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.listing).toBeDefined()
  })
})
