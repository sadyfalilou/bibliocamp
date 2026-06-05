'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

const ETATS = ['Neuf', 'Très bon état', 'Bon état', 'Acceptable']

export default function Create() {
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
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id)
    })
    // Pré-remplir depuis les params URL (vendre mon exemplaire)
    const t = searchParams.get('title')
    const a = searchParams.get('authors')
    const i = searchParams.get('isbn')
    const c = searchParams.get('course')
    if (t) setTitle(t)
    if (a) setAuthors(a)
    if (i) setIsbn(i)
    if (c) setCourse(c)
  }, [])

  const savingsPercent = price && originalPrice && Number(originalPrice) > 0
    ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
    : null

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
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

    let imageUrl = null
    if (image) {
      const fileName = Date.now() + '-' + image.name
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, image)
      if (uploadError) { alert('Erreur upload image'); setLoading(false); return }
      const { data } = supabase.storage.from('images').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    const { error } = await supabase.from('listings').insert([{
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
      image_url: imageUrl,
      user_id: userId
    }])

    setLoading(false)
    if (error) { alert('Erreur: ' + error.message); return }
    window.location.href = '/'
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
        <div
          onClick={() => router.push('/')}
          style={{
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
            Accueil / Manuels / <span style={{ color: '#1a2e4a', fontWeight: 600 }}>Publier un manuel</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 16px' }}>
            Publier un manuel
          </h1>


          <form onSubmit={handleSubmit}>
            <div style={{
              background: 'white', borderRadius: 14, padding: '28px',
              border: '1px solid #e2e8f0', marginBottom: 16
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a2e4a', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, color: '#a0aec0' }}>
                Informations du livre
              </h2>

              {/* TITRE */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                  Titre du manuel <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <input
                  placeholder="ex: Le Marketing – 4e édition"
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

              {/* AUTEURS */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                  Auteur(s)
                </label>
                <input
                  placeholder="ex: Philip Kotler, Kevin Lane Keller"
                  value={authors}
                  onChange={e => setAuthors(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1px solid #cbd5e0', borderRadius: 8,
                    fontSize: 15, outline: 'none', boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#00c9a7'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e0'}
                />
              </div>

              {/* ISBN + COURS */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    ISBN
                  </label>
                  <input
                    placeholder="ex: 9782765141310"
                    value={isbn}
                    onChange={e => setIsbn(e.target.value)}
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
                    placeholder="ex: MKG3301"
                    value={course}
                    onChange={e => setCourse(e.target.value)}
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
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>
                    Ton prix ($) <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="ex: 35"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                    min="1"
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
                    type="number"
                    placeholder="ex: 85"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                    min="1"
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
                <button type="button" onClick={() => { setImage(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }} style={{
                  marginTop: 10, background: 'none', border: 'none',
                  color: '#e53e3e', cursor: 'pointer', fontSize: 13
                }}>
                  × Supprimer la photo
                </button>
              )}
            </div>

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
