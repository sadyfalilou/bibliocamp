'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Footer from '../../../components/Footer'

const DOMAINS = ['Sciences', 'Santé', 'Droit', 'Arts', 'Éducation', 'Génie', 'Commerce', 'Autres']
const LANGUAGES = ['Français', 'Anglais', 'Espagnol', 'Arabe', 'Portugais', 'Mandarin']
const DAYS = [
  { key: 'lundi',    label: 'Lundi' },
  { key: 'mardi',   label: 'Mardi' },
  { key: 'mercredi',label: 'Mercredi' },
  { key: 'jeudi',   label: 'Jeudi' },
  { key: 'vendredi',label: 'Vendredi' },
  { key: 'samedi',  label: 'Samedi' },
  { key: 'dimanche',label: 'Dimanche' },
]
const SLOTS = ['matin', 'après-midi', 'soir']

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < total - 1 ? 1 : 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
            background: i < current ? '#00c9a7' : i === current ? '#1a2e4a' : '#e2e8f0',
            color: i <= current ? 'white' : '#a0aec0',
            transition: 'all 0.3s',
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
    <div
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s',
        border: `2px solid ${active ? '#00c9a7' : '#e2e8f0'}`,
        background: active ? '#f0fdf9' : 'white',
        color: active ? '#00c9a7' : '#64748b',
      }}
    >
      {active && <span style={{ marginRight: 4 }}>✓</span>}{label}
    </div>
  )
}

function Field({ label, hint, children, error }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a2e4a', marginBottom: 6 }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>{hint}</p>}
      {children}
      {error && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

export default function DevenirTuteurPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [errors, setErrors] = useState({})

  // Formulaire
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
  const [isMobile, setIsMobile]   = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // Vérifier si déjà tuteur
      const { data: existing } = await supabase.from('tutors').select('id').eq('user_id', user.id).single()
      if (existing) { router.push('/tuteurs/modifier'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [])

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
      if (!bio.trim()) e.bio = 'Écris une courte présentation.'
      if (bio.trim().length < 30) e.bio = 'Ta présentation doit faire au moins 30 caractères.'
      if (!meetCampus && !meetOnline && !meetCity) e.modes = 'Choisis au moins un mode de rencontre.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate()) return
    setStep(s => s + 1)
    window.scrollTo(0, 0)
  }

  const prev = () => { setStep(s => s - 1); window.scrollTo(0, 0) }

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
        setErrors({ submit: json.error || 'Erreur lors de l\'enregistrement. Réessaie.' })
        return
      }
      setStep(4) // confirmation
    } catch (err) {
      setErrors({ submit: 'Erreur lors de l\'enregistrement. Réessaie.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#64748b' }}>
      Chargement...
    </div>
  )

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1a2e4a',
    outline: 'none', boxSizing: 'border-box', background: 'white',
    transition: 'border-color 0.15s',
  }

  const steps = ['Profil', 'Expertise', 'Disponibilités', 'Présentation']

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa', colorScheme: 'light' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 16 }}>
          <button onClick={() => step === 0 ? router.push('/tuteurs') : prev()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← {step === 0 ? 'Tuteurs' : 'Retour'}
          </button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1a2e4a' }}>
            {step < 4 ? 'Devenir tuteur' : ''}
          </span>
          <div style={{ width: 80 }} />
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>

        {/* ── CONFIRMATION ── */}
        {step === 4 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#00c9a7,#0099ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>🎓</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 12px' }}>Ton profil est en ligne !</h1>
            <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 32px', lineHeight: 1.6 }}>
              Les étudiants peuvent maintenant te trouver et te contacter pour des sessions de tutorat.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => router.push('/tuteurs')} style={{ padding: '14px', background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Voir tous les tuteurs
              </button>
              <button onClick={() => router.push('/tuteurs/modifier')} style={{ padding: '14px', background: 'white', color: '#1a2e4a', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Modifier mon profil
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Indicateur d'étapes */}
            <StepIndicator current={step} total={4} />

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: isMobile ? '24px 16px' : '32px' }}>

              {/* ── ÉTAPE 0 — Profil de base ── */}
              {step === 0 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a', margin: '0 0 6px' }}>Ton profil de base</h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px' }}>Ces informations viennent de ton compte BiblioCamp.</p>

                  {/* Aperçu profil */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: '#f8fafc', borderRadius: 12, marginBottom: 24, border: '1px solid #e2e8f0' }}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', fontWeight: 700 }}>
                          {(profile?.first_name?.[0] || '?').toUpperCase()}
                        </div>
                    }
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2e4a' }}>{profile?.first_name} {profile?.last_name}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{profile?.institution || profile?.campus || 'Institution non renseignée'}</div>
                      {profile?.phone_verified && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf9', color: '#00c9a7', borderRadius: 6, padding: '2px 8px', border: '1px solid #a7f3d0' }}>✓ Profil vérifié</span>
                      )}
                    </div>
                  </div>

                  <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#92400e' }}>
                    <strong>💡 Conseils pour un bon profil tuteur :</strong>
                    <ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.8 }}>
                      <li>Ajoute une photo de profil si ce n'est pas fait</li>
                      <li>Mentionne tes cours réussis avec de bonnes notes</li>
                      <li>Sois réactif aux messages des étudiants</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* ── ÉTAPE 1 — Expertise ── */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a', margin: '0 0 6px' }}>Ton expertise</h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px' }}>Indique tes domaines et les cours que tu peux enseigner.</p>

                  <Field label="Domaines d'enseignement" hint="Choisis un ou plusieurs domaines." error={errors.domains}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {DOMAINS.map(d => (
                        <Chip key={d} label={d} active={domains.includes(d)} onClick={() => setDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])} />
                      ))}
                    </div>
                  </Field>

                  <Field label="Matières et codes de cours" hint="Ex: MAT101, Calcul, Droit civil, BIO201 — appuie Entrée pour ajouter." error={errors.subjects}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input
                        value={subjectInput}
                        onChange={e => setSubjectInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                        placeholder="Ex: MAT101"
                        style={{ ...inputStyle, flex: 1 }}
                        onFocus={e => e.target.style.borderColor = '#00c9a7'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                      <button onClick={addSubject} style={{ padding: '11px 18px', background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                        + Ajouter
                      </button>
                    </div>
                    {subjects.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {subjects.map(s => (
                          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#f0f9ff', color: '#0369a1', borderRadius: 8, padding: '4px 10px', border: '1px solid #bae6fd' }}>
                            {s}
                            <button onClick={() => setSubjects(prev => prev.filter(x => x !== s))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </Field>

                  <Field label={`Tarif horaire : ${rate} $/h`} hint="Entre 10 $ et 150 $ par heure." error={errors.rate}>
                    <input
                      type="range" min="10" max="150" step="5"
                      value={rate} onChange={e => setRate(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#00c9a7', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      <span>10 $</span><span style={{ fontWeight: 700, color: '#00c9a7', fontSize: 16 }}>{rate} $/h</span><span>150 $</span>
                    </div>
                  </Field>
                </div>
              )}

              {/* ── ÉTAPE 2 — Disponibilités ── */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a', margin: '0 0 6px' }}>Tes disponibilités</h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px' }}>Sélectionne les créneaux où tu es généralement disponible.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* En-têtes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr', gap: 6, marginBottom: 4 }}>
                      <div />
                      {SLOTS.map(s => (
                        <div key={s} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'capitalize' }}>{s}</div>
                      ))}
                    </div>
                    {DAYS.map(({ key, label }) => (
                      <div key={key} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr', gap: 6, alignItems: 'center', padding: '4px 0' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a' }}>{label}</span>
                        {SLOTS.map(slot => {
                          const active = (availabilities[key] || []).includes(slot)
                          return (
                            <div
                              key={slot}
                              onClick={() => toggleSlot(key, slot)}
                              style={{
                                height: 36, borderRadius: 8, cursor: 'pointer',
                                border: `2px solid ${active ? '#00c9a7' : '#e2e8f0'}`,
                                background: active ? '#f0fdf9' : 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, transition: 'all 0.15s',
                              }}
                            >
                              {active ? '✓' : ''}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
                    💡 Tu peux laisser vide si tes disponibilités varient — les étudiants te contacteront directement.
                  </p>
                </div>
              )}

              {/* ── ÉTAPE 3 — Présentation ── */}
              {step === 3 && (
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a', margin: '0 0 6px' }}>Ta présentation</h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px' }}>La dernière étape avant que ton profil soit en ligne !</p>

                  <Field label="Bio" hint="Présente-toi : ton programme, tes points forts, ton approche de l'enseignement. (30–500 caractères)" error={errors.bio}>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      maxLength={500}
                      rows={5}
                      placeholder="Bonjour ! Je suis étudiant en 3e année de... J'ai réussi MAT101 avec une note de A+ et j'adore expliquer les concepts complexes simplement..."
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                      onFocus={e => e.target.style.borderColor = '#00c9a7'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <div style={{ textAlign: 'right', fontSize: 12, color: bio.length > 450 ? '#e53e3e' : '#94a3b8', marginTop: 4 }}>{bio.length}/500</div>
                  </Field>

                  <Field label="Modes de rencontre" error={errors.modes}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { key: 'campus', label: '🏫 Sur campus', value: meetCampus, set: setMeetCampus },
                        { key: 'online', label: '💻 En ligne (Zoom, Teams...)', value: meetOnline, set: setMeetOnline },
                        { key: 'city',   label: '🏙️ En ville (café, bibliothèque...)', value: meetCity, set: setMeetCity },
                      ].map(m => (
                        <div key={m.key} onClick={() => m.set(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `2px solid ${m.value ? '#00c9a7' : '#e2e8f0'}`, background: m.value ? '#f0fdf9' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${m.value ? '#00c9a7' : '#cbd5e0'}`, background: m.value ? '#00c9a7' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {m.value && <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: m.value ? '#00c9a7' : '#4a5568' }}>{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </Field>

                  <Field label="Langues parlées">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {LANGUAGES.map(l => (
                        <Chip key={l} label={l} active={languages.includes(l)} onClick={() => setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])} />
                      ))}
                    </div>
                  </Field>

                  {errors.submit && (
                    <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#c53030', marginBottom: 16 }}>
                      {errors.submit}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: step === 0 ? 'flex-end' : 'space-between' }}>
                {step > 0 && (
                  <button onClick={prev} style={{ padding: '12px 24px', background: 'white', color: '#4a5568', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    ← Retour
                  </button>
                )}
                {step < 3 ? (
                  <button onClick={next} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Continuer →
                  </button>
                ) : (
                  <button onClick={submit} disabled={saving} style={{ padding: '12px 28px', background: saving ? '#e2e8f0' : 'linear-gradient(135deg,#00c9a7,#0099ff)', color: saving ? '#94a3b8' : 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                    {saving ? 'Publication...' : '🎓 Publier mon profil tuteur'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
