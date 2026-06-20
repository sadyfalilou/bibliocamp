'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROOM_TYPE_LABELS = {
  chambre_privee: 'Chambre privée',
  chambre_partagee: 'Chambre partagée',
  appartement_complet: 'Appartement complet',
}

export default function MesColocsView({ user, setView, onEdit }) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('roommate_listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStatus = async (item) => {
    setActingId(item.id)
    const { data: { session } } = await supabase.auth.getSession()
    const newStatus = item.status === 'active' ? 'rented' : 'active'
    await fetch('/api/roommates', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, status: newStatus })
    })
    setListings(prev => prev.map(l => l.id === item.id ? { ...l, status: newStatus } : l))
    setActingId(null)
  }

  const handleDelete = async (id) => {
    setActingId(id)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/roommates?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    if (res.ok) setListings(prev => prev.filter(l => l.id !== id))
    setActingId(null)
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a2e4a', margin: '0 0 20px' }}>
        Mes annonces coloc
      </h1>

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Chargement...</p>
      ) : listings.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, padding: 50, border: '1px solid #e2e8f0', textAlign: 'center', color: '#a0aec0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <p style={{ marginBottom: 20 }}>Tu n'as encore publié aucune annonce.</p>
          <button onClick={() => setView('publier-coloc')} style={{ background: '#1a2e4a', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>
            + Publier ma première annonce
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {listings.map(item => (
            <div key={item.id} style={{
              background: item.status === 'rented' ? '#f8fafc' : 'white', borderRadius: 10, padding: 14,
              border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14,
              opacity: item.status === 'rented' ? 0.75 : 1
            }}>
              {item.image_url ? (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={item.image_url} alt={item.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                  {item.image_urls?.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 1, right: 1, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 20 }}>
                      +{item.image_urls.length - 1}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#1a2e4a,#0d4f6b)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏠</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 700, color: '#00a88a', fontSize: 14 }}>{item.title}</div>
                  {item.status === 'rented' && <span style={{ fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#16a34a', padding: '1px 6px', borderRadius: 10 }}>Louée</span>}
                </div>
                <div style={{ fontSize: 12, color: '#718096' }}>{ROOM_TYPE_LABELS[item.room_type]} · {item.rent_price} $/mois</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  disabled={actingId === item.id}
                  onClick={() => onEdit?.(item.id)}
                  style={{ background: '#f8fafc', color: '#1a2e4a', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  Modifier
                </button>
                <button
                  disabled={actingId === item.id}
                  onClick={() => toggleStatus(item)}
                  style={{ background: '#f0fdf9', color: '#00a88a', border: '1px solid #00c9a7', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  {item.status === 'active' ? 'Marquer louée' : 'Remettre en ligne'}
                </button>
                <button
                  disabled={actingId === item.id}
                  onClick={() => handleDelete(item.id)}
                  style={{ background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
