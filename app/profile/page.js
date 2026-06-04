'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const INSTITUTIONS = [
  'UQAM', 'HEC Montréal', 'Université de Montréal', 'McGill', 'Concordia',
  'Université Laval', 'Université de Sherbrooke', 'UQTR', 'UQAC', 'UQAR',
  'Polytechnique Montréal', 'ÉTS', 'Autre'
]

const PROGRAMS = [
  'Administration', 'Commerce', 'Comptabilité', 'Droit', 'Finance',
  'Génie', 'Informatique', 'Marketing', 'Médecine', 'Nursing',
  'Psychologie', 'Sciences', 'Autre'
]

export default function Profile() {
  const [user, setUser] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [campus, setCampus] = useState('')
  const [institution, setInstitution] = useState('')
  const [program, setProgram] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

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
      }
      setLoading(false)
    }
    init()
  }, [])

  const completion = [firstName, lastName, campus, institution, program]
    .filter(v => v.trim() !== '').length

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      campus,
      institution,
      program
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
        <div onClick={() => router.push('/')} style={{ background: '#00c9a7', color: 'white', fontWeight: 900, fontSize: 16, padding: '5px 14px', borderRadius: 8, letterSpacing: 1, cursor: 'pointer' }}>
          📚 BIBLIOCAMP
        </div>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', color: '#a0aec0', border: '1px solid #2d4a6b', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#00c9a7' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#a0aec0'; e.currentTarget.style.borderColor = '#2d4a6b' }}
        >← Retour</button>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '36px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: '#a0aec0', marginBottom: 8 }}>
          Accueil / <span style={{ color: '#1a2e4a', fontWeight: 600 }}>Mon profil</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 24px' }}>Mon profil</h1>

        {/* Barre de complétion */}
        <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a' }}>Complétude du profil</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: completion === 5 ? '#00c9a7' : '#f59e0b' }}>{Math.round((completion / 5) * 100)}%</span>
          </div>
          <div style={{ background: '#e2e8f0', borderRadius: 20, height: 8, overflow: 'hidden' }}>
            <div style={{ background: completion === 5 ? '#00c9a7' : '#f59e0b', height: '100%', width: `${(completion / 5) * 100}%`, borderRadius: 20, transition: 'width 0.3s' }} />
          </div>
          {completion < 5 && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#718096' }}>
              Un profil complet aide les acheteurs à te faire confiance.
            </p>
          )}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSave}>

          {/* Avatar + email */}
          <div style={{ background: 'white', borderRadius: 14, padding: '24px', border: '1px solid #e2e8f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, background: 'linear-gradient(135deg, #1a2e4a, #00c9a7)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 900, fontSize: 24, flexShrink: 0
            }}>
              {firstName ? firstName[0].toUpperCase() : user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1a2e4a', fontSize: 16 }}>
                {firstName && lastName ? `${firstName} ${lastName}` : 'Ton nom'}
              </div>
              <div style={{ color: '#718096', fontSize: 13 }}>{user?.email}</div>
              {institution && <div style={{ color: '#00c9a7', fontSize: 12, fontWeight: 600, marginTop: 2 }}>🏫 {institution}</div>}
            </div>
          </div>

          {/* Nom + prénom */}
          <div style={{ background: 'white', borderRadius: 14, padding: '24px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 18px' }}>Identité</h2>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>Prénom</label>
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

          {/* Études */}
          <div style={{ background: 'white', borderRadius: 14, padding: '24px', border: '1px solid #e2e8f0', marginBottom: 24 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 18px' }}>Études</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 6 }}>Institution</label>
              <select value={institution} onChange={e => setInstitution(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e0', borderRadius: 8, fontSize: 15, outline: 'none', background: 'white', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#00c9a7'}
                onBlur={e => e.target.style.borderColor = '#cbd5e0'}
              >
                <option value="">Sélectionne ton université...</option>
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
                <option value="">Sélectionne ton programme...</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {saved && (
            <div style={{ background: '#f0fdf9', border: '1px solid #00c9a7', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#00a88a', fontWeight: 600, fontSize: 14 }}>
              ✅ Profil sauvegardé avec succès !
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
            {saving ? 'Sauvegarde...' : '✓ Sauvegarder le profil'}
          </button>
        </form>
      </div>
    </div>
  )
}
