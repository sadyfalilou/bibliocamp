'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Logo from '../../components/Logo'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase met le token dans le hash de l'URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { alert('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8) { alert('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { alert('Erreur : ' + error.message); return }
    alert('Mot de passe mis à jour ✅')
    router.push('/login')
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f0f4f8' }}>

      {/* HEADER */}
      <header style={{
        background: '#1a2e4a', height: 64,
        display: 'flex', alignItems: 'center', padding: '0 40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <Logo variant="light" size="sm" onClick={() => router.push('/')} style={{ cursor: 'pointer' }} />
      </header>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2e4a 0%, #0d4f6b 60%, #00c9a7 100%)',
        padding: '32px 20px 70px', textAlign: 'center', color: 'white'
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 8px' }}>
          Réinitialiser le mot de passe
        </h1>
        <p style={{ fontSize: 15, opacity: 0.85, margin: 0 }}>
          Entre ton nouveau mot de passe ci-dessous
        </p>
      </div>

      {/* FORM */}
      <div style={{
        maxWidth: 420, margin: '-30px auto 60px',
        background: 'white', borderRadius: 16, padding: '28px 24px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        position: 'relative', zIndex: 10,
        width: 'calc(100% - 32px)', boxSizing: 'border-box'
      }}>
        {!ready ? (
          <div style={{ textAlign: 'center', color: '#718096', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Vérification du lien en cours...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontWeight: 600, color: '#444', fontSize: 14, marginBottom: 6 }}>
              Nouveau mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 14px',
                border: '2px solid #e2e8f0', borderRadius: 10,
                fontSize: 15, marginBottom: 16, outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#00c9a7'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />

            <label style={{ display: 'block', fontWeight: 600, color: '#444', fontSize: 14, marginBottom: 6 }}>
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 14px',
                border: '2px solid #e2e8f0', borderRadius: 10,
                fontSize: 15, marginBottom: 24, outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#00c9a7'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px',
              background: loading ? '#ccc' : '#1a2e4a',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#00c9a7' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1a2e4a' }}
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          <span
            onClick={() => router.push('/login')}
            style={{ color: '#a0aec0', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Retour à la connexion
          </span>
        </p>
      </div>
    </div>
  )
}
