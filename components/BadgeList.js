'use client'

import { useEffect, useState } from 'react'

// Ordre de prestige (du plus au moins important)
const PRESTIGE_ORDER = ['ambassador', 'active_seller', 'founder', 'librarian', 'verified_profile', 'early_adopter']

/**
 * mode="card"    → 1 seul badge (le plus prestigieux) en micro-puce, style Airbnb
 * mode="profile" → tous les badges, gagnés + grisés (showLocked), format complet
 */
export default function BadgeList({ userId, mode = 'card' }) {
  const [badges, setBadges] = useState(null)
  const [all, setAll] = useState([])
  const [earned, setEarned] = useState([])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/badges?user_id=${userId}`)
      .then(r => r.json())
      .then(d => {
        setBadges(d.badges || [])
        setAll(d.all || [])
        setEarned(d.earned || [])
      })
  }, [userId])

  if (!badges) return null

  // MODE CARD — 1 seul badge, le plus prestigieux
  if (mode === 'card') {
    if (badges.length === 0) return null
    const top = PRESTIGE_ORDER.map(id => badges.find(b => b.id === id)).find(Boolean) || badges[0]
    return (
      <span
        title={top.desc}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: '#f0fdf9',
          border: '1px solid #b2f5ea',
          borderRadius: 20,
          padding: '2px 8px',
          fontSize: 11, fontWeight: 700,
          color: '#00a88a',
          userSelect: 'none', cursor: 'default'
        }}
      >
        {top.emoji} {top.label}
      </span>
    )
  }

  // MODE PROFILE — tous les badges, gagnés + à débloquer en grisé
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {all.map(badge => {
        const isEarned = earned.includes(badge.id)
        return (
          <div
            key={badge.id}
            title={isEarned ? badge.desc : `À débloquer : ${badge.desc}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              fontSize: 12, fontWeight: 700,
              background: isEarned ? 'linear-gradient(135deg, #f0fdf9, #f0f4ff)' : '#f8fafc',
              border: `1px solid ${isEarned ? '#00c9a7' : '#e8edf2'}`,
              color: isEarned ? '#1a2e4a' : '#c0ccd8',
              opacity: isEarned ? 1 : 0.65,
              transition: 'all 0.15s',
              cursor: 'default', userSelect: 'none'
            }}
          >
            <span style={{ fontSize: 15 }}>{badge.emoji}</span>
            {badge.label}
            {!isEarned && <span style={{ fontSize: 10, opacity: 0.6 }}>🔒</span>}
          </div>
        )
      })}
    </div>
  )
}
