'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '../../components/Logo'

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

  useEffect(() => {
    if (!selectedConv) return
    fetchMessages(selectedConv)
    markAsRead(selectedConv)

    // Polling toutes les 3s pour les nouveaux messages
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConv)
        .order('created_at', { ascending: true })
      if (data) {
        setMessages(data)
        markAsRead(selectedConv)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [selectedConv])

  const fetchConversations = async (userId) => {
    const { data: convs } = await supabase
      .from('conversations')
      .select('*, listings(title, price, image_url)')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (!convs) return
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
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConv)
      fetchConversations(user.id)
    }
    setSending(false)
  }

  const deleteConversation = async (convId) => {
    setDeletingConv(convId)
    const { error: msgError } = await supabase.from('messages').delete().eq('conversation_id', convId)
    if (msgError) {
      alert(`Erreur lors de la suppression des messages : ${msgError.message}\n\nVérifie les règles RLS sur la table "messages" dans Supabase.`)
      setDeletingConv(null)
      return
    }
    const { error: convError } = await supabase.from('conversations').delete().eq('id', convId)
    if (convError) {
      alert(`Erreur lors de la suppression de la conversation : ${convError.message}\n\nVérifie les règles RLS sur la table "conversations" dans Supabase.`)
      setDeletingConv(null)
      return
    }
    setConversations(prev => prev.filter(c => c.id !== convId))
    if (selectedConv === convId) setSelectedConv(null)
    setConfirmDelete(null)
    setDeletingConv(null)
  }

  const getOtherUser = (conv) => {
    if (!user) return null
    const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
    return profiles[otherId]
  }

  // Polling notifications pour les OTHER conversations (toutes les 5s)
  useEffect(() => {
    if (!user?.id) return
    document.addEventListener('click', () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
    }, { once: true })

    const checkOtherConvs = async () => {
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      if (!convs) return

      // Compter non lus dans toutes les convs SAUF celle ouverte
      const otherIds = convs.map(c => c.id).filter(id => id !== selectedConv)
      if (otherIds.length === 0) return

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', otherIds)
        .eq('read', false)
        .neq('sender_id', user.id)

      const newCount = count || 0

      // Rafraîchir la liste des convs pour les badges
      fetchConversations(user.id)

      // Son si nouveaux messages non lus
      if (newCount > prevUnreadRef.current) {
        playSound()
      }
      prevUnreadRef.current = newCount
    }

    checkOtherConvs()
    const interval = setInterval(checkOtherConvs, 5000)
    return () => clearInterval(interval)
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
        <button onClick={() => router.push('/app')} style={{ background: 'transparent', color: '#a0aec0', border: '1px solid #2d4a6b', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#00c9a7' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#a0aec0'; e.currentTarget.style.borderColor = '#2d4a6b' }}
        >← Marketplace</button>
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
                  {other?.avatar_url ? (
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
                    {conv.listings && (
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
                {otherUser?.avatar_url ? (
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
                  {selectedConvData?.listings && (
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
