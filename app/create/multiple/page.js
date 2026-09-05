'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Logo from '../../../components/Logo'
import ProfileMenu from '../../../components/ProfileMenu'
import { VALID_ETATS } from '../../../lib/validation'

const MAX_PER_BATCH = 20
const LOOKUP_CONCURRENCY = 4

const card = { background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20 }
const label = { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const input = (extra = {}) => ({
  width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
  fontSize: 14, outline: 'none', background: '#fafbfc', color: '#1a2e4a',
  fontFamily: "'Segoe UI', sans-serif", boxSizing: 'border-box', ...extra,
})

// Découpe la saisie libre en ISBN nettoyés, sans doublon, en gardant l'ordre.
function parseIsbns(raw) {
  const seen = new Set()
  return raw
    .split(/[\s,;]+/)
    .map(v => v.replace(/[-\s]/g, '').trim())
    .filter(v => v.length > 0)
    .filter(v => { if (seen.has(v)) return false; seen.add(v); return true })
}

// Résout les ISBN par petits paquets : /api/isbn interroge des API externes,
// tout lancer d'un coup ferait tomber les dernières requêtes en timeout.
async function resolveIsbns(isbns, onRow) {
  for (let i = 0; i < isbns.length; i += LOOKUP_CONCURRENCY) {
    const slice = isbns.slice(i, i + LOOKUP_CONCURRENCY)
    await Promise.all(slice.map(async (isbn) => {
      const valid = /^\d{10,13}$/.test(isbn)
      if (!valid) return onRow({ isbn, found: false, invalid: true })
      try {
        const res = await fetch(`/api/isbn?isbn=${isbn}`)
        const data = await res.json()
        onRow(data.found && data.book ? { isbn, found: true, book: data.book } : { isbn, found: false })
      } catch {
        onRow({ isbn, found: false })
      }
    }))
  }
}

export default function BatchCreatePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  const [raw, setRaw] = useState('')
  const [looking, setLooking] = useState(false)
  const [rows, setRows] = useState([])

  // Réglages appliqués à toutes les lignes — sans eux, le vendeur ressaisit
  // le même campus et le même mode de transaction pour chaque manuel.
  const [etat, setEtat] = useState('Bon état')
  const [campus, setCampus] = useState('')
  const [meetCampus, setMeetCampus] = useState(true)
  const [meetCity, setMeetCity] = useState(false)
  const [post, setPost] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [publishedCount, setPublishedCount] = useState(0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.push('/login?redirect=/create/multiple'); return }
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

  const handleLookup = async () => {
    const isbns = parseIsbns(raw).slice(0, MAX_PER_BATCH)
    if (isbns.length === 0) return
    setLooking(true)
    setServerError('')
    setRows(isbns.map(isbn => ({ isbn, status: 'loading', title: '', authors: '', course_code: '', cover: null, price: '', original_price: '', etat: '' })))

    await resolveIsbns(isbns, (result) => {
      setRows(prev => prev.map(r => r.isbn !== result.isbn ? r : {
        ...r,
        status: result.invalid ? 'invalid' : (result.found ? 'found' : 'notfound'),
        title: result.book?.title || '',
        authors: result.book?.authors || '',
        course_code: result.book?.course || '',
        cover: result.book?.cover || null,
      }))
    })
    setLooking(false)
  }

  const updateRow = (isbn, patch) => setRows(prev => prev.map(r => r.isbn === isbn ? { ...r, ...patch } : r))
  const removeRow = (isbn) => setRows(prev => prev.filter(r => r.isbn !== isbn))

  const publishable = rows.filter(r => r.status !== 'invalid' && r.status !== 'published')
  const noTransaction = !meetCampus && !meetCity && !post

  const handlePublish = async () => {
    setServerError('')
    if (noTransaction) { setServerError('Choisis au moins une méthode de transaction.'); return }
    setSubmitting(true)

    const items = publishable.map(r => ({
      title: r.title,
      authors: r.authors,
      isbn: r.isbn,
      course_code: r.course_code,
      price: r.price,
      original_price: r.original_price || null,
      description: r.etat || etat,
      campus,
      meet_campus: meetCampus,
      meet_city: meetCity,
      post,
      image_url: r.cover || null,
    }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/listings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()

      if (!res.ok && !json.rejected) {
        setServerError(json.error || 'Erreur lors de la publication.')
        setSubmitting(false)
        return
      }

      // Les lignes refusées gardent leur saisie et affichent leur motif ;
      // les autres passent en « publié » et sortent du lot à soumettre.
      const errorByIndex = {}
      ;(json.rejected || []).forEach(r => { errorByIndex[r.index] = r.error })
      setRows(prev => {
        let i = -1
        return prev.map(r => {
          if (r.status === 'invalid' || r.status === 'published') return r
          i++
          return errorByIndex[i]
            ? { ...r, error: errorByIndex[i] }
            : { ...r, status: 'published', error: '' }
        })
      })
      setPublishedCount(c => c + (json.created?.length || 0))
    } catch {
      setServerError('Erreur réseau. Réessaie.')
    }
    setSubmitting(false)
  }

  const statusBadge = (row) => {
    if (row.status === 'published') return <span style={{ color: '#00a88a', fontWeight: 700, fontSize: 12 }}>✓ Publié</span>
    if (row.status === 'loading') return <span style={{ color: '#a0aec0', fontSize: 12 }}>Recherche…</span>
    if (row.status === 'invalid') return <span style={{ color: '#e53e3e', fontSize: 12 }}>ISBN invalide</span>
    if (row.status === 'notfound') return <span style={{ color: '#d97706', fontSize: 12 }}>Titre à saisir</span>
    return <span style={{ color: '#00a88a', fontSize: 12 }}>Trouvé</span>
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

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '20px 16px' : '36px 24px' }}>
        <div style={{ fontSize: 13, color: '#a0aec0', marginBottom: 8 }}>
          <span onClick={() => router.push('/app')} style={{ cursor: 'pointer', color: '#00c9a7' }}>Accueil</span>
          {' / '}
          <span onClick={() => router.push('/create')} style={{ cursor: 'pointer', color: '#00c9a7' }}>Publier un manuel</span>
          {' / '}
          <span style={{ color: '#1a2e4a', fontWeight: 600 }}>Publier plusieurs annonces</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 6px' }}>
          Publier plusieurs annonces
        </h1>
        <p style={{ color: '#718096', fontSize: 14, margin: '0 0 24px' }}>
          Une annonce distincte par manuel, créées d&apos;un coup. Colle les ISBN — on récupère les titres et les couvertures,
          tu n&apos;as plus qu&apos;à mettre les prix. Jusqu&apos;à {MAX_PER_BATCH} manuels à la fois.
          {' '}Pour vendre plusieurs manuels <strong>ensemble, en un seul bloc</strong>, passe plutôt par l&apos;annonce de lot.
        </p>

        {/* ── 1. Saisie des ISBN ── */}
        <div style={card}>
          <label style={label}>1 · Les ISBN de tes manuels</label>
          <textarea
            value={raw}
            onChange={e => setRaw(e.target.value)}
            rows={4}
            placeholder={"9782765012345\n9782894318416\n978-2-7605-4321-0"}
            style={input({ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 })}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleLookup}
              disabled={looking || parseIsbns(raw).length === 0}
              style={{
                background: looking ? '#a0aec0' : '#1a2e4a', color: 'white', border: 'none',
                borderRadius: 9, padding: '11px 22px', fontWeight: 700, fontSize: 14,
                cursor: looking ? 'default' : 'pointer',
              }}
            >
              {looking ? 'Recherche…' : 'Rechercher les manuels'}
            </button>
            <span style={{ fontSize: 13, color: '#718096' }}>
              {parseIsbns(raw).length} ISBN détecté{parseIsbns(raw).length > 1 ? 's' : ''}
              {parseIsbns(raw).length > MAX_PER_BATCH && ` — seuls les ${MAX_PER_BATCH} premiers seront traités`}
            </span>
          </div>
        </div>

        {rows.length > 0 && (
          <>
            {/* ── 2. Réglages communs ── */}
            <div style={card}>
              <label style={label}>2 · Réglages appliqués à tous les manuels</label>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 4 }}>État par défaut</div>
                  <select value={etat} onChange={e => setEtat(e.target.value)} style={input()}>
                    {VALID_ETATS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div style={{ minWidth: 200, flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 4 }}>Campus / établissement</div>
                  <input value={campus} onChange={e => setCampus(e.target.value)} placeholder="UQAM" style={input()} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 6 }}>Méthodes de transaction</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      ['Sur le campus', meetCampus, setMeetCampus],
                      ['En ville', meetCity, setMeetCity],
                      ['Par la poste', post, setPost],
                    ].map(([text, checked, set]) => (
                      <label key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
                        <input type="checkbox" checked={checked} onChange={e => set(e.target.checked)} style={{ accentColor: '#00c9a7', width: 16, height: 16 }} />
                        {text}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {noTransaction && (
                <div style={{ color: '#e53e3e', fontSize: 13, marginTop: 10 }}>Choisis au moins une méthode de transaction.</div>
              )}
            </div>

            {/* ── 3. Les manuels ── */}
            <div style={card}>
              <label style={label}>3 · Tes manuels — le prix est obligatoire</label>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', fontSize: 12, color: '#64748b' }}>
                      <th style={{ padding: '8px 6px', fontWeight: 700 }}>Manuel</th>
                      <th style={{ padding: '8px 6px', fontWeight: 700, width: 110 }}>Cours</th>
                      <th style={{ padding: '8px 6px', fontWeight: 700, width: 100 }}>Prix ($)</th>
                      <th style={{ padding: '8px 6px', fontWeight: 700, width: 110 }}>Prix neuf</th>
                      <th style={{ padding: '8px 6px', fontWeight: 700, width: 140 }}>État</th>
                      <th style={{ width: 36 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => {
                      const done = row.status === 'published'
                      return (
                        <tr key={row.isbn} style={{ borderTop: '1px solid #edf2f7', opacity: done ? 0.55 : 1, background: row.error ? '#fff8f8' : 'transparent' }}>
                          <td style={{ padding: '10px 6px' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              {row.cover
                                ? <img src={row.cover} alt="" style={{ width: 34, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                                : <div style={{ width: 34, height: 48, background: '#edf2f7', borderRadius: 4, flexShrink: 0 }} />}
                              <div style={{ minWidth: 200, flex: 1 }}>
                                <input
                                  value={row.title}
                                  onChange={e => updateRow(row.isbn, { title: e.target.value })}
                                  placeholder="Titre du manuel"
                                  disabled={done}
                                  style={input({ padding: '7px 10px', fontSize: 13, marginBottom: 4 })}
                                />
                                <div style={{ fontSize: 11, color: '#a0aec0', fontFamily: 'monospace' }}>{row.isbn}</div>
                                <div style={{ marginTop: 2 }}>{statusBadge(row)}</div>
                                {row.error && <div style={{ color: '#e53e3e', fontSize: 12, marginTop: 3 }}>{row.error}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 6px' }}>
                            <input value={row.course_code} onChange={e => updateRow(row.isbn, { course_code: e.target.value })} disabled={done} placeholder="ECN1000" style={input({ padding: '7px 10px', fontSize: 13 })} />
                          </td>
                          <td style={{ padding: '10px 6px' }}>
                            <input value={row.price} onChange={e => updateRow(row.isbn, { price: e.target.value })} disabled={done} inputMode="decimal" placeholder="30" style={input({ padding: '7px 10px', fontSize: 13 })} />
                          </td>
                          <td style={{ padding: '10px 6px' }}>
                            <input value={row.original_price} onChange={e => updateRow(row.isbn, { original_price: e.target.value })} disabled={done} inputMode="decimal" placeholder="—" style={input({ padding: '7px 10px', fontSize: 13 })} />
                          </td>
                          <td style={{ padding: '10px 6px' }}>
                            <select value={row.etat || ''} onChange={e => updateRow(row.isbn, { etat: e.target.value })} disabled={done} style={input({ padding: '7px 10px', fontSize: 13 })}>
                              <option value="">{etat} (commun)</option>
                              {VALID_ETATS.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                            <button onClick={() => removeRow(row.isbn)} title="Retirer" style={{ background: 'transparent', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: 16 }}>×</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {serverError && (
              <div style={{ background: '#fff5f5', border: '1px solid #e53e3e', color: '#c53030', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
                {serverError}
              </div>
            )}

            {publishedCount > 0 && (
              <div style={{ background: '#f0fdf9', border: '1px solid #00c9a7', color: '#00a88a', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
                ✅ {publishedCount} manuel{publishedCount > 1 ? 's' : ''} publié{publishedCount > 1 ? 's' : ''}.
                {' '}
                <span onClick={() => router.push('/app?view=mes-annonces')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Voir mes annonces</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
              <button
                onClick={handlePublish}
                disabled={submitting || publishable.length === 0}
                style={{
                  background: submitting || publishable.length === 0 ? '#a0aec0' : '#00c9a7',
                  color: 'white', border: 'none', borderRadius: 10,
                  padding: '14px 28px', fontWeight: 800, fontSize: 15,
                  cursor: submitting || publishable.length === 0 ? 'default' : 'pointer',
                }}
              >
                {submitting ? 'Publication…' : `Publier ${publishable.length} manuel${publishable.length > 1 ? 's' : ''}`}
              </button>
              <span style={{ fontSize: 13, color: '#718096' }}>
                Tu pourras ajouter une photo réelle depuis « Mes annonces ».
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
