'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

const ETATS = ['Neuf', 'Très bon état', 'Bon état', 'Acceptable']

export default function Edit() {
  const { id } = useParams()
  const router = useRouter()
  const fileInputRef = useRef(null)

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

  const savingsPercent = price && originalPrice && Number(originalPrice) > 0
    ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
    : null

  useEffect(() => {
    const fetchData = async () => {
      const timeout = setTimeout(() => {
        setFetching(false)
        alert('Impossible de charger le livre. Vérifie ta connexion.')
        router.push('/')
      }, 8000)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { clearTimeout(timeout); router.push('/login'); return }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single()

      clearTimeout(timeout)

      if (error || !data) { router.push('/'); return }

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

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
    setExistingImageUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpdate = async (e) => {
    e.preventDefault()

    // Validations
    if (!title.trim()) { alert('Le titre est obligatoire.'); return }
    if (title.trim().length > 150) { alert('Le titre ne peut pas dépasser 150 caractères.'); return }
    if (authors.length > 200) { alert('Le champ auteurs ne peut pas dépasser 200 caractères.'); return }
    if (isbn && !/^\d{10,13}$/.test(isbn.replace(/[-\s]/g, ''))) { alert('ISBN invalide — doit contenir 10 ou 13 chiffres.'); return }
    if (course && course.length > 20) { alert('Le code de cours ne peut pas dépasser 20 caractères.'); return }
    if (!price || Number(price) <= 0 || Number(price) > 9999) { alert('Le prix doit être entre 1 $ et 9 999 $.'); return }
    if (originalPrice && (Number(originalPrice) <= 0 || Number(originalPrice) > 9999)) { alert('Le prix neuf doit être entre 1 $ et 9 999 $.'); return }
    if (originalPrice && Number(originalPrice) <= Number(price)) { alert('Le prix neuf doit être supérieur à ton prix de vente.'); return }
    if (campus && campus.length > 100) { alert('Le nom du campus ne peut pas dépasser 100 caractères.'); return }

    setLoading(true)

    let imageUrl = existingImageUrl

    if (image) {
      const fileName = Date.now() + '-' + image.name
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, image)
      if (uploadError) { alert('Erreur upload image'); setLoading(false); return }
      const { data } = supabase.storage.from('images').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    if (!existingImageUrl && !image) imageUrl = null

    const { error } = await supabase
      .from('listings')
      .update({
        title,
        authors,
        isbn,
        course_code: course,
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        description: etat,
        campus,
        meet_campus: meetCampus,
        meet_city: meetCity,
        post,
        image_url: imageUrl
      })
      .eq('id', id)
      .eq('user_id', (await supabase.auth.getSession()).data.session?.user.id)

    setLoading(false)
    if (error) { alert('Erreur: ' + error.message); return }
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
        <div onClick={() => router.push('/')} style={{
          background: '#00c9a7', color: 'white', fontWeight: 900,
          fontSize: 16, padding: '5px 14px', borderRadius: 8,
          letterSpacing: 1, cursor: 'pointer'
        }}>
          📚 BIBLIOCAMP
        </div>
        <button onClick={() => router.push('/')} style={{
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

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 24px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* FORMULAIRE */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#a0aec0', marginBottom: 8 }}>
            Accueil / Manuels / <span style={{ color: '#1a2e4a', fontWeight: 600 }}>Modifier un manuel</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 28px' }}>
            Modifier le manuel
          </h1>

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
                </label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1px solid #cbd5e0', borderRadius: 8,
                    fontSize: 15, outline: 'none', boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#00c9a7'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e0'}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                  Auteur(s)
                </label>
                <input
                  value={authors}
                  onChange={e => setAuthors(e.target.value)}
                  placeholder="ex: Philip Kotler, Kevin Lane Keller"
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1px solid #cbd5e0', borderRadius: 8,
                    fontSize: 15, outline: 'none', boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#00c9a7'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e0'}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    ISBN
                  </label>
                  <input
                    value={isbn}
                    onChange={e => setIsbn(e.target.value)}
                    placeholder="ex: 9782765141310"
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: '1px solid #cbd5e0', borderRadius: 8,
                      fontSize: 15, outline: 'none', boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#00c9a7'}
                    onBlur={e => e.target.style.borderColor = '#cbd5e0'}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    Code de cours
                  </label>
                  <input
                    value={course}
                    onChange={e => setCourse(e.target.value)}
                    placeholder="ex: MKG3301"
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: '1px solid #cbd5e0', borderRadius: 8,
                      fontSize: 15, outline: 'none', boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#00c9a7'}
                    onBlur={e => e.target.style.borderColor = '#cbd5e0'}
                  />
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
                  onChange={e => setCampus(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1px solid #cbd5e0', borderRadius: 8,
                    fontSize: 15, outline: 'none', boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#00c9a7'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e0'}
                />
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
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    Ton prix ($) <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    type="number" value={price} onChange={e => setPrice(e.target.value)}
                    required min="1"
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: '1px solid #cbd5e0', borderRadius: 8,
                      fontSize: 15, outline: 'none', boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#00c9a7'}
                    onBlur={e => e.target.style.borderColor = '#cbd5e0'}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    Prix neuf ($) <span style={{ color: '#a0aec0', fontWeight: 400 }}>(pour afficher l'économie)</span>
                  </label>
                  <input
                    type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)}
                    min="1" placeholder="ex: 85"
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: '1px solid #cbd5e0', borderRadius: 8,
                      fontSize: 15, outline: 'none', boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#00c9a7'}
                    onBlur={e => e.target.style.borderColor = '#cbd5e0'}
                  />
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
                border: '2px dashed #cbd5e0', borderRadius: 10,
                padding: '28px', cursor: 'pointer',
                background: imagePreview ? 'transparent' : '#f7fafc',
                transition: 'border-color 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#00c9a7'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e0'}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{
                    maxHeight: 160, maxWidth: '100%', borderRadius: 8, objectFit: 'contain'
                  }} />
                ) : (
                  <>
                    <span style={{ fontSize: 32 }}>📷</span>
                    <span style={{ color: '#718096', fontSize: 14 }}>Clique pour ajouter une photo</span>
                    <span style={{ color: '#a0aec0', fontSize: 12 }}>JPG, PNG — max 5 MB</span>
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
            </div>

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
              <button type="button" onClick={() => router.push('/')} style={{
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
        <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 80 }}>
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
