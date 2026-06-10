'use client'

import { useState, useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'reset'
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  // Si déjà connecté (ex: retour OAuth), rediriger vers l'accueil
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) router.push('/')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Messages d'erreur normaux côté utilisateur — pas des bugs à signaler
  const USER_ERRORS = [
    'invalid login credentials',
    'email not confirmed',
    'user already registered',
    'password should be at least',
    'invalid email',
  ]
  const isUserError = (msg) => USER_ERRORS.some(e => msg.toLowerCase().includes(e))

  const friendlyError = (msg) => {
    const m = msg.toLowerCase()
    if (m.includes('invalid login credentials')) return 'Adresse courriel ou mot de passe incorrect.'
    if (m.includes('email not confirmed')) return 'Confirme ton adresse courriel avant de te connecter. Vérifie ta boîte mail.'
    if (m.includes('user already registered')) return 'Un compte existe déjà avec cette adresse courriel.'
    if (m.includes('password should be at least')) return 'Le mot de passe doit contenir au moins 8 caractères.'
    if (m.includes('invalid email')) return 'Adresse courriel invalide.'
    return msg
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (!isUserError(error.message)) {
        Sentry.captureException(error, { extra: { context: 'login', email } })
      }
      setErrorMsg(friendlyError(error.message))
      return
    }
    router.push('/')
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    setLoading(false)
    if (error) {
      if (!isUserError(error.message)) {
        Sentry.captureException(error, { extra: { context: 'reset-password', email } })
      }
      setErrorMsg(friendlyError(error.message))
      return
    }
    setResetDone(true)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      if (!isUserError(error.message)) {
        Sentry.captureException(error, { extra: { context: 'signup', email } })
      }
      setErrorMsg(friendlyError(error.message))
      return
    }
    setSignupDone(true)
    setMode('login')
  }

  const handleOAuth = async (provider) => {
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      Sentry.captureException(error, { extra: { context: `oauth-${provider}` } })
      setErrorMsg(error.message)
    }
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f0f4f8' }}>

      {/* HEADER */}
      <header style={{
        background: '#1a2e4a',
        padding: '0 20px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          background: '#00c9a7', color: 'white', fontWeight: 900,
          fontSize: 16, padding: '6px 14px', borderRadius: 8, letterSpacing: 1
        }}>
          📚 BIBLIOCAMP
        </div>
      </header>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2e4a 0%, #0d4f6b 60%, #00c9a7 100%)',
        padding: '32px 20px 70px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px', letterSpacing: -0.5 }}>
          La marketplace des étudiants
        </h1>
        <p style={{ fontSize: 15, opacity: 0.85, margin: 0 }}>
          Achète et vends tes manuels entre étudiants
        </p>
      </div>

      {/* FORM SECTION */}
      <div style={{
        maxWidth: 440,
        margin: '-40px auto 60px',
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden',
        marginLeft: 'auto',
        marginRight: 'auto',
        width: 'calc(100% - 32px)'
      }}>

        {/* TABS connexion / inscription */}
        {mode !== 'reset' && (
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0' }}>
            <button onClick={() => { setMode('login'); setErrorMsg('') }} style={{
              flex: 1, padding: '16px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15,
              background: mode === 'login' ? 'white' : '#f7fafc',
              color: mode === 'login' ? '#00c9a7' : '#718096',
              borderBottom: mode === 'login' ? '2px solid #00c9a7' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.2s'
            }}>
              Connexion
            </button>
            <button onClick={() => { setMode('signup'); setErrorMsg('') }} style={{
              flex: 1, padding: '16px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15,
              background: mode === 'signup' ? 'white' : '#f7fafc',
              color: mode === 'signup' ? '#00c9a7' : '#718096',
              borderBottom: mode === 'signup' ? '2px solid #00c9a7' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.2s'
            }}>
              Créer un compte
            </button>
          </div>
        )}

        <div style={{ padding: '28px 24px' }}>
        <h2 style={{ margin: '0 0 20px', color: '#1a2e4a', fontSize: 20, fontWeight: 800 }}>
          {mode === 'reset' ? 'Réinitialiser le mot de passe' : mode === 'login' ? 'Bon retour 👋' : 'Rejoins BiblioCamp'}
        </h2>

        {/* BOUTONS OAUTH */}
        {mode !== 'reset' && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', padding: '12px',
                  background: 'white', border: '1.5px solid #e2e8f0',
                  borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600,
                  color: '#1a2e4a', transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285f4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(66,133,244,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continuer avec Google
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('azure')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', padding: '12px',
                  background: 'white', border: '1.5px solid #e2e8f0',
                  borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600,
                  color: '#1a2e4a', transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0078d4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,120,212,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M13 1h10v10H13z"/><path fill="#7fba00" d="M1 13h10v10H1z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>
                Continuer avec Microsoft
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 13, color: '#a0aec0', fontWeight: 500 }}>ou</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
          </div>
        )}

        {/* MESSAGE ERREUR INLINE */}
        {errorMsg && (
          <div style={{
            background: '#fff5f5', border: '1px solid #fc8181',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            fontSize: 14, color: '#c53030', fontWeight: 600,
            display: 'flex', alignItems: 'flex-start', gap: 8
          }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MESSAGE SUCCÈS INSCRIPTION */}
        {signupDone && (
          <div style={{
            background: '#f0fdf9', border: '1px solid #00c9a7',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            fontSize: 14, color: '#00a88a', fontWeight: 600,
          }}>
            ✅ Compte créé ! Connexion en cours...
          </div>
        )}

        {resetDone && (
          <div style={{
            background: '#f0fdf9', border: '1px solid #00c9a7',
            borderRadius: 10, padding: '14px 16px', marginBottom: 20,
            fontSize: 14, color: '#00a88a', fontWeight: 600
          }}>
            ✅ Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifie ta boîte courriel.
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : mode === 'reset' ? handleReset : handleSignup}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444', fontSize: 14 }}>
            Adresse courriel
          </label>
          <input
            type="email"
            placeholder="ton@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '2px solid #e2e8f0',
              borderRadius: 10,
              fontSize: 15,
              marginBottom: 16,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#00c9a7'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />

          {mode !== 'reset' && <>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#444', fontSize: 14 }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 14px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#00c9a7'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 18, color: '#a0aec0',
                  padding: 0, lineHeight: 1
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : '#1a2e4a',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#00c9a7' }}
            onMouseLeave={e => { if (!loading) e.target.style.background = '#1a2e4a' }}
          >
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : mode === 'reset' ? 'Envoyer le lien' : 'Créer mon compte'}
          </button>
        </form>

        {mode === 'login' && (
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
            <span
              onClick={() => { setMode('reset'); setResetDone(false); setErrorMsg('') }}
              style={{ color: '#a0aec0', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Mot de passe oublié ?
            </span>
          </p>
        )}

        {mode === 'reset' && (
          <p style={{ textAlign: 'center', marginTop: 8, color: '#666', fontSize: 14 }}>
            <span onClick={() => { setMode('login'); setErrorMsg('') }} style={{ color: '#00c9a7', fontWeight: 700, cursor: 'pointer' }}>
              ← Retour à la connexion
            </span>
          </p>
        )}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        color: '#999',
        fontSize: 13,
        borderTop: '1px solid #e2e8f0'
      }}>
        © 2026 BiblioCamp — Fait pour les étudiants, par des étudiants
      </footer>
    </div>
  )
}
