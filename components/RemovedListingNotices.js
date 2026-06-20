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
        .select('id, listing_title, reason, type, listing_id, removed_at')
        .eq('user_id', userId)
        .eq('read', false)
        .order('removed_at', { ascending: false })
      // Les avertissements rattachés à une annonce encore active sont
      // affichés directement sur la carte de l'annonce (ListingWarningBadge),
      // pas besoin de les dupliquer ici.
      setNotices((data || []).filter(n => !(n.type === 'warning' && n.listing_id)))
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
      {notices.map(n => {
        const isWarning = n.type === 'warning'
        const colors = isWarning
          ? { bg: '#fffbeb', border: '#fde68a', text: '#92400e', sub: '#b45309' }
          : { bg: '#fff5f5', border: '#fed7d7', text: '#991b1b', sub: '#7f1d1d' }
        return (
          <div key={n.id} style={{
            background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 12,
            padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{isWarning ? '⚠️' : '🚩'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 2 }}>
                {isWarning
                  ? <>Avertissement concernant ton annonce « {n.listing_title} »</>
                  : <>Ton annonce « {n.listing_title} » a été retirée</>}
              </div>
              <div style={{ fontSize: 13, color: colors.sub }}>
                Motif : {n.reason}
              </div>
            </div>
            <button
              onClick={() => dismiss(n.id)}
              style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
            >
              Compris ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
