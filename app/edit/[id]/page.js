'use client'

import { useEffect, useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Logo from '../../../components/Logo'
import ProfileMenu from '../../../components/ProfileMenu'

const ETATS = ['Neuf', 'Très bon état', 'Bon état', 'Acceptable']

export default function Edit() {
  const { id } = useParams()
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState(null)

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
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [imageInfo, setImageInfo] = useState(null)
  const sessionTokenRef = useRef(null)

  const savingsPercent = price && originalPrice && Number(originalPrice) > 0
    ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
    : null

  const validateField = (name, val, extra = {}) => {
    switch (name) {
      case 'title':
        if (!val.trim()) return 'Le titre est obligatoire.'
        if (val.trim().length > 150) return `${val.trim().length}/150 — trop long.`
        return ''
      case 'authors': return val.length > 200 ? `${val.length}/200 — trop long.` : ''
      case 'isbn': return val && !/^\d{10,13}$/.test(val.replace(/[-\s]/g, '')) ? 'Doit contenir 10 ou 13 chiffres.' : ''
      case 'course': return val.length > 20 ? `${val.length}/20 — trop long.` : ''
      case 'price':
        if (!val || isNaN(Number(val)) || Number(val) <= 0 || Number(val) > 9999) return 'Entre 1 $ et 9 999 $.'
        return ''
      case 'originalPrice':
        if (!val) return ''
        if (isNaN(Number(val)) || Number(val) <= 0 || Number(val) > 9999) return 'Entre 1 $ et 9 999 $.'
        if (extra.price && Number(val) <= Number(extra.price)) return 'Doit être supérieur au prix de vente.'
        return ''
      case 'campus': return val.length > 100 ? `${val.length}/100 — trop long.` : ''
      default: return ''
    }
  }

  const touch = (name, val, extra = {}) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    setErrors(prev => ({ ...prev, [name]: validateField(name, val, extra) }))
  }

  const handleFieldChange = (name, val, setter, extra = {}) => {
    setter(val)
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, val, extra) }))
  }

  const fieldStyle = (name) => ({
    width: '100%', padding: '11px 14px',
    border: `1.5px solid ${errors[name] ? '#e53e3e' : touched[name] && !errors[name] ? '#00c9a7' : '#cbd5e0'}`,
    borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s', background: errors[name] ? '#fff5f5' : 'white'
  })

  const ErrorMsg = ({ name }) => errors[name] ? (
    <div style={{ color: '#e53e3e', fontSize: 12, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      ⚠ {errors[name]}
    </div>
  ) : null

  useEffect(() => {
    const fetchData = async () => {
      // Charger la session et la listing en parallèle pour aller plus vite
      const [{ data: { session } }, ] = await Promise.all([
        supabase.auth.getSession()
      ])
      if (!session) { router.push('/login'); return }
      sessionTokenRef.current = session.access_token
      setUser(session.user)

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single()

      if (error || !data) { router.push('/app'); return }

      setTitle(data.title || '')
      setAuthors(data.authors || '')
      setIsbn(data.isbn || '')
      setCourse(data.course_code || '')
      setPrice(data.price || '')
      setOriginalPrice(data.original_price || '')
      setEtat(data.description || '')
      setCampus(data.campus || '')
      setMeetCampus(data.meet_campus || false)
      setMeetCity(data.meet_city || false)
      setPost(data.post || false)
      setExistingImageUrl(data.image_url || null)
      setImagePreview(data.image_url || null)
      setFetching(false)
    }

    if (id) fetchData()
  }, [id])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
    setExistingImageUrl(null)
    setImageInfo(null)
    setErrors(prev => ({ ...prev, image: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    // Valider tous les champs avant envoi
    const allErrors = {
      title: validateField('title', title),
      authors: validateField('authors', authors),
      isbn: validateField('isbn', isbn),
      course: validateField('course', course),
      price: validateField('price', price),
      originalPrice: validateField('originalPrice', originalPrice, { price }),
      campus: validateField('campus', campus),
    }
    setErrors(allErrors)
    setTouched({ title: true, authors: true, isbn: true, course: true, price: true, originalPrice: true, campus: true })
    allErrors.image = errors.image || ''
    setErrors(allErrors)
    if (Object.values(allErrors).some(e => e !== '')) return

    setLoading(true)

    const formData = new FormData()
    formData.append('listing_id', id)
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
    formData.append('existing_image_url', existingImageUrl || '')
    if (image) formData.append('image', image)

    const res = await fetch('/api/listings', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${sessionTokenRef.current}` },
      body: formData
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      const msg = json.error || 'Erreur lors de la mise à jour.'
      if (msg.toLowerCase().includes('image') || msg.toLowerCase().includes('format')) {
        setErrors(prev => ({ ...prev, image: msg }))
      } else {
        setServerError(msg)
      }
      return
    }
    window.location.href = '/'
  }

  if (fetching) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: "'Segoe UI', sans-serif",
      background: '#f0f4f8', color: '#1a2e4a', fontSize: 18, fontWeight: 600
    }}>
      Chargement...
    </div>
  )

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
        <ProfileMenu user={user} />
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '20px 16px' : '36px 24px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 32, alignItems: 'flex-start' }}>

        {/* FORMULAIRE */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#a0aec0', marginBottom: 8 }}>
            <span onClick={() => router.push('/app')} style={{ cursor: 'pointer', color: '#00c9a7' }}>Accueil</span>
            {' / '}
            <span onClick={() => router.push('/app')} style={{ cursor: 'pointer', color: '#00c9a7' }}>Manuels</span>
            {' / '}
            <span style={{ color: '#1a2e4a', fontWeight: 600 }}>Modifier un manuel</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 28px' }}>
            Modifier le manuel
          </h1>

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
          <form onSubmit={handleUpdate}>

            {/* INFOS */}
            <div style={{
              background: 'white', borderRadius: 14, padding: '28px',
              border: '1px solid #e2e8f0', marginBottom: 16
            }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: 1 }}>
                Informations du livre
              </h2>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                  Titre du manuel <span style={{ color: '#e53e3e' }}>*</span>
                  <span style={{ fontWeight: 400, color: '#a0aec0', fontSize: 12, marginLeft: 8 }}>{title.length}/150</span>
                </label>
                <input
                  value={title}
                  onChange={e => handleFieldChange('title', e.target.value, setTitle)}
                  onBlur={e => touch('title', e.target.value)}
                  style={fieldStyle('title')}
                />
                <ErrorMsg name="title" />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                  Auteur(s)
                </label>
                <input
                  value={authors}
                  onChange={e => handleFieldChange('authors', e.target.value, setAuthors)}
                  onBlur={e => touch('authors', e.target.value)}
                  placeholder="ex: Philip Kotler, Kevin Lane Keller"
                  style={fieldStyle('authors')}
                />
                <ErrorMsg name="authors" />
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>ISBN</label>
                  <input
                    value={isbn}
                    onChange={e => handleFieldChange('isbn', e.target.value, setIsbn)}
                    onBlur={e => touch('isbn', e.target.value)}
                    placeholder="ex: 9782765141310"
                    style={fieldStyle('isbn')}
                  />
                  <ErrorMsg name="isbn" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>Code de cours</label>
                  <input
                    value={course}
                    onChange={e => handleFieldChange('course', e.target.value, setCourse)}
                    onBlur={e => touch('course', e.target.value)}
                    placeholder="ex: MBA8616"
                    style={fieldStyle('course')}
                  />
                  <ErrorMsg name="course" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                  État du livre
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {ETATS.map(e => (
                    <button key={e} type="button" onClick={() => setEtat(e)} style={{
                      padding: '8px 16px',
                      border: `2px solid ${etat === e ? '#00c9a7' : '#cbd5e0'}`,
                      borderRadius: 20,
                      background: etat === e ? '#f0fdf9' : 'white',
                      color: etat === e ? '#00c9a7' : '#4a5568',
                      fontWeight: etat === e ? 700 : 500,
                      fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
                    }}>
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

              {/* MÉTHODES */}
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
                    type="number" value={price}
                    onChange={e => handleFieldChange('price', e.target.value, setPrice)}
                    onBlur={e => touch('price', e.target.value)}
                    min="1" style={fieldStyle('price')}
                  />
                  <ErrorMsg name="price" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    Prix neuf ($) <span style={{ color: '#a0aec0', fontWeight: 400 }}>(pour afficher l'économie)</span>
                  </label>
                  <input
                    type="number" value={originalPrice}
                    onChange={e => handleFieldChange('originalPrice', e.target.value, setOriginalPrice, { price })}
                    onBlur={e => touch('originalPrice', e.target.value, { price })}
                    min="1" placeholder="ex: 85"
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
              <h2 style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: 1 }}>
                Photo de couverture
              </h2>
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
                    <span style={{ color: '#a0aec0', fontSize: 12 }}>JPG, PNG, WebP — compressée automatiquement</span>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
              {imagePreview && (
                <button type="button" onClick={handleRemoveImage} style={{
                  marginTop: 10, background: 'none', border: 'none',
                  color: '#e53e3e', cursor: 'pointer', fontSize: 13
                }}>
                  × Supprimer la photo
                </button>
              )}
              {errors.image && (
                <div style={{ color: '#e53e3e', fontSize: 12, fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
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

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={loading} style={{
                flex: 1, padding: '15px',
                background: loading ? '#a0aec0' : '#1a2e4a',
                color: 'white', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
                onMouseEnter={e => { if (!loading) e.target.style.background = '#00c9a7' }}
                onMouseLeave={e => { if (!loading) e.target.style.background = '#1a2e4a' }}
              >
                {loading ? 'Mise à jour en cours...' : 'Enregistrer les modifications'}
              </button>
              <button type="button" onClick={() => router.push('/app')} style={{
                padding: '15px 28px',
                background: 'white', color: '#718096',
                border: '1px solid #cbd5e0', borderRadius: 10,
                fontWeight: 600, fontSize: 16, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
                onMouseEnter={e => { e.target.style.borderColor = '#e53e3e'; e.target.style.color = '#e53e3e' }}
                onMouseLeave={e => { e.target.style.borderColor = '#cbd5e0'; e.target.style.color = '#718096' }}
              >
                Annuler
              </button>
            </div>

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
            💡 L'aperçu se met à jour en temps réel pendant que tu modifies.
          </div>
        </div>

      </div>
    </div>
  )
}
