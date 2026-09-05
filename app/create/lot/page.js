'use client'

import { useState, useEffect, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Logo from '../../../components/Logo'
import ProfileMenu from '../../../components/ProfileMenu'
import {
  VALID_ETATS, MAX_BUNDLE_IMAGES, MIN_BUNDLE_ITEMS, MAX_BUNDLE_ITEMS,
  parseBundleItems, validateBundleFields,
} from '../../../lib/validation'

const card = { background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 }
const label = { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const field = (extra = {}) => ({
  width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9,
  fontSize: 14, outline: 'none', background: '#fafbfc', color: '#1a2e4a',
  fontFamily: "'Segoe UI', sans-serif", boxSizing: 'border-box', ...extra,
})

export default function CreateBundlePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  const [title, setTitle] = useState('')
  const [items, setItems] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [etat, setEtat] = useState('Bon état')
  const [campus, setCampus] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [meetCampus, setMeetCampus] = useState(true)
  const [meetCity, setMeetCity] = useState(false)
  const [post, setPost] = useState(false)

  const [photos, setPhotos] = useState([]) // { file, preview }
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef(null)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.push('/login?redirect=/create/lot'); return }
      setUser(session.user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_verified, campus, institution')
        .eq('id', session.user.id)
        .single()
      if (!profile?.phone_verified) { router.push('/app?verify=1'); return }
      if (profile.campus || profile.institution) setCampus(profile.campus || profile.institution)
    })
  }, [])

  const parsedItems = parseBundleItems(items)

  const addPhotos = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const room = Math.max(MAX_BUNDLE_IMAGES - photos.length, 0)
    setCompressing(true)
    const added = []
    for (const file of files.slice(0, room)) {
      try {
        const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true })
        added.push({ file: new File([compressed], file.name, { type: compressed.type }), preview: URL.createObjectURL(compressed) })
      } catch {
        added.push({ file, preview: URL.createObjectURL(file) })
      }
    }
    setPhotos(prev => [...prev, ...added])
    setCompressing(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePhoto = (index) => setPhotos(prev => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Même validation que le serveur : l'erreur s'affiche sans aller-retour.
    const fields = {
      title, bundle_items: items, price, original_price: originalPrice || null,
      campus, description: etat, meet_campus: meetCampus, meet_city: meetCity, post,
    }
    const err = validateBundleFields(fields)
    if (err) { setError(err); return }

    setSubmitting(true)
    const body = new FormData()
    body.append('is_bundle', 'true')
    body.append('title', title)
    body.append('bundle_items', items)
    body.append('price', price)
    if (originalPrice) body.append('original_price', originalPrice)
    body.append('description', etat)
    body.append('campus', campus)
    body.append('course_code', courseCode)
    body.append('meet_campus', String(meetCampus))
    body.append('meet_city', String(meetCity))
    body.append('post', String(post))
    photos.forEach(p => body.append('images', p.file))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body,
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erreur lors de la publication.'); setSubmitting(false); return }
      router.push('/app?view=mes-annonces')
    } catch {
      setError('Erreur réseau. Réessaie.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa' }}>
      <header style={{
        background: '#1a2e4a', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <Logo variant="light" size="sm" onClick={() => router.push('/app')} style={{ cursor: 'pointer' }} />
        <ProfileMenu user={user} />
      </header>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '20px 16px' : '36px 24px' }}>
        <div style={{ fontSize: 13, color: '#a0aec0', marginBottom: 8 }}>
          <span onClick={() => router.push('/app')} style={{ cursor: 'pointer', color: '#00c9a7' }}>Accueil</span>
          {' / '}
          <span onClick={() => router.push('/create')} style={{ cursor: 'pointer', color: '#00c9a7' }}>Publier un manuel</span>
          {' / '}
          <span style={{ color: '#1a2e4a', fontWeight: 600 }}>Vendre un lot</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 6px' }}>
          Vendre un lot de manuels
        </h1>
        <p style={{ color: '#718096', fontSize: 14, margin: '0 0 24px' }}>
          Tous tes manuels d&apos;une session ou d&apos;une année, vendus ensemble dans une seule annonce,
          à un seul prix. Liste les titres et ajoute des photos de la pile.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={card}>
            <label style={label}>Titre de l&apos;annonce</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={150}
              placeholder="Lot de 6 manuels — 1re année sciences comptables UQAM"
              style={field()}
            />

            <div style={{ marginTop: 18 }}>
              <label style={label}>Les manuels du lot — un par ligne</label>
              <textarea
                value={items}
                onChange={e => setItems(e.target.value)}
                rows={7}
                placeholder={"Comptabilité intermédiaire\nMathématiques financières\nIntroduction au droit des affaires\nStatistiques pour la gestion"}
                style={field({ resize: 'vertical', lineHeight: 1.6 })}
              />
              <div style={{ fontSize: 12, color: parsedItems.length >= MIN_BUNDLE_ITEMS ? '#718096' : '#d97706', marginTop: 6 }}>
                {parsedItems.length} manuel{parsedItems.length > 1 ? 's' : ''} dans le lot
                {parsedItems.length < MIN_BUNDLE_ITEMS && ` — il en faut au moins ${MIN_BUNDLE_ITEMS}`}
                {parsedItems.length > MAX_BUNDLE_ITEMS && ` — maximum ${MAX_BUNDLE_ITEMS}`}
              </div>
            </div>
          </div>

          <div style={card}>
            <label style={label}>Photos du lot (max {MAX_BUNDLE_IMAGES})</label>
            <p style={{ fontSize: 13, color: '#718096', margin: '0 0 12px' }}>
              Une photo de la pile de livres vaut mieux qu&apos;une couverture générique : l&apos;acheteur voit l&apos;état réel.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p.preview} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 22, height: 22,
                      borderRadius: '50%', border: 'none', background: '#e53e3e', color: 'white',
                      cursor: 'pointer', fontSize: 13, lineHeight: 1,
                    }}
                  >×</button>
                </div>
              ))}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} style={{ display: 'none' }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photos.length >= MAX_BUNDLE_IMAGES || compressing}
              style={{
                background: '#f8fafc', color: '#1a2e4a', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600,
                cursor: photos.length >= MAX_BUNDLE_IMAGES ? 'not-allowed' : 'pointer',
                opacity: photos.length >= MAX_BUNDLE_IMAGES ? 0.5 : 1,
              }}
            >
              {compressing ? 'Compression…' : '+ Ajouter des photos'}
            </button>
            <span style={{ fontSize: 12, color: '#718096', marginLeft: 10 }}>{photos.length}/{MAX_BUNDLE_IMAGES}</span>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px' }}>
                <label style={label}>Prix du lot ($)</label>
                <input value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" placeholder="150" style={field()} />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={label}>Prix neuf total (option)</label>
                <input value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} inputMode="decimal" placeholder="600" style={field()} />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={label}>État général</label>
                <select value={etat} onChange={e => setEtat(e.target.value)} style={field()}>
                  {VALID_ETATS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 18 }}>
              <div style={{ flex: '1 1 220px' }}>
                <label style={label}>Campus / établissement</label>
                <input value={campus} onChange={e => setCampus(e.target.value)} placeholder="UQAM" style={field()} />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={label}>Programme ou cours (option)</label>
                <input value={courseCode} onChange={e => setCourseCode(e.target.value)} maxLength={20} placeholder="SCO1000" style={field()} />
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={label}>Méthodes de transaction</label>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                {[
                  ['Sur le campus', meetCampus, setMeetCampus],
                  ['En ville', meetCity, setMeetCity],
                  ['Par la poste', post, setPost],
                ].map(([text, checked, set]) => (
                  <label key={text} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checked} onChange={e => set(e.target.checked)} style={{ accentColor: '#00c9a7', width: 16, height: 16 }} />
                    {text}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #e53e3e', color: '#c53030', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '15px',
              background: submitting ? '#a0aec0' : '#00c9a7',
              color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 800, fontSize: 16, cursor: submitting ? 'default' : 'pointer',
              marginBottom: 40,
            }}
          >
            {submitting ? 'Publication…' : 'Publier le lot'}
          </button>
        </form>
      </div>
    </div>
  )
}
