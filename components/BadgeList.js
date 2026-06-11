'use client'

import { useEffect, useState } from 'react'

// size: 'sm' | 'md'
// showLocked: affiche les badges non gagnés en grisé
export default function BadgeList({ userId, size = 'md', showLocked = false }) {
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
  if (badges.length === 0 && !showLocked) return null

  const isSm = size === 'sm'

  const list = showLocked ? all : badges

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: isSm ? 6 : 8 }}>
      {list.map(badge => {
        const isEarned = earned.includes(badge.id)
        if (!isEarned && !showLocked) return null
        return (
          <div
            key={badge.id}
            title={badge.desc}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: isSm ? 4 : 6,
              padding: isSm ? '3px 8px' : '5px 12px',
              borderRadius: 20,
              fontSize: isSm ? 11 : 12,
              fontWeight: 700,
              background: isEarned
                ? 'linear-gradient(135deg, #f0fdf9, #f0f4ff)'
                : '#f1f5f9',
              border: `1px solid ${isEarned ? '#00c9a7' : '#e2e8f0'}`,
              color: isEarned ? '#1a2e4a' : '#cbd5e0',
              opacity: isEarned ? 1 : 0.6,
              transition: 'all 0.15s',
              cursor: 'default',
              userSelect: 'none'
            }}
          >
            <span style={{ fontSize: isSm ? 12 : 14 }}>{badge.emoji}</span>
            {badge.label}
          </div>
        )
      })}
    </div>
  )
}
