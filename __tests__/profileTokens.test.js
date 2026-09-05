import { getUnsubTokens, getUnsubToken, findUserByUnsubToken } from '../lib/profileTokens'

const UUID = '1c3cbf8e-d341-4829-943b-67eae16aa3f4'

function makeSupabase({ existing = [], created = [], byToken = null } = {}) {
  const upsert = jest.fn(() => Promise.resolve({ error: null }))
  let call = 0
  return {
    upsert,
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        in: jest.fn(() => Promise.resolve({ data: call++ === 0 ? existing : created })),
        eq: jest.fn(() => ({ maybeSingle: () => Promise.resolve({ data: byToken }) })),
      })),
      upsert,
    })),
  }
}

describe('getUnsubTokens', () => {
  test('liste vide → aucun appel', async () => {
    const sb = makeSupabase()
    expect(await getUnsubTokens(sb, [])).toEqual({})
    expect(sb.from).not.toHaveBeenCalled()
  })

  test('jetons existants → retournés sans création', async () => {
    const sb = makeSupabase({ existing: [{ user_id: 'u1', unsub_token: 't1' }] })
    expect(await getUnsubTokens(sb, ['u1'])).toEqual({ u1: 't1' })
    expect(sb.upsert).not.toHaveBeenCalled()
  })

  test('jeton manquant → créé puis relu', async () => {
    const sb = makeSupabase({ existing: [], created: [{ user_id: 'u2', unsub_token: 't2' }] })
    expect(await getUnsubTokens(sb, ['u2'])).toEqual({ u2: 't2' })
    expect(sb.upsert).toHaveBeenCalled()
  })

  test('doublons et valeurs vides ignorés', async () => {
    const sb = makeSupabase({ existing: [{ user_id: 'u1', unsub_token: 't1' }] })
    await getUnsubTokens(sb, ['u1', 'u1', null, undefined])
    expect(sb.from).toHaveBeenCalledTimes(1) // un seul identifiant a chercher
  })
})

describe('getUnsubToken', () => {
  test('retourne le jeton de l\'utilisateur', async () => {
    const sb = makeSupabase({ existing: [{ user_id: 'u1', unsub_token: 't1' }] })
    expect(await getUnsubToken(sb, 'u1')).toBe('t1')
  })

  test('aucun jeton trouvable → null', async () => {
    const sb = makeSupabase({ existing: [], created: [] })
    expect(await getUnsubToken(sb, 'u9')).toBeNull()
  })
})

describe('findUserByUnsubToken', () => {
  test('jeton au format UUID et connu → utilisateur', async () => {
    const sb = makeSupabase({ byToken: { user_id: 'u1' } })
    expect(await findUserByUnsubToken(sb, UUID)).toBe('u1')
  })

  test('jeton inconnu → null', async () => {
    const sb = makeSupabase({ byToken: null })
    expect(await findUserByUnsubToken(sb, UUID)).toBeNull()
  })

  test('format non-UUID → refusé sans requête', async () => {
    const sb = makeSupabase({ byToken: { user_id: 'u1' } })
    expect(await findUserByUnsubToken(sb, 'abc')).toBeNull()
    expect(sb.from).not.toHaveBeenCalled()
  })

  test('jeton absent → refusé sans requête', async () => {
    const sb = makeSupabase()
    expect(await findUserByUnsubToken(sb, null)).toBeNull()
    expect(sb.from).not.toHaveBeenCalled()
  })
})
