'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

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

function Chip({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s',
      border: `2px solid ${active ? '#00c9a7' : '#e2e8f0'}`,
      background: active ? '#f0fdf9' : 'white',
      color: active ? '#00c9a7' : '#64748b',
    }}>
      {active && <span style={{ marginRight: 4 }}>✓</span>}{label}
    </div>
  )
}

function Field({ label, hint, children, error }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a2e4a', marginBottom: 6 }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>{hint}</p>}
      {children}
      {error && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '24px', marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a2e4a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>{title}</h3>
      {children}
    </div>
  )
}

export default function ModifierTuteurPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [profile, setProfile] = useState(null)
  const [tutorId, setTutorId] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Champs
  const [domains, setDomains]         = useState([])
  const [subjects, setSubjects]       = useState([])
  const [subjectInput, setSubjectInput] = useState('')
  const [rate, setRate]               = useState(25)
  const [meetCampus, setMeetCampus]   = useState(true)
  const [meetOnline, setMeetOnline]   = useState(false)
  const [meetCity, setMeetCity]       = useState(false)
  const [availabilities, setAvailabilities] = useState({})
  const [bio, setBio]                 = useState('')
  const [languages, setLanguages]     = useState(['Français'])
  const [isActive, setIsActive]       = useState(true)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { data: tutor, error } = await supabase.from('tutors').select('*').eq('user_id', user.id).single()
      if (error || !tutor) { router.push('/tuteurs/devenir-tuteur'); return }

      setTutorId(tutor.id)
      setDomains(tutor.domains || [])
      setSubjects(tutor.subjects || [])
      setRate(tutor.rate_per_hour || 25)
      setMeetCampus(tutor.meet_campus ?? true)
      setMeetOnline(tutor.meet_online ?? false)
      setMeetCity(tutor.meet_city ?? false)
      setAvailabilities(tutor.availabilities || {})
      setBio(tutor.bio || '')
      setLanguages(tutor.languages || ['Français'])
      setIsActive(tutor.is_active ?? true)
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
    if (domains.length === 0) e.domains = 'Choisis au moins un domaine.'
    if (subjects.length === 0) e.subjects = 'Ajoute au moins une matière.'
    if (!bio.trim() || bio.trim().length < 30) e.bio = 'Ta présentation doit faire au moins 30 caractères.'
    if (!meetCampus && !meetOnline && !meetCity) e.modes = 'Choisis au moins un mode de rencontre.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase.from('tutors').update({
        domains,
        subjects,
        rate_per_hour: rate,
        meet_campus: meetCampus,
        meet_online: meetOnline,
        meet_city: meetCity,
        availabilities,
        bio: bio.trim(),
        languages,
        is_active: isActive,
      }).eq('id', tutorId)
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setErrors({ submit: 'Erreur lors de la sauvegarde. Réessaie.' })
    } finally {
      setSaving(false)
    }
  }

  const deleteProfil = async () => {
    setDeleting(true)
    try {
      await supabase.from('tutor_reviews').delete().eq('tutor_id', tutorId)
      await supabase.from('tutors').delete().eq('id', tutorId)
      router.push('/tuteurs')
    } catch {
      setErrors({ submit: 'Erreur lors de la suppression.' })
      setDeleting(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1a2e4a',
    outline: 'none', boxSizing: 'border-box', background: 'white',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#64748b' }}>
      Chargement...
    </div>
  )

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa', colorScheme: 'light' }}>

      {/* Navbar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 12 }}>
          <button onClick={() => router.push('/tuteurs')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', padding: 4 }}>← Tuteurs</button>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#1a2e4a', textAlign: 'center' }}>Mon profil tuteur</span>
          <button
            onClick={save} disabled={saving}
            style={{ padding: '8px 18px', background: saved ? '#00c9a7' : saving ? '#e2e8f0' : '#1a2e4a', color: saved || saving ? (saved ? 'white' : '#94a3b8') : 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', transition: 'all 0.2s' }}
          >
            {saved ? '✓ Sauvegardé' : saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>

        {/* Aperçu profil */}
        <div style={{ background: 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', borderRadius: 14, padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }} />
            : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'white', fontWeight: 700, border: '2px solid rgba(255,255,255,0.3)' }}>
                {(profile?.first_name?.[0] || '?').toUpperCase()}
              </div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{profile?.first_name} {profile?.last_name}</div>
            <div style={{ fontSize: 12, color: '#a0c4d8' }}>{profile?.institution || profile?.campus || '—'}</div>
          </div>
          <button onClick={() => router.push(`/tuteurs/${tutorId}`)} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Voir mon profil →
          </button>
        </div>

        {/* Statut actif/inactif */}
        <div style={{ background: 'white', borderRadius: 14, border: `2px solid ${isActive ? '#a7f3d0' : '#e2e8f0'}`, padding: '16px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2e4a' }}>Profil {isActive ? 'visible' : 'masqué'}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{isActive ? 'Les étudiants peuvent te trouver et te contacter.' : 'Ton profil est masqué du marketplace tuteurs.'}</div>
          </div>
          <div
            onClick={() => setIsActive(v => !v)}
            style={{ width: 48, height: 26, borderRadius: 13, background: isActive ? '#00c9a7' : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
          >
            <div style={{ position: 'absolute', top: 3, left: isActive ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
          </div>
        </div>

        {errors.submit && (
          <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#c53030', marginBottom: 16 }}>{errors.submit}</div>
        )}

        {/* ── Domaines ── */}
        <Section title="🎯 Domaines d'enseignement">
          <Field error={errors.domains}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DOMAINS.map(d => (
                <Chip key={d} label={d} active={domains.includes(d)} onClick={() => setDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])} />
              ))}
            </div>
          </Field>
        </Section>

        {/* ── Matières ── */}
        <Section title="📚 Matières et codes de cours">
          <Field hint="Ex: MAT101, Calcul, Droit civil — appuie Entrée pour ajouter." error={errors.subjects}>
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
              <button onClick={addSubject} style={{ padding: '11px 18px', background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>+ Ajouter</button>
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
        </Section>

        {/* ── Tarif ── */}
        <Section title="💰 Tarif horaire">
          <Field>
            <input
              type="range" min="10" max="150" step="5"
              value={rate} onChange={e => setRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#00c9a7', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              <span>10 $</span>
              <span style={{ fontWeight: 900, color: '#00c9a7', fontSize: 20 }}>{rate} $/h</span>
              <span>150 $</span>
            </div>
          </Field>
        </Section>

        {/* ── Modes ── */}
        <Section title="📍 Modes de rencontre">
          <Field error={errors.modes}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '🏫 Sur campus', value: meetCampus, set: setMeetCampus },
                { label: '💻 En ligne (Zoom, Teams...)', value: meetOnline, set: setMeetOnline },
                { label: '🏙️ En ville (café, bibliothèque...)', value: meetCity, set: setMeetCity },
              ].map((m, i) => (
                <div key={i} onClick={() => m.set(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `2px solid ${m.value ? '#00c9a7' : '#e2e8f0'}`, background: m.value ? '#f0fdf9' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${m.value ? '#00c9a7' : '#cbd5e0'}`, background: m.value ? '#00c9a7' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {m.value && <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: m.value ? '#00c9a7' : '#4a5568' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </Field>
        </Section>

        {/* ── Disponibilités ── */}
        <Section title="📅 Disponibilités">
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 360 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
                <div />
                {SLOTS.map(s => (
                  <div key={s} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'capitalize' }}>{s}</div>
                ))}
              </div>
              {DAYS.map(({ key, label }) => (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 1fr', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a' }}>{label}</span>
                  {SLOTS.map(slot => {
                    const active = (availabilities[key] || []).includes(slot)
                    return (
                      <div key={slot} onClick={() => toggleSlot(key, slot)} style={{ height: 36, borderRadius: 8, cursor: 'pointer', border: `2px solid ${active ? '#00c9a7' : '#e2e8f0'}`, background: active ? '#f0fdf9' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#00c9a7', fontWeight: 700, transition: 'all 0.15s' }}>
                        {active ? '✓' : ''}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Bio ── */}
        <Section title="✍️ Présentation">
          <Field error={errors.bio}>
            <textarea
              value={bio} onChange={e => setBio(e.target.value)}
              maxLength={500} rows={5}
              placeholder="Présente-toi : ton programme, tes points forts, ton approche..."
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = '#00c9a7'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <div style={{ textAlign: 'right', fontSize: 12, color: bio.length > 450 ? '#e53e3e' : '#94a3b8', marginTop: 4 }}>{bio.length}/500</div>
          </Field>
        </Section>

        {/* ── Langues ── */}
        <Section title="🌐 Langues parlées">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {LANGUAGES.map(l => (
              <Chip key={l} label={l} active={languages.includes(l)} onClick={() => setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])} />
            ))}
          </div>
        </Section>

        {/* Bouton sauvegarder */}
        <button
          onClick={save} disabled={saving}
          style={{ width: '100%', padding: '14px', background: saved ? '#00c9a7' : saving ? '#e2e8f0' : 'linear-gradient(135deg,#1a2e4a,#2d4a6b)', color: saving ? '#94a3b8' : 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer', marginBottom: 16, transition: 'all 0.2s' }}
        >
          {saved ? '✓ Profil sauvegardé !' : saving ? 'Sauvegarde en cours...' : 'Sauvegarder les modifications'}
        </button>

        {/* ── Zone de danger ── */}
        <div style={{ background: 'white', borderRadius: 14, border: '2px solid #fed7d7', padding: '20px 24px', marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#c53030', margin: '0 0 8px' }}>Zone de danger</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
            Supprimer ton profil tuteur supprimera aussi tous tes avis. Cette action est irréversible.
          </p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '10px 20px', background: 'white', color: '#e53e3e', border: '1.5px solid #e53e3e', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Supprimer mon profil tuteur
            </button>
          ) : (
            <div style={{ background: '#fff5f5', borderRadius: 10, padding: '14px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#c53030', margin: '0 0 12px' }}>Es-tu sûr ? Cette action est irréversible.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={deleteProfil} disabled={deleting} style={{ padding: '10px 20px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: deleting ? 'default' : 'pointer' }}>
                  {deleting ? 'Suppression...' : 'Oui, supprimer'}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '10px 20px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
