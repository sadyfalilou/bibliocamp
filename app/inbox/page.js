'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '../../components/Logo'
import LogoIcon from '../../components/LogoIcon'
import ProfileMenu from '../../components/ProfileMenu'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor(diff / 60000)
  if (days > 0) return `${days}j`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}min`
  return 'maintenant'
}

function InboxInner() {
  const [user, setUser] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles] = useState({})
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unreadByConv, setUnreadByConv] = useState({})
  const [isMobile, setIsMobile] = useState(false)
  const [deletingConv, setDeletingConv] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const prevUnreadRef = useRef(0)
  const audioCtxRef = useRef(null)
  const messagesEndRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      await fetchConversations(session.user.id)

      // Charger le profil de l'utilisateur courant (pour le message système)
      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', session.user.id)
        .single()
      if (prof) setCurrentProfile(prof)

      setLoading(false)

      // Ouvrir une conv spécifique depuis l'URL
      const convId = searchParams.get('conv')
      if (convId) setSelectedConv(Number(convId))
    }
    init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Rafraîchir les messages quand l'utilisateur revient sur l'onglet (mobile throttling fix)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && selectedConv) {
        fetchMessages(selectedConv)
        markAsRead(selectedConv)
      }
      if (document.visibilityState === 'visible' && user?.id) {
        fetchConversations(user.id)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [selectedConv, user?.id])

  useEffect(() => {
    if (!selectedConv) return
    fetchMessages(selectedConv)
    markAsRead(selectedConv)

    // Realtime : écoute les nouveaux messages dans la conversation ouverte
    const channel = supabase
      .channel(`messages:${selectedConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConv}`,
      }, (payload) => {
        setMessages(prev => {
          // Évite les doublons (message optimiste déjà affiché)
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        markAsRead(selectedConv)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedConv])

  const fetchConversations = async (userId) => {
    const { data: allConvs } = await supabase
      .from('conversations')
      .select('*, listings(title, price, image_url), roommate_listings(title, rent_price, image_url)')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (!allConvs) return

    // Filtrer les convs que l'utilisateur courant a supprimées (soft delete)
    const convs = allConvs.filter(c => {
      if (c.user1_id === userId) return !c.deleted_by_user1
      if (c.user2_id === userId) return !c.deleted_by_user2
      return true
    })

    setConversations(convs)

    // Compter les non lus par conversation
    const convIds = convs.map(c => c.id)
    const { data: unreadMsgs } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .eq('read', false)
      .neq('sender_id', userId)
    if (unreadMsgs) {
      const map = {}
      unreadMsgs.forEach(m => { map[m.conversation_id] = (map[m.conversation_id] || 0) + 1 })
      setUnreadByConv(map)
    }

    // Charger les profils des interlocuteurs
    const otherIds = [...new Set(convs.map(c => c.user1_id === userId ? c.user2_id : c.user1_id))]
    if (otherIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, institution')
        .in('id', otherIds)
      if (profs) {
        const map = {}
        profs.forEach(p => { map[p.id] = p })
        setProfiles(map)
      }
    }
  }

  const fetchMessages = async (convId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const playSound = async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
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

  const markAsRead = async (convId) => {
    if (!user) return
    await supabase.from('messages')
      .update({ read: true })
      .eq('conversation_id', convId)
      .neq('sender_id', user.id)
    setUnreadByConv(prev => { const next = { ...prev }; delete next[convId]; return next })
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv || sending) return
    if (newMessage.trim().length > 1000) {
      alert('Le message ne peut pas dépasser 1 000 caractères.')
      return
    }
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    // Ajout optimiste — affiche immédiatement sans attendre Supabase
    const tempMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConv,
      sender_id: user.id,
      content,
      read: false,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: selectedConv,
      sender_id: user.id,
      content
    }).select().single()

    // Remplace le message temporaire par le vrai
    if (data) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data : m))
    }

    if (!error) {
      // Réinitialise les flags de suppression douce pour les deux users
      // → si l'un avait supprimé la conv, elle réapparaît quand un nouveau message arrive
      await supabase.from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          deleted_by_user1: false,
          deleted_by_user2: false,
        })
        .eq('id', selectedConv)
      fetchConversations(user.id)
    }
    setSending(false)
  }

  const deleteConversation = async (convId) => {
    setDeletingConv(convId)
    const conv = conversations.find(c => c.id === convId)
    if (!conv) { setDeletingConv(null); return }

    // Suppression douce : on marque la conv comme cachée pour cet utilisateur uniquement
    const field = conv.user1_id === user.id ? 'deleted_by_user1' : 'deleted_by_user2'
    const { data: updated, error } = await supabase
      .from('conversations')
      .update({ [field]: true })
      .eq('id', convId)
      .select('deleted_by_user1, deleted_by_user2')
      .single()

    if (error) {
      alert(`Erreur : ${error.message}`)
      setDeletingConv(null)
      return
    }

    // Si les deux users ont supprimé → suppression définitive
    if (updated?.deleted_by_user1 && updated?.deleted_by_user2) {
      await supabase.from('messages').delete().eq('conversation_id', convId)
      await supabase.from('conversations').delete().eq('id', convId)
    } else {
      // Insérer un message système pour avertir l'autre user
      const senderName = currentProfile?.first_name || user.user_metadata?.first_name || 'Un utilisateur'
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: user.id,
        content: `${senderName} a quitté la conversation.`,
        type: 'system',
      })
    }

    setConversations(prev => prev.filter(c => c.id !== convId))
    if (selectedConv === convId) setSelectedConv(null)
    setConfirmDelete(null)
    setDeletingConv(null)
  }

  const SYSTEM_ADMIN_PROFILE = { first_name: 'Support', last_name: 'BiblioCamp', institution: null, avatar_url: null, isSystem: true }

  const getOtherUser = (conv) => {
    if (!user) return null
    // Conversation initiée par un admin : le vendeur (user2) voit "Support BiblioCamp"
    // au lieu du profil personnel de l'admin (user1) qui a écrit.
    if (conv.context_type === 'admin' && conv.user1_id !== user.id) {
      return SYSTEM_ADMIN_PROFILE
    }
    const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
    return profiles[otherId]
  }

  // Realtime : écoute les nouveaux messages sur TOUTES les conversations (badges + son)
  useEffect(() => {
    if (!user?.id) return

    document.addEventListener('click', () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
    }, { once: true })

    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new
        // Ignorer ses propres messages et ceux de la conv ouverte (déjà gérés)
        if (msg.sender_id === user.id) return
        if (msg.conversation_id === selectedConv) return

        // Badge non lu + son
        setUnreadByConv(prev => ({
          ...prev,
          [msg.conversation_id]: (prev[msg.conversation_id] || 0) + 1,
        }))
        prevUnreadRef.current += 1
        playSound()

        // Rafraîchir la liste pour mettre à jour last_message_at
        fetchConversations(user.id)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, selectedConv])

  const selectedConvData = conversations.find(c => c.id === selectedConv)
  const otherUser = selectedConvData ? getOtherUser(selectedConvData) : null

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#f5f7fa', color: '#1a2e4a', fontSize: 18, fontWeight: 600 }}>
      Chargement...
    </div>
  )

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", position: 'fixed', inset: 0, background: '#f5f7fa', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* HEADER */}
      <header style={{ background: '#1a2e4a', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        {/* Mobile : bouton retour liste si conv ouverte, sinon logo */}
        {isMobile && selectedConv ? (
          <button onClick={() => setSelectedConv(null)} style={{ background: 'transparent', color: 'white', border: 'none', padding: '6px 4px', cursor: 'pointer', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Messages
          </button>
        ) : (
          <Logo variant="light" size="sm" onClick={() => router.push('/app')} style={{ cursor: 'pointer' }} />
        )}
        {!(isMobile && selectedConv) && <ProfileMenu user={user} />}
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 60px)' }}>

        {/* LISTE DES CONVERSATIONS */}
        <div style={{
          width: isMobile ? '100%' : 320,
          background: 'white',
          borderRight: '1px solid #e2e8f0',
          display: isMobile && selectedConv ? 'none' : 'flex',
          flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
        }}>
          <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #f0f4f8' }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1a2e4a', margin: 0 }}>Messages</h1>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a0aec0' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✉️</div>
                <div style={{ fontSize: 14 }}>Aucune conversation</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Contacte un vendeur depuis un livre</div>
              </div>
            ) : conversations.map(conv => {
              const other = getOtherUser(conv)
              const isSelected = conv.id === selectedConv
              const hasUnread = unreadByConv[conv.id] > 0
              return (
                <div key={conv.id} style={{
                  padding: '14px 20px',
                  background: isSelected ? '#f0fdf9' : hasUnread ? '#fffbf0' : 'white',
                  borderLeft: isSelected ? '3px solid #00c9a7' : hasUnread ? '3px solid #e53e3e' : '3px solid transparent',
                  borderBottom: '1px solid #f7fafc',
                  display: 'flex', gap: 12, alignItems: 'center',
                  transition: 'background 0.1s', position: 'relative'
                }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = '#f8fafc'
                    const btn = e.currentTarget.querySelector('.del-btn')
                    if (btn) btn.style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'white'
                    const btn = e.currentTarget.querySelector('.del-btn')
                    if (btn) btn.style.opacity = '0'
                  }}
                >
                  <div onClick={() => setSelectedConv(conv.id)} style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  {/* Avatar */}
                  {other?.isSystem ? (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'white', border: '1px solid #e2e8f0' }}>
                      <LogoIcon size={28} />
                    </div>
                  ) : other?.avatar_url ? (
                    <img src={other.avatar_url} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#1a2e4a,#00c9a7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                      {other?.first_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1a2e4a', fontSize: 14, marginBottom: 2 }}>
                      {other?.first_name ? `${other.first_name} ${other.last_name || ''}`.trim() : 'Utilisateur'}
                    </div>
                    {conv.context_type === 'admin' ? (
                      <div style={{ fontSize: 11, color: '#b45309', fontWeight: 600 }}>Équipe support</div>
                    ) : conv.context_type === 'tuteur' ? (
                      <div style={{ fontSize: 11, color: '#00c9a7', fontWeight: 600 }}>🎓 Tuteur</div>
                    ) : conv.context_type === 'colocation' ? (
                      <div style={{ fontSize: 11, color: '#0d4f6b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🏠 {conv.roommate_listings?.title || 'Coloc'}
                      </div>
                    ) : conv.listings && (
                      <div style={{ fontSize: 11, color: '#a0aec0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📖 {conv.listings.title}
                      </div>
                    )}
                    {other?.institution && (
                      <div style={{ fontSize: 11, color: '#718096' }}>🏫 {other.institution}</div>
                    )}
                  </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: '#b0bec5' }}>{timeAgo(conv.last_message_at)}</div>
                      {hasUnread && (
                        <div style={{
                          background: '#e53e3e', color: 'white',
                          borderRadius: '50%', width: 18, height: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800
                        }}>
                          {unreadByConv[conv.id] > 9 ? '9+' : unreadByConv[conv.id]}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Bouton supprimer */}
                  <button
                    className="del-btn"
                    onClick={e => { e.stopPropagation(); setConfirmDelete(conv.id) }}
                    style={{
                      opacity: 0, transition: 'opacity 0.15s',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#e53e3e', fontSize: 16, padding: '4px 6px',
                      borderRadius: 6, flexShrink: 0,
                      display: 'flex', alignItems: 'center'
                    }}
                    title="Supprimer la conversation"
                  >🗑️</button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ZONE DE MESSAGES */}
        <div style={{
          flex: 1, display: isMobile && !selectedConv ? 'none' : 'flex',
          flexDirection: 'column', overflow: 'hidden',
          width: isMobile ? '100%' : 'auto'
        }}>
          {!selectedConv ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#718096' }}>Sélectionne une conversation</div>
              <div style={{ fontSize: 13, color: '#b0bec5' }}>ou contacte un vendeur depuis un livre</div>
              <button onClick={() => router.push('/app')} style={{ marginTop: 8, background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                Parcourir les manuels →
              </button>
            </div>
          ) : (
            <>
              {/* Header conversation */}
              <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
                {otherUser?.isSystem ? (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #e2e8f0' }}>
                    <LogoIcon size={26} />
                  </div>
                ) : otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#1a2e4a,#00c9a7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>
                    {otherUser?.first_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, color: '#1a2e4a', fontSize: 15 }}>
                    {otherUser?.first_name ? `${otherUser.first_name} ${otherUser.last_name || ''}`.trim() : 'Utilisateur'}
                  </div>
                  {selectedConvData?.context_type === 'admin' ? (
                    <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>🛠️ Message de l'équipe BiblioCamp</div>
                  ) : selectedConvData?.context_type === 'tuteur' ? (
                    <div style={{ fontSize: 12, color: '#00c9a7', fontWeight: 600 }}>🎓 Conversation tuteur</div>
                  ) : selectedConvData?.context_type === 'colocation' ? (
                    <div style={{ fontSize: 12, color: '#0d4f6b', fontWeight: 600 }}>
                      🏠 {selectedConvData.roommate_listings?.title || 'Coloc'}{selectedConvData.roommate_listings?.rent_price ? ` · ${selectedConvData.roommate_listings.rent_price} $/mois` : ''}
                    </div>
                  ) : selectedConvData?.listings && (
                    <div style={{ fontSize: 12, color: '#a0aec0' }}>📖 {selectedConvData.listings.title} · {selectedConvData.listings.price} $</div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#b0bec5', marginTop: 40, fontSize: 13 }}>
                    Début de la conversation · dis bonjour 👋
                  </div>
                ) : messages.map(msg => {
                  // Message système (ex: "X a quitté la conversation")
                  if (msg.type === 'system') {
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                        <div style={{
                          fontSize: 12, color: '#9ca3af', fontStyle: 'italic',
                          background: '#f3f4f6', borderRadius: 20,
                          padding: '5px 14px', maxWidth: '80%', textAlign: 'center'
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  }

                  const isMe = msg.sender_id === user?.id
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '10px 14px',
                        background: isMe ? '#1a2e4a' : 'white',
                        color: isMe ? 'white' : '#1a2e4a',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        border: isMe ? 'none' : '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.content}</div>
                        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                          {new Date(msg.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input message */}
              <form onSubmit={sendMessage} style={{ padding: '12px 24px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                {newMessage.length > 800 && (
                  <div style={{ fontSize: 11, color: newMessage.length > 950 ? '#e53e3e' : '#f59e0b', textAlign: 'right', marginBottom: 4 }}>
                    {newMessage.length}/1000 caractères
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  maxLength={1000}
                  placeholder="Écris ton message..."
                  style={{
                    flex: 1, padding: '12px 16px',
                    border: `1px solid ${newMessage.length > 950 ? '#e53e3e' : '#e2e8f0'}`,
                    borderRadius: 24, fontSize: 14, outline: 'none', background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#00c9a7'}
                  onBlur={e => e.target.style.borderColor = newMessage.length > 950 ? '#e53e3e' : '#e2e8f0'}
                />
                <button type="submit" disabled={!newMessage.trim() || sending} style={{
                  background: newMessage.trim() ? '#1a2e4a' : '#e2e8f0',
                  color: newMessage.trim() ? 'white' : '#a0aec0',
                  border: 'none', borderRadius: '50%',
                  width: 44, height: 44, cursor: newMessage.trim() ? 'pointer' : 'default',
                  fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0
                }}
                  onMouseEnter={e => { if (newMessage.trim()) e.currentTarget.style.background = '#00c9a7' }}
                  onMouseLeave={e => { if (newMessage.trim()) e.currentTarget.style.background = '#1a2e4a' }}
                >
                  ➤
                </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
      {/* MODAL CONFIRMATION SUPPRESSION */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setConfirmDelete(null)}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '28px 32px',
            maxWidth: 360, width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1a2e4a' }}>
              Supprimer la conversation ?
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>
              Tous les messages seront effacés définitivement.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: 9,
                  padding: '10px 20px', fontSize: 14, fontWeight: 600,
                  color: '#64748b', cursor: 'pointer'
                }}
              >Annuler</button>
              <button
                onClick={() => deleteConversation(confirmDelete)}
                disabled={deletingConv === confirmDelete}
                style={{
                  background: '#e53e3e', border: 'none', borderRadius: 9,
                  padding: '10px 20px', fontSize: 14, fontWeight: 700,
                  color: 'white', cursor: 'pointer', opacity: deletingConv === confirmDelete ? 0.7 : 1
                }}
              >
                {deletingConv === confirmDelete ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Inbox() {
  return <Suspense><InboxInner /></Suspense>
}
