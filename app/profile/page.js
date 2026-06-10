'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Logo from '../../components/Logo'

const INSTITUTIONS = [
  'UQAM', 'HEC MontrÃ©al', 'UniversitÃ© de MontrÃ©al', 'McGill', 'Concordia',
  'UniversitÃ© Laval', 'UniversitÃ© de Sherbrooke', 'UQTR', 'UQAC', 'UQAR',
  'Polytechnique MontrÃ©al', 'Ã‰TS', 'Autre'
]

const PROGRAMS = [
  'Administration', 'Commerce', 'ComptabilitÃ©', 'Droit', 'Finance',
  'GÃ©nie', 'Informatique', 'Marketing', 'MÃ©decine', 'Nursing',
  'Psychologie', 'Sciences', 'Autre'
]

export default function Profile() {
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [campus, setCampus] = useState('')
  const [institution, setInstitution] = useState('')
  const [program, setProgram] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const avatarInputRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setCampus(data.campus || '')
        setInstitution(data.institution || '')
        setProgram(data.program || '')
        setAvatarUrl(data.avatar_url || null)
        setAvatarPreview(data.avatar_url || null)
      }
      setLoading(false)
    }
    init()
  }, [])

  const fields = [firstName, lastName, campus, institution, program, avatarUrl]
  const completion = fields.filter(v => v && v.toString().trim() !== '').length
  const completionPct = Math.round((completion / fields.length) * 100)

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)

    const ext = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (error) { alert('Erreur upload photo'); setUploadingAvatar(false); return }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const url = `${data.publicUrl}?t=${Date.now()}`
    setAvatarUrl(url)

    await supabase.from('profiles').upsert({ id: user.id, avatar_url: url })
    setUploadingAvatar(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      campus,
      institution,
      program,
      avatar_url: avatarUrl
    })
    setSaving(false)
    if (error) { alert('Erreur : ' + error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#f5f7fa', color: '#1a2e4a', fontSize: 18, fontWeight: 600 }}>
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
        <button onClick={() => router.push('/app')} style={{ background: 'transparent', color: '#a0aec0', border: '1px solid #2d4a6b', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#00c9a7' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#a0aec0'; e.currentTarget.style.borderColor = '#2d4a6b' }}
        >â† Retour</button>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px' : '36px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: '#a0aec0', marginBottom: 8 }}>
          Accueil / <span style={{ color: '#1a2e4a', fontWeight: 600 }}>Mon profil</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 24px' }}>Mon profil</h1>

        {/* Barre de complÃ©tion */}
        <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a' }}>ComplÃ©tude du profil</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: completionPct === 100 ? '#00c9a7' : '#f59e0b' }}>{completionPct}%</span>
          </div>
          <div style={{ background: '#e2e8f0', borderRadius: 20, height: 8, overflow: 'hidden' }}>
            <div style={{ background: completionPct === 100 ? '#00c9a7' : '#f59e0b', height: '100%', width: `${completionPct}%`, borderRadius: 20, transition: 'width 0.3s' }} />
          </div>
          {completionPct < 100 && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#718096' }}>
              Un profil complet aide les acheteurs Ã  te faire confiance.
            </p>
          )}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSave}>

          {/* Avatar + email */}
          <div style={{ background: 'white', borderRadius: 14, padding: '24px', border: '1px solid #e2e8f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>

            {/* Photo cliquable */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: '50%', cursor: 'pointer',
                  overflow: 'hidden', position: 'relative',
                  border: '3px solid #00c9a7',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #1a2e4a, #00c9a7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: 28
                  }}>
                    {firstName ? firstName[0].toUpperCase() : user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
                {/* Overlay hover */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                  color: 'white', fontSize: 11, fontWeight: 600, gap: 2
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  <span style={{ fontSize: 18 }}>ðŸ“·</span>
                  Modifier
                </div>
              </div>
              {uploadingAvatar && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,201,167,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 11, fontWeight: 700
                }}>â³</div>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#1a2e4a', fontSize: 16 }}>
                {firstName && lastName ? `${firstName} ${lastName}` : 'Ton nom'}
              </div>
              <div style={{ color: '#718096', fontSize: 13 }}>{user?.email}</div>
              {institution && <div style={{ color: '#00c9a7', fontSize: 12, fontWeight: 600, marginTop: 2 }}>ðŸ« {institution}</div>}
              <button type="button" onClick={() => avatarInputRef.current?.click()} style={{
                marginTop: 8, background: 'none', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '5px 12px', fontSize: 12,
                color: '#718096', cursor: 'pointer', fontWeight: 600
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.color = '#00c9a7' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#718096' }}
              >
                ðŸ“· {avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
            </div>
          </div>

          {/* Nom + prÃ©nom */}
          <div style={{ background: 'white', borderRadius: 14, padding: '24px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 18px' }}>IdentitÃ©</h2>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>PrÃ©nom</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="ex: Mouhamadou"
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#00c9a7'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e0'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>Nom de famille</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="ex: Sady"
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#00c9a7'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e0'}
                />
              </div>
            </div>
          </div>

          {/* Ã‰tudes */}
          <div style={{ background: 'white', borderRadius: 14, padding: '24px', border: '1px solid #e2e8f0', marginBottom: 24 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 18px' }}>Ã‰tudes</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>Institution</label>
              <select value={institution} onChange={e => setInstitution(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 15, outline: 'none', background: 'white', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#00c9a7'}
                onBlur={e => e.target.style.borderColor = '#cbd5e0'}
              >
                <option value="">SÃ©lectionne ton universitÃ©...</option>
                {INSTITUTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>Campus</label>
              <input value={campus} onChange={e => setCampus(e.target.value)} placeholder="ex: Campus principal, Longueuil..."
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#00c9a7'}
                onBlur={e => e.target.style.borderColor = '#cbd5e0'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>Programme</label>
              <select value={program} onChange={e => setProgram(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 15, outline: 'none', background: 'white', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#00c9a7'}
                onBlur={e => e.target.style.borderColor = '#cbd5e0'}
              >
                <option value="">SÃ©lectionne ton programme...</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {saved && (
            <div style={{ background: '#f0fdf9', border: '1px solid #00c9a7', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#00a88a', fontWeight: 600, fontSize: 14 }}>
              âœ… Profil sauvegardÃ© avec succÃ¨s !
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '15px',
            background: saving ? '#a0aec0' : '#1a2e4a',
            color: 'white', border: 'none', borderRadius: 10,
            fontWeight: 700, fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer'
          }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#00c9a7' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#1a2e4a' }}
          >
            {saving ? 'Sauvegarde...' : 'âœ“ Sauvegarder le profil'}
          </button>
        </form>
      </div>
    </div>
  )
}
