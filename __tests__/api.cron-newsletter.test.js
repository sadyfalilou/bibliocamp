import { GET } from '../app/api/cron/newsletter-rentree/route'

const mockMaybeSingle = jest.fn()
const mockProfilesSelect = jest.fn()
const mockInsert = jest.fn()
const mockListUsers = jest.fn()
const mockTokenSelect = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(table => {
      if (table === 'newsletter_campaigns_log') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({ maybeSingle: mockMaybeSingle })),
            })),
          })),
          insert: mockInsert,
        }
      }
      if (table === 'profiles') {
        return { select: jest.fn(() => ({ eq: mockProfilesSelect })) }
      }
      if (table === 'profile_tokens') {
        return {
          select: jest.fn(() => ({ in: mockTokenSelect })),
          upsert: jest.fn(() => Promise.resolve({ error: null })),
        }
      }
      return {}
    }),
    auth: { admin: { listUsers: mockListUsers } },
  })),
}))

jest.mock('@sentry/nextjs', () => ({ captureException: jest.fn() }))

const mockSendBatchEmails = jest.fn()
jest.mock('../lib/sendEmail', () => ({
  sendBatchEmails: (...args) => mockSendBatchEmails(...args),
}))

function makeRequest(secret) {
  return { headers: { get: () => (secret ? `Bearer ${secret}` : null) } }
}

describe('GET /api/cron/newsletter-rentree', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...OLD_ENV, CRON_SECRET: 'secret123' }
    mockMaybeSingle.mockResolvedValue({ data: null })
    mockInsert.mockResolvedValue({ data: null, error: null })
    mockListUsers.mockResolvedValue({ data: { users: [] }, error: null })
    mockTokenSelect.mockResolvedValue({ data: [{ user_id: 'u1', unsub_token: 'tok-1' }], error: null })
  })

  afterEach(() => {
    jest.useRealTimers()
    process.env = OLD_ENV
  })

  test('sans le bon secret → 401', async () => {
    const res = await GET(makeRequest('wrong'))
    expect(res.status).toBe(401)
  })

  test('date hors campagne → skip', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-22'))
    const res = await GET(makeRequest('secret123'))
    const body = await res.json()
    expect(body.skipped).toBe(true)
  })

  test('campagne déjà envoyée aujourd\'hui → skip', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00Z'))
    mockMaybeSingle.mockResolvedValue({ data: { id: 1 } })
    const res = await GET(makeRequest('secret123'))
    const body = await res.json()
    expect(body.skipped).toBe(true)
  })

  test('campagne rentrée automne → envoie aux abonnés', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-25T12:00:00Z'))
    mockProfilesSelect.mockResolvedValue({
      data: [{ id: 'user-1', newsletter_unsub_token: 'tok-1' }],
      error: null,
    })
    mockListUsers.mockResolvedValue({ data: { users: [{ id: 'user-1', email: 'a@b.com' }] }, error: null })
    mockSendBatchEmails.mockResolvedValue()

    const res = await GET(makeRequest('secret123'))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.sent).toBe(1)
    expect(mockSendBatchEmails).toHaveBeenCalledWith([
      expect.objectContaining({ to: 'a@b.com' }),
    ])
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ campaign_key: 'rentree-automne', recipients_count: 1 })
    )
  })

  test('aucun abonné → sent 0', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2027-01-05T12:00:00Z'))
    mockProfilesSelect.mockResolvedValue({ data: [], error: null })
    const res = await GET(makeRequest('secret123'))
    const body = await res.json()
    expect(body.sent).toBe(0)
  })
})
