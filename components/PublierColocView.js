'use client'

import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROOM_TYPES = [
  { value: 'chambre_privee', label: 'Chambre privée' },
  { value: 'chambre_partagee', label: 'Chambre partagée' },
  { value: 'appartement_complet', label: 'Appartement complet' },
]

export default function PublierColocView({ setView }) {
  const [form, setForm] = useState({
    title: '', description: '', rent_price: '', room_type: 'chambre_privee',
    campus: '', city: '', available_from: '', num_spots: 1,
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const MAX_IMAGES = 6

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setError('')
    const combined = [...imageFiles, ...files].slice(0, MAX_IMAGES)
    setImageFiles(combined)
    setImagePreviews(combined.map(f => URL.createObjectURL(f)))
    e.target.value = ''
  }

  const removeImage = (idx) => {
    const next = imageFiles.filter((_, i) => i !== idx)
    setImageFiles(next)
    setImagePreviews(next.map(f => URL.createObjectURL(f)))
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

    const res = await fetch('/api/roommates', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error || 'Erreur lors de la publication.'); return }
    setView('colocs')
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 20px' }}>
        Publier une annonce
      </h1>

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: imagePreviews.length ? 10 : 0 }}>
            {imagePreviews.map((src, idx) => (
              <div key={idx} style={{ position: 'relative', width: 64, height: 64 }}>
                <img src={src} alt={`aperçu ${idx + 1}`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#1a2e4a', color: 'white', border: 'none', fontSize: 12, lineHeight: '20px', cursor: 'pointer' }}
                  aria-label="Retirer cette photo"
                >×</button>
              </div>
            ))}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
          <button
            type="button"
            disabled={imageFiles.length >= MAX_IMAGES}
            onClick={() => fileInputRef.current?.click()}
            style={{ background: '#f8fafc', color: '#1a2e4a', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: imageFiles.length >= MAX_IMAGES ? 'not-allowed' : 'pointer', opacity: imageFiles.length >= MAX_IMAGES ? 0.5 : 1 }}
          >
            {imageFiles.length > 0 ? 'Ajouter d\'autres photos' : 'Choisir des photos'}
          </button>
          {imageFiles.length > 0 && <span style={{ fontSize: 12, color: '#718096', marginLeft: 10 }}>{imageFiles.length}/{MAX_IMAGES}</span>}
        </div>

        {error && <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', borderRadius: 8, padding: 12, fontSize: 13 }}>{error}</div>}

        <button type="submit" disabled={saving} style={{
          background: saving ? '#a0aec0' : '#1a2e4a', color: 'white', border: 'none',
          borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer'
        }}>
          {saving ? 'Publication...' : '+ Publier l\'annonce'}
        </button>
      </form>
    </div>
  )
}
