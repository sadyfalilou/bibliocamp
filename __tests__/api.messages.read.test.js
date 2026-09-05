import { POST } from '../app/api/messages/read/route'

const mockGetUser = jest.fn()
const mockConversationSingle = jest.fn()
const mockMessagesUpdate = jest.fn()
const mockConversationUpdate = jest.fn()

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table) => {
      if (table === 'messages') {
        return {
          update: jest.fn(() => ({
            eq: jest.fn(() => ({ neq: mockMessagesUpdate })),
          })),
        }
      }
      return {
        select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockConversationSingle })) })),
        update: jest.fn((payload) => ({ eq: (...args) => mockConversationUpdate(payload, ...args) })),
      }
    }),
  })),
}))

const CONV = { id: 7, user1_id: 'buyer-1', user2_id: 'seller-1' }

function makeRequest(body, withAuth = true) {
  const headers = new Headers()
  if (withAuth) headers.set('authorization', 'Bearer fake-token')
  return { json: () => Promise.resolve(body), headers }
}

describe('POST /api/messages/read', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'seller-1' } } })
    mockConversationSingle.mockResolvedValue({ data: { ...CONV }, error: null })
    mockMessagesUpdate.mockResolvedValue({ error: null })
    mockConversationUpdate.mockResolvedValue({ error: null })
  })

  test('sans auth → 401', async () => {
    const res = await POST(makeRequest({ conversation_id: 7 }, false))
    expect(res.status).toBe(401)
  })

  test('sans conversation_id → 400', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  test('conversation introuvable → 404', async () => {
    mockConversationSingle.mockResolvedValue({ data: null, error: null })
    const res = await POST(makeRequest({ conversation_id: 7 }))
    expect(res.status).toBe(404)
  })

  test('non participant → 403 (rien n\'est marqué lu)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'intrus-9' } } })
    const res = await POST(makeRequest({ conversation_id: 7 }))
    expect(res.status).toBe(403)
    expect(mockMessagesUpdate).not.toHaveBeenCalled()
  })

  test('user2 → horodate last_read_at_user2', async () => {
    const res = await POST(makeRequest({ conversation_id: 7 }))
    expect(res.status).toBe(200)
    expect(mockConversationUpdate.mock.calls[0][0]).toHaveProperty('last_read_at_user2')
  })

  test('user1 → horodate last_read_at_user1', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'buyer-1' } } })
    await POST(makeRequest({ conversation_id: 7 }))
    expect(mockConversationUpdate.mock.calls[0][0]).toHaveProperty('last_read_at_user1')
  })

  test('échec du marquage → 500 sans horodatage', async () => {
    mockMessagesUpdate.mockResolvedValue({ error: { message: 'db down' } })
    const res = await POST(makeRequest({ conversation_id: 7 }))
    expect(res.status).toBe(500)
    expect(mockConversationUpdate).not.toHaveBeenCalled()
  })
})
