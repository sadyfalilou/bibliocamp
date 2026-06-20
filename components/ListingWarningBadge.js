'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ListingWarningBadge({ userId, listingId }) {
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!userId || !listingId) return
    const load = async () => {
      const { data } = await supabase
        .from('removed_listings_notices')
        .select('id, reason')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .eq('type', 'warning')
        .eq('read', false)
        .order('removed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setNotice(data || null)
    }
    load()
  }, [userId, listingId])

  const dismiss = async () => {
    if (!notice) return
    setNotice(null)
    await supabase.from('removed_listings_notices').update({ read: true }).eq('id', notice.id)
  }

  if (!notice) return null

  return (
    <div style={{
      background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
      padding: '8px 10px', marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 8
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1, fontSize: 12, color: '#92400e' }}>
        <strong>Avertissement</strong> — Motif : {notice.reason}
      </div>
      <button
        onClick={dismiss}
        style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  )
}
