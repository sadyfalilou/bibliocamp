'use client'

import { useState } from 'react'
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
  const router = useRouter()

  // Messages d'erreur normaux côté utilisateur — pas des bugs à signaler
  const USER_ERRORS = [
    'invalid login credentials',
    'email not confirmed',
    'user already registered',
    'password should be at least',
    'invalid email',
  ]
  const isUserError = (msg) => USER_ERRORS.some(e => msg.toLowerCase().includes(e))

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (!isUserError(error.message)) {
        Sentry.captureException(error, { extra: { context: 'login', email } })
      }
      alert(error.message)
      return
    }
    router.push('/')
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    setLoading(false)
    if (error) {
      if (!isUserError(error.message)) {
        Sentry.captureException(error, { extra: { context: 'reset-password', email } })
      }
      alert(error.message)
      return
    }
    setResetDone(true)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      if (!isUserError(error.message)) {
        Sentry.captureException(error, { extra: { context: 'signup', email } })
      }
      alert(error.message)
      return
    }
    setSignupDone(true)
    setMode('login')
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
            <button onClick={() => setMode('login')} style={{
              flex: 1, padding: '16px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15,
              background: mode === 'login' ? 'white' : '#f7fafc',
              color: mode === 'login' ? '#00c9a7' : '#718096',
              borderBottom: mode === 'login' ? '2px solid #00c9a7' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.2s'
            }}>
              Connexion
            </button>
            <button onClick={() => setMode('signup')} style={{
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

        {signupDone && (
          <div style={{
            background: '#f0fdf9', border: '1px solid #00c9a7',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            fontSize: 14, color: '#00a88a', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            ✅ Compte créé ! Tu peux maintenant te connecter.
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
              onClick={() => { setMode('reset'); setResetDone(false) }}
              style={{ color: '#a0aec0', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Mot de passe oublié ?
            </span>
          </p>
        )}

        {mode === 'reset' && (
          <p style={{ textAlign: 'center', marginTop: 8, color: '#666', fontSize: 14 }}>
            <span onClick={() => setMode('login')} style={{ color: '#00c9a7', fontWeight: 700, cursor: 'pointer' }}>
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
