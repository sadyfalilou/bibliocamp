'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROOM_TYPES = [
  { value: 'chambre_privee', label: 'Chambre privée' },
  { value: 'chambre_partagee', label: 'Chambre partagée' },
  { value: 'appartement_complet', label: 'Appartement complet' },
]

const MAX_IMAGES = 6

export default function PublierColocView({ setView, editId, phoneSaved, onVerifyPhone }) {
  const [form, setForm] = useState({
    title: '', description: '', rent_price: '', room_type: 'chambre_privee',
    campus: '', city: '', available_from: '', num_spots: 1,
  })
  const [existingImages, setExistingImages] = useState([]) // urls deja en ligne, conservees
  const [imageFiles, setImageFiles] = useState([]) // nouveaux fichiers a uploader
  const [imagePreviews, setImagePreviews] = useState([])
  const [loadingEdit, setLoadingEdit] = useState(!!editId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!editId) { setLoadingEdit(false); return }
    let active = true
    const load = async () => {
      setLoadingEdit(true)
      const { data } = await supabase.from('roommate_listings').select('*').eq('id', editId).single()
      if (active && data) {
        setForm({
          title: data.title || '', description: data.description || '', rent_price: data.rent_price ?? '',
          room_type: data.room_type || 'chambre_privee', campus: data.campus || '', city: data.city || '',
          available_from: data.available_from || '', num_spots: data.num_spots ?? 1,
        })
        setExistingImages(data.image_urls?.length ? data.image_urls : (data.image_url ? [data.image_url] : []))
      }
      setLoadingEdit(false)
    }
    load()
    return () => { active = false }
  }, [editId])

  const totalImages = existingImages.length + imageFiles.length

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setError('')
    const room = Math.max(MAX_IMAGES - existingImages.length, 0)
    const combined = [...imageFiles, ...files].slice(0, room)
    setImageFiles(combined)
    setImagePreviews(combined.map(f => URL.createObjectURL(f)))
    e.target.value = ''
  }

  const removeNewImage = (idx) => {
    const next = imageFiles.filter((_, i) => i !== idx)
    setImageFiles(next)
    setImagePreviews(next.map(f => URL.createObjectURL(f)))
  }

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx))
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }
  const labelStyle = { display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#374151' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()

    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => body.append(key, value))
    imageFiles.forEach(file => body.append('images', file))

    let res
    if (editId) {
      body.append('id', editId)
      existingImages.forEach(url => body.append('keepImages', url))
      res = await fetch('/api/roommates', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body
      })
    } else {
      res = await fetch('/api/roommates', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body
      })
    }
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error || 'Erreur lors de l\'enregistrement.'); return }
    setView(editId ? 'mes-colocs' : 'colocs')
  }

  if (loadingEdit) {
    return <p style={{ color: '#94a3b8' }}>Chargement...</p>
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 20px' }}>
        {editId ? 'Modifier mon annonce' : 'Publier une annonce'}
      </h1>

      {/* Prévenir dès l'ouverture : le numéro doit être vérifié pour publier. */}
      {!phoneSaved && (
        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#7b5e00', marginBottom: 2 }}>📱 Vérifie ton numéro avant de publier</div>
            <div style={{ fontSize: 13, color: '#7b5e00' }}>Ton annonce ne pourra être publiée qu&apos;avec un numéro nord-américain (+1) vérifié. Autant le faire maintenant.</div>
          </div>
          <button type="button" onClick={onVerifyPhone} style={{ background: '#00c9a7', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Vérifier mon numéro →
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Titre *</label>
          <input style={inputStyle} value={form.title} onChange={handleChange('title')} placeholder="Chambre disponible près de l'UQAM" required />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={form.description} onChange={handleChange('description')} placeholder="Décris le logement, l'ambiance, les colocs actuels..." />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Loyer mensuel ($) *</label>
            <input type="number" style={inputStyle} value={form.rent_price} onChange={handleChange('rent_price')} placeholder="550" required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Type de logement *</label>
            <select style={inputStyle} value={form.room_type} onChange={handleChange('room_type')}>
              {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Ville</label>
            <input style={inputStyle} value={form.city} onChange={handleChange('city')} placeholder="Montréal" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Secteur / campus</label>
            <input style={inputStyle} value={form.campus} onChange={handleChange('campus')} placeholder="Près UQAM" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Disponible à partir du</label>
            <input type="date" style={inputStyle} value={form.available_from} onChange={handleChange('available_from')} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Places disponibles</label>
            <input type="number" min="1" style={inputStyle} value={form.num_spots} onChange={handleChange('num_spots')} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Photos (optionnel, max {MAX_IMAGES})</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: (existingImages.length || imagePreviews.length) ? 10 : 0 }}>
            {existingImages.map((src, idx) => (
              <div key={`existing-${idx}`} style={{ position: 'relative', width: 64, height: 64 }}>
                <img src={src} alt={`photo ${idx + 1}`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <button
                  type="button"
                  onClick={() => removeExistingImage(idx)}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#1a2e4a', color: 'white', border: 'none', fontSize: 12, lineHeight: '20px', cursor: 'pointer' }}
                  aria-label="Retirer cette photo"
                >×</button>
              </div>
            ))}
            {imagePreviews.map((src, idx) => (
              <div key={`new-${idx}`} style={{ position: 'relative', width: 64, height: 64 }}>
                <img src={src} alt={`aperçu ${idx + 1}`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#1a2e4a', color: 'white', border: 'none', fontSize: 12, lineHeight: '20px', cursor: 'pointer' }}
                  aria-label="Retirer cette photo"
                >×</button>
              </div>
            ))}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
          <button
            type="button"
            disabled={totalImages >= MAX_IMAGES}
            onClick={() => fileInputRef.current?.click()}
            style={{ background: '#f8fafc', color: '#1a2e4a', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: totalImages >= MAX_IMAGES ? 'not-allowed' : 'pointer', opacity: totalImages >= MAX_IMAGES ? 0.5 : 1 }}
          >
            {totalImages > 0 ? 'Ajouter d\'autres photos' : 'Choisir des photos'}
          </button>
          {totalImages > 0 && <span style={{ fontSize: 12, color: '#718096', marginLeft: 10 }}>{totalImages}/{MAX_IMAGES}</span>}
        </div>

        {error && /v[ée]rif/i.test(error) ? (
          phoneSaved ? (
            <div style={{ background: '#f0fdf9', border: '1px solid #00c9a7', color: '#00a88a', borderRadius: 8, padding: 12, fontSize: 13 }}>
              👍 Numéro vérifié. Clique de nouveau sur « Publier l&apos;annonce » pour finaliser.
            </div>
          ) : (
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', color: '#7b5e00', borderRadius: 8, padding: 12, fontSize: 13 }}>
              <p style={{ margin: '0 0 10px' }}>Ton numéro de téléphone n&apos;est pas encore vérifié. Il faut un numéro nord-américain (+1) pour publier une annonce.</p>
              <button onClick={onVerifyPhone} style={{ background: '#00c9a7', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Vérifier mon numéro →
              </button>
            </div>
          )
        ) : error && (
          <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', borderRadius: 8, padding: 12, fontSize: 13 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setView(editId ? 'mes-colocs' : 'colocs')}
            disabled={saving}
            style={{
              flex: 1, background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0',
              borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Annuler
          </button>
          <button type="submit" disabled={saving} style={{
            flex: 2, background: saving ? '#a0aec0' : '#1a2e4a', color: 'white', border: 'none',
            borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer'
          }}>
            {saving ? 'Enregistrement...' : (editId ? 'Enregistrer les modifications' : '+ Publier l\'annonce')}
          </button>
        </div>
      </form>
    </div>
  )
}
