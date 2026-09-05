import { POST } from '../app/api/messages/route'

const mockGetUser = jest.fn()
const mockGetUserById = jest.fn()
const mockConversationSingle = jest.fn()
const mockProfileSingle = jest.fn()
const mockMessageInsert = jest.fn()
const mockRateCount = jest.fn()
const mockRateInsert = jest.fn()
const mockRateDelete = jest.fn()
const mockConversationUpdate = jest.fn()
const mockSendEmail = jest.fn()
const mockTokenSelect = jest.fn()

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

// `after` exécute la notification une fois la réponse envoyée. On collecte les
// promesses pour pouvoir les attendre dans les tests.
const mockAfterPromises = []
jest.mock('next/server', () => ({ after: (fn) => { mockAfterPromises.push(fn()) } }))

jest.mock('../lib/sendEmail', () => ({
  sendEmail: (...args) => mockSendEmail(...args),
  escapeHtml: (v) => String(v ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      admin: { getUserById: mockGetUserById },
    },
    from: jest.fn((table) => {
      if (table === 'rate_limits') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockReturnThis(),
            gte: mockRateCount,
          })),
          insert: mockRateInsert,
          delete: jest.fn(() => ({ eq: mockRateDelete })),
        }
      }
      if (table === 'profile_tokens') {
        return {
          select: jest.fn(() => ({ in: mockTokenSelect })),
          upsert: jest.fn(() => Promise.resolve({ error: null })),
        }
      }
      if (table === 'messages') {
        return {
          insert: jest.fn(() => ({ select: jest.fn(() => ({ single: mockMessageInsert })) })),
        }
      }
      // conversations | profiles
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: table === 'profiles' ? mockProfileSingle : mockConversationSingle,
          })),
        })),
        update: jest.fn(() => ({ eq: mockConversationUpdate })),
      }
    }),
  })),
}))

const CONV = {
  id: 7,
  user1_id: 'buyer-1',
  user2_id: 'seller-1',
  context_type: 'manuel',
  last_read_at_user1: null,
  last_read_at_user2: null,
}

function makeRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { json: () => Promise.resolve(body), headers }
}

const validBody = { conversation_id: 7, content: 'Bonjour, est-il encore dispo ?' }

// Envoie la requête puis attend la notification différée par `after`.
async function post(body = validBody, withAuth = true) {
  const res = await POST(makeRequest(body, withAuth))
  await Promise.all(mockAfterPromises)
  return res
}

describe('POST /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAfterPromises.length = 0
    mockGetUser.mockResolvedValue({ data: { user: { id: 'buyer-1' } } })
    mockConversationSingle.mockResolvedValue({ data: { ...CONV }, error: null })
    mockProfileSingle.mockResolvedValue({ data: { message_emails_opt_in: true, first_name: 'Ali' }, error: null })
    // Le jeton de desabonnement vit desormais dans profile_tokens
    mockTokenSelect.mockResolvedValue({ data: [{ user_id: 'seller-1', unsub_token: 'tok-1' }], error: null })
    mockMessageInsert.mockResolvedValue({ data: { id: 100, content: 'ok' }, error: null })
    mockConversationUpdate.mockResolvedValue({ error: null })
    mockRateCount.mockResolvedValue({ count: 0, error: null })
    mockRateInsert.mockResolvedValue({ error: null })
    mockRateDelete.mockResolvedValue({ error: null })
    mockGetUserById.mockResolvedValue({ data: { user: { email: 'seller@exemple.ca' } } })
    mockSendEmail.mockResolvedValue(undefined)
  })

  test('sans auth → 401', async () => {
    const res = await post(validBody, false)
    expect(res.status).toBe(401)
  })

  test('sans conversation_id → 400', async () => {
    const res = await post({ content: 'salut' })
    expect(res.status).toBe(400)
  })

  test('message vide → 400', async () => {
    const res = await post({ conversation_id: 7, content: '   ' })
    expect(res.status).toBe(400)
  })

  test('message > 1000 caractères → 400', async () => {
    const res = await post({ conversation_id: 7, content: 'a'.repeat(1001) })
    expect(res.status).toBe(400)
  })

  test('conversation introuvable → 404', async () => {
    mockConversationSingle.mockResolvedValue({ data: null, error: null })
    const res = await post(validBody)
    expect(res.status).toBe(404)
  })

  test('non participant → 403 (pas d\'insertion)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'intrus-9' } } })
    const res = await post(validBody)
    expect(res.status).toBe(403)
    expect(mockMessageInsert).not.toHaveBeenCalled()
  })

  test('envoi valide → 200 et courriel au destinataire', async () => {
    const res = await post(validBody)
    expect(res.status).toBe(200)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(mockSendEmail.mock.calls[0][0].to).toBe('seller@exemple.ca')
    expect(mockGetUserById).toHaveBeenCalledWith('seller-1')
  })

  test('destinataire ayant lu il y a moins de 3 min → pas de courriel', async () => {
    mockConversationSingle.mockResolvedValue({
      data: { ...CONV, last_read_at_user2: new Date(Date.now() - 30_000).toISOString() },
      error: null,
    })
    const res = await post(validBody)
    expect(res.status).toBe(200)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  test('lecture ancienne (> 3 min) → courriel envoyé', async () => {
    mockConversationSingle.mockResolvedValue({
      data: { ...CONV, last_read_at_user2: new Date(Date.now() - 3_600_000).toISOString() },
      error: null,
    })
    await post(validBody)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  test('le jeton de desabonnement ne vient plus de profiles', async () => {
    await post()
    const html = mockSendEmail.mock.calls[0][0].html
    expect(html).toContain('tok-1') // provient de profile_tokens
  })

  test('destinataire désabonné → pas de courriel', async () => {
    mockProfileSingle.mockResolvedValue({ data: { message_emails_opt_in: false }, error: null })
    const res = await post(validBody)
    expect(res.status).toBe(200)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  test('déjà notifié dans le quart d\'heure → pas de courriel', async () => {
    mockRateCount.mockResolvedValue({ count: 1, error: null })
    await post(validBody)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  test('table rate_limits indisponible → pas de courriel (échec fermé)', async () => {
    mockRateCount.mockResolvedValue({ count: null, error: { message: 'boom' } })
    await post(validBody)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  test('échec Resend → le message est quand même envoyé (200)', async () => {
    mockSendEmail.mockRejectedValue(new Error('Resend down'))
    const res = await post(validBody)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message.id).toBe(100)
  })

  test('échec Resend → le verrou est libéré (nouvelle tentative possible)', async () => {
    mockSendEmail.mockRejectedValue(new Error('Resend down'))
    await post(validBody)
    expect(mockRateDelete).toHaveBeenCalledWith('key', 'msg-notif:7:seller-1')
  })

  test('destinataire sans adresse courriel → verrou libéré, pas d\'envoi', async () => {
    mockGetUserById.mockResolvedValue({ data: { user: null } })
    await post(validBody)
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(mockRateDelete).toHaveBeenCalledWith('key', 'msg-notif:7:seller-1')
  })

  test('conversation admin → l\'identité de l\'admin n\'est pas révélée', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'buyer-1' } } })
    mockConversationSingle.mockResolvedValue({
      data: { ...CONV, context_type: 'admin' },
      error: null,
    })
    await post(validBody)
    expect(mockSendEmail.mock.calls[0][0].subject).toContain('Support BiblioCamp')
  })

  test('aperçu tronqué et échappé dans le HTML', async () => {
    await post({ conversation_id: 7, content: '<script>alert(1)</script> ' + 'a'.repeat(200) })
    const html = mockSendEmail.mock.calls[0][0].html
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('…')
  })

  test('insertion en échec → 500 et aucun courriel', async () => {
    mockMessageInsert.mockResolvedValue({ data: null, error: { message: 'db down' } })
    const res = await post(validBody)
    expect(res.status).toBe(500)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})
