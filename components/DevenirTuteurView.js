'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DOMAINS = ['Sciences', 'Santé', 'Droit', 'Arts', 'Éducation', 'Génie', 'Commerce', 'Autres']
const LANGUAGES = ['Français', 'Anglais', 'Espagnol', 'Arabe', 'Portugais', 'Mandarin']
const DAYS = [
  { key: 'lundi',     label: 'Lundi' },
  { key: 'mardi',    label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi',    label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi',   label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
]
const SLOTS = ['matin', 'après-midi', 'soir']

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < total - 1 ? 1 : 'none' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            background: i < current ? '#00c9a7' : i === current ? '#1a2e4a' : '#e2e8f0',
            color: i <= current ? 'white' : '#a0aec0', transition: 'all 0.3s',
          }}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? '#00c9a7' : '#e2e8f0', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function Chip({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '6px 13px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s',
      border: `2px solid ${active ? '#00c9a7' : '#e2e8f0'}`,
      background: active ? '#f0fdf9' : 'white', color: active ? '#00c9a7' : '#64748b',
    }}>
      {active && <span style={{ marginRight: 4 }}>✓</span>}{label}
    </div>
  )
}

function Field({ label, hint, children, error }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a2e4a', marginBottom: 5 }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 7px' }}>{hint}</p>}
      {children}
      {error && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

export default function DevenirTuteurView({ user, setView }) {
  const [step, setStep]           = useState(0)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [profile, setProfile]     = useState(null)
  const [alreadyTutor, setAlreadyTutor] = useState(false)
  const [errors, setErrors]       = useState({})

  const [domains, setDomains]     = useState([])
  const [subjects, setSubjects]   = useState([])
  const [subjectInput, setSubjectInput] = useState('')
  const [rate, setRate]           = useState(25)
  const [meetCampus, setMeetCampus] = useState(true)
  const [meetOnline, setMeetOnline] = useState(false)
  const [meetCity, setMeetCity]   = useState(false)
  const [availabilities, setAvailabilities] = useState({})
  const [bio, setBio]             = useState('')
  const [languages, setLanguages] = useState(['Français'])

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return }
      const { data: existing } = await supabase.from('tutors').select('id').eq('user_id', user.id).single()
      if (existing) { setAlreadyTutor(true); setLoading(false); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [user])

  const toggleSlot = (day, slot) => {
    setAvailabilities(prev => {
      const current = prev[day] || []
      const updated = current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot]
      return { ...prev, [day]: updated }
    })
  }

  const addSubject = () => {
    const s = subjectInput.trim().toUpperCase()
    if (s && !subjects.includes(s)) setSubjects(prev => [...prev, s])
    setSubjectInput('')
  }

  const validate = () => {
    const e = {}
    if (step === 1) {
      if (domains.length === 0) e.domains = 'Choisis au moins un domaine.'
      if (subjects.length === 0) e.subjects = 'Ajoute au moins une matière ou un code de cours.'
      if (rate < 10 || rate > 150) e.rate = 'Le tarif doit être entre 10 $ et 150 $.'
    }
    if (step === 3) {
      if (!bio.trim() || bio.trim().length < 30) e.bio = 'Ta présentation doit faire au moins 30 caractères.'
      if (!meetCampus && !meetOnline && !meetCity) e.modes = 'Choisis au moins un mode de rencontre.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (!validate()) return; setStep(s => s + 1) }
  const prev = () => setStep(s => s - 1)

  const submit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          domains, subjects, rate_per_hour: rate,
          meet_campus: meetCampus, meet_online: meetOnline, meet_city: meetCity,
          availabilities, bio: bio.trim(), languages,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrors({ submit: json.error || "Erreur lors de l'enregistrement. Réessaie." })
        return
      }
      setStep(4)
    } catch {
      setErrors({ submit: "Erreur lors de l'enregistrement. Réessaie." })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 9, border: '1.5px solid #e2e8f0',
    fontSize: 13, color: '#1a2e4a', outline: 'none', boxSizing: 'border-box', background: 'white',
  }
  const btnPrimary = {
    padding: '11px 24px', background: '#1a2e4a', color: 'white', border: 'none',
    borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
  }
  const btnSecondary = {
    padding: '11px 20px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>Chargement...</div>

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>🎓</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2e4a', marginBottom: 8 }}>Connecte-toi pour devenir tuteur</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>Un compte est nécessaire pour créer un profil tuteur.</div>
    </div>
  )

  if (alreadyTutor) return (
    <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1a2e4a', marginBottom: 8 }}>Tu es déjà tuteur !</div>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Tu peux modifier ton profil, changer ta disponibilité ou mettre à jour ton tarif.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setView('tuteurs')} style={btnSecondary}>← Voir les tuteurs</button>
        <button
          onClick={async () => {
            const { data: { session } } = await supabase.auth.getSession()
            window.location.href = '/tuteurs/modifier'
          }}
          style={btnPrimary}
        >
          Modifier mon profil →
        </button>
      </div>
    </div>
  )

  // ── Étape 4 : Confirmation ──
  if (step === 4) return (
    <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#1a2e4a', marginBottom: 8 }}>Profil créé avec succès !</div>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Ton profil est maintenant visible sur BiblioCamp. Les étudiants peuvent te contacter directement.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setView('tuteurs')} style={btnSecondary}>Voir tous les tuteurs</button>
        <button onClick={() => window.location.href = '/tuteurs/modifier'} style={btnPrimary}>Modifier mon profil →</button>
      </div>
    </div>
  )

  const steps = ['Profil', 'Expertise', 'Disponibilités', 'Présentation']

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a2e4a', margin: '0 0 4px' }}>Devenir tuteur</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Étape {step + 1} sur {steps.length} — {steps[step]}</p>
      </div>

      <StepIndicator current={step} total={steps.length} />

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '24px' }}>

        {/* ── Étape 0 : Profil ── */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1a2e4a', margin: '0 0 16px' }}>Ton profil de base</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Ces informations viennent de ton compte BiblioCamp. Elles seront visibles sur ton profil tuteur.</p>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#f8fafc', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2e4a,#00c9a7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', fontWeight: 800 }}>
                    {(profile?.first_name || user?.email || '?')[0].toUpperCase()}
                  </div>
              }
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2e4a' }}>
                  {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Mon nom' : '—'}
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{profile?.institution || 'Mon institution'}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{profile?.campus || profile?.program || ''}</div>
              </div>
            </div>

            <div style={{ background: '#fef9e7', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400e' }}>
              💡 Pour modifier ton nom ou ta photo, va dans <strong>Mon profil</strong> depuis la barre de navigation.
            </div>
          </div>
        )}

        {/* ── Étape 1 : Expertise ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1a2e4a', margin: '0 0 16px' }}>Ton expertise</h2>

            <Field label="Domaines" hint="Sélectionne les domaines où tu peux aider." error={errors.domains}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DOMAINS.map(d => (
                  <Chip key={d} label={d} active={domains.includes(d)} onClick={() => setDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])} />
                ))}
              </div>
            </Field>

            <Field label="Matières / codes de cours" hint="Ex : BIO201, Calcul différentiel, Python..." error={errors.subjects}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSubject()}
                  placeholder="Appuie sur Entrée pour ajouter"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addSubject} style={{ ...btnPrimary, padding: '10px 16px', fontSize: 13 }}>+ Ajouter</button>
              </div>
              {subjects.length > 0 && (
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {subjects.map(s => (
                    <span key={s} style={{ background: '#f0f9ff', color: '#0369a1', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s}
                      <span onClick={() => setSubjects(prev => prev.filter(x => x !== s))} style={{ cursor: 'pointer', color: '#64748b', fontWeight: 700 }}>×</span>
                    </span>
                  ))}
                </div>
              )}
            </Field>

            <Field label={`Tarif : ${rate} $/heure`} hint="Fixe entre 10 $ et 150 $/h. La moyenne est de 25–35 $/h." error={errors.rate}>
              <input type="range" min={10} max={150} step={5} value={rate} onChange={e => setRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#00c9a7' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a0aec0', marginTop: 4 }}>
                <span>10 $/h</span><span style={{ fontWeight: 700, color: '#00c9a7', fontSize: 14 }}>{rate} $/h</span><span>150 $/h</span>
              </div>
            </Field>
          </div>
        )}

        {/* ── Étape 2 : Disponibilités ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1a2e4a', margin: '0 0 6px' }}>Tes disponibilités</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Coche les créneaux où tu es généralement disponible.</p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 8px', fontSize: 12, color: '#94a3b8', textAlign: 'left', fontWeight: 600 }}>Jour</th>
                    {SLOTS.map(s => (
                      <th key={s} style={{ padding: '6px 8px', fontSize: 12, color: '#94a3b8', textAlign: 'center', fontWeight: 600, textTransform: 'capitalize' }}>{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(({ key, label }) => (
                    <tr key={key}>
                      <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600, color: '#1a2e4a' }}>{label}</td>
                      {SLOTS.map(slot => {
                        const active = (availabilities[key] || []).includes(slot)
                        return (
                          <td key={slot} style={{ padding: '4px 6px', textAlign: 'center' }}>
                            <div onClick={() => toggleSlot(key, slot)} style={{
                              width: 28, height: 28, borderRadius: 7, margin: '0 auto', cursor: 'pointer',
                              background: active ? '#00c9a7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, transition: 'all 0.15s',
                            }}>
                              {active ? <span style={{ color: 'white', fontWeight: 700 }}>✓</span> : ''}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>Pas de panique, tu pourras modifier tes disponibilités à tout moment.</p>
          </div>
        )}

        {/* ── Étape 3 : Présentation ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1a2e4a', margin: '0 0 16px' }}>Ta présentation</h2>

            <Field label="Bio" hint="Présente-toi en quelques phrases. Qu'est-ce qui te distingue ?" error={errors.bio}>
              <textarea
                value={bio} onChange={e => setBio(e.target.value)} maxLength={500}
                placeholder="Ex : Étudiant en génie informatique à Polytechnique, j'ai obtenu A+ en Python et Algo. Je propose des sessions claires et adaptées à ton niveau..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: bio.length > 450 ? '#e53e3e' : '#a0aec0', marginTop: 3 }}>{bio.length}/500</div>
            </Field>

            <Field label="Modes de rencontre" error={errors.modes}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip label="🏫 Sur campus" active={meetCampus} onClick={() => setMeetCampus(v => !v)} />
                <Chip label="💻 En ligne" active={meetOnline} onClick={() => setMeetOnline(v => !v)} />
                <Chip label="🏙️ En ville" active={meetCity} onClick={() => setMeetCity(v => !v)} />
              </div>
            </Field>

            <Field label="Langues d'enseignement">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LANGUAGES.map(l => (
                  <Chip key={l} label={l} active={languages.includes(l)}
                    onClick={() => setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])} />
                ))}
              </div>
            </Field>

            {errors.submit && (
              <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#c53030', marginTop: 8 }}>{errors.submit}</div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        {step > 0
          ? <button onClick={prev} style={btnSecondary}>← Retour</button>
          : <button onClick={() => setView('tuteurs')} style={btnSecondary}>← Annuler</button>
        }
        {step < 3
          ? <button onClick={next} style={btnPrimary}>Continuer →</button>
          : <button onClick={submit} disabled={saving} style={{ ...btnPrimary, background: saving ? '#94a3b8' : '#00c9a7', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Enregistrement...' : 'Créer mon profil ✓'}
            </button>
        }
      </div>
    </div>
  )
}
