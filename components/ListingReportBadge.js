'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Indique qu'une annonce a un signalement en attente de revue par
// un admin. Ne révèle pas le motif ni l'identité du rapporteur —
// seulement le fait qu'un signalement existe, pour rester neutre
// avant toute décision.
export default function ListingReportBadge({ listingId }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!listingId) return
    const load = async () => {
      const { count: c } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', listingId)
      setCount(c || 0)
    }
    load()
  }, [listingId])

  if (count === 0) return null

  return (
    <div style={{
      background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8,
      padding: '8px 10px', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>🚩</span>
      <div style={{ fontSize: 12, color: '#9a3412' }}>
        Cette annonce a été signalée et est en attente de revue par l'équipe BiblioCamp.
      </div>
    </div>
  )
}
