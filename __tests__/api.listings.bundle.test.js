import { POST, PATCH } from '../app/api/listings/route'

const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockGetUser = jest.fn()
const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockProfileSingle = jest.fn()

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

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
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockProfileSingle })) })) }
      }
      return {
        insert: jest.fn((rows) => { mockInsert.rows = rows; return { select: jest.fn(() => ({ single: mockInsert })) } }),
        update: jest.fn((payload) => {
          mockUpdate.payload = payload
          const chain = { eq: jest.fn(() => chain), select: jest.fn(() => ({ single: mockUpdate })) }
          return chain
        }),
      }
    }),
    storage: { from: jest.fn(() => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl })) },
  })),
}))

function makeRequest(fields = {}, files = [], withAuth = true) {
  const formData = new FormData()
  Object.entries(fields).forEach(([k, v]) => formData.append(k, String(v)))
  files.forEach(f => formData.append('images', f))

  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { formData: () => Promise.resolve(formData), headers }
}

function photo(name = 'lot.jpg', type = 'image/jpeg', size = 1000) {
  const file = new File([new Uint8Array(size)], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

const bundleFields = {
  is_bundle: 'true',
  title: 'Lot 1re année sciences comptables',
  bundle_items: 'Comptabilité intermédiaire\nMathématiques financières\nDroit des affaires',
  price: '150',
  description: 'Bon état',
  campus: 'UQAM',
  meet_campus: 'true',
  meet_city: 'false',
  post: 'false',
}

describe('POST /api/listings — annonce de lot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInsert.rows = null
    mockGetUser.mockResolvedValue({ data: { user: { id: 'seller-1' } } })
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: true }, error: null })
    mockInsert.mockResolvedValue({ data: { id: 1, is_bundle: true }, error: null })
    mockUpdate.payload = null
    mockUpdate.mockResolvedValue({ data: { id: 1, is_bundle: true }, error: null })
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn/lot-1.jpg' } })
  })

  test('lot valide sans ISBN → 200', async () => {
    const res = await POST(makeRequest(bundleFields))
    expect(res.status).toBe(200)
    const row = mockInsert.rows[0]
    expect(row.is_bundle).toBe(true)
    expect(row.isbn).toBeNull() // un lot n'a pas d'ISBN
    expect(row.bundle_items.split('\n')).toHaveLength(3)
  })

  test('moins de 2 manuels → 400', async () => {
    const res = await POST(makeRequest({ ...bundleFields, bundle_items: 'Un seul' }))
    expect(res.status).toBe(400)
  })

  test('sans titre → 400', async () => {
    const res = await POST(makeRequest({ ...bundleFields, title: '' }))
    expect(res.status).toBe(400)
  })

  test('téléphone non vérifié → 403', async () => {
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: false }, error: null })
    const res = await POST(makeRequest(bundleFields))
    expect(res.status).toBe(403)
  })

  test('plusieurs photos → toutes enregistrées, la 1re devient la vignette', async () => {
    mockGetPublicUrl
      .mockReturnValueOnce({ data: { publicUrl: 'https://cdn/a.jpg' } })
      .mockReturnValueOnce({ data: { publicUrl: 'https://cdn/b.jpg' } })
    const res = await POST(makeRequest(bundleFields, [photo('a.jpg'), photo('b.jpg')]))
    expect(res.status).toBe(200)
    const row = mockInsert.rows[0]
    expect(row.image_urls).toEqual(['https://cdn/a.jpg', 'https://cdn/b.jpg'])
    expect(row.image_url).toBe('https://cdn/a.jpg')
  })

  test('au-delà de 6 photos → 400', async () => {
    const files = Array.from({ length: 7 }, (_, i) => photo(`p${i}.jpg`))
    const res = await POST(makeRequest(bundleFields, files))
    expect(res.status).toBe(400)
    expect(mockUpload).not.toHaveBeenCalled()
  })

  test('format de photo non supporté → 400', async () => {
    const res = await POST(makeRequest(bundleFields, [photo('x.gif', 'image/gif')]))
    expect(res.status).toBe(400)
  })

  test('photo trop lourde → 400', async () => {
    const res = await POST(makeRequest(bundleFields, [photo('gros.jpg', 'image/jpeg', 6 * 1024 * 1024)]))
    expect(res.status).toBe(400)
  })

  test('une annonce simple reste limitée à une photo', async () => {
    const simple = {
      title: 'Comptabilité', isbn: '9782765012345', price: '30',
      description: 'Bon état', campus: 'UQAM', meet_campus: 'true',
    }
    const res = await POST(makeRequest(simple, [photo('a.jpg'), photo('b.jpg')]))
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/listings — modification d\'un lot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdate.payload = null
    mockGetUser.mockResolvedValue({ data: { user: { id: 'seller-1' } } })
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: true }, error: null })
    mockUpdate.mockResolvedValue({ data: { id: 1, is_bundle: true }, error: null })
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn/nouvelle.jpg' } })
  })

  test('la liste des manuels est conservée après modification', async () => {
    const req = makeRequest({ ...bundleFields, listing_id: '1' })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(mockUpdate.payload.is_bundle).toBe(true)
    expect(mockUpdate.payload.bundle_items.split('\n')).toHaveLength(3)
  })

  test('photos conservées + nouvelle photo → les deux sont enregistrées', async () => {
    const formData = new FormData()
    Object.entries({ ...bundleFields, listing_id: '1' }).forEach(([k, v]) => formData.append(k, String(v)))
    formData.append('keepImages', 'https://cdn/ancienne.jpg')
    formData.append('images', photo('nouvelle.jpg'))
    const headers = new Headers()
    headers.set('authorization', 'Bearer fake-token')

    const res = await PATCH({ formData: () => Promise.resolve(formData), headers })
    expect(res.status).toBe(200)
    expect(mockUpdate.payload.image_urls).toEqual(['https://cdn/ancienne.jpg', 'https://cdn/nouvelle.jpg'])
  })

  test('retirer toutes les photos → aucune image conservée', async () => {
    const res = await PATCH(makeRequest({ ...bundleFields, listing_id: '1' }))
    expect(mockUpdate.payload.image_urls).toEqual([])
    expect(mockUpdate.payload.image_url).toBeNull()
  })

  test('lot vidé de ses manuels → 400, rien n\'est modifié', async () => {
    const res = await PATCH(makeRequest({ ...bundleFields, listing_id: '1', bundle_items: '' }))
    expect(res.status).toBe(400)
    expect(mockUpdate.payload).toBeNull()
  })

  test('sans listing_id → 400', async () => {
    const res = await PATCH(makeRequest(bundleFields))
    expect(res.status).toBe(400)
  })
})
