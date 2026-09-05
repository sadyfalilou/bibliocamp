import { validateBundleFields, parseBundleItems, MIN_BUNDLE_ITEMS, MAX_BUNDLE_ITEMS } from '../lib/validation'

const valid = {
  title: 'Lot 1re année sciences comptables',
  bundle_items: 'Comptabilité intermédiaire\nMathématiques financières\nDroit des affaires',
  price: '150',
  original_price: '600',
  campus: 'UQAM',
  description: 'Bon état',
  meet_campus: true,
  meet_city: false,
  post: false,
}

describe('parseBundleItems', () => {
  test('découpe par ligne en ignorant les lignes vides', () => {
    expect(parseBundleItems('A\n\n  B  \n\nC')).toEqual(['A', 'B', 'C'])
  })
  test('valeur absente → tableau vide', () => {
    expect(parseBundleItems(null)).toEqual([])
  })
})

describe('validateBundleFields', () => {
  test('lot valide → null', () => expect(validateBundleFields(valid)).toBeNull())

  test('aucun ISBN requis — un lot n\'en a pas', () => {
    expect(validateBundleFields({ ...valid, isbn: '' })).toBeNull()
  })

  test('titre manquant → erreur', () => {
    expect(validateBundleFields({ ...valid, title: '  ' })).toMatch(/titre/i)
  })

  test(`moins de ${MIN_BUNDLE_ITEMS} manuels → erreur`, () => {
    expect(validateBundleFields({ ...valid, bundle_items: 'Un seul manuel' })).toMatch(/au moins/i)
  })

  test('liste vide → erreur', () => {
    expect(validateBundleFields({ ...valid, bundle_items: '' })).toMatch(/au moins/i)
  })

  test(`plus de ${MAX_BUNDLE_ITEMS} manuels → erreur`, () => {
    const items = Array.from({ length: MAX_BUNDLE_ITEMS + 1 }, (_, i) => `Manuel ${i}`).join('\n')
    expect(validateBundleFields({ ...valid, bundle_items: items })).toMatch(/dépasser/i)
  })

  test('titre de manuel trop long → erreur', () => {
    expect(validateBundleFields({ ...valid, bundle_items: `${'a'.repeat(151)}\nAutre manuel` })).toMatch(/150/)
  })

  test('prix hors bornes → erreur', () => {
    expect(validateBundleFields({ ...valid, price: '0' })).toMatch(/prix/i)
    expect(validateBundleFields({ ...valid, price: '10000' })).toMatch(/prix/i)
  })

  test('prix neuf inférieur au prix de vente → erreur', () => {
    expect(validateBundleFields({ ...valid, original_price: '100' })).toMatch(/supérieur/i)
  })

  test('état invalide → erreur', () => {
    expect(validateBundleFields({ ...valid, description: 'Correct' })).toMatch(/état/i)
  })

  test('aucune méthode de transaction → erreur', () => {
    expect(validateBundleFields({ ...valid, meet_campus: false })).toMatch(/transaction/i)
  })
})
