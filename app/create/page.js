'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '../../components/Logo'

const ETATS = ['Neuf', 'Très bon état', 'Bon état', 'Acceptable']

function CreateInner() {
  const [isMobile, setIsMobile] = useState(false)
  const [userId, setUserId] = useState(null)
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState('')
  const [isbn, setIsbn] = useState('')
  const [course, setCourse] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [etat, setEtat] = useState('')
  const [campus, setCampus] = useState('')
  const [meetCampus, setMeetCampus] = useState(false)
  const [meetCity, setMeetCity] = useState(false)
  const [post, setPost] = useState(false)
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [imageInfo, setImageInfo] = useState(null)
  const [isbnSearch, setIsbnSearch] = useState('')
  const [isbnLoading, setIsbnLoading] = useState(false)
  const [isbnFound, setIsbnFound] = useState(false)
  const [coverFromGoogle, setCoverFromGoogle] = useState(null)
  const sessionTokenRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id)
        sessionTokenRef.current = session.access_token
      }
    })
    const t = searchParams.get('title')
    const a = searchParams.get('authors')
    const i = searchParams.get('isbn')
    const c = searchParams.get('course')
    if (t) setTitle(t)
    if (a) setAuthors(a)
    if (i) setIsbn(i)
    if (c) setCourse(c)
  }, [])

  const searchingRef = useRef(false)
  const searchByIsbn = async () => {
    if (searchingRef.current) return // évite les doubles appels (React StrictMode)
    const cleaned = isbnSearch.replace(/[-\s]/g, '')
    if (!/^\d{10,13}$/.test(cleaned)) {
      setErrors(prev => ({ ...prev, isbnSearch: 'ISBN invalide — doit contenir 10 ou 13 chiffres.' }))
      return
    }
    setErrors(prev => ({ ...prev, isbnSearch: '' }))
    setIsbnLoading(true)
    setIsbnFound(false)
    searchingRef.current = true
    try {
      const res = await fetch(`/api/isbn?isbn=${cleaned}`)
      const data = await res.json()
      if (data.found && data.book) {
        const book = data.book
        setTitle(book.title || '')
        setAuthors(book.authors || '')
        setIsbn(cleaned)
        if (book.cover) {
          setCoverFromGoogle(book.cover)
          setImagePreview(book.cover)
        }
        setIsbnFound(true)
        setTouched(prev => ({ ...prev, title: true, authors: true, isbn: true }))
        setErrors(prev => ({ ...prev, title: '', authors: '', isbn: '' }))
      } else {
        setErrors(prev => ({ ...prev, isbnSearch: 'Livre non indexé dans nos bases de données. Remplis les champs titre et auteurs manuellement ci-dessous.' }))
      }
    } catch {
      setErrors(prev => ({ ...prev, isbnSearch: 'Erreur de connexion. Remplis les champs manuellement.' }))
    }
    setIsbnLoading(false)
    searchingRef.current = false
  }

  const validateField = (name, val, extra = {}) => {
    switch (name) {
      case 'title':
        if (!val.trim()) return 'Le titre est obligatoire.'
        if (val.trim().length > 150) return `${val.trim().length}/150 — trop long.`
        return ''
      case 'authors':
        if (val.length > 200) return `${val.length}/200 — trop long.`
        return ''
      case 'isbn':
        if (val && !/^\d{10,13}$/.test(val.replace(/[-\s]/g, ''))) return 'Doit contenir 10 ou 13 chiffres.'
        return ''
      case 'course':
        if (val.length > 20) return `${val.length}/20 — trop long.`
        return ''
      case 'price':
        if (!val || isNaN(Number(val)) || Number(val) <= 0 || Number(val) > 9999) return 'Entre 1 $ et 9 999 $.'
        return ''
      case 'originalPrice':
        if (!val) return ''
        if (isNaN(Number(val)) || Number(val) <= 0 || Number(val) > 9999) return 'Entre 1 $ et 9 999 $.'
        if (extra.price && Number(val) <= Number(extra.price)) return 'Doit être supérieur au prix de vente.'
        return ''
      case 'campus':
        if (val.length > 100) return `${val.length}/100 — trop long.`
        return ''
      default: return ''
    }
  }

  const touch = (name, val, extra = {}) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    setErrors(prev => ({ ...prev, [name]: validateField(name, val, extra) }))
  }

  const handleFieldChange = (name, val, setter, extra = {}) => {
    setter(val)
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, val, extra) }))
    }
  }

  const fieldStyle = (name) => ({
    width: '100%', padding: '11px 14px',
    border: `1.5px solid ${errors[name] ? '#e53e3e' : touched[name] && !errors[name] ? '#00c9a7' : '#cbd5e0'}`,
    borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    background: errors[name] ? '#fff5f5' : 'white'
  })

  const ErrorMsg = ({ name }) => errors[name] ? (
    <div style={{ color: '#e53e3e', fontSize: 12, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      ⚠ {errors[name]}
    </div>
  ) : null

  const savingsPercent = price && originalPrice && Number(originalPrice) > 0
    ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
    : null

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Format non supporté. Utilise JPG, PNG ou WebP.' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: "L'image ne peut pas dépasser 5 MB." }))
      return
    }
    setErrors(prev => ({ ...prev, image: '' }))
    const originalKB = Math.round(file.size / 1024)
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true
    })
    const compressedKB = Math.round(compressed.size / 1024)
    setImageInfo({ original: originalKB, compressed: compressedKB })
    setImage(compressed)
    setImagePreview(URL.createObjectURL(compressed))
    setCoverFromGoogle(null) // l'upload remplace la couverture Google
  }

  const hasErrors = () => {
    const allErrors = {
      title: validateField('title', title),
      authors: validateField('authors', authors),
      isbn: validateField('isbn', isbn),
      course: validateField('course', course),
      price: validateField('price', price),
      originalPrice: validateField('originalPrice', originalPrice, { price }),
      campus: validateField('campus', campus),
      image: errors.image || '',
    }
    setErrors(allErrors)
    setTouched({ title: true, authors: true, isbn: true, course: true, price: true, originalPrice: true, campus: true })
    return Object.values(allErrors).some(e => e !== '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (hasErrors()) return
    setLoading(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('authors', authors)
    formData.append('isbn', isbn)
    formData.append('course_code', course)
    formData.append('price', price)
    formData.append('original_price', originalPrice)
    formData.append('description', etat)
    formData.append('campus', campus)
    formData.append('meet_campus', meetCampus)
    formData.append('meet_city', meetCity)
    formData.append('post', post)
    if (image) formData.append('image', image)
    else if (coverFromGoogle) formData.append('image_url', coverFromGoogle)

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sessionTokenRef.current}` },
      body: formData
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      const msg = json.error || 'Erreur lors de la création.'
      if (msg.toLowerCase().includes('image') || msg.toLowerCase().includes('format')) {
        setErrors(prev => ({ ...prev, image: msg }))
      } else {
        setServerError(msg)
      }
      return
    }
    window.location.href = '/app'
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa' }}>

      {/* HEADER */}
      <header style={{
        background: '#1a2e4a', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <Logo variant="light" size="sm" onClick={() => router.push('/app')} style={{ cursor: 'pointer' }} />
        <button onClick={() => router.push('/app')} style={{
          background: 'transparent', color: '#a0aec0',
          border: '1px solid #2d4a6b', padding: '6px 14px',
          borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600
        }}
          onMouseEnter={e => { e.target.style.color = 'white'; e.target.style.borderColor = '#00c9a7' }}
          onMouseLeave={e => { e.target.style.color = '#a0aec0'; e.target.style.borderColor = '#2d4a6b' }}
        >
          ← Retour
        </button>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '20px 16px' : '36px 24px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 32, alignItems: 'flex-start' }}>

        {/* FORMULAIRE */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#a0aec0', marginBottom: 8 }}>
            Accueil / Manuels / <span style={{ color: '#1a2e4a', fontWeight: 600 }}>Publier un manuel</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 16px' }}>
            Publier un manuel
          </h1>

          <form onSubmit={handleSubmit}>

            {/* RECHERCHE ISBN AUTO */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf9, #e6f7ff)',
              borderRadius: 14, padding: '24px 28px',
              border: '1.5px solid #00c9a7', marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 22 }}>🔍</span>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#1a2e4a', margin: 0 }}>
                  Trouve ton manuel par ISBN
                </h2>
                <span style={{
                  background: '#00c9a7', color: 'white', fontSize: 10,
                  fontWeight: 700, padding: '2px 8px', borderRadius: 20, letterSpacing: 0.5
                }}>NOUVEAU</span>
              </div>
              <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px' }}>
                Entre l'ISBN (au dos du livre, sous le code-barres) — titre, auteurs et photo se remplissent automatiquement.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  placeholder="ex: 9782765141310"
                  value={isbnSearch}
                  onChange={e => { setIsbnSearch(e.target.value); setErrors(prev => ({ ...prev, isbnSearch: '' })); setIsbnFound(false) }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchByIsbn())}
                  style={{
                    flex: 1, padding: '11px 14px',
                    border: `1.5px solid ${errors.isbnSearch ? '#e53e3e' : '#00c9a7'}`,
                    borderRadius: 8, fontSize: 15, outline: 'none',
                    background: 'white', boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={searchByIsbn}
                  disabled={isbnLoading}
                  style={{
                    background: isbnLoading ? '#a0aec0' : '#1a2e4a',
                    color: 'white', border: 'none', borderRadius: 8,
                    padding: '11px 20px', fontWeight: 700, fontSize: 14,
                    cursor: isbnLoading ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => { if (!isbnLoading) e.currentTarget.style.background = '#00c9a7' }}
                  onMouseLeave={e => { if (!isbnLoading) e.currentTarget.style.background = '#1a2e4a' }}
                >
                  {isbnLoading ? '⏳ Recherche...' : '→ Rechercher'}
                </button>
              </div>
              {errors.isbnSearch && (
                <div style={{ color: '#e53e3e', fontSize: 12, fontWeight: 600, marginTop: 8 }}>
                  ⚠ {errors.isbnSearch}
                </div>
              )}
              {isbnFound && (
                <div style={{
                  marginTop: 12, background: 'white', border: '1px solid #00c9a7',
                  borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12
                }}>
                  {coverFromGoogle && (
                    <img src={coverFromGoogle} alt="couverture" style={{ height: 64, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a2e4a', fontSize: 14 }}>✅ Livre trouvé !</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{title}{authors ? ` — ${authors}` : ''}</div>
                    <div style={{ color: '#a0aec0', fontSize: 12, marginTop: 2 }}>Vérifie les informations ci-dessous et complète les champs manquants.</div>
                  </div>
                </div>
              )}
            </div>

            {/* INFORMATIONS DU LIVRE */}
            <div style={{
              background: 'white', borderRadius: 14, padding: '28px',
              border: '1px solid #e2e8f0', marginBottom: 16
            }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: 1 }}>
                Informations du livre
              </h2>

              {/* TITRE */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                  Titre du manuel <span style={{ color: '#e53e3e' }}>*</span>
                  <span style={{ fontWeight: 400, color: '#a0aec0', fontSize: 12, marginLeft: 8 }}>{title.length}/150</span>
                </label>
                <input
                  placeholder="ex: Le Marketing — 4e édition"
                  value={title}
                  onChange={e => handleFieldChange('title', e.target.value, setTitle)}
                  onBlur={e => touch('title', e.target.value)}
                  style={fieldStyle('title')}
                />
                <ErrorMsg name="title" />
              </div>

              {/* AUTEURS */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                  Auteur(s)
                </label>
                <input
                  placeholder="ex: Philip Kotler, Kevin Lane Keller"
                  value={authors}
                  onChange={e => handleFieldChange('authors', e.target.value, setAuthors)}
                  onBlur={e => touch('authors', e.target.value)}
                  style={fieldStyle('authors')}
                />
                <ErrorMsg name="authors" />
              </div>

              {/* ISBN + COURS */}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    ISBN
                  </label>
                  <input
                    placeholder="ex: 9782765141310"
                    value={isbn}
                    onChange={e => handleFieldChange('isbn', e.target.value, setIsbn)}
                    onBlur={e => touch('isbn', e.target.value)}
                    style={fieldStyle('isbn')}
                  />
                  <ErrorMsg name="isbn" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    Code de cours
                  </label>
                  <input
                    placeholder="ex: MKG3301"
                    value={course}
                    onChange={e => handleFieldChange('course', e.target.value, setCourse)}
                    onBlur={e => touch('course', e.target.value)}
                    style={fieldStyle('course')}
                  />
                  <ErrorMsg name="course" />
                </div>
              </div>

              {/* ÉTAT */}
              <div style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                  État du livre
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {ETATS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEtat(e)}
                      style={{
                        padding: '8px 16px',
                        border: `2px solid ${etat === e ? '#00c9a7' : '#cbd5e0'}`,
                        borderRadius: 20,
                        background: etat === e ? '#f0fdf9' : 'white',
                        color: etat === e ? '#00c9a7' : '#4a5568',
                        fontWeight: etat === e ? 700 : 500,
                        fontSize: 13, cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* CAMPUS */}
              <div style={{ marginTop: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                  Campus / Université
                </label>
                <input
                  placeholder="ex: UQAM, HEC Montréal, McGill, Concordia..."
                  value={campus}
                  onChange={e => handleFieldChange('campus', e.target.value, setCampus)}
                  onBlur={e => touch('campus', e.target.value)}
                  style={fieldStyle('campus')}
                />
                <ErrorMsg name="campus" />
              </div>

              {/* MÉTHODES DE TRANSACTION */}
              <div style={{ marginTop: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 10 }}>
                  Méthodes de transaction
                </label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { key: 'campus', label: '🏫 Rencontre sur campus', state: meetCampus, set: setMeetCampus, color: '#6c63ff' },
                    { key: 'city', label: '🏙️ Rencontre en ville', state: meetCity, set: setMeetCity, color: '#f59e0b' },
                    { key: 'post', label: '📦 Envoi postal', state: post, set: setPost, color: '#3b82f6' },
                  ].map(m => (
                    <button key={m.key} type="button" onClick={() => m.set(!m.state)} style={{
                      padding: '10px 18px',
                      border: `2px solid ${m.state ? m.color : '#cbd5e0'}`,
                      borderRadius: 20,
                      background: m.state ? `${m.color}15` : 'white',
                      color: m.state ? m.color : '#4a5568',
                      fontWeight: m.state ? 700 : 500,
                      fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      {m.state && <span>✓</span>}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PRIX */}
            <div style={{
              background: 'white', borderRadius: 14, padding: '28px',
              border: '1px solid #e2e8f0', marginBottom: 16
            }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: 1 }}>
                Prix
              </h2>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    Ton prix ($) <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 35"
                    value={price}
                    onChange={e => handleFieldChange('price', e.target.value, setPrice)}
                    onBlur={e => touch('price', e.target.value)}
                    min="1"
                    style={fieldStyle('price')}
                  />
                  <ErrorMsg name="price" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    Prix neuf ($) <span style={{ color: '#a0aec0', fontWeight: 400 }}>(pour afficher l'économie)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 85"
                    value={originalPrice}
                    onChange={e => handleFieldChange('originalPrice', e.target.value, setOriginalPrice, { price })}
                    onBlur={e => touch('originalPrice', e.target.value, { price })}
                    min="1"
                    style={fieldStyle('originalPrice')}
                  />
                  <ErrorMsg name="originalPrice" />
                </div>
              </div>
              {savingsPercent > 0 && (
                <div style={{
                  marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#f0fdf9', border: '1px solid #00c9a7',
                  borderRadius: 8, padding: '8px 14px'
                }}>
                  <span style={{ color: '#00a88a', fontWeight: 700, fontSize: 14 }}>
                    ✅ Badge "Économise {savingsPercent}%" affiché sur ton annonce
                  </span>
                </div>
              )}
            </div>

            {/* PHOTO */}
            <div style={{
              background: 'white', borderRadius: 14, padding: '28px',
              border: '1px solid #e2e8f0', marginBottom: 24
            }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
                Photo de couverture
              </h2>
              {coverFromGoogle && !image && (
                <p style={{ fontSize: 12, color: '#00a88a', margin: '0 0 14px' }}>
                  ✅ Couverture récupérée automatiquement via Google Books. Tu peux en uploader une autre ci-dessous.
                </p>
              )}
              {!coverFromGoogle && !image && (
                <p style={{ fontSize: 12, color: '#a0aec0', margin: '0 0 14px' }}>
                  JPG, PNG, WebP — compressée automatiquement
                </p>
              )}

              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 10,
                border: `2px dashed ${errors.image ? '#e53e3e' : '#cbd5e0'}`,
                borderRadius: 10, padding: '28px', cursor: 'pointer',
                background: errors.image ? '#fff5f5' : imagePreview ? 'transparent' : '#f7fafc',
                transition: 'border-color 0.2s, background 0.2s'
              }}
                onMouseEnter={e => { if (!errors.image) e.currentTarget.style.borderColor = '#00c9a7' }}
                onMouseLeave={e => { if (!errors.image) e.currentTarget.style.borderColor = '#cbd5e0' }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{
                    maxHeight: 160, maxWidth: '100%', borderRadius: 8, objectFit: 'contain'
                  }} />
                ) : (
                  <>
                    <span style={{ fontSize: 32 }}>📷</span>
                    <span style={{ color: '#718096', fontSize: 14 }}>Clique pour ajouter une photo</span>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
              {imagePreview && (
                <button type="button" onClick={() => {
                  setImage(null); setImagePreview(null); setImageInfo(null)
                  setCoverFromGoogle(null)
                  setErrors(prev => ({ ...prev, image: '' }))
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }} style={{
                  marginTop: 10, background: 'none', border: 'none',
                  color: '#e53e3e', cursor: 'pointer', fontSize: 13
                }}>
                  × Supprimer la photo
                </button>
              )}
              {errors.image && (
                <div style={{ color: '#e53e3e', fontSize: 12, fontWeight: 600, marginTop: 8 }}>
                  ⚠ {errors.image}
                </div>
              )}
            </div>

            {serverError && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10,
                padding: '12px 16px', marginBottom: 16,
                color: '#c53030', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                ⚠️ {serverError}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '15px',
              background: loading ? '#a0aec0' : '#1a2e4a',
              color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#00c9a7' }}
              onMouseLeave={e => { if (!loading) e.target.style.background = '#1a2e4a' }}
            >
              {loading ? 'Publication en cours...' : 'Publier mon manuel'}
            </button>
          </form>
        </div>

        {/* APERÇU LIVE */}
        <div style={{ width: isMobile ? '100%' : 300, flexShrink: 0, position: isMobile ? 'relative' : 'sticky', top: isMobile ? 'auto' : 80 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Aperçu de ton annonce
          </h3>
          <div style={{
            background: 'white', borderRadius: 10, padding: '16px 20px',
            border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{ flexShrink: 0 }}>
              {imagePreview ? (
                <img src={imagePreview} style={{ width: 54, height: 68, objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                <div style={{
                  width: 54, height: 68,
                  background: 'linear-gradient(135deg, #1a2e4a, #0d4f6b)',
                  borderRadius: 6, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24
                }}>📖</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#00a88a', fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title || 'Titre du manuel'}
              </div>
              {isbn && <div style={{ fontSize: 12, color: '#718096' }}>ISBN : <span style={{ color: '#00a88a' }}>{isbn}</span></div>}
              {authors && <div style={{ fontSize: 12, color: '#718096' }}>Auteurs : {authors}</div>}
              {course && <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>Cours : <strong>{course}</strong></div>}
              {etat && <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>{etat}</div>}
              <div style={{ fontSize: 11, color: '#b0bec5', marginTop: 4 }}>à l'instant</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1a2e4a' }}>
                {price ? `${price} $` : '-- $'}
              </div>
              {savingsPercent > 0 && (
                <div style={{
                  background: '#00c9a7', color: 'white',
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: 11, fontWeight: 700, marginTop: 4, whiteSpace: 'nowrap'
                }}>
                  Économise {savingsPercent}%
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#7b5e00' }}>
            💡 L'aperçu se met à jour en temps réel pendant que tu remplis le formulaire.
          </div>
        </div>

      </div>
    </div>
  )
}

export default function Create() {
  return <Suspense><CreateInner /></Suspense>
}
