export const VALID_ETATS = ['Neuf', 'Très bon état', 'Bon état', 'Acceptable']
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

/**
 * Valide un champ individuel du formulaire d'annonce.
 * Retourne un message d'erreur ou '' si valide.
 */
export function validateField(name, val, extra = {}) {
  switch (name) {
    case 'title':
      if (!val || val.trim().length === 0) return 'Le titre est obligatoire.'
      if (val.trim().length > 150) return `${val.trim().length}/150 — trop long.`
      return ''
    case 'authors':
      if (val && val.length > 200) return `${val.length}/200 — trop long.`
      return ''
    case 'isbn':
      if (!val || !val.trim()) return "L'ISBN est obligatoire."
      if (!/^\d{10,13}$/.test(val.replace(/[-\s]/g, '')))
        return 'Doit contenir 10 ou 13 chiffres.'
      return ''
    case 'course_code':
    case 'course':
      if (val && val.length > 20) return `${val.length}/20 — trop long.`
      return ''
    case 'price':
      if (!val || isNaN(Number(val)) || Number(val) <= 0 || Number(val) > 9999)
        return 'Entre 1 $ et 9 999 $.'
      return ''
    case 'original_price':
    case 'originalPrice':
      if (!val) return ''
      if (isNaN(Number(val)) || Number(val) <= 0 || Number(val) > 9999)
        return 'Entre 1 $ et 9 999 $.'
      if (extra.price && Number(val) <= Number(extra.price))
        return 'Doit être supérieur au prix de vente.'
      return ''
    case 'campus':
      if (val && val.length > 100) return `${val.length}/100 — trop long.`
      return ''
    case 'description':
      if (!val || !val.trim()) return "L'état du livre est obligatoire."
      if (!VALID_ETATS.includes(val)) return 'État du livre invalide.'
      return ''
    case 'transaction':
      if (!val) return 'Choisis au moins une méthode de transaction.'
      return ''
    default:
      return ''
  }
}

/**
 * Valide tous les champs d'une annonce.
 * Retourne le premier message d'erreur trouvé ou null si tout est valide.
 */
export function validateListing(fields) {
  const checks = ['title', 'authors', 'isbn', 'course_code', 'price', 'original_price', 'campus', 'description']
  for (const field of checks) {
    const err = validateField(field, fields[field] ?? '', { price: fields.price })
    if (err) return err
  }
  // Au moins une méthode de transaction
  const hasTransaction = fields.meet_campus || fields.meet_city || fields.post
  const txErr = validateField('transaction', hasTransaction ? 'ok' : '')
  if (txErr) return txErr
  return null
}

/**
 * Valide un fichier image côté serveur.
 * Retourne un message d'erreur ou null si valide.
 */
export function validateImageFile(file) {
  if (!file || file.size === 0) return null // pas d'image = ok
  if (!ALLOWED_IMAGE_TYPES.includes(file.type))
    return 'Format image non supporté. Utilise JPG, PNG ou WebP.'
  if (file.size > MAX_IMAGE_SIZE)
    return "L'image ne peut pas dépasser 5 MB."
  return null
}

/**
 * Vérifie si un message est valide.
 * Retourne un message d'erreur ou null si valide.
 */
export function validateMessage(content) {
  if (!content || typeof content !== 'string') return 'Message vide.'
  const trimmed = content.trim()
  if (trimmed.length === 0) return 'Message vide.'
  if (trimmed.length > 1000) return 'Le message ne peut pas dépasser 1 000 caractères.'
  return null
}

/**
 * Valide une annonce côté serveur (routes API), à partir d'un objet de champs
 * déjà extrait du formulaire. Source unique partagée par la création unitaire
 * et la publication en lot — messages destinés à être renvoyés tels quels.
 * Retourne un message d'erreur ou null si valide.
 */
export function validateListingFields({ title, authors, isbn, course_code, price, original_price, campus, description, meet_campus, meet_city, post }) {
  if (!title || title.trim().length === 0) return 'Le titre est obligatoire.'
  if (title.trim().length > 150) return 'Le titre ne peut pas dépasser 150 caractères.'
  if (authors && authors.length > 200) return 'Le champ auteurs ne peut pas dépasser 200 caractères.'
  if (!isbn || isbn.trim().length === 0) return "L'ISBN est obligatoire."
  if (!/^\d{10,13}$/.test(isbn.replace(/[-\s]/g, ''))) return 'ISBN invalide — doit contenir 10 ou 13 chiffres.'
  if (course_code && course_code.length > 20) return 'Le code de cours ne peut pas dépasser 20 caractères.'
  if (!price || isNaN(Number(price)) || Number(price) <= 0 || Number(price) > 9999) return 'Le prix doit être entre 1 $ et 9 999 $.'
  if (original_price && (isNaN(Number(original_price)) || Number(original_price) <= 0 || Number(original_price) > 9999)) return 'Le prix neuf doit être entre 1 $ et 9 999 $.'
  if (original_price && Number(original_price) <= Number(price)) return 'Le prix neuf doit être supérieur au prix de vente.'
  if (campus && campus.length > 100) return 'Le campus ne peut pas dépasser 100 caractères.'
  if (!description || description.trim().length === 0) return "L'état du livre est obligatoire."
  if (!VALID_ETATS.includes(description)) return 'État du livre invalide.'
  if (!meet_campus && !meet_city && !post) return 'Choisis au moins une méthode de transaction.'
  return null
}

export const MAX_BUNDLE_ITEMS = 30
export const MIN_BUNDLE_ITEMS = 2
export const MAX_BUNDLE_IMAGES = 6

/**
 * Découpe la liste des manuels d'un lot (un titre par ligne) en tableau propre.
 */
export function parseBundleItems(text) {
  return String(text ?? '')
    .split('\n')
    .map(v => v.trim())
    .filter(Boolean)
}

/**
 * Valide une annonce de LOT : plusieurs manuels vendus ensemble dans une seule
 * annonce. Contrairement à une annonce simple, l'ISBN n'a pas de sens ici — ce
 * qui identifie le lot, c'est la liste des titres.
 * Retourne un message d'erreur ou null si valide.
 */
export function validateBundleFields({ title, bundle_items, price, original_price, campus, description, meet_campus, meet_city, post }) {
  if (!title || title.trim().length === 0) return 'Le titre du lot est obligatoire.'
  if (title.trim().length > 150) return 'Le titre ne peut pas dépasser 150 caractères.'

  const items = parseBundleItems(bundle_items)
  if (items.length < MIN_BUNDLE_ITEMS) return `Un lot doit contenir au moins ${MIN_BUNDLE_ITEMS} manuels.`
  if (items.length > MAX_BUNDLE_ITEMS) return `Un lot ne peut pas dépasser ${MAX_BUNDLE_ITEMS} manuels.`
  if (items.some(i => i.length > 150)) return 'Chaque titre de manuel doit faire au plus 150 caractères.'

  if (!price || isNaN(Number(price)) || Number(price) <= 0 || Number(price) > 9999) return 'Le prix doit être entre 1 $ et 9 999 $.'
  if (original_price && (isNaN(Number(original_price)) || Number(original_price) <= 0 || Number(original_price) > 9999)) return 'Le prix neuf doit être entre 1 $ et 9 999 $.'
  if (original_price && Number(original_price) <= Number(price)) return 'Le prix neuf doit être supérieur au prix de vente.'
  if (campus && campus.length > 100) return 'Le campus ne peut pas dépasser 100 caractères.'
  if (!description || description.trim().length === 0) return "L'état des manuels est obligatoire."
  if (!VALID_ETATS.includes(description)) return 'État des manuels invalide.'
  if (!meet_campus && !meet_city && !post) return 'Choisis au moins une méthode de transaction.'
  return null
}
