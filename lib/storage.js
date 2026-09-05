import * as Sentry from '@sentry/nextjs'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from './validation'

/**
 * Téléverse une liste de File vers le bucket 'images'.
 * Partagé par les annonces de manuels et les annonces de colocs.
 * Retourne { error } ou { urls }.
 */
export async function uploadImages(supabase, imageFiles, { userId, route, prefix = '' }) {
  const urls = []
  for (const imageFile of imageFiles) {
    if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      return { error: 'Format image non supporté. Utilise JPG, PNG ou WebP.' }
    }
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return { error: 'Chaque image ne peut pas dépasser 5 MB.' }
    }
    const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const bytes = await imageFile.arrayBuffer()
    const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, bytes, { contentType: imageFile.type })
    if (uploadErr) {
      Sentry.captureException(uploadErr, { extra: { route, action: 'image-upload', userId } })
      return { error: "Erreur lors de l'upload d'une image." }
    }
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
    urls.push(urlData.publicUrl)
  }
  return { urls }
}
