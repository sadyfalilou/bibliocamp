'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function RemovedListingNotices({ userId }) {
  const [notices, setNotices] = useState([])

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      const { data } = await supabase
        .from('removed_listings_notices')
        .select('id, listing_title, reason, removed_at')
        .eq('user_id', userId)
        .eq('read', false)
        .order('removed_at', { ascending: false })
      setNotices(data || [])
    }
    load()
  }, [userId])

  const dismiss = async (id) => {
    setNotices(prev => prev.filter(n => n.id !== id))
    await supabase.from('removed_listings_notices').update({ read: true }).eq('id', id)
  }

  if (notices.length === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      {notices.map(n => (
        <div key={n.id} style={{
          background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 12,
          padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🚩</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 2 }}>
              Ton annonce « {n.listing_title} » a été retirée
            </div>
            <div style={{ fontSize: 13, color: '#7f1d1d' }}>
              Motif : {n.reason}
            </div>
          </div>
          <button
            onClick={() => dismiss(n.id)}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
          >
            Compris ✕
          </button>
        </div>
      ))}
    </div>
  )
}
