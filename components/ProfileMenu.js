'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function ProfileMenu({ user }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, institution')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      const { count: wishlist } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setWishlistCount(wishlist || 0)

      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      if (convs && convs.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', convs.map(c => c.id))
          .eq('read', false)
          .neq('sender_id', user.id)
        setUnreadMessages(count || 0)
      }
    }
    load()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.replace('/')
  }

  const items = [
    { icon: '❤️', label: 'Mes favoris', badge: wishlistCount > 0 ? wishlistCount : null, action: () => { router.push('/app?view=favoris'); setOpen(false) } },
    { icon: '✉️', label: 'Messages', badge: unreadMessages > 0 ? unreadMessages : null, action: () => { router.push('/inbox'); setOpen(false) } },
    { icon: '📋', label: 'Mes annonces', badge: null, action: () => { router.push('/app?view=mes-annonces'); setOpen(false) } },
    { icon: '👤', label: 'Mon profil', badge: null, action: () => { router.push('/profile'); setOpen(false) } },
    { icon: '🔗', label: 'Inviter des amis', badge: null, action: () => { router.push('/profile'); setOpen(false) } },
  ]

  if (!user) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: open ? '#243d5a' : 'transparent',
          border: `1px solid ${open ? '#4a6a8a' : '#2d4a6b'}`,
          borderRadius: 30, padding: '5px 6px 5px 12px',
          cursor: 'pointer', transition: 'box-shadow 0.15s',
          boxShadow: open ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          <div style={{ width: 15, height: 1.5, background: '#a0aec0', borderRadius: 2 }} />
          <div style={{ width: 15, height: 1.5, background: '#a0aec0', borderRadius: 2 }} />
          <div style={{ width: 15, height: 1.5, background: '#a0aec0', borderRadius: 2 }} />
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 32, height: 32, background: '#00c9a7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
              {(profile?.first_name || user?.email)?.[0]?.toUpperCase()}
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

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 300 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            background: 'white', borderRadius: 14,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            minWidth: 220, zIndex: 301,
            overflow: 'hidden', border: '1px solid #e2e8f0'
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f4f8', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#1a2e4a,#00c9a7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                  {(profile?.first_name || user?.email)?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, color: '#1a2e4a', fontSize: 14 }}>
                  {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Mon compte'}
                </div>
                <div style={{ fontSize: 12, color: '#a0aec0' }}>{user?.email}</div>
                {profile?.institution && <div style={{ fontSize: 11, color: '#00a88a', marginTop: 2 }}>🏫 {profile.institution}</div>}
              </div>
            </div>

            {items.map(item => (
              <div key={item.label} onClick={item.action} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', cursor: 'pointer',
                borderBottom: '1px solid #f0f4f8',
                transition: 'background 0.1s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 14, color: '#1a2e4a', fontWeight: 500 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ background: '#e53e3e', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{item.badge}</span>
                )}
              </div>
            ))}

            <div onClick={() => { handleLogout(); setOpen(false) }} style={{
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
  )
}
