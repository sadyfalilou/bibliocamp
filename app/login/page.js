'use client'

import { useState, useEffect, Suspense } from 'react'
import * as Sentry from '@sentry/nextjs'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '../../components/Logo'

function LoginInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Si ?tab=signup dans l'URL, ouvrir directement le mode inscription
    if (searchParams.get('tab') === 'signup') setMode('signup')
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) router.push('/app')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const USER_ERRORS = ['invalid login credentials', 'email not confirmed', 'user already registered', 'password should be at least', 'invalid email']
  const isUserError = (msg) => USER_ERRORS.some(e => msg.toLowerCase().includes(e))

  const friendlyError = (msg) => {
    const m = msg.toLowerCase()
    if (m.includes('invalid login credentials')) return 'Adresse courriel ou mot de passe incorrect.'
    if (m.includes('email not confirmed')) return 'Confirme ton adresse courriel avant de te connecter.'
    if (m.includes('user already registered')) return 'Un compte existe déjà avec cette adresse courriel.'
    if (m.includes('password should be at least')) return 'Le mot de passe doit contenir au moins 8 caractères.'
    if (m.includes('invalid email')) return 'Adresse courriel invalide.'
    return msg
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setErrorMsg(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (!isUserError(error.message)) Sentry.captureException(error, { extra: { context: 'login', email } })
      setErrorMsg(friendlyError(error.message)); return
    }
    router.push('/app')
  }

  const handleReset = async (e) => {
    e.preventDefault(); setErrorMsg(''); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setLoading(false)
    if (error) {
      if (!isUserError(error.message)) Sentry.captureException(error, { extra: { context: 'reset-password', email } })
      setErrorMsg(friendlyError(error.message)); return
    }
    setResetDone(true)
  }

  const handleSignup = async (e) => {
    e.preventDefault(); setErrorMsg('')
    if (!firstName.trim() || !lastName.trim()) { setErrorMsg('Prénom et nom sont requis.'); return }
    if (password !== confirmPassword) { setErrorMsg('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8) { setErrorMsg('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setLoading(false)
      if (!isUserError(error.message)) Sentry.captureException(error, { extra: { context: 'signup', email } })
      setErrorMsg(friendlyError(error.message)); return
    }
    if (data?.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, first_name: firstName.trim(), last_name: lastName.trim() })
      // Enregistre le parrainage si un code ref est présent dans l'URL
      const refCode = searchParams.get('ref')
      if (refCode) {
        await fetch('/api/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: data.user.id, ref_code: refCode })
        })
      }
    }
    setLoading(false); setSignupDone(true); setMode('login')
  }

  const handleOAuth = async (provider) => {
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } })
    if (error) { Sentry.captureException(error, { extra: { context: `oauth-${provider}` } }); setErrorMsg(error.message) }
  }

  const inputStyle = (extra = {}) => ({
    width: '100%', padding: '13px 16px',
    border: '1.5px solid #e8edf2', borderRadius: 10,
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
    background: '#fafbfc', color: '#1a2e4a',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: "'Segoe UI', sans-serif",
    ...extra
  })

  const benefits = [
    { icon: '📚', text: 'Des centaines de manuels à petit prix' },
    { icon: '🎓', text: 'Réservé aux étudiants québécois' },
    { icon: '💬', text: 'Messagerie intégrée entre étudiants' },
    { icon: '🔒', text: 'Plateforme sécurisée et gratuite' },
  ]

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f4f8' }}>

      {/* LAYOUT PRINCIPAL */}
      <div style={{ flex: 1, display: 'flex', minHeight: '100vh' }}>

        {/* PANNEAU GAUCHE — caché sur mobile */}
        {!isMobile && (
          <div style={{
            width: '42%', minHeight: '100vh',
            background: 'linear-gradient(160deg, #0f1f35 0%, #1a2e4a 40%, #0d4f6b 100%)',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '60px 48px',
            position: 'sticky', top: 0, height: '100vh',
            overflow: 'hidden'
          }}>
            {/* Cercles décoratifs */}
            <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(0,201,167,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(0,201,167,0.06)', pointerEvents: 'none' }} />

            {/* Logo */}
            <div style={{ marginBottom: 48 }}>
              <Logo variant="light" size="lg" onClick={() => router.push('/')} style={{ cursor: 'pointer' }} />
            </div>

            {/* Tagline */}
            <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, lineHeight: 1.25, margin: '0 0 16px', letterSpacing: -0.5 }}>
              La marketplace des manuels étudiants du Québec
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, margin: '0 0 44px', lineHeight: 1.6 }}>
              Achète et vends tes manuels directement entre étudiants.
            </p>

            {/* Avantages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,201,167,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {b.icon}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 500 }}>{b.text}</span>
                </div>
              ))}
            </div>

            {/* Badge gratuit */}
            <div style={{ marginTop: 44, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,201,167,0.12)', border: '1px solid rgba(0,201,167,0.25)', borderRadius: 30, padding: '10px 20px', width: 'fit-content' }}>
              <span style={{ color: '#00c9a7', fontSize: 16 }}>✓</span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 }}>100% gratuit — aucune carte requise</span>
            </div>
          </div>
        )}

        {/* PANNEAU DROIT — formulaire */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: isMobile ? '32px 20px' : '40px 48px',
          overflowY: 'auto'
        }}>

          {/* Logo mobile seulement */}
          {isMobile && (
            <div style={{ marginBottom: 28 }}>
              <Logo variant="dark" size="md" onClick={() => router.push('/')} style={{ cursor: 'pointer' }} />
            </div>
          )}

          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* TABS */}
            {mode !== 'reset' && (
              <div style={{ display: 'flex', background: '#f0f4f8', borderRadius: 12, padding: 4, marginBottom: 32 }}>
                {['login', 'signup'].map(m => (
                  <button key={m} onClick={() => { setMode(m); setErrorMsg('') }} style={{
                    flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                    borderRadius: 9, fontWeight: 700, fontSize: 14,
                    background: mode === m ? 'white' : 'transparent',
                    color: mode === m ? '#1a2e4a' : '#94a3b8',
                    boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}>
                    {m === 'login' ? 'Connexion' : 'Créer un compte'}
                  </button>
                ))}
              </div>
            )}

            {/* TITRE */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: '0 0 6px', color: '#1a2e4a', fontSize: 24, fontWeight: 800, letterSpacing: -0.3 }}>
                {mode === 'reset' ? 'Mot de passe oublié ?' : mode === 'login' ? 'Bon retour 👋' : 'Créer ton compte'}
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                {mode === 'reset'
                  ? 'Entre ton courriel pour recevoir un lien de réinitialisation.'
                  : mode === 'login'
                  ? 'Connecte-toi pour accéder à la marketplace.'
                  : 'Rejoins des milliers d\'étudiants québécois.'}
              </p>
            </div>

            {/* BOUTON GOOGLE */}
            {mode !== 'reset' && (
              <div style={{ marginBottom: 24 }}>
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '13px',
                    background: 'white', border: '1.5px solid #e8edf2',
                    borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600,
                    color: '#1a2e4a', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285f4'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(66,133,244,0.18)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8edf2'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continuer avec Google
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#e8edf2' }} />
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>ou</span>
                  <div style={{ flex: 1, height: 1, background: '#e8edf2' }} />
                </div>
              </div>
            )}

            {/* ERREUR */}
            {errorMsg && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fca5a5',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                fontSize: 14, color: '#dc2626', fontWeight: 500,
                display: 'flex', alignItems: 'flex-start', gap: 8
              }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SUCCÈS INSCRIPTION */}
            {signupDone && (
              <div style={{ background: '#f0fdf9', border: '1px solid #6ee7b7', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#059669', fontWeight: 600 }}>
                ✅ Compte créé ! Connexion en cours...
              </div>
            )}

            {/* SUCCÈS RESET */}
            {resetDone && (
              <div style={{ background: '#f0fdf9', border: '1px solid #6ee7b7', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#059669', fontWeight: 600 }}>
                ✅ Lien envoyé à <strong>{email}</strong>. Vérifie ta boîte courriel.
              </div>
            )}

            {/* FORMULAIRE */}
            <form onSubmit={mode === 'login' ? handleLogin : mode === 'reset' ? handleReset : handleSignup}>

              {/* PRÉNOM + NOM */}
              {mode === 'signup' && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexDirection: isMobile ? 'column' : 'row' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: '#374151', fontSize: 13, letterSpacing: 0.1 }}>Prénom</label>
                    <input type="text" placeholder="Alexandre" value={firstName} onChange={e => setFirstName(e.target.value)} required
                      style={inputStyle()}
                      onFocus={e => { e.target.style.borderColor = '#00c9a7'; e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)'; e.target.style.background = 'white' }}
                      onBlur={e => { e.target.style.borderColor = '#e8edf2'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafbfc' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: '#374151', fontSize: 13, letterSpacing: 0.1 }}>Nom</label>
                    <input type="text" placeholder="Tremblay" value={lastName} onChange={e => setLastName(e.target.value)} required
                      style={inputStyle()}
                      onFocus={e => { e.target.style.borderColor = '#00c9a7'; e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)'; e.target.style.background = 'white' }}
                      onBlur={e => { e.target.style.borderColor = '#e8edf2'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafbfc' }}
                    />
                  </div>
                </div>
              )}

              {/* EMAIL */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: '#374151', fontSize: 13, letterSpacing: 0.1 }}>Adresse courriel</label>
                <input type="email" placeholder="alexandre@uqam.ca" value={email} onChange={e => setEmail(e.target.value)} required
                  style={inputStyle()}
                  onFocus={e => { e.target.style.borderColor = '#00c9a7'; e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)'; e.target.style.background = 'white' }}
                  onBlur={e => { e.target.style.borderColor = '#e8edf2'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafbfc' }}
                />
              </div>

              {/* MOT DE PASSE */}
              {mode !== 'reset' && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: '#374151', fontSize: 13, letterSpacing: 0.1 }}>Mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                      style={inputStyle({ paddingRight: 44 })}
                      onFocus={e => { e.target.style.borderColor = '#00c9a7'; e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)'; e.target.style.background = 'white' }}
                      onBlur={e => { e.target.style.borderColor = '#e8edf2'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafbfc' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, color: '#94a3b8', padding: 0, lineHeight: 1 }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {mode === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                      <span onClick={() => { setMode('reset'); setResetDone(false); setErrorMsg('') }}
                        style={{ fontSize: 13, color: '#00c9a7', cursor: 'pointer', fontWeight: 600 }}>
                        Mot de passe oublié ?
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* CONFIRMER MOT DE PASSE — signup seulement */}
              {mode === 'signup' && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', marginBottom: 7, fontWeight: 600, color: '#374151', fontSize: 13, letterSpacing: 0.1 }}>Confirmer le mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                      style={{
                        ...inputStyle({ paddingRight: 44 }),
                        borderColor: confirmPassword && confirmPassword !== password ? '#fca5a5' : confirmPassword && confirmPassword === password ? '#6ee7b7' : '#e8edf2'
                      }}
                      onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(0,201,167,0.1)'; e.target.style.background = 'white' }}
                      onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.background = '#fafbfc' }}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 17, color: '#94a3b8', padding: 0, lineHeight: 1 }}>
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                    {/* Indicateur match */}
                    {confirmPassword && (
                      <div style={{ position: 'absolute', right: 44, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>
                        {confirmPassword === password ? '✅' : '❌'}
                      </div>
                    )}
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
                      Les mots de passe ne correspondent pas.
                    </p>
                  )}
                </div>
              )}

              {/* BOUTON SUBMIT */}
              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #1a2e4a 0%, #0d4f6b 100%)',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(26,46,74,0.3)',
                  transition: 'all 0.2s', letterSpacing: 0.2
                }}
                onMouseEnter={e => { if (!loading) { e.target.style.background = 'linear-gradient(135deg, #00c9a7 0%, #00a88a 100%)'; e.target.style.boxShadow = '0 4px 14px rgba(0,201,167,0.35)' } }}
                onMouseLeave={e => { if (!loading) { e.target.style.background = 'linear-gradient(135deg, #1a2e4a 0%, #0d4f6b 100%)'; e.target.style.boxShadow = '0 4px 14px rgba(26,46,74,0.3)' } }}
              >
                {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : mode === 'reset' ? 'Envoyer le lien' : 'Créer mon compte'}
              </button>
            </form>

            {/* RETOUR RESET */}
            {mode === 'reset' && (
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
                <span onClick={() => { setMode('login'); setErrorMsg('') }} style={{ color: '#00c9a7', fontWeight: 700, cursor: 'pointer' }}>
                  ← Retour à la connexion
                </span>
              </p>
            )}

            {/* CGU */}
            {mode === 'signup' && (
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                En créant un compte, tu acceptes nos{' '}
                <a href="/cgu" style={{ color: '#00c9a7', textDecoration: 'none', fontWeight: 600 }}>conditions d'utilisation</a>
                {' '}et notre{' '}
                <a href="/confidentialite" style={{ color: '#00c9a7', textDecoration: 'none', fontWeight: 600 }}>politique de confidentialité</a>.
              </p>
            )}

            {/* BADGE GRATUIT MOBILE */}
            {isMobile && mode === 'signup' && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <span style={{ background: '#f0fdf9', color: '#059669', border: '1px solid #6ee7b7', borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '4px 12px' }}>
                  ✅ 100% gratuit — aucune carte requise
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  return <Suspense><LoginInner /></Suspense>
}
