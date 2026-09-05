import { POST, MAX_PER_BATCH, MAX_PER_DAY } from '../app/api/listings/batch/route'

const mockGetUser = jest.fn()
const mockProfileSingle = jest.fn()
const mockCountToday = jest.fn()
const mockExistingListings = jest.fn()
const mockInsert = jest.fn()
const mockAlerts = jest.fn()
const mockAlertsUpdate = jest.fn()
const mockSendBatchEmails = jest.fn()

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

jest.mock('../lib/sendEmail', () => ({
  sendBatchEmails: (...args) => mockSendBatchEmails(...args),
  escapeHtml: (v) => String(v ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockProfileSingle })) })) }
      }
      if (table === 'book_alerts') {
        return {
          select: jest.fn(() => ({ in: jest.fn(() => ({ eq: mockAlerts })) })),
          update: jest.fn(() => ({ in: mockAlertsUpdate })),
        }
      }
      // listings : comptage du jour, annonces existantes, insertion
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: mockCountToday,
            eq: mockExistingListings,
          })),
        })),
        insert: jest.fn(() => ({ select: mockInsert })),
      }
    }),
  })),
}))

function makeRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { json: () => Promise.resolve(body), headers }
}

// Une ligne valide ; `over` permet de casser un champ précis.
function item(over = {}) {
  return {
    title: 'Comptabilité générale',
    authors: 'Dupont',
    isbn: '9782765012345',
    price: '30',
    description: 'Bon état',
    campus: 'UQAM',
    meet_campus: true,
    ...over,
  }
}

describe('POST /api/listings/batch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'seller-1' } } })
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: true }, error: null })
    mockCountToday.mockResolvedValue({ count: 0, error: null })
    mockExistingListings.mockResolvedValue({ data: [], error: null })
    mockInsert.mockImplementation(() => Promise.resolve({
      data: [{ id: 1, isbn: '9782765012345', title: 'Comptabilité générale', price: 30 }],
      error: null,
    }))
    mockAlerts.mockResolvedValue({ data: [], error: null })
    mockAlertsUpdate.mockResolvedValue({ error: null })
    mockSendBatchEmails.mockResolvedValue(undefined)
  })

  test('sans auth → 401', async () => {
    const res = await POST(makeRequest({ items: [item()] }, false))
    expect(res.status).toBe(401)
  })

  test('téléphone non vérifié → 403', async () => {
    mockProfileSingle.mockResolvedValue({ data: { phone_verified: false }, error: null })
    const res = await POST(makeRequest({ items: [item()] }))
    expect(res.status).toBe(403)
  })

  test('liste vide → 400', async () => {
    const res = await POST(makeRequest({ items: [] }))
    expect(res.status).toBe(400)
  })

  test('au-delà du maximum par lot → 400', async () => {
    const items = Array.from({ length: MAX_PER_BATCH + 1 }, () => item())
    const res = await POST(makeRequest({ items }))
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  test('lot valide → 200 et insertion groupée', async () => {
    const res = await POST(makeRequest({ items: [item()] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.created).toHaveLength(1)
    expect(body.rejected).toEqual([])
    expect(mockInsert).toHaveBeenCalledTimes(1) // une seule requête, pas N
  })

  test('succès partiel : la ligne invalide est rejetée, les autres passent', async () => {
    const items = [item(), item({ isbn: '9782765099999', price: '0' }), item({ isbn: '9782765088888' })]
    const res = await POST(makeRequest({ items }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.rejected).toHaveLength(1)
    expect(body.rejected[0].index).toBe(1) // l'indice permet de surligner la ligne
    expect(body.rejected[0].error).toMatch(/prix/i)
  })

  test('toutes les lignes invalides → 400, rien n\'est inséré', async () => {
    const res = await POST(makeRequest({ items: [item({ price: '0' })] }))
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
    const body = await res.json()
    expect(body.rejected).toHaveLength(1)
  })

  test('ISBN déjà en vente par ce vendeur → rejeté', async () => {
    mockExistingListings.mockResolvedValue({ data: [{ isbn: '9782765012345' }], error: null })
    const res = await POST(makeRequest({ items: [item()] }))
    const body = await res.json()
    expect(body.rejected[0].error).toMatch(/déjà une annonce/i)
  })

  test('ISBN en double dans le lot → la 2e est rejetée', async () => {
    const res = await POST(makeRequest({ items: [item(), item()] }))
    const body = await res.json()
    expect(body.rejected).toHaveLength(1)
    expect(body.rejected[0].index).toBe(1)
    expect(body.rejected[0].error).toMatch(/deux fois/i)
  })

  test('plafond quotidien atteint → 429', async () => {
    mockCountToday.mockResolvedValue({ count: MAX_PER_DAY, error: null })
    const res = await POST(makeRequest({ items: [item()] }))
    expect(res.status).toBe(429)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  test('plafond quotidien partiellement atteint → seules les places restantes sont publiées', async () => {
    mockCountToday.mockResolvedValue({ count: MAX_PER_DAY - 1, error: null })
    const items = [item(), item({ isbn: '9782765099999' })]
    const res = await POST(makeRequest({ items }))
    const body = await res.json()
    expect(body.rejected).toHaveLength(1)
    expect(body.rejected[0].error).toMatch(/par jour/i)
  })

  test('alertes manuel → un seul envoi groupé', async () => {
    mockAlerts.mockResolvedValue({
      data: [{ id: 10, email: 'etudiant@exemple.ca', isbn: '9782765012345' }],
      error: null,
    })
    await POST(makeRequest({ items: [item()] }))
    expect(mockSendBatchEmails).toHaveBeenCalledTimes(1)
    expect(mockSendBatchEmails.mock.calls[0][0]).toHaveLength(1)
    expect(mockAlertsUpdate).toHaveBeenCalled()
  })

  test('échec des alertes → la publication reste un succès', async () => {
    mockAlerts.mockResolvedValue({ data: [{ id: 10, email: 'x@y.ca', isbn: '9782765012345' }], error: null })
    mockSendBatchEmails.mockRejectedValue(new Error('Resend down'))
    const res = await POST(makeRequest({ items: [item()] }))
    expect(res.status).toBe(200)
  })

  test('échec d\'insertion → 500', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'db down' } })
    const res = await POST(makeRequest({ items: [item()] }))
    expect(res.status).toBe(500)
  })
})
