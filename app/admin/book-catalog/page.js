'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const EMPTY_FORM = { isbn: '', title: '', authors: '', publisher: '', course_code: '', cover_url: '', source: 'coop_uqam' }

export default function BookCatalogPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const fetchBooks = async () => {
    setLoading(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Tu dois être connecté.'); setLoading(false); return }

    const res = await fetch('/api/admin/book-catalog', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    const json = await res.json()
    if (!res.ok) {
      setError(res.status === 403 ? "Accès refusé — tu n'es pas administrateur." : (json.error || 'Erreur de chargement.'))
      setLoading(false)
      return
    }
    setBooks(json.books || [])
    setLoading(false)
  }

  useEffect(() => { fetchBooks() }, [])

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSavedMsg('')
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/book-catalog', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error || 'Erreur lors de l\'ajout.'); return }
    setSavedMsg(`✅ « ${form.title} » ajouté au catalogue.`)
    setForm({ ...EMPTY_FORM, source: form.source }) // garde la source sélectionnée pour la prochaine saisie
    fetchBooks()
  }

  const handleDelete = async (isbn) => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/admin/book-catalog?isbn=${isbn}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    if (res.ok) setBooks(prev => prev.filter(b => b.isbn !== isbn))
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }
  const labelStyle = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#374151' }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem', fontFamily: "'Segoe UI', sans-serif" }}>
      <h1 style={{ marginBottom: 4 }}>📚 Catalogue de manuels</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Ajoute des manuels québécois (Coop UQAM, Chenelière) pour que la recherche par ISBN
        les trouve même quand Google Books / Open Library ne les ont pas.
      </p>

      <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>ISBN *</label>
          <input style={inputStyle} value={form.isbn} onChange={handleChange('isbn')} placeholder="9782765077640" required />
        </div>
        <div>
          <label style={labelStyle}>Titre *</label>
          <input style={inputStyle} value={form.title} onChange={handleChange('title')} placeholder="Le Marketing : 4e édition" required />
        </div>
        <div>
          <label style={labelStyle}>Auteur(s)</label>
          <input style={inputStyle} value={form.authors} onChange={handleChange('authors')} placeholder="Naoufel Daghfous, Pierre Filiatrault" />
        </div>
        <div>
          <label style={labelStyle}>Éditeur</label>
          <input style={inputStyle} value={form.publisher} onChange={handleChange('publisher')} placeholder="Chenelière" />
        </div>
        <div>
          <label style={labelStyle}>Code de cours (optionnel)</label>
          <input style={inputStyle} value={form.course_code} onChange={handleChange('course_code')} placeholder="MKG435" />
        </div>
        <div>
          <label style={labelStyle}>URL de la couverture (optionnel)</label>
          <input style={inputStyle} value={form.cover_url} onChange={handleChange('cover_url')} placeholder="https://..." />
        </div>
        <div>
          <label style={labelStyle}>Source</label>
          <select style={inputStyle} value={form.source} onChange={handleChange('source')}>
            <option value="coop_uqam">Coop UQAM</option>
            <option value="cheneliere">Chenelière</option>
            <option value="manual">Manuel (autre)</option>
          </select>
        </div>

        {error && <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', borderRadius: 8, padding: 12, fontSize: 13 }}>{error}</div>}
        {savedMsg && <div style={{ background: '#f0fdf9', border: '1px solid #6ee7b7', color: '#059669', borderRadius: 8, padding: 12, fontSize: 13 }}>{savedMsg}</div>}

        <button type="submit" disabled={saving} style={{
          background: saving ? '#a0aec0' : '#1a2e4a', color: 'white', border: 'none',
          borderRadius: 8, padding: '11px', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer'
        }}>
          {saving ? 'Ajout...' : '+ Ajouter au catalogue'}
        </button>
      </form>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e4a', marginBottom: 12 }}>Derniers manuels ajoutés</h2>

      {loading ? <p>Chargement...</p> : books.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>Aucun manuel dans le catalogue pour l'instant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {books.map(b => (
            <div key={b.isbn} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e4a' }}>{b.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  ISBN {b.isbn} {b.authors && `· ${b.authors}`} {b.course_code && `· ${b.course_code}`}
                </div>
              </div>
              <button onClick={() => handleDelete(b.isbn)} style={{ background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
