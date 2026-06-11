'use client'

import { useEffect, useState, useRef } from 'react'
import * as Sentry from '@sentry/nextjs'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Logo from '../../components/Logo'
import BadgeList from '../../components/BadgeList'

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

const LISTINGS_PER_PAGE = 24

export default function Home() {
  const [listings, setListings] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [userSubjects, setUserSubjects] = useState([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const userIdRef = useRef(null)
  const [profilesMap, setProfilesMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('acheter') // 'acheter' | 'vendre' | 'mes-annonces'
  const [selectedBook, setSelectedBook] = useState(null)
  const [relatedListings, setRelatedListings] = useState([])
  const [reportModal, setReportModal] = useState(null) // listing_id à signaler
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [filterMethods, setFilterMethods] = useState(new Set()) // set vide = Tous
  // Filtres liste principale
  const [sortBy, setSortBy] = useState('recent')
  const [filterInstitution, setFilterInstitution] = useState('')
  const [filterEtat, setFilterEtat] = useState('')
  const [filterTransaction, setFilterTransaction] = useState('')
  const [expandedSeller, setExpandedSeller] = useState(null)
  const [showSellerBooks, setShowSellerBooks] = useState(null)
  const [wishlist, setWishlist] = useState(new Set())
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('CA')
  const [phoneError, setPhoneError] = useState('')
  const [phoneSaved, setPhoneSaved] = useState(false)
  const [phoneStep, setPhoneStep] = useState('enter') // 'enter' | 'verify'
  const [verifyRedirect, setVerifyRedirect] = useState('/create')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [soldConfirmId, setSoldConfirmId] = useState(null)
  const [markingAsSold, setMarkingAsSold] = useState(false)
  const router = useRouter()

  const fetchListings = async (offset = 0, append = false) => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + LISTINGS_PER_PAGE - 1)
    if (!error && data) {
      setListings(prev => append ? [...prev, ...data] : data)
      setHasMore(data.length === LISTINGS_PER_PAGE)
      const userIds = [...new Set(data.map(l => l.user_id).filter(Boolean))]
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, campus, institution')
          .in('id', userIds)
        if (profiles) {
          const map = {}
          profiles.forEach(p => { map[p.id] = p })
          setProfilesMap(prev => ({ ...prev, ...map }))
        }
      }
    }
  }

  const loadMore = async () => {
    setLoadingMore(true)
    await fetchListings(listings.length, true)
    setLoadingMore(false)
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    let initialized = false

    const init = async (currentUser) => {
      if (initialized) return
      initialized = true
      try {
        const user = currentUser || (await supabase.auth.getSession()).data.session?.user
        if (!user) { window.location.href = '/login'; return }
        setUser(user)
        Sentry.setUser({ id: user.id, email: user.email })
        const savedPhone = user?.user_metadata?.phone_verified
        if (savedPhone) setPhoneSaved(true)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        userIdRef.current = user.id
        if (profile) {
          setUserProfile(profile)
          setUserSubjects(profile.subjects || [])
        }
        fetchWishlist(user.id)
        fetchUnreadMessages(user.id)
        requestNotifPermission()
        document.addEventListener('click', initAudio, { once: true })
      } catch (e) {
        window.location.href = '/login'
        return
      }
      setLoading(false)
      fetchListings()
    }

    // onAuthStateChange fire immédiatement avec la session existante (y compris après OAuth)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login'
      } else if (session?.user) {
        init(session.user)
      } else if (event === 'INITIAL_SESSION' && !session) {
        // Pas de session — rediriger vers login
        window.location.href = '/login'
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // AudioContext créé une fois et réutilisé (évite le blocage navigateur)
  const audioCtxRef = useRef(null)

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
  }

  const playNotifSound = async () => {
    try {
      initAudio()
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') await ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } catch (e) {}
  }

  const requestNotifPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const showBrowserNotif = (senderName, content) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`📚 BiblioCamp — ${senderName}`, {
        body: content,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      })
    }
  }

  const fetchUnreadMessages = async (userId) => {
    // Conversations où l'utilisateur est membre
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    if (!convs || convs.length === 0) return

    const convIds = convs.map(c => c.id)
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('read', false)
      .neq('sender_id', userId)

    setUnreadMessages(count || 0)
    // Mise à jour du titre de l'onglet
    if (count > 0) document.title = `(${count}) BiblioCamp`
    else document.title = 'BiblioCamp'
  }

  const fetchWishlist = async (userId) => {
    const { data } = await supabase
      .from('wishlist')
      .select('listing_id')
      .eq('user_id', userId)
    if (data) setWishlist(new Set(data.map(w => w.listing_id)))
  }

  const toggleWishlist = async (listingId) => {
    const isInWishlist = wishlist.has(listingId)
    if (isInWishlist) {
      await supabase.from('wishlist').delete()
        .eq('user_id', user.id).eq('listing_id', listingId)
      setWishlist(prev => { const next = new Set(prev); next.delete(listingId); return next })
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, listing_id: listingId })
      setWishlist(prev => new Set([...prev, listingId]))
    }
  }

  const toggleSubject = async (courseCode) => {
    if (!courseCode) return
    const isFollowed = userSubjects.includes(courseCode)
    const updated = isFollowed
      ? userSubjects.filter(s => s !== courseCode)
      : [...userSubjects, courseCode]
    setUserSubjects(updated)
    await supabase.from('profiles').upsert({ id: user.id, subjects: updated })
  }

  const handleDelete = async (id) => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/listings?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    setDeleteConfirmId(null)
    if (res.ok) fetchListings()
  }

  const handleMarkSold = async (id) => {
    setMarkingAsSold(true)
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/listings/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: id, status: 'sold' })
    })
    setSoldConfirmId(null)
    setMarkingAsSold(false)
    fetchListings()
  }

  const handleMarkActive = async (id) => {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/listings/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: id, status: 'active' })
    })
    fetchListings()
  }

  const handleReport = async () => {
    if (!reportReason) return
    setReportLoading(true)
    const { error } = await supabase.from('reports').insert({
      listing_id: reportModal,
      reporter_id: user.id,
      reason: reportReason
    })
    setReportLoading(false)
    if (error?.code === '23505') {
      setReportSent(true) // déjà signalé
    } else if (error) {
      alert('Erreur lors du signalement.')
    } else {
      setReportSent(true)
    }
  }

  const closeReportModal = () => {
    setReportModal(null)
    setReportReason('')
    setReportSent(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.replace('/')
  }

  const handleSendCode = async () => {
    setPhoneError('')
    const digits = phone.replace(/\D/g, '')
    if (!isValidPhone(phone)) {
      setPhoneError('Numéro invalide. Entre 10 chiffres sans tirets (ex: 5145551234).')
      return
    }
    if (digits.length !== 10) {
      setPhoneError('Le numéro doit contenir exactement 10 chiffres.')
      return
    }
    const formatted = `+1${digits}` // Toujours +1 (Canada/USA)
    setSendingCode(true)

    // Vérifier que le numéro n'est pas VoIP
    try {
      const check = await fetch('/api/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted })
      })
      const result = await check.json()
      if (!result.valid) {
        setPhoneError(result.error || 'Numéro non accepté.')
        setSendingCode(false)
        return
      }
    } catch (e) {
      // Erreur réseau → on laisse passer
    }

    // Envoyer le code via Twilio Verify (sans toucher à la session Supabase)
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted })
      })
      const result = await res.json()
      if (!res.ok) {
        setPhoneError(result.error || 'Erreur lors de l\'envoi du SMS.')
        setSendingCode(false)
        return
      }
      setPhoneStep('verify')
    } catch {
      setPhoneError('Erreur réseau. Réessaie.')
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyOtp = async () => {
    setOtpError('')
    if (otp.length < 4) { setOtpError('Entre le code reçu par SMS.'); return }
    setVerifyingCode(true)
    const digits = phone.replace(/\D/g, '')
    const dialCode = COUNTRIES.find(c => c.code === countryCode)?.dial || '+1'
    const formatted = `${dialCode}${digits}`
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ phone: formatted, code: otp })
      })
      const result = await res.json()
      if (!res.ok) {
        setOtpError(result.error || 'Code incorrect ou expiré. Réessaie.')
        return
      }
      setPhoneSaved(true)
      router.push(verifyRedirect)
    } catch {
      setOtpError('Erreur inattendue. Réessaie.')
    } finally {
      setVerifyingCode(false)
    }
  }

  const filtered = listings?.filter(item => {
    if (item.status === 'sold' && item.user_id !== user?.id) return false // cache les vendus sauf au proprio
    if (search) {
      const q = search.toLowerCase().replace(/[-\s]/g, '')
      const matchTitle = item.title?.toLowerCase().includes(search.toLowerCase())
      const matchCourse = item.course_code?.toLowerCase().includes(search.toLowerCase())
      const matchIsbn = item.isbn?.replace(/[-\s]/g, '').includes(q)
      const matchAuthors = item.authors?.toLowerCase().includes(search.toLowerCase())
      if (!matchTitle && !matchCourse && !matchIsbn && !matchAuthors) return false
    }
    if (filterEtat && item.description !== filterEtat) return false
    if (filterTransaction === 'campus' && !item.meet_campus) return false
    if (filterTransaction === 'city' && !item.meet_city) return false
    if (filterTransaction === 'post' && !item.post) return false
    if (filterInstitution === '__mes_cours__') {
      if (!item.course_code || !userSubjects.includes(item.course_code)) return false
    } else if (filterInstitution) {
      const p = profilesMap[item.user_id]
      if ((item.campus || p?.institution) !== filterInstitution) return false
    }
    return true
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price
    if (sortBy === 'price_desc') return b.price - a.price
    if (sortBy === 'savings') {
      const sa = a.original_price > 0 ? (a.original_price - a.price) / a.original_price : 0
      const sb = b.original_price > 0 ? (b.original_price - b.price) / b.original_price : 0
      return sb - sa
    }
    return new Date(b.created_at) - new Date(a.created_at) // recent
  })

  // Institutions disponibles dans les listings
  const availableInstitutions = [...new Set(
    listings?.map(item => item.campus || profilesMap[item.user_id]?.institution).filter(Boolean)
  )].sort()

  const myListings = listings?.filter(item => item.user_id === user?.id)

  // Polling notifications — toutes les 5s, détecte les nouveaux messages
  const prevUnreadRef = useRef(0)
  useEffect(() => {
    if (!user?.id) return
    const userId = user.id

    const check = async () => {
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      if (!convs || convs.length === 0) return

      const convIds = convs.map(c => c.id)
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .eq('read', false)
        .neq('sender_id', userId)

      const newCount = count || 0
      setUnreadMessages(newCount)
      document.title = newCount > 0 ? `(${newCount}) BiblioCamp` : 'BiblioCamp'

      // Son + notif si nouveaux messages depuis la dernière vérification
      if (newCount > prevUnreadRef.current) {
        playNotifSound()
        if (!window.location.pathname.startsWith('/inbox')) {
          showBrowserNotif('BiblioCamp', `Tu as ${newCount} message${newCount > 1 ? 's' : ''} non lu${newCount > 1 ? 's' : ''}`)
        }
      }
      prevUnreadRef.current = newCount
    }

    check() // immédiat
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [user?.id])

  useEffect(() => {
    if (!selectedBook) { setRelatedListings([]); return }
    const related = listings.filter(item => {
      if (item.id === selectedBook.id) return false
      if (selectedBook.isbn && item.isbn) return item.isbn === selectedBook.isbn
      return item.title.toLowerCase() === selectedBook.title.toLowerCase()
    })
    setRelatedListings(related)
  }, [selectedBook, listings])

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

      {/* MODAL CONFIRMATION VENDU */}
      {soldConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setSoldConfirmId(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: '28px 32px',
            maxWidth: 380, width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1a2e4a' }}>
              Marquer comme vendu ?
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>
              L'annonce sera masquée du marketplace. Tu pourras la remettre en ligne si besoin.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setSoldConfirmId(null)} style={{
                flex: 1, padding: '11px', borderRadius: 9,
                border: '1.5px solid #e2e8f0', background: 'white',
                color: '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}>Annuler</button>
              <button
                onClick={() => handleMarkSold(soldConfirmId)}
                disabled={markingAsSold}
                style={{
                  flex: 1, padding: '11px', borderRadius: 9,
                  border: 'none', background: '#00c9a7',
                  color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                }}
              >
                {markingAsSold ? '...' : '✓ Vendu !'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setDeleteConfirmId(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: '28px 32px',
            maxWidth: 380, width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1a2e4a' }}>
              Supprimer ce manuel ?
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>
              Cette action est irréversible. L'annonce sera définitivement supprimée.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  flex: 1, padding: '11px', borderRadius: 9,
                  border: '1.5px solid #e2e8f0', background: 'white',
                  color: '#64748b', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  flex: 1, padding: '11px', borderRadius: 9,
                  border: 'none', background: '#e53e3e',
                  color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#c53030'}
                onMouseLeave={e => e.currentTarget.style.background = '#e53e3e'}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{
        background: '#1a2e4a', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 4, padding: 6
            }}>
              <div style={{ width: 20, height: 2, background: 'white', borderRadius: 2 }} />
              <div style={{ width: 20, height: 2, background: 'white', borderRadius: 2 }} />
              <div style={{ width: 20, height: 2, background: 'white', borderRadius: 2 }} />
            </button>
          )}
          <Logo variant="light" size="sm" onClick={() => setView('acheter')} style={{ cursor: 'pointer' }} />
        </div>
        {/* Menu profil style Airbnb */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: showProfileMenu ? '#243d5a' : 'transparent',
              border: `1px solid ${showProfileMenu ? '#4a6a8a' : '#2d4a6b'}`,
              borderRadius: 30, padding: '5px 6px 5px 12px',
              cursor: 'pointer', transition: 'box-shadow 0.15s',
              boxShadow: showProfileMenu ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'}
            onMouseLeave={e => { if (!showProfileMenu) e.currentTarget.style.boxShadow = 'none' }}
          >
            {/* Hamburger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <div style={{ width: 15, height: 1.5, background: '#a0aec0', borderRadius: 2 }} />
              <div style={{ width: 15, height: 1.5, background: '#a0aec0', borderRadius: 2 }} />
              <div style={{ width: 15, height: 1.5, background: '#a0aec0', borderRadius: 2 }} />
            </div>
            {/* Avatar avec badge messages non lus */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 32, height: 32, background: '#00c9a7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
                  {(userProfile?.first_name || user?.email)?.[0]?.toUpperCase()}
                </div>
              )}
              {unreadMessages > 0 && (
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#e53e3e', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800,
                  border: '2px solid #1a2e4a'
                }}>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </div>
              )}
            </div>
          </button>

          {/* Dropdown */}
          {showProfileMenu && (
            <>
              {/* Overlay pour fermer */}
              <div
                onClick={() => setShowProfileMenu(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 300 }}
              />
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: 'white', borderRadius: 14,
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                minWidth: 220, zIndex: 301,
                overflow: 'hidden', border: '1px solid #e2e8f0'
              }}>
                {/* Infos utilisateur */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f4f8', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="avatar" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#1a2e4a,#00c9a7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                      {(userProfile?.first_name || user?.email)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a2e4a', fontSize: 14 }}>
                      {userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim() : 'Mon compte'}
                    </div>
                    <div style={{ fontSize: 12, color: '#a0aec0' }}>{user?.email}</div>
                    {userProfile?.institution && <div style={{ fontSize: 11, color: '#00a88a', marginTop: 2 }}>🏫 {userProfile.institution}</div>}
                  </div>
                </div>

                {/* Items */}
                {[
                  { icon: '❤️', label: 'Mes favoris', badge: wishlist.size > 0 ? wishlist.size : null, action: () => { setView('favoris'); setShowProfileMenu(false) } },
                  { icon: '✉️', label: 'Messages', badge: unreadMessages > 0 ? unreadMessages : null, action: () => { router.push('/inbox'); setShowProfileMenu(false) } },
                  { icon: '📋', label: 'Mes annonces', badge: null, action: () => { setView('mes-annonces'); setShowProfileMenu(false) } },
                  { icon: '👤', label: 'Mon profil', badge: null, action: () => { router.push('/profile'); setShowProfileMenu(false) } },
                  { icon: '🔗', label: 'Inviter des amis', badge: null, action: () => { router.push('/profile'); setShowProfileMenu(false) } },
                ].map(item => (
                  <div key={item.label} onClick={item.action} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', cursor: 'pointer',
                    borderBottom: '1px solid #f0f4f8',
                    transition: 'background 0.1s',
                    opacity: item.soon ? 0.5 : 1
                  }}
                    onMouseEnter={e => { if (!item.soon) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
                    <span style={{ flex: 1, fontSize: 14, color: '#1a2e4a', fontWeight: 500 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{ background: '#e53e3e', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{item.badge}</span>
                    )}
                    {item.soon && <span style={{ fontSize: 10, color: '#a0aec0', background: '#f0f4f8', borderRadius: 20, padding: '1px 7px' }}>Bientôt</span>}
                  </div>
                ))}

                {/* Déconnexion */}
                <div onClick={() => { handleLogout(); setShowProfileMenu(false) }} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px', cursor: 'pointer', transition: 'background 0.1s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🚪</span>
                  <span style={{ fontSize: 14, color: '#e53e3e', fontWeight: 600 }}>Déconnexion</span>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)', position: 'relative' }}>

        {/* OVERLAY mobile */}
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99
          }} />
        )}

        {/* SIDEBAR */}
        <aside style={{
          width: 210, background: 'white',
          borderRight: '1px solid #e2e8f0',
          padding: '20px 0', flexShrink: 0,
          ...(isMobile ? {
            position: 'fixed', top: 60, left: 0, bottom: 0,
            zIndex: 100, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease', overflowY: 'auto'
          } : {})
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
            { key: 'favoris', icon: '❤️', label: 'Mes favoris', badge: wishlist.size > 0 ? wishlist.size : null },
            { key: 'mes-cours', icon: '📚', label: 'Mes cours', badge: userSubjects.length > 0 ? userSubjects.length : null },
          ].map(item => (
            <div key={item.key}
              onClick={() => { setView(item.key); if (isMobile) setSidebarOpen(false) }}
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
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: '#e53e3e', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}

          <div style={{ height: 1, background: '#e2e8f0', margin: '16px 0' }} />

          <div style={{ padding: '0 14px' }}>
            <button onClick={() => { setVerifyRedirect('/create'); setView('vendre') }} style={{
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

            <div style={{ height: 1, background: '#e2e8f0', margin: '12px 0' }} />

            <button
              onClick={() => router.push('/profile')}
              style={{
                width: '100%', padding: '10px',
                background: 'transparent', color: '#718096',
                border: '1px solid #e2e8f0', borderRadius: 10,
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.color = '#00c9a7' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#718096' }}
            >
              👤 Mon profil
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, padding: isMobile ? '16px 14px' : '28px 36px', maxWidth: 900, width: '100%' }}>

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
                    placeholder="Titre, ISBN, auteur, code de cours..."
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

              {/* ── BARRE DE FILTRES ── */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>

                {/* Tri */}
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                  padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                  fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer',
                  color: '#1a2e4a', fontWeight: 600
                }}>
                  <option value="recent">📅 Plus récent</option>
                  <option value="price_asc">💲 Prix croissant</option>
                  <option value="price_desc">💲 Prix décroissant</option>
                  <option value="savings">🏷️ Meilleure économie</option>
                </select>

                {/* Institution */}
                <select value={filterInstitution} onChange={e => setFilterInstitution(e.target.value)} style={{
                  padding: '8px 12px', border: `1px solid ${filterInstitution ? '#00c9a7' : '#e2e8f0'}`,
                  borderRadius: 8, fontSize: 13, outline: 'none',
                  background: filterInstitution ? '#f0fdf9' : 'white',
                  cursor: 'pointer', color: filterInstitution ? '#00a88a' : '#1a2e4a', fontWeight: 600
                }}>
                  <option value="">🏫 Institution</option>
                  {availableInstitutions.map(i => <option key={i} value={i}>{i}</option>)}
                </select>

                {/* État */}
                <select value={filterEtat} onChange={e => setFilterEtat(e.target.value)} style={{
                  padding: '8px 12px', border: `1px solid ${filterEtat ? '#00c9a7' : '#e2e8f0'}`,
                  borderRadius: 8, fontSize: 13, outline: 'none',
                  background: filterEtat ? '#f0fdf9' : 'white',
                  cursor: 'pointer', color: filterEtat ? '#00a88a' : '#1a2e4a', fontWeight: 600
                }}>
                  <option value="">📖 État</option>
                  {['Neuf', 'Très bon état', 'Bon état', 'Acceptable'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>

                {/* Méthode */}
                <select value={filterTransaction} onChange={e => setFilterTransaction(e.target.value)} style={{
                  padding: '8px 12px', border: `1px solid ${filterTransaction ? '#00c9a7' : '#e2e8f0'}`,
                  borderRadius: 8, fontSize: 13, outline: 'none',
                  background: filterTransaction ? '#f0fdf9' : 'white',
                  cursor: 'pointer', color: filterTransaction ? '#00a88a' : '#1a2e4a', fontWeight: 600
                }}>
                  <option value="">🤝 Méthode</option>
                  <option value="campus">🏫 Campus</option>
                  <option value="city">🏙️ En ville</option>
                  <option value="post">📦 Postal</option>
                </select>

                {/* Mes cours */}
                {userSubjects.length > 0 && (
                  <button
                    onClick={() => setFilterInstitution(filterInstitution === '__mes_cours__' ? '' : '__mes_cours__')}
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${filterInstitution === '__mes_cours__' ? '#6c63ff' : '#e2e8f0'}`,
                      borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: filterInstitution === '__mes_cours__' ? '#ede9fe' : 'white',
                      color: filterInstitution === '__mes_cours__' ? '#6c63ff' : '#1a2e4a',
                      display: 'flex', alignItems: 'center', gap: 5
                    }}
                  >
                    📚 Mes cours
                    <span style={{ background: filterInstitution === '__mes_cours__' ? '#6c63ff' : '#f0f4f8', color: filterInstitution === '__mes_cours__' ? 'white' : '#718096', borderRadius: 20, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>
                      {userSubjects.length}
                    </span>
                  </button>
                )}

                {/* Reset si filtres actifs */}
                {(filterInstitution || filterEtat || filterTransaction || sortBy !== 'recent') && (
                  <button onClick={() => { setFilterInstitution(''); setFilterEtat(''); setFilterTransaction(''); setSortBy('recent') }} style={{
                    padding: '8px 12px', background: '#fff5f5', color: '#e53e3e',
                    border: '1px solid #fed7d7', borderRadius: 8,
                    fontSize: 13, cursor: 'pointer', fontWeight: 600
                  }}>
                    × Réinitialiser
                  </button>
                )}
              </div>

              <p style={{ color: '#718096', fontSize: 13, marginBottom: 12 }}>
                {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
                {search && ` pour "${search}"`}
                {filterEtat && ` · ${filterEtat}`}
                {filterInstitution && ` · ${filterInstitution}`}
                {filterTransaction && ` · ${filterTransaction === 'campus' ? 'Campus' : filterTransaction === 'city' ? 'En ville' : 'Postal'}`}
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
                      background: 'white', borderRadius: 10, padding: isMobile ? '12px 14px' : '16px 20px',
                      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 16,
                      border: '1px solid #e2e8f0', transition: 'box-shadow 0.15s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      {/* Ligne du haut sur mobile : image + infos */}
                      <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0, width: '100%' }}>
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          onClick={() => setSelectedBook(item)}
                          style={{ fontWeight: 700, color: '#00a88a', fontSize: 15, marginBottom: 2, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, color: '#718096' }}>
                              Cours : <strong>{item.course_code}</strong>
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); toggleSubject(item.course_code) }}
                              title={userSubjects.includes(item.course_code) ? 'Ne plus suivre' : 'Suivre ce cours'}
                              style={{
                                background: userSubjects.includes(item.course_code) ? '#ede9fe' : 'transparent',
                                color: userSubjects.includes(item.course_code) ? '#6c63ff' : '#a0aec0',
                                border: `1px solid ${userSubjects.includes(item.course_code) ? '#c4b5fd' : '#e2e8f0'}`,
                                borderRadius: 20, padding: '1px 8px', fontSize: 10,
                                fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              {userSubjects.includes(item.course_code) ? '✓ Suivi' : '+ Suivre'}
                            </button>
                          </div>
                        )}
                        {item.description && (
                          <div style={{ fontSize: 13, color: '#a0aec0', marginTop: 2 }}>{item.description}</div>
                        )}
                        {(() => {
                          const p = profilesMap[item.user_id]
                          const name = p?.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : (item.campus || null)
                          const sub = item.campus || p?.institution
                          if (!name && !sub) return null
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <div style={{ width: 20, height: 20, background: 'linear-gradient(135deg,#1a2e4a,#00c9a7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                                {(name || '?')[0].toUpperCase()}
                              </div>
                              <span
                                onClick={item.user_id !== user?.id ? (e => { e.stopPropagation(); router.push(`/seller/${item.user_id}`) }) : undefined}
                                style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', cursor: item.user_id !== user?.id ? 'pointer' : 'default', textDecoration: 'none' }}
                                onMouseEnter={item.user_id !== user?.id ? (e => e.currentTarget.style.color = '#00c9a7') : undefined}
                                onMouseLeave={item.user_id !== user?.id ? (e => e.currentTarget.style.color = '#4a5568') : undefined}
                              >{name}</span>
                              {sub && <span style={{ fontSize: 11, color: '#a0aec0' }}>· {sub}</span>}
                            </div>
                          )
                        })()}
                        {item.user_id && <div style={{ marginTop: 4 }}><BadgeList userId={item.user_id} mode="card" /></div>}
                        <div style={{ display: 'flex', gap: 5, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          {item.meet_campus && <span style={{ background: '#ede9fe', color: '#6c63ff', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20 }}>🏫</span>}
                          {item.meet_city && <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20 }}>🏙️</span>}
                          {item.post && <span style={{ background: '#dbeafe', color: '#2563eb', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20 }}>📦</span>}
                          <span style={{ fontSize: 11, color: '#b0bec5' }}>{timeAgo(item.created_at)}</span>
                        </div>
                      </div>
                      </div>{/* fin ligne du haut */}

                      {/* Ligne du bas sur mobile : prix + cœur + boutons */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: isMobile ? '100%' : 'auto',
                        flexShrink: 0, textAlign: 'right', flexDirection: isMobile ? 'row' : 'column',
                        alignSelf: isMobile ? 'auto' : 'center', gap: isMobile ? 8 : 0
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 900, color: '#1a2e4a' }}>
                            {item.price} $
                          </div>
                          {item.original_price > 0 && item.original_price > item.price && (
                            <div style={{
                              background: '#00c9a7', color: 'white',
                              borderRadius: 20, padding: '2px 8px',
                              fontSize: 11, fontWeight: 700,
                              display: 'inline-block'
                            }}>
                              -{Math.round(((item.original_price - item.price) / item.original_price) * 100)}%
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            onClick={e => { e.stopPropagation(); toggleWishlist(item.id) }}
                            title={wishlist.has(item.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            style={{
                              background: wishlist.has(item.id) ? '#fff0f0' : '#f7fafc',
                              color: wishlist.has(item.id) ? '#e53e3e' : '#a0aec0',
                              border: `1px solid ${wishlist.has(item.id) ? '#fed7d7' : '#e2e8f0'}`,
                              padding: '5px 10px', borderRadius: 7,
                              cursor: 'pointer', fontSize: 14, fontWeight: 600
                            }}
                          >
                            {wishlist.has(item.id) ? '❤️' : '🤍'}
                          </button>
                          {item.user_id === user?.id && (<>
                            <button onClick={() => router.push(`/edit/${item.id}`)} style={{
                              background: '#f0fdf9', color: '#00c9a7', border: '1px solid #00c9a7',
                              padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600
                            }}>✏️</button>
                            <button onClick={() => setDeleteConfirmId(item.id)} style={{
                              background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7',
                              padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600
                            }}>🗑️</button>
                          </>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {view === 'acheter' && !search && !filterEtat && !filterTransaction && !filterInstitution && hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                  <button onClick={loadMore} disabled={loadingMore} style={{
                    padding: '12px 32px', background: loadingMore ? '#a0aec0' : '#1a2e4a',
                    color: 'white', border: 'none', borderRadius: 10,
                    fontWeight: 700, fontSize: 15, cursor: loadingMore ? 'not-allowed' : 'pointer'
                  }}>
                    {loadingMore ? 'Chargement...' : "Charger plus d'annonces"}
                  </button>
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
                  <p style={{ color: '#718096', fontSize: 14, margin: '0 0 16px' }}>
                    Pour la sécurité des membres, nous demandons un numéro de téléphone vérifié.
                  </p>

                  {/* Restriction Canada/USA */}
                  <div style={{
                    background: '#f0f4f8', border: '1px solid #e2e8f0',
                    borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4a5568'
                  }}>
                    <span style={{ fontSize: 20 }}>🇨🇦</span>
                    <span>La vente est réservée aux membres avec un <strong>numéro nord-américain (+1)</strong> — Canada et États-Unis.</span>
                  </div>

                  {/* TÉLÉPHONE */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontWeight: 600, color: '#1a2e4a', fontSize: 14, marginBottom: 8 }}>
                      Numéro de téléphone
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${phoneError ? '#e53e3e' : '#cbd5e0'}`, borderRadius: 8, overflow: 'hidden' }}>
                      <span style={{
                        padding: '12px 14px', background: '#f0f4f8',
                        borderRight: '1px solid #cbd5e0', color: '#1a2e4a',
                        fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}>
                        🇨🇦 +1
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
                    10 chiffres sans espaces ni tirets · ex: 5145551234
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

          {/* ===== VUE FAVORIS ===== */}
          {view === 'favoris' && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 6px' }}>Mes favoris</h1>
              <p style={{ color: '#718096', fontSize: 14, margin: '0 0 24px' }}>
                {wishlist.size} livre{wishlist.size !== 1 ? 's' : ''} sauvegardé{wishlist.size !== 1 ? 's' : ''}
              </p>

              {wishlist.size === 0 ? (
                <div style={{ background: 'white', borderRadius: 14, padding: '50px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#a0aec0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🤍</div>
                  <p style={{ marginBottom: 20 }}>Aucun livre sauvegardé.</p>
                  <button onClick={() => setView('acheter')} style={{ background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>
                    Parcourir les manuels
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {listings.filter(item => wishlist.has(item.id)).map(item => {
                    const p = profilesMap[item.user_id]
                    const sellerName = p?.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : (item.campus || null)
                    return (
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
                            <img src={item.image_url} alt={item.title} style={{ width: 54, height: 68, objectFit: 'cover', borderRadius: 6 }} />
                          ) : (
                            <div style={{ width: 54, height: 68, background: 'linear-gradient(135deg,#1a2e4a,#0d4f6b)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📖</div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div onClick={() => setSelectedBook(item)} style={{ fontWeight: 700, color: '#00a88a', fontSize: 15, marginBottom: 2, cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >{item.title}</div>
                          {item.authors && <div style={{ fontSize: 13, color: '#718096' }}>✍️ {item.authors}</div>}
                          {item.course_code && <div style={{ fontSize: 13, color: '#718096' }}>Cours : <strong>{item.course_code}</strong></div>}
                          {sellerName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                              <div style={{ width: 16, height: 16, background: 'linear-gradient(135deg,#1a2e4a,#00c9a7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', fontWeight: 700 }}>
                                {sellerName[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: 11, color: '#718096' }}>{sellerName}</span>
                            </div>
                          )}
                          {item.user_id && <div style={{ marginTop: 4 }}><BadgeList userId={item.user_id} mode="card" /></div>}
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            {item.meet_campus && <span style={{ background: '#ede9fe', color: '#6c63ff', borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>🏫</span>}
                            {item.meet_city && <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>🏙️</span>}
                            {item.post && <span style={{ background: '#dbeafe', color: '#2563eb', borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>📦</span>}
                            <span style={{ fontSize: 11, color: '#b0bec5' }}>{timeAgo(item.created_at)}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a', marginBottom: 8 }}>{item.price} $</div>
                          {item.original_price > 0 && item.original_price > item.price && (
                            <div style={{ background: '#00c9a7', color: 'white', borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 700, marginBottom: 8, display: 'inline-block' }}>
                              -{Math.round(((item.original_price - item.price) / item.original_price) * 100)}%
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedBook(item)} style={{ background: '#f0fdf9', color: '#00c9a7', border: '1px solid #00c9a7', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              Voir
                            </button>
                            <button onClick={() => toggleWishlist(item.id)} style={{ background: '#fff0f0', color: '#e53e3e', border: '1px solid #fed7d7', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>
                              ❤️
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ===== VUE MES COURS ===== */}
          {view === 'mes-cours' && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 6px' }}>Mes cours</h1>
              <p style={{ color: '#718096', fontSize: 14, margin: '0 0 24px' }}>
                {userSubjects.length} cours suivi{userSubjects.length !== 1 ? 's' : ''} · les manuels disponibles apparaissent en dessous
              </p>

              {/* Chips cours suivis */}
              {userSubjects.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 14, padding: '40px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#a0aec0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                  <p style={{ marginBottom: 16 }}>Tu ne suis encore aucun cours.</p>
                  <p style={{ fontSize: 13, color: '#b0bec5' }}>Dans la vue <strong>Acheter</strong>, clique sur <strong>"+ Suivre"</strong> à côté d'un code de cours.</p>
                  <button onClick={() => setView('acheter')} style={{ marginTop: 16, background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>
                    Parcourir les manuels
                  </button>
                </div>
              ) : (
                <>
                  {/* Badges des cours */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                    {userSubjects.map(code => (
                      <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 20, padding: '6px 14px' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#6c63ff' }}>📚 {code}</span>
                        <button onClick={() => toggleSubject(code)} style={{ background: 'none', border: 'none', color: '#9c8fef', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }} title="Ne plus suivre">×</button>
                      </div>
                    ))}
                  </div>

                  {/* Manuels disponibles pour ces cours */}
                  {(() => {
                    const coursBooks = listings.filter(l => l.course_code && userSubjects.includes(l.course_code))
                    return coursBooks.length === 0 ? (
                      <div style={{ background: 'white', borderRadius: 12, padding: '30px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#a0aec0', fontSize: 13 }}>
                        Aucun manuel disponible pour tes cours pour l'instant.
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a', marginBottom: 12 }}>
                          {coursBooks.length} manuel{coursBooks.length > 1 ? 's' : ''} disponible{coursBooks.length > 1 ? 's' : ''} pour tes cours
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {coursBooks.map(item => {
                            const p = profilesMap[item.user_id]
                            const sellerName = p?.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : (item.campus || null)
                            return (
                              <div key={item.id} style={{ background: 'white', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #e2e8f0', transition: 'box-shadow 0.15s', cursor: 'pointer' }}
                                onClick={() => { setSelectedBook(item); setView('acheter') }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                              >
                                {item.image_url ? (
                                  <img src={item.image_url} style={{ width: 44, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                                ) : (
                                  <div style={{ width: 44, height: 56, background: 'linear-gradient(135deg,#1a2e4a,#0d4f6b)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📖</div>
                                )}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 700, color: '#00a88a', fontSize: 14 }}>{item.title}</div>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                                    <span style={{ background: '#ede9fe', color: '#6c63ff', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20 }}>{item.course_code}</span>
                                    {item.description && <span style={{ fontSize: 11, color: '#a0aec0' }}>{item.description}</span>}
                                  </div>
                                  {sellerName && <div style={{ fontSize: 11, color: '#718096', marginTop: 3 }}>👤 {sellerName}{item.campus ? ` · ${item.campus}` : ''}</div>}
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: 18, fontWeight: 900, color: '#1a2e4a' }}>{item.price} $</div>
                                  {item.original_price > 0 && item.original_price > item.price && (
                                    <span style={{ background: '#00c9a7', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                                      -{Math.round(((item.original_price - item.price) / item.original_price) * 100)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )
                  })()}
                </>
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
                      background: item.status === 'sold' ? '#f8fafc' : 'white', borderRadius: 10, padding: '14px',
                      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      gap: isMobile ? 10 : 16, border: '1px solid #e2e8f0',
                      opacity: item.status === 'sold' ? 0.75 : 1
                    }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <div style={{ flexShrink: 0, position: 'relative' }}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} style={{ width: 48, height: 60, objectFit: 'cover', borderRadius: 6, filter: item.status === 'sold' ? 'grayscale(50%)' : 'none' }} />
                          ) : (
                            <div style={{ width: 48, height: 60, background: 'linear-gradient(135deg, #1a2e4a, #0d4f6b)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📖</div>
                          )}
                          {item.status === 'sold' && (
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 6, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: 9, fontWeight: 900, color: 'white', textTransform: 'uppercase', background: '#00c9a7', padding: '2px 4px', borderRadius: 3 }}>VENDU</span>
                            </div>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <div style={{ fontWeight: 700, color: item.status === 'sold' ? '#94a3b8' : '#00a88a', fontSize: 14 }}>{item.title}</div>
                            {item.status === 'sold' && <span style={{ fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 10 }}>Vendu</span>}
                          </div>
                          {item.course_code && <div style={{ fontSize: 12, color: '#718096' }}>Cours : <strong>{item.course_code}</strong></div>}
                          <div style={{ fontSize: 11, color: '#b0bec5', marginTop: 2 }}>{timeAgo(item.created_at)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: isMobile ? '100%' : 'auto', gap: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: item.status === 'sold' ? '#94a3b8' : '#1a2e4a' }}>{item.price} $</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {item.status === 'sold' ? (
                            <>
                              <button onClick={() => handleMarkActive(item.id)} style={{ background: '#f0fdf9', color: '#00a88a', border: '1px solid #00c9a7', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Remettre en ligne</button>
                              <button onClick={() => setDeleteConfirmId(item.id)} style={{ background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Supprimer</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setSoldConfirmId(item.id)} style={{ background: '#f0fdf9', color: '#00a88a', border: '1px solid #00c9a7', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Vendu</button>
                              <button onClick={() => router.push(`/edit/${item.id}`)} style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Modifier</button>
                              <button onClick={() => setDeleteConfirmId(item.id)} style={{ background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Supprimer</button>
                            </>
                          )}
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

      {/* ===== SLIDE-OVER ===== */}
      {/* MODAL SIGNALEMENT */}
      {reportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={closeReportModal}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            {reportSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e4a', margin: '0 0 8px' }}>Signalement envoyé</h3>
                <p style={{ color: '#718096', fontSize: 14, margin: '0 0 24px' }}>Merci, nous allons examiner cette annonce.</p>
                <button onClick={closeReportModal} style={{ background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e4a', margin: '0 0 6px' }}>🚩 Signaler cette annonce</h3>
                <p style={{ color: '#718096', fontSize: 13, margin: '0 0 20px' }}>Pourquoi signales-tu cette annonce ?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {['Fausse annonce', 'Prix abusif', 'Contenu inapproprié', 'Vendeur frauduleux', 'Livre déjà vendu', 'Autre'].map(reason => (
                    <button key={reason} type="button" onClick={() => setReportReason(reason)} style={{
                      padding: '10px 16px', textAlign: 'left', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                      border: `2px solid ${reportReason === reason ? '#e53e3e' : '#e2e8f0'}`,
                      background: reportReason === reason ? '#fff5f5' : 'white',
                      color: reportReason === reason ? '#e53e3e' : '#4a5568',
                      fontWeight: reportReason === reason ? 700 : 400,
                      transition: 'all 0.15s'
                    }}>
                      {reportReason === reason ? '● ' : '○ '}{reason}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={closeReportModal} style={{ flex: 1, padding: '10px', background: 'white', color: '#718096', border: '1px solid #e2e8f0', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                  <button onClick={handleReport} disabled={!reportReason || reportLoading} style={{ flex: 1, padding: '10px', background: !reportReason || reportLoading ? '#a0aec0' : '#e53e3e', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: !reportReason || reportLoading ? 'not-allowed' : 'pointer' }}>
                    {reportLoading ? 'Envoi...' : 'Signaler'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedBook && (() => {
        const allSellers = [selectedBook, ...relatedListings].sort((a, b) => a.price - b.price)
        const filteredSellers = allSellers.filter(s => {
          if (filterMethods.size > 0) {
            const match = (filterMethods.has('campus') && s.meet_campus) ||
                          (filterMethods.has('city') && s.meet_city) ||
                          (filterMethods.has('post') && s.post)
            if (!match) return false
          }
          return true
        })
        return (
        <>
          {/* Overlay */}
          <div
            onClick={() => { setSelectedBook(null); setFilterMethods(new Set()); setExpandedSeller(null) }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
          />

          {/* Panneau */}
          <div style={{
            position: 'fixed', top: 0, right: 0,
            width: 500, maxWidth: '100vw', height: '100vh',
            background: '#f5f7fa', zIndex: 201,
            boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Segoe UI', sans-serif"
          }}>

            {/* ── ZONE HAUTE : infos livre ── */}
            <div style={{ background: 'white', borderBottom: '2px solid #e2e8f0', flexShrink: 0 }}>

              {/* Header */}
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f4f8' }}>
                <div style={{ fontSize: 12, color: '#a0aec0' }}>Manuels / <strong style={{ color: '#1a2e4a' }}>Détail</strong></div>
                <button onClick={() => { setSelectedBook(null); setFilterMethods(new Set()); setExpandedSeller(null) }} style={{
                  background: '#f0f4f8', border: 'none', borderRadius: '50%', width: 30, height: 30,
                  cursor: 'pointer', fontSize: 16, color: '#718096'
                }}>×</button>
              </div>

              {/* Livre principal */}
              <div style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {selectedBook.image_url ? (
                  <img src={selectedBook.image_url} alt={selectedBook.title} style={{ width: 80, height: 100, objectFit: 'cover', borderRadius: 8, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                ) : (
                  <div style={{ width: 80, height: 100, background: 'linear-gradient(135deg,#1a2e4a,#0d4f6b)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>📖</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1a2e4a', margin: '0 0 6px', lineHeight: 1.3 }}>{selectedBook.title}</h2>
                  {selectedBook.authors && <div style={{ fontSize: 13, color: '#718096', marginBottom: 3 }}>✍️ {selectedBook.authors}</div>}
                  {selectedBook.isbn && (
                    <div style={{ fontSize: 12, color: '#718096', marginBottom: 6 }}>
                      ISBN <span style={{ color: '#00a88a', fontWeight: 600 }}>{selectedBook.isbn}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedBook.course_code && <span style={{ background: '#e6f9f5', color: '#00a88a', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{selectedBook.course_code}</span>}
                  </div>
                </div>
              </div>

              {/* Boutons action */}
              <div style={{ padding: '0 20px 16px', display: 'flex', gap: 10 }}>
                <button
                  onClick={() => toggleWishlist(selectedBook.id)}
                  style={{
                    padding: '10px 14px', flexShrink: 0,
                    background: wishlist.has(selectedBook.id) ? '#fff0f0' : '#f7fafc',
                    color: wishlist.has(selectedBook.id) ? '#e53e3e' : '#a0aec0',
                    border: `1px solid ${wishlist.has(selectedBook.id) ? '#fed7d7' : '#e2e8f0'}`,
                    borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer'
                  }}
                  title={wishlist.has(selectedBook.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  {wishlist.has(selectedBook.id) ? '❤️' : '🤍'}
                </button>
                <button
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (selectedBook.title) params.set('title', selectedBook.title)
                    if (selectedBook.authors) params.set('authors', selectedBook.authors)
                    if (selectedBook.isbn) params.set('isbn', selectedBook.isbn)
                    if (selectedBook.course_code) params.set('course', selectedBook.course_code)
                    if (selectedBook.image_url) params.set('cover', selectedBook.image_url)
                    setSelectedBook(null)
                    router.push(`/create?${params.toString()}`)
                  }}
                  style={{
                    flex: 1, padding: '10px',
                    background: 'white', color: '#00a88a',
                    border: '2px solid #00c9a7', borderRadius: 8,
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf9' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
                >
                  💰 Vendre mon exemplaire
                </button>
              </div>
            </div>

            {/* ── ZONE BASSE : tous les vendeurs ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              {/* Titre + filtres dynamiques */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e4a', marginBottom: 10 }}>
                  {allSellers.length} vendeur{allSellers.length > 1 ? 's' : ''} · trié par prix
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(() => {
                    const countCampus = allSellers.filter(s => s.meet_campus).length
                    const countCity = allSellers.filter(s => s.meet_city).length
                    const countPost = allSellers.filter(s => s.post).length
                    const methods = [
                      { key: 'all', label: 'Tous', count: allSellers.length },
                      countCampus > 0 && { key: 'campus', label: '🏫 Campus', count: countCampus },
                      countCity > 0 && { key: 'city', label: '🏙️ Ville', count: countCity },
                      countPost > 0 && { key: 'post', label: '📦 Postal', count: countPost },
                    ].filter(Boolean)
                    return methods.map(f => {
                      const isAll = f.key === 'all'
                      const isActive = isAll
                        ? filterMethods.size === 0
                        : filterMethods.has(f.key)
                      const toggle = () => {
                        if (isAll) { setFilterMethods(new Set()); return }
                        const next = new Set(filterMethods)
                        if (next.has(f.key)) next.delete(f.key)
                        else next.add(f.key)
                        setFilterMethods(next)
                      }
                      return (
                        <button key={f.key} onClick={toggle} style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer',
                          border: isActive ? 'none' : '1px solid #e2e8f0',
                          background: isActive ? '#1a2e4a' : 'white',
                          color: isActive ? 'white' : '#4a5568',
                          display: 'flex', alignItems: 'center', gap: 5,
                          boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                        }}>
                          {f.label}
                          <span style={{
                            background: isActive ? 'rgba(255,255,255,0.25)' : '#f0f4f8',
                            color: isActive ? 'white' : '#718096',
                            borderRadius: 20, padding: '0 6px', fontSize: 10, fontWeight: 700
                          }}>{f.count}</span>
                        </button>
                      )
                    })
                  })()}
                </div>
              </div>

              {filteredSellers.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#a0aec0', padding: '30px', fontSize: 13 }}>
                  Aucun vendeur avec cette méthode
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredSellers.map(s => {
                    const isOpen = expandedSeller === s.id
                    const savings = s.original_price > 0 && s.original_price > s.price
                      ? Math.round(((s.original_price - s.price) / s.original_price) * 100)
                      : null
                    return (
                      <div key={s.id} style={{
                        background: 'white', borderRadius: 12,
                        border: isOpen ? '2px solid #00c9a7' : '1px solid #e2e8f0',
                        overflow: 'hidden', transition: 'border-color 0.15s'
                      }}>
                        {/* Ligne compacte — toujours visible */}
                        <div
                          style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                          onClick={() => setExpandedSeller(isOpen ? null : s.id)}
                        >
                          {/* Mini avatar vendeur */}
                          {(() => {
                            const p = profilesMap[s.user_id]
                            return p?.avatar_url ? (
                              <img src={p.avatar_url} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#1a2e4a,#00c9a7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                {(p?.first_name || s.campus || '?')[0].toUpperCase()}
                              </div>
                            )
                          })()}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#1a2e4a', fontSize: 13 }}>
                              {(() => {
                                const p = profilesMap[s.user_id]
                                return p?.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : (s.campus || 'Vendeur')
                              })()}
                            </div>
                            {(() => {
                              const p = profilesMap[s.user_id]
                              const inst = s.campus || p?.institution
                              return inst ? <div style={{ fontSize: 11, color: '#a0aec0' }}>🏫 {inst}</div> : null
                            })()}
                            <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                              {s.meet_campus && <span style={{ background: '#ede9fe', color: '#6c63ff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>🏫 Campus</span>}
                              {s.meet_city && <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>🏙️ Ville</span>}
                              {s.post && <span style={{ background: '#dbeafe', color: '#2563eb', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>📦 Postal</span>}
                              {s.description && <span style={{ fontSize: 10, color: '#a0aec0' }}>· {s.description}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#1a2e4a' }}>{s.price} $</div>
                            {savings && <span style={{ background: '#00c9a7', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>-{savings}%</span>}
                          </div>
                          <div style={{ color: '#a0aec0', fontSize: 14, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</div>
                        </div>

                        {/* Détails expandés */}
                        {isOpen && (
                          <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f0f4f8' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', margin: '12px 0', fontSize: 13 }}>
                              {s.isbn && <><span style={{ color: '#a0aec0', fontWeight: 600 }}>ISBN</span><span style={{ color: '#00a88a', fontWeight: 600 }}>{s.isbn}</span></>}
                              <span style={{ color: '#a0aec0', fontWeight: 600 }}>Tu paies</span>
                              <span>
                                <strong style={{ color: '#1a2e4a', fontSize: 16 }}>{s.price} $</strong>
                                {savings && <span style={{ marginLeft: 8, background: '#00c9a7', color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>-{savings}%</span>}
                              </span>
                              {s.original_price > 0 && <><span style={{ color: '#a0aec0', fontWeight: 600 }}>Prix neuf</span><span style={{ color: '#a0aec0', textDecoration: 'line-through' }}>{s.original_price} $</span></>}
                              {s.description && <><span style={{ color: '#a0aec0', fontWeight: 600 }}>État</span><span style={{ color: '#1a2e4a' }}>{s.description}</span></>}
                              {(() => {
                                const p = profilesMap[s.user_id]
                                const name = p?.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : null
                                // Campus annonce > institution profil (une seule source, pas de contradiction)
                                const location = s.campus || p?.institution || null
                                return <>
                                  {name && <><span style={{ color: '#a0aec0', fontWeight: 600 }}>Vendeur</span><span style={{ color: '#1a2e4a', fontWeight: 600 }}>{name}</span></>}
                                  {location && <><span style={{ color: '#a0aec0', fontWeight: 600 }}>Campus</span><span style={{ color: '#1a2e4a' }}>{location}</span></>}
                                </>
                              })()}
                              <span style={{ color: '#a0aec0', fontWeight: 600 }}>Publié</span><span style={{ color: '#718096' }}>{timeAgo(s.created_at)}</span>
                              <span style={{ color: '#a0aec0', fontWeight: 600 }}>Transaction</span>
                              <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {s.meet_campus && <span style={{ background: '#ede9fe', color: '#6c63ff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>🏫 Campus</span>}
                                {s.meet_city && <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>🏙️ En ville</span>}
                                {s.post && <span style={{ background: '#dbeafe', color: '#2563eb', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>📦 Postal</span>}
                              </span>
                            </div>

                            {/* Autres annonces du vendeur — toggle */}
                            {(() => {
                              const otherBooks = listings.filter(l => l.user_id === s.user_id && l.id !== s.id)
                              if (otherBooks.length === 0) return null
                              const open = showSellerBooks === s.id
                              return (
                                <div style={{ marginBottom: 12 }}>
                                  <button
                                    onClick={() => setShowSellerBooks(open ? null : s.id)}
                                    style={{
                                      width: '100%', padding: '10px 14px',
                                      background: open ? '#1a2e4a' : '#f0f4f8',
                                      color: open ? 'white' : '#1a2e4a',
                                      border: 'none', borderRadius: 8,
                                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}
                                  >
                                    <span>📚 {otherBooks.length} autre{otherBooks.length > 1 ? 's' : ''} annonce{otherBooks.length > 1 ? 's' : ''} de ce vendeur</span>
                                    <span style={{ fontSize: 16 }}>{open ? '▲' : '▼'}</span>
                                  </button>

                                  {open && (
                                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {otherBooks.map(ob => (
                                        <div key={ob.id}
                                          onClick={() => { setSelectedBook(ob); setExpandedSeller(null); setShowSellerBooks(null) }}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            background: 'white', borderRadius: 8, padding: '10px 12px',
                                            border: '1px solid #e2e8f0', cursor: 'pointer',
                                            transition: 'all 0.15s'
                                          }}
                                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#00c9a7'; e.currentTarget.style.background = '#f0fdf9' }}
                                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white' }}
                                        >
                                          {ob.image_url ? (
                                            <img src={ob.image_url} style={{ width: 36, height: 44, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                                          ) : (
                                            <div style={{ width: 36, height: 44, background: 'linear-gradient(135deg,#1a2e4a,#0d4f6b)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📖</div>
                                          )}
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#00a88a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ob.title}</div>
                                            {ob.authors && <div style={{ fontSize: 10, color: '#a0aec0' }}>{ob.authors}</div>}
                                            {ob.description && <div style={{ fontSize: 10, color: '#718096' }}>{ob.description}</div>}
                                          </div>
                                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a2e4a' }}>{ob.price} $</div>
                                            {ob.original_price > 0 && ob.original_price > ob.price && (
                                              <span style={{ background: '#00c9a7', color: 'white', borderRadius: 20, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>
                                                -{Math.round(((ob.original_price - ob.price) / ob.original_price) * 100)}%
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })()}

                            {s.user_id === user?.id ? (
                              <div style={{ textAlign: 'center', padding: '8px', background: '#f0f4f8', borderRadius: 8, fontSize: 12, color: '#a0aec0' }}>
                                C'est ton annonce
                              </div>
                            ) : !phoneSaved ? (
                              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '12px 14px', fontSize: 13 }}>
                                <div style={{ fontWeight: 700, color: '#7b5e00', marginBottom: 4 }}>🇨🇦 Numéro canadien requis</div>
                                <div style={{ color: '#a07020', marginBottom: 10, fontSize: 12 }}>
                                  Tu dois vérifier un numéro canadien (+1) pour contacter les vendeurs.
                                </div>
                                <button
                                  onClick={() => {
                                    setVerifyRedirect('/inbox')
                                    setSelectedBook(null)
                                    setView('vendre')
                                  }}
                                  style={{ width: '100%', padding: '8px', background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                                >
                                  Vérifier mon numéro →
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={async () => {
                                  if (!user || s.user_id === user.id) return
                                  const { data: existing } = await supabase
                                    .from('conversations')
                                    .select('id')
                                    .or(`and(user1_id.eq.${user.id},user2_id.eq.${s.user_id}),and(user1_id.eq.${s.user_id},user2_id.eq.${user.id})`)
                                    .eq('listing_id', s.id)
                                    .single()
                                  let convId = existing?.id
                                  if (!convId) {
                                    const { data: newConv } = await supabase
                                      .from('conversations')
                                      .insert({ user1_id: user.id, user2_id: s.user_id, listing_id: s.id })
                                      .select('id').single()
                                    convId = newConv?.id
                                  }
                                  setSelectedBook(null)
                                  router.push(`/inbox?conv=${convId}`)
                                }}
                                style={{ width: '100%', padding: '10px', background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#00c9a7'}
                                onMouseLeave={e => e.currentTarget.style.background = '#1a2e4a'}
                              >✉️ Contacter ce vendeur</button>
                            )}

                            {user?.id === s.user_id && (
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button onClick={() => { setSelectedBook(null); router.push(`/edit/${s.id}`) }} style={{ flex: 1, padding: '8px', background: '#f0fdf9', color: '#00c9a7', border: '1px solid #00c9a7', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>✏️ Modifier</button>
                                <button onClick={() => { setSelectedBook(null); setDeleteConfirmId(s.id) }} style={{ flex: 1, padding: '8px', background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>🗑️ Supprimer</button>
                              </div>
                            )}
                            {user?.id !== s.user_id && (
                              <button onClick={() => { setReportModal(s.id); setReportSent(false); setReportReason('') }} style={{ marginTop: 6, background: 'none', border: 'none', color: '#a0aec0', fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                                🚩 Signaler cette annonce
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
        )
      })()}
    </div>
  )
}
