'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor(diff / 60000)
  if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`
  if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`
  if (minutes > 0) return `il y a ${minutes} min`
  return "à l'instant"
}

const COUNTRIES = [
  { code: 'CA', label: '🇨🇦 Canada', dial: '+1' },
  { code: 'US', label: '🇺🇸 États-Unis', dial: '+1' },
  { code: 'FR', label: '🇫🇷 France', dial: '+33' },
  { code: 'BE', label: '🇧🇪 Belgique', dial: '+32' },
  { code: 'CH', label: '🇨🇭 Suisse', dial: '+41' },
  { code: 'DZ', label: '🇩🇿 Algérie', dial: '+213' },
  { code: 'MA', label: '🇲🇦 Maroc', dial: '+212' },
  { code: 'TN', label: '🇹🇳 Tunisie', dial: '+216' },
  { code: 'SN', label: '🇸🇳 Sénégal', dial: '+221' },
  { code: 'CI', label: "🇨🇮 Côte d'Ivoire", dial: '+225' },
  { code: 'CM', label: '🇨🇲 Cameroun', dial: '+237' },
  { code: 'CD', label: '🇨🇩 Congo', dial: '+243' },
  { code: 'GB', label: '🇬🇧 Royaume-Uni', dial: '+44' },
  { code: 'DE', label: '🇩🇪 Allemagne', dial: '+49' },
  { code: 'ES', label: '🇪🇸 Espagne', dial: '+34' },
  { code: 'IT', label: '🇮🇹 Italie', dial: '+39' },
  { code: 'BR', label: '🇧🇷 Brésil', dial: '+55' },
  { code: 'MX', label: '🇲🇽 Mexique', dial: '+52' },
]

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

export default function Home() {
  const [listings, setListings] = useState([])
  const [search, setSearch] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('acheter') // 'acheter' | 'vendre' | 'mes-annonces'
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('CA')
  const [phoneError, setPhoneError] = useState('')
  const [phoneSaved, setPhoneSaved] = useState(false)
  const [phoneStep, setPhoneStep] = useState('enter') // 'enter' | 'verify'
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const router = useRouter()

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setListings(data)
  }

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!data.user) { window.location.href = '/login'; return }
        setUser(data.user)
        const savedPhone = data.user?.user_metadata?.phone_verified
        if (savedPhone) setPhoneSaved(true)
      } catch (e) {
        window.location.href = '/login'
        return
      }
      setLoading(false)
      fetchListings()
    }
    init()
    const { data: listener } = supabase.auth.onAuthStateChange(() => fetchListings())
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce manuel ?')) return
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (error) alert('Erreur suppression')
    else fetchListings()
  }

  const handleLogout = () => {
    supabase.auth.signOut()
    window.location.replace('/login')
  }

  const handleSendCode = async () => {
    setPhoneError('')
    const digits = phone.replace(/\D/g, '')
    if (!isValidPhone(phone)) {
      setPhoneError('Numéro invalide. Entre un numéro valide sans indicatif.')
      return
    }
    const dialCode = COUNTRIES.find(c => c.code === countryCode)?.dial || '+1'
    const formatted = `${dialCode}${digits}`
    setSendingCode(true)
    let done = false

    const advance = (error) => {
      if (done) return
      done = true
      setSendingCode(false)
      if (error) setPhoneError('Erreur : ' + error.message)
      else setPhoneStep('verify')
    }

    // Backup : si Supabase ne répond pas en 10s, avance quand même
    const backup = setTimeout(() => advance(null), 10000)

    supabase.auth.updateUser({ phone: formatted })
      .then(({ error }) => { clearTimeout(backup); advance(error) })
      .catch(() => { clearTimeout(backup); advance(null) })
  }

  const handleVerifyOtp = async () => {
    setOtpError('')
    if (otp.length < 4) { setOtpError('Entre le code reçu par SMS.'); return }
    setVerifyingCode(true)
    const digits = phone.replace(/\D/g, '')
    const dialCode = COUNTRIES.find(c => c.code === countryCode)?.dial || '+1'
    const formatted = `${dialCode}${digits}`
    try {
      const result = await Promise.race([
        supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'phone_change' }),
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 6000))
      ])
      if (result?.error) {
        setOtpError('Code incorrect ou expiré. Réessaie.')
        return
      }
      await Promise.race([
        supabase.auth.updateUser({ data: { phone_verified: true } }),
        new Promise(resolve => setTimeout(resolve, 3000))
      ])
      setPhoneSaved(true)
      router.push('/create')
    } catch (e) {
      setOtpError('Erreur inattendue. Réessaie.')
    } finally {
      setVerifyingCode(false)
    }
  }

  const filtered = listings?.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.course_code?.toLowerCase().includes(search.toLowerCase())
  )

  const myListings = listings?.filter(item => item.user_id === user?.id)

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: "'Segoe UI', sans-serif",
      background: '#f0f4f8', color: '#1a2e4a', fontSize: 18, fontWeight: 600
    }}>
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
        <div style={{
          background: '#00c9a7', color: 'white', fontWeight: 900,
          fontSize: 16, padding: '5px 14px', borderRadius: 8, letterSpacing: 1
        }}>
          📚 BIBLIOCAMP
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#a0aec0', fontSize: 13 }}>{user?.email}</span>
          <div style={{
            width: 34, height: 34, background: '#00c9a7', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 14
          }}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <button onClick={handleLogout} style={{
            background: 'transparent', color: '#a0aec0',
            border: '1px solid #2d4a6b', padding: '6px 14px',
            borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#00c9a7' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#a0aec0'; e.currentTarget.style.borderColor = '#2d4a6b' }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>

        {/* SIDEBAR */}
        <aside style={{
          width: 210, background: 'white',
          borderRight: '1px solid #e2e8f0',
          padding: '20px 0', flexShrink: 0
        }}>
          {/* Manuels — parent toujours ouvert */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 22px',
            background: '#f0fdf9',
            borderLeft: '3px solid #00c9a7',
            color: '#00c9a7', fontWeight: 800, fontSize: 15
          }}>
            <span>📖</span><span>Manuels</span>
          </div>

          {/* Sous-menus */}
          {[
            { key: 'acheter', icon: '🛒', label: 'Acheter' },
            { key: 'vendre', icon: '🏷️', label: 'Vendre' },
            { key: 'mes-annonces', icon: '📋', label: 'Mes annonces' },
          ].map(item => (
            <div key={item.key}
              onClick={() => setView(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 22px 10px 36px',
                borderLeft: view === item.key ? '3px solid #00c9a7' : '3px solid transparent',
                background: view === item.key ? '#f0fdf9' : 'transparent',
                color: view === item.key ? '#00c9a7' : '#4a5568',
                fontWeight: view === item.key ? 700 : 500,
                fontSize: 14, cursor: 'pointer', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { if (view !== item.key) e.currentTarget.style.background = '#f7fafc' }}
              onMouseLeave={e => { if (view !== item.key) e.currentTarget.style.background = 'transparent' }}
            >
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}

          <div style={{ height: 1, background: '#e2e8f0', margin: '16px 0' }} />

          <div style={{ padding: '0 14px' }}>
            <button onClick={() => setView('vendre')} style={{
              width: '100%', padding: '11px',
              background: '#1a2e4a', color: 'white',
              border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: 'pointer'
            }}
              onMouseEnter={e => e.target.style.background = '#00c9a7'}
              onMouseLeave={e => e.target.style.background = '#1a2e4a'}
            >
              + Publier un manuel
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, padding: '28px 36px', maxWidth: 900 }}>

          <div style={{ fontSize: 13, color: '#a0aec0', marginBottom: 8 }}>
            Accueil / Manuels / <span style={{ color: '#1a2e4a', fontWeight: 600 }}>
              {view === 'acheter' ? 'Acheter' : view === 'vendre' ? 'Vendre' : 'Mes annonces'}
            </span>
          </div>

          {/* ===== VUE ACHETER ===== */}
          {view === 'acheter' && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 20px' }}>
                Acheter un manuel
              </h1>

              {/* BANNER */}
              <div style={{
                background: 'linear-gradient(135deg, #1a2e4a 0%, #0d4f6b 50%, #00c9a7 100%)',
                borderRadius: 14, padding: '24px 28px', marginBottom: 24,
              }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
                  🔍 Rechercher un manuel
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    placeholder="Titre, code de cours..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      flex: 1, padding: '10px 14px',
                      border: 'none', borderRadius: 8,
                      fontSize: 14, outline: 'none'
                    }}
                  />
                  <button style={{
                    background: '#00c9a7', color: 'white', border: 'none',
                    borderRadius: 8, padding: '10px 20px',
                    fontWeight: 700, cursor: 'pointer', fontSize: 14
                  }}>
                    Chercher
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#1a2e4a' }}>{listings.length}</span>
                  <span style={{ fontSize: 13, color: '#718096', marginLeft: 6 }}>manuels disponibles</span>
                </div>
              </div>

              <p style={{ color: '#718096', fontSize: 14, marginBottom: 16, fontStyle: 'italic' }}>
                Les derniers manuels ajoutés...
              </p>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#a0aec0' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                  Aucun manuel trouvé.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filtered.map(item => (
                    <div key={item.id} style={{
                      background: 'white', borderRadius: 10, padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: 16,
                      border: '1px solid #e2e8f0', transition: 'box-shadow 0.15s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <div style={{ flexShrink: 0 }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} style={{
                            width: 54, height: 68, objectFit: 'cover', borderRadius: 6
                          }} />
                        ) : (
                          <div style={{
                            width: 54, height: 68,
                            background: 'linear-gradient(135deg, #1a2e4a, #0d4f6b)',
                            borderRadius: 6, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 24
                          }}>📖</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#00a88a', fontSize: 15, marginBottom: 2 }}>
                          {item.title}
                        </div>
                        {item.authors && (
                          <div style={{ fontSize: 13, color: '#718096' }}>
                            Auteurs : {item.authors}
                          </div>
                        )}
                        {item.isbn && (
                          <div style={{ fontSize: 13, color: '#718096' }}>
                            ISBN : <span style={{ color: '#00a88a' }}>{item.isbn}</span>
                          </div>
                        )}
                        {item.course_code && (
                          <div style={{ fontSize: 13, color: '#718096' }}>
                            Cours : <strong>{item.course_code}</strong>
                          </div>
                        )}
                        {item.description && (
                          <div style={{ fontSize: 13, color: '#a0aec0', marginTop: 2 }}>{item.description}</div>
                        )}
                        <div style={{ fontSize: 12, color: '#b0bec5', marginTop: 4 }}>
                          {timeAgo(item.created_at)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a', marginBottom: 4 }}>
                          {item.price} $
                        </div>
                        {item.original_price > 0 && item.original_price > item.price && (
                          <div style={{
                            background: '#00c9a7', color: 'white',
                            borderRadius: 20, padding: '3px 8px',
                            fontSize: 11, fontWeight: 700, marginBottom: 6,
                            display: 'inline-block', width: 'fit-content'
                          }}>
                            -{Math.round(((item.original_price - item.price) / item.original_price) * 100)}%
                          </div>
                        )}
                        {item.user_id === user?.id && (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => router.push(`/edit/${item.id}`)} style={{
                              background: '#f0fdf9', color: '#00c9a7', border: '1px solid #00c9a7',
                              padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600
                            }}>Modifier</button>
                            <button onClick={() => handleDelete(item.id)} style={{
                              background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7',
                              padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600
                            }}>Supprimer</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===== VUE VENDRE ===== */}
          {view === 'vendre' && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 20px' }}>
                Vendre un manuel
              </h1>

              {phoneSaved ? (
                /* ✅ Numéro déjà vérifié */
                <div style={{
                  background: '#f0fdf9', border: '1px solid #00c9a7',
                  borderRadius: 14, padding: '20px 24px', marginBottom: 24,
                  display: 'flex', alignItems: 'center', gap: 12
                }}>
                  <span style={{ fontSize: 22 }}>✅</span>
                  <div>
                    <strong style={{ color: '#1a2e4a' }}>Numéro vérifié</strong>
                    <span style={{ color: '#718096', fontSize: 14, marginLeft: 8 }}>
                      Tu peux publier tes manuels.
                    </span>
                  </div>
                  <button onClick={() => router.push('/create')} style={{
                    marginLeft: 'auto', background: '#1a2e4a', color: 'white',
                    border: 'none', borderRadius: 8, padding: '10px 20px',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer'
                  }}
                    onMouseEnter={e => e.target.style.background = '#00c9a7'}
                    onMouseLeave={e => e.target.style.background = '#1a2e4a'}
                  >
                    + Publier un manuel
                  </button>
                </div>

              ) : phoneStep === 'enter' ? (
                /* ÉTAPE 1 — Saisie du numéro */
                <div style={{
                  background: 'white', borderRadius: 14, padding: '36px',
                  border: '1px solid #e2e8f0', maxWidth: 560
                }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e4a', margin: '0 0 8px' }}>
                    Vérifie ton numéro de téléphone
                  </h2>
                  <p style={{ color: '#718096', fontSize: 14, margin: '0 0 28px' }}>
                    Pour la sécurité des membres, nous demandons un numéro de téléphone vérifié.
                  </p>

                  {/* PAYS */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 8 }}>
                      Pays
                    </label>
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 14px',
                        border: '1px solid #cbd5e0', borderRadius: 8,
                        fontSize: 15, outline: 'none', background: 'white',
                        boxSizing: 'border-box', cursor: 'pointer'
                      }}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.label} ({c.dial})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TÉLÉPHONE */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 8 }}>
                      Numéro de téléphone
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${phoneError ? '#e53e3e' : '#cbd5e0'}`, borderRadius: 8, overflow: 'hidden' }}>
                      <span style={{
                        padding: '12px 14px', background: '#f7fafc',
                        borderRight: '1px solid #cbd5e0', color: '#4a5568',
                        fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap'
                      }}>
                        {COUNTRIES.find(c => c.code === countryCode)?.dial || '+1'}
                      </span>
                      <input
                        placeholder="ex: 5145551234"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setPhoneError('') }}
                        style={{
                          flex: 1, padding: '12px 14px',
                          border: 'none', fontSize: 15, outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {phoneError && (
                    <p style={{ color: '#e53e3e', fontSize: 13, margin: '-12px 0 16px' }}>{phoneError}</p>
                  )}

                  <p style={{ fontSize: 12, color: '#a0aec0', margin: '0 0 24px' }}>
                    Format : 10 chiffres sans tirets (ex: 5145551234). Le +1 sera ajouté automatiquement.
                  </p>

                  <button
                    onClick={handleSendCode}
                    disabled={sendingCode}
                    style={{
                      background: sendingCode ? '#a0aec0' : '#00c9a7',
                      color: 'white', border: 'none', borderRadius: 8,
                      padding: '12px 28px', fontWeight: 700, fontSize: 15,
                      cursor: sendingCode ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {sendingCode ? 'Envoi en cours...' : 'Envoyer le code de vérification'}
                  </button>
                </div>

              ) : (
                /* ÉTAPE 2 — Saisie du code SMS */
                <div style={{
                  background: 'white', borderRadius: 14, padding: '36px',
                  border: '1px solid #e2e8f0', maxWidth: 560
                }}>
                  {/* Bannière succès envoi */}
                  <div style={{
                    background: '#f0fdf9', border: '1px solid #00c9a7',
                    borderRadius: 8, padding: '12px 16px', marginBottom: 28,
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 14, color: '#00a88a', fontWeight: 600
                  }}>
                    <span>👍</span>
                    Le code de vérification a été envoyé à ton téléphone.
                  </div>

                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e4a', margin: '0 0 8px' }}>
                    Entre ton code de vérification
                  </h2>
                  <p style={{ color: '#718096', fontSize: 14, margin: '0 0 28px' }}>
                    Vérifie tes SMS. Le code peut prendre une à deux minutes à arriver.
                  </p>

                  <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 8 }}>
                        Code de vérification
                      </label>
                      <input
                        placeholder="ex: 123456"
                        value={otp}
                        onChange={e => { setOtp(e.target.value); setOtpError('') }}
                        maxLength={6}
                        style={{
                          width: '100%', padding: '12px 14px',
                          border: `1px solid ${otpError ? '#e53e3e' : '#cbd5e0'}`,
                          borderRadius: 8, fontSize: 20, outline: 'none',
                          boxSizing: 'border-box', letterSpacing: 6, textAlign: 'center'
                        }}
                        onFocus={e => e.target.style.borderColor = '#00c9a7'}
                        onBlur={e => e.target.style.borderColor = otpError ? '#e53e3e' : '#cbd5e0'}
                      />
                    </div>
                  </div>

                  {otpError && (
                    <p style={{ color: '#e53e3e', fontSize: 13, margin: '-12px 0 16px' }}>{otpError}</p>
                  )}

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                      onClick={handleVerifyOtp}
                      disabled={verifyingCode}
                      style={{
                        background: verifyingCode ? '#a0aec0' : '#00c9a7',
                        color: 'white', border: 'none', borderRadius: 8,
                        padding: '12px 28px', fontWeight: 700, fontSize: 15,
                        cursor: verifyingCode ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {verifyingCode ? 'Vérification...' : 'Vérifier mon numéro'}
                    </button>
                    <button
                      onClick={() => { setPhoneStep('enter'); setOtp(''); setOtpError('') }}
                      style={{
                        background: 'transparent', color: '#718096',
                        border: 'none', fontSize: 14, cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Changer de numéro
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== VUE MES ANNONCES ===== */}
          {view === 'mes-annonces' && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 20px' }}>
                Mes annonces
              </h1>

              {myListings.length === 0 ? (
                <div style={{
                  background: 'white', borderRadius: 14, padding: '50px',
                  border: '1px solid #e2e8f0', textAlign: 'center', color: '#a0aec0'
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <p style={{ marginBottom: 20 }}>Tu n'as encore publié aucun manuel.</p>
                  <button onClick={() => setView('vendre')} style={{
                    background: '#1a2e4a', color: 'white', border: 'none',
                    borderRadius: 10, padding: '12px 24px',
                    fontWeight: 700, cursor: 'pointer'
                  }}>
                    + Publier mon premier manuel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {myListings.map(item => (
                    <div key={item.id} style={{
                      background: 'white', borderRadius: 10, padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: 16,
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ flexShrink: 0 }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} style={{
                            width: 54, height: 68, objectFit: 'cover', borderRadius: 6
                          }} />
                        ) : (
                          <div style={{
                            width: 54, height: 68,
                            background: 'linear-gradient(135deg, #1a2e4a, #0d4f6b)',
                            borderRadius: 6, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 24
                          }}>📖</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#00a88a', fontSize: 15 }}>{item.title}</div>
                        {item.course_code && (
                          <div style={{ fontSize: 13, color: '#718096' }}>Cours : <strong>{item.course_code}</strong></div>
                        )}
                        <div style={{ fontSize: 12, color: '#b0bec5', marginTop: 4 }}>{timeAgo(item.created_at)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a', marginBottom: 8 }}>
                          {item.price} $
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => router.push(`/edit/${item.id}`)} style={{
                            background: '#f0fdf9', color: '#00c9a7', border: '1px solid #00c9a7',
                            padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600
                          }}>Modifier</button>
                          <button onClick={() => handleDelete(item.id)} style={{
                            background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7',
                            padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600
                          }}>Supprimer</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  )
}
