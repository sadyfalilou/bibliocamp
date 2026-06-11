import { validateField, validateListing, validateMessage, validateImageFile } from '../lib/validation'

// ─── validateField — title ─────────────────────────────────────────────────────

describe('validateField — title', () => {
  test('vide → erreur', () => {
    expect(validateField('title', '')).not.toBe('')
    expect(validateField('title', '   ')).not.toBe('')
  })
  test('valide → pas d\'erreur', () => {
    expect(validateField('title', 'Le Marketing')).toBe('')
  })
  test('trop long (>150) → erreur', () => {
    expect(validateField('title', 'a'.repeat(151))).not.toBe('')
  })
  test('exactement 150 → ok', () => {
    expect(validateField('title', 'a'.repeat(150))).toBe('')
  })
})

// ─── validateField — price ─────────────────────────────────────────────────────

describe('validateField — price', () => {
  test('vide → erreur', () => expect(validateField('price', '')).not.toBe(''))
  test('0 → erreur', () => expect(validateField('price', '0')).not.toBe(''))
  test('négatif → erreur', () => expect(validateField('price', '-5')).not.toBe(''))
  test('trop élevé (>9999) → erreur', () => expect(validateField('price', '10000')).not.toBe(''))
  test('1 → ok', () => expect(validateField('price', '1')).toBe(''))
  test('9999 → ok', () => expect(validateField('price', '9999')).toBe(''))
  test('35.50 → ok', () => expect(validateField('price', '35.50')).toBe(''))
})

// ─── validateField — originalPrice ────────────────────────────────────────────

describe('validateField — originalPrice', () => {
  test('vide → ok (optionnel)', () => expect(validateField('originalPrice', '')).toBe(''))
  test('inférieur au prix → erreur', () => {
    expect(validateField('originalPrice', '20', { price: '30' })).not.toBe('')
  })
  test('égal au prix → erreur', () => {
    expect(validateField('originalPrice', '30', { price: '30' })).not.toBe('')
  })
  test('supérieur au prix → ok', () => {
    expect(validateField('originalPrice', '85', { price: '35' })).toBe('')
  })
})

// ─── validateField — isbn (OBLIGATOIRE) ────────────────────────────────────────

describe('validateField — isbn', () => {
  test('vide → erreur (obligatoire)', () => expect(validateField('isbn', '')).not.toBe(''))
  test('null → erreur', () => expect(validateField('isbn', null)).not.toBe(''))
  test('ISBN-13 valide', () => expect(validateField('isbn', '9782765141310')).toBe(''))
  test('ISBN-10 valide', () => expect(validateField('isbn', '0306406152')).toBe(''))
  test('avec tirets → ok', () => expect(validateField('isbn', '978-2-7651-4131-0')).toBe(''))
  test('trop court → erreur', () => expect(validateField('isbn', '123')).not.toBe(''))
  test('lettres → erreur', () => expect(validateField('isbn', 'ABCDEFGHIJ')).not.toBe(''))
})

// ─── validateField — description / état (OBLIGATOIRE) ─────────────────────────

describe('validateField — description (état)', () => {
  test('vide → erreur (obligatoire)', () => expect(validateField('description', '')).not.toBe(''))
  test('null → erreur', () => expect(validateField('description', null)).not.toBe(''))
  test('Neuf → ok', () => expect(validateField('description', 'Neuf')).toBe(''))
  test('Très bon état → ok', () => expect(validateField('description', 'Très bon état')).toBe(''))
  test('Bon état → ok', () => expect(validateField('description', 'Bon état')).toBe(''))
  test('Acceptable → ok', () => expect(validateField('description', 'Acceptable')).toBe(''))
  test('valeur invalide → erreur', () => expect(validateField('description', 'Cassé')).not.toBe(''))
})

// ─── validateField — transaction (OBLIGATOIRE) ────────────────────────────────

describe('validateField — transaction', () => {
  test('vide → erreur (obligatoire)', () => expect(validateField('transaction', '')).not.toBe(''))
  test('"ok" → pas d\'erreur', () => expect(validateField('transaction', 'ok')).toBe(''))
})

// ─── validateField — campus ────────────────────────────────────────────────────

describe('validateField — campus', () => {
  test('vide → ok (optionnel)', () => expect(validateField('campus', '')).toBe(''))
  test('UQAM → ok', () => expect(validateField('campus', 'UQAM')).toBe(''))
  test('>100 chars → erreur', () => expect(validateField('campus', 'a'.repeat(101))).not.toBe(''))
})

// ─── validateField — authors ──────────────────────────────────────────────────

describe('validateField — authors', () => {
  test('vide → ok (optionnel)', () => expect(validateField('authors', '')).toBe(''))
  test('>200 chars → erreur', () => expect(validateField('authors', 'a'.repeat(201))).not.toBe(''))
})

// ─── validateListing ──────────────────────────────────────────────────────────

describe('validateListing', () => {
  const validListing = {
    title: 'Le Marketing',
    authors: 'Philip Kotler',
    isbn: '9782765141310',
    course_code: 'MKG3301',
    price: '35',
    original_price: '85',
    campus: 'UQAM',
    description: 'Bon état',
    meet_campus: true,
    meet_city: false,
    post: false,
  }

  test('listing valide → null', () => {
    expect(validateListing(validListing)).toBeNull()
  })
  test('titre manquant → erreur', () => {
    expect(validateListing({ ...validListing, title: '' })).not.toBeNull()
  })
  test('isbn manquant → erreur', () => {
    expect(validateListing({ ...validListing, isbn: '' })).not.toBeNull()
  })
  test('isbn invalide → erreur', () => {
    expect(validateListing({ ...validListing, isbn: '123' })).not.toBeNull()
  })
  test('état manquant → erreur', () => {
    expect(validateListing({ ...validListing, description: '' })).not.toBeNull()
  })
  test('état invalide → erreur', () => {
    expect(validateListing({ ...validListing, description: 'Cassé' })).not.toBeNull()
  })
  test('prix invalide → erreur', () => {
    expect(validateListing({ ...validListing, price: '0' })).not.toBeNull()
  })
  test('aucune méthode de transaction → erreur', () => {
    expect(validateListing({ ...validListing, meet_campus: false, meet_city: false, post: false })).not.toBeNull()
  })
  test('meet_city seul → ok', () => {
    expect(validateListing({ ...validListing, meet_campus: false, meet_city: true, post: false })).toBeNull()
  })
  test('post seul → ok', () => {
    expect(validateListing({ ...validListing, meet_campus: false, meet_city: false, post: true })).toBeNull()
  })
})

// ─── validateMessage ──────────────────────────────────────────────────────────

describe('validateMessage', () => {
  test('message valide → null', () => expect(validateMessage('Bonjour !')).toBeNull())
  test('vide → erreur', () => expect(validateMessage('')).not.toBeNull())
  test('null → erreur', () => expect(validateMessage(null)).not.toBeNull())
  test('espaces seulement → erreur', () => expect(validateMessage('   ')).not.toBeNull())
  test('>1000 chars → erreur', () => expect(validateMessage('a'.repeat(1001))).not.toBeNull())
  test('exactement 1000 → ok', () => expect(validateMessage('a'.repeat(1000))).toBeNull())
})

// ─── validateImageFile ────────────────────────────────────────────────────────

describe('validateImageFile', () => {
  const makeFile = (type, size) => ({ type, size })

  test('pas de fichier → null', () => expect(validateImageFile(null)).toBeNull())
  test('JPEG → ok', () => expect(validateImageFile(makeFile('image/jpeg', 100000))).toBeNull())
  test('PNG → ok', () => expect(validateImageFile(makeFile('image/png', 100000))).toBeNull())
  test('WebP → ok', () => expect(validateImageFile(makeFile('image/webp', 100000))).toBeNull())
  test('GIF → erreur', () => expect(validateImageFile(makeFile('image/gif', 100000))).not.toBeNull())
  test('PDF → erreur', () => expect(validateImageFile(makeFile('application/pdf', 100000))).not.toBeNull())
  test('>5MB → erreur', () => expect(validateImageFile(makeFile('image/jpeg', 6 * 1024 * 1024))).not.toBeNull())
  test('exactement 5MB → ok', () => expect(validateImageFile(makeFile('image/jpeg', 5 * 1024 * 1024))).toBeNull())
})
