'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import Logo from '../../../components/Logo'

const STORAGE_KEY = 'bibliocamp_international_diagnostic_draft'
const TOTAL_STEPS = 7

const NIVEAUX = ['Formation professionnelle', 'DEC', 'Certificat', 'Baccalauréat', 'Diplôme d\'études supérieures', 'Maîtrise', 'Doctorat', 'Autre']

const NEEDS = [
  {
    key: 'selection_programmes',
    label: 'Sélection de programmes',
    prix: '99 $',
    desc: 'Diagnostic + 3 programmes potentiels comparés, conditions d\'admission, dates importantes.',
  },
  {
    key: 'accompagnement_admission',
    label: 'Accompagnement admission essentiel',
    prix: '149 $',
    desc: 'Checklist personnalisée, organisation des documents, révision du CV et de la lettre, une rencontre vidéo.',
  },
  {
    key: 'preparation_arrivee',
    label: 'Préparation à l\'arrivée',
    prix: '99 $',
    desc: 'Checklist avant le départ, budget d\'installation, logement, téléphone, séance d\'orientation.',
  },
  {
    key: 'service_complet',
    label: 'Service complet',
    prix: '449 $',
    desc: 'Admission, conseils personnalisés, accueil à l\'aéroport, recherche de logement, installation complète au Québec.',
  },
]

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '', country: '', preferred_language: 'Français', timezone: '',
  last_diploma: '', current_level: '', diploma_country: '', field_of_study: '', academic_description: '',
  target_level: '', target_field: '', target_cities: '', target_session: '',
  french_level: '', english_level: '',
  annual_budget: '', budget_currency: 'CAD',
  needs: [],
  consent_data_processing: false, consent_terms: false, consent_marketing: false,
}

function fieldStyle(extra = {}) {
  return {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid #e8edf2', borderRadius: 10,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    background: '#fafbfc', color: '#1a2e4a',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: "'Segoe UI', sans-serif",
    ...extra
  }
}

const onFieldFocus = e => { e.target.style.borderColor = '#00c9a7'; e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)'; e.target.style.background = 'white' }
const onFieldBlur = e => { e.target.style.borderColor = '#e8edf2'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafbfc' }

function TextInput(props) {
  return <input {...props} onFocus={onFieldFocus} onBlur={onFieldBlur} style={fieldStyle(props.style)} />
}

function Select({ children, ...props }) {
  return <select {...props} onFocus={onFieldFocus} onBlur={onFieldBlur} style={fieldStyle({ cursor: 'pointer', ...props.style })}>{children}</select>
}

function TextArea(props) {
  return <textarea {...props} onFocus={onFieldFocus} onBlur={onFieldBlur} style={fieldStyle({ resize: 'vertical', ...props.style })} />
}

export default function DiagnosticPage() {
  return (
    <Suspense fallback={null}>
      <DiagnosticForm />
    </Suspense>
  )
}

function DiagnosticForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [step, setStep] = useState(1)
  const [openInfo, setOpenInfo] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        router.push(`/login?redirect=/international/diagnostic${editId ? `?edit=${editId}` : ''}`)
        return
      }
      setUser(data.user)

      if (editId) {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`/api/international-diagnostics/${editId}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        })
        const json = await res.json()
        if (res.ok && json.diagnostic) {
          const d = json.diagnostic
          setForm(prev => {
            const merged = { ...prev, ...d }
            Object.keys(emptyForm).forEach(key => {
              if (merged[key] == null) merged[key] = emptyForm[key]
            })
            return {
              ...merged,
              target_cities: (d.target_cities || []).join(', '),
              annual_budget: d.annual_budget != null ? String(d.annual_budget) : '',
              needs: d.needs || [],
            }
          })
        } else {
          setSubmitError(json.error || 'Impossible de charger cette demande.')
        }
        setCheckingAuth(false)
        return
      }

      setCheckingAuth(false)
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      const draft = localStorage.getItem(STORAGE_KEY)
      let restored = false
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          // N'applique le brouillon que s'il appartient à l'utilisateur courant :
          // sur un poste partagé, le brouillon d'un autre compte est ignoré et purgé
          // (sinon ses PII — nom, email, budget… — seraient pré-remplies pour l'autre).
          if (parsed.__uid === data.user.id) {
            setForm(prev => ({ ...prev, ...parsed, timezone: parsed.timezone || detectedTimezone }))
            if (parsed.__step) setStep(parsed.__step)
            restored = true
          } else {
            localStorage.removeItem(STORAGE_KEY)
          }
        } catch { localStorage.removeItem(STORAGE_KEY) }
      }
      if (!restored) {
        setForm(prev => ({ ...prev, email: data.user.email || '', timezone: detectedTimezone }))
      }
    })
  }, [router, editId])

  useEffect(() => {
    if (checkingAuth || editId || !user) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form, __step: step, __uid: user.id }))
  }, [form, step, checkingAuth, editId, user])

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const toggleNeed = (key) => {
    setForm(prev => ({
      ...prev,
      needs: prev.needs.includes(key) ? prev.needs.filter(n => n !== key) : [...prev.needs, key]
    }))
  }

  const validateStep = () => {
    const e = {}
    if (step === 1) {
      if (!form.first_name.trim()) e.first_name = 'Requis'
      if (!form.last_name.trim()) e.last_name = 'Requis'
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Courriel invalide'
      if (!form.country.trim()) e.country = 'Requis'
      if (!form.preferred_language) e.preferred_language = 'Requis'
    }
    if (step === 3) {
      if (!form.target_level) e.target_level = 'Requis'
    }
    if (step === 7) {
      if (!form.consent_data_processing) e.consent_data_processing = 'Requis'
      if (!form.consent_terms) e.consent_terms = 'Requis'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validateStep()) return
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }
  const prev = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    if (!validateStep()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(editId ? `/api/international-diagnostics/${editId}` : '/api/international-diagnostics', {
        method: editId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...form,
          target_cities: form.target_cities.split(',').map(c => c.trim()).filter(Boolean),
          annual_budget: form.annual_budget ? Number(form.annual_budget) : null,
        })
      })
      const json = await res.json()
      if (!res.ok) {
        setSubmitError(json.error || 'Une erreur est survenue. Réessaie.')
        setSubmitting(false)
        return
      }
      localStorage.removeItem(STORAGE_KEY)
      router.push(`/international/resultat/${editId || json.id}`)
    } catch {
      setSubmitError('Erreur réseau. Réessaie.')
      setSubmitting(false)
    }
  }

  if (checkingAuth) return null

  const progress = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: '#f8fafc', minHeight: '100vh', padding: '32px 16px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/app" style={{ textDecoration: 'none' }}>
            <Logo variant="dark" />
          </Link>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '30px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Étape {step} sur {TOTAL_STEPS}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>💾 Sauvegardé automatiquement</span>
          </div>
          <div style={{ height: 6, background: '#eef2f6', borderRadius: 6, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#00c9a7', borderRadius: 6, transition: 'width 0.2s' }} />
          </div>

          {step === 1 && (
            <Step title="Informations personnelles" subtitle="Pour qu'on sache à qui on s'adresse.">
              <Row>
                <Field label="Prénom *" error={errors.first_name}>
                  <TextInput value={form.first_name} onChange={e => set('first_name', e.target.value)} />
                </Field>
                <Field label="Nom *" error={errors.last_name}>
                  <TextInput value={form.last_name} onChange={e => set('last_name', e.target.value)} />
                </Field>
              </Row>
              <Field label="Courriel *" error={errors.email}>
                <TextInput type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </Field>
              <Row>
                <Field label="Téléphone (facultatif)">
                  <TextInput value={form.phone} onChange={e => set('phone', e.target.value)} />
                </Field>
                <Field label="Pays de résidence *" error={errors.country}>
                  <TextInput value={form.country} onChange={e => set('country', e.target.value)} />
                </Field>
              </Row>
              <Field label="Langue préférée *" error={errors.preferred_language}>
                <Select value={form.preferred_language} onChange={e => set('preferred_language', e.target.value)}>
                  <option value="Français">Français</option>
                  <option value="English">English</option>
                </Select>
              </Field>
            </Step>
          )}

          {step === 2 && (
            <Step title="Parcours scolaire" subtitle="Ton dernier diplôme et où tu en es.">
              <Row>
                <Field label="Dernier diplôme obtenu">
                  <TextInput value={form.last_diploma} onChange={e => set('last_diploma', e.target.value)} />
                </Field>
                <Field label="Niveau scolaire actuel">
                  <TextInput value={form.current_level} onChange={e => set('current_level', e.target.value)} />
                </Field>
              </Row>
              <Row>
                <Field label="Pays d'obtention">
                  <TextInput value={form.diploma_country} onChange={e => set('diploma_country', e.target.value)} />
                </Field>
                <Field label="Domaine d'études">
                  <TextInput value={form.field_of_study} onChange={e => set('field_of_study', e.target.value)} />
                </Field>
              </Row>
              <Field label="Décris ton parcours en quelques mots">
                <TextArea rows={3} value={form.academic_description} onChange={e => set('academic_description', e.target.value)} />
              </Field>
            </Step>
          )}

          {step === 3 && (
            <Step title="Projet d'études" subtitle="Ce que tu souhaites étudier au Québec.">
              <Field label="Niveau recherché *" error={errors.target_level}>
                <Select value={form.target_level} onChange={e => set('target_level', e.target.value)}>
                  <option value="">Choisir…</option>
                  {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Field>
              <Field label="Domaine souhaité">
                <TextInput value={form.target_field} onChange={e => set('target_field', e.target.value)} />
              </Field>
              <Field label="Villes souhaitées (séparées par des virgules)">
                <TextInput placeholder="Montréal, Québec, Sherbrooke…" value={form.target_cities} onChange={e => set('target_cities', e.target.value)} />
              </Field>
              <Field label="Session de rentrée souhaitée">
                <TextInput placeholder="ex. Automne 2027" value={form.target_session} onChange={e => set('target_session', e.target.value)} />
              </Field>
            </Step>
          )}

          {step === 4 && (
            <Step title="Langues" subtitle="Ton niveau en français et en anglais.">
              <Row>
                <Field label="Niveau de français">
                  <Select value={form.french_level} onChange={e => set('french_level', e.target.value)}>
                    <option value="">Choisir…</option>
                    <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option><option>Langue maternelle</option>
                  </Select>
                </Field>
                <Field label="Niveau d'anglais">
                  <Select value={form.english_level} onChange={e => set('english_level', e.target.value)}>
                    <option value="">Choisir…</option>
                    <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option><option>Langue maternelle</option>
                  </Select>
                </Field>
              </Row>
            </Step>
          )}

          {step === 5 && (
            <Step title="Budget" subtitle="Ça nous aide à proposer des options réalistes.">
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.5 }}>Cette estimation ne constitue jamais une garantie financière.</p>
              <Row>
                <Field label="Budget annuel disponible">
                  <TextInput type="number" min="0" value={form.annual_budget} onChange={e => set('annual_budget', e.target.value)} />
                </Field>
                <Field label="Devise">
                  <Select value={form.budget_currency} onChange={e => set('budget_currency', e.target.value)}>
                    <option value="CAD">CAD</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="XOF">XOF</option><option value="MAD">MAD</option>
                  </Select>
                </Field>
              </Row>
            </Step>
          )}

          {step === 6 && (
            <Step title="Besoins d'accompagnement" subtitle="Coche ce qui t'intéresse — rien n'est facturé à cette étape. Touche le « i » pour voir le détail de chaque service.">
              <div style={{ display: 'grid', gap: 0 }}>
                {NEEDS.map((n, i) => (
                  <div key={n.key} style={{ padding: '10px 0', borderBottom: i < NEEDS.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.needs.includes(n.key)} onChange={() => toggleNeed(n.key)} style={{ width: 16, height: 16, flexShrink: 0, accentColor: '#00c9a7' }} />
                      <span style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span><b>{n.label}</b> — {n.prix}</span>
                        <span
                          onClick={e => { e.preventDefault(); setOpenInfo(o => o === n.key ? null : n.key) }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16,
                            borderRadius: '50%', border: '1px solid #94a3b8', color: '#94a3b8', fontSize: 10,
                            fontStyle: 'italic', fontWeight: 700, cursor: 'pointer', flexShrink: 0
                          }}
                        >i</span>
                      </span>
                    </label>
                    {openInfo === n.key && (
                      <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 0 24px', lineHeight: 1.5, background: '#f8fafc', borderRadius: 6, padding: '8px 10px' }}>
                        {n.desc}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Step>
          )}

          {step === 7 && (
            <Step title="Consentement" subtitle="Dernière étape avant d'envoyer ton diagnostic.">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151', marginBottom: 14, lineHeight: 1.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.consent_data_processing} onChange={e => set('consent_data_processing', e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: '#00c9a7' }} />
                <span>Je consens au traitement des renseignements fournis dans ce formulaire, conformément à la <a href="/confidentialite" target="_blank" style={{ color: '#1a2e4a' }}>politique de confidentialité</a>.</span>
              </label>
              {errors.consent_data_processing && <ErrorText text={errors.consent_data_processing} />}

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151', marginBottom: 14, lineHeight: 1.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.consent_terms} onChange={e => set('consent_terms', e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: '#00c9a7' }} />
                <span>J'accepte les <a href="/cgu" target="_blank" style={{ color: '#1a2e4a' }}>conditions d'utilisation</a>, je confirme que les informations fournies sont exactes, et je comprends que BiblioCamp ne garantit aucune admission et ne fournit pas de conseils juridiques ou de conseils réglementés en immigration.</span>
              </label>
              {errors.consent_terms && <ErrorText text={errors.consent_terms} />}

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151', marginBottom: 4, lineHeight: 1.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.consent_marketing} onChange={e => set('consent_marketing', e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: '#00c9a7' }} />
                <span>Je veux recevoir des courriels au sujet de mon dossier et des nouveautés BiblioCamp (facultatif).</span>
              </label>

              {submitError && <p style={{ color: '#b91c1c', fontSize: 13, marginTop: 16 }}>{submitError}</p>}
            </Step>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 18, marginTop: 24 }}>
            <button onClick={prev} disabled={step === 1} style={{ background: 'transparent', color: step === 1 ? '#cbd5e1' : '#1a2e4a', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: step === 1 ? 'default' : 'pointer' }}>
              ← Précédent
            </button>
            <button onClick={() => router.push('/app')} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
              Reprendre plus tard
            </button>
            {step < TOTAL_STEPS ? (
              <button onClick={next} style={{ background: '#1a2e4a', color: 'white', border: 'none', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Suivant →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} style={{ background: submitting ? '#94a3b8' : '#00c9a7', color: '#073e35', border: 'none', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: submitting ? 'default' : 'pointer' }}>
                {submitting ? 'Envoi…' : 'Envoyer mon diagnostic'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Step({ title, subtitle, children }) {
  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a2e4a', margin: '0 0 4px' }}>{title}</h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 22px' }}>{subtitle}</p>
      {children}
    </div>
  )
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>{children}</div>
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
      {error && <ErrorText text={error} />}
    </div>
  )
}

function ErrorText({ text }) {
  return <p style={{ color: '#b91c1c', fontSize: 11, margin: '4px 0 0' }}>{text}</p>
}
