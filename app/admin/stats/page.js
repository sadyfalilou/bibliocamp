'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

function Stat({ label, value, sub, color = '#1a2e4a', icon }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 14px' }}>{title}</h2>
      {children}
    </div>
  )
}

function Bar({ label, value, max, color = '#00c9a7' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: '#1a2e4a', fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#64748b' }}>{value}</span>
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 6, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function AdminStatsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erreur'); setLoading(false); return }
      setData(json)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Segoe UI', sans-serif", color: '#1a2e4a', fontSize: 18, fontWeight: 600 }}>
      Chargement des stats...
    </div>
  )

  if (error) return (
    <div style={{ maxWidth: 500, margin: '80px auto', fontFamily: "'Segoe UI', sans-serif", textAlign: 'center' }}>
      <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 12, padding: 24, color: '#c53030' }}>{error}</div>
    </div>
  )

  const { users, listings, messages, referrals, growth } = data

  const maxGrowthUsers = Math.max(...growth.map(g => g.new_users), 1)
  const maxGrowthListings = Math.max(...growth.map(g => g.new_listings), 1)
  const phoneVerifiedPct = users.total > 0 ? Math.round((users.phone_verified / users.total) * 100) : 0
  const soldRate = listings.total > 0 ? Math.round((listings.sold / listings.total) * 100) : 0

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa', padding: '40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}>←</button>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a2e4a', margin: 0 }}>📊 Tableau de bord</h1>
            <p style={{ fontSize: 13, color: '#a0aec0', margin: '4px 0 0' }}>Vue d'ensemble de BiblioCamp</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <a href="/admin/invitations" style={{ fontSize: 13, color: '#00c9a7', fontWeight: 600, textDecoration: 'none', marginRight: 16 }}>Invitations →</a>
            <a href="/admin/reports" style={{ fontSize: 13, color: '#00c9a7', fontWeight: 600, textDecoration: 'none' }}>Signalements →</a>
          </div>
        </div>

        {/* ── UTILISATEURS ── */}
        <Section title="👥 Utilisateurs">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <Stat icon="👥" label="Utilisateurs total" value={users.total} color="#1a2e4a" />
            <Stat icon="🆕" label="Nouveaux cette semaine" value={users.week} sub={`+${users.month} ce mois`} color="#00c9a7" />
            <Stat icon="📱" label="Numéros vérifiés" value={users.phone_verified} sub={`${phoneVerifiedPct}% des comptes`} color="#6c63ff" />
            <Stat icon="🎁" label="Inscrits par parrainage" value={referrals.total} sub={`${referrals.founders} fondateurs`} color="#f59e0b" />
          </div>
        </Section>

        {/* ── ANNONCES ── */}
        <Section title="📚 Annonces">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <Stat icon="✅" label="Annonces actives" value={listings.active} color="#16a34a" />
            <Stat icon="🏷️" label="Vendues" value={listings.sold} sub={`${soldRate}% taux de vente`} color="#e53e3e" />
            <Stat icon="💲" label="Prix moyen" value={listings.avg_price ? `${listings.avg_price} $` : '—'} sub={`${listings.min_price} $ – ${listings.max_price} $`} color="#1a2e4a" />
          </div>

          {/* État des livres */}
          <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>État des livres</div>
            {Object.entries(listings.by_etat).sort((a, b) => b[1] - a[1]).map(([etat, count]) => (
              <Bar key={etat} label={etat} value={count} max={listings.active + listings.sold} color="#00c9a7" />
            ))}
          </div>

          {/* Méthodes de transaction */}
          <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>Méthodes de transaction</div>
            <Bar label="🏫 Campus" value={listings.meet_campus} max={listings.active + listings.sold} color="#6c63ff" />
            <Bar label="🏙️ Ville" value={listings.meet_city} max={listings.active + listings.sold} color="#f59e0b" />
            <Bar label="📦 Envoi postal" value={listings.meet_post} max={listings.active + listings.sold} color="#2563eb" />
          </div>
        </Section>

        {/* ── MESSAGES ── */}
        <Section title="💬 Engagement">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Stat icon="💬" label="Conversations" value={messages.conversations} sub={`+${messages.conv_week} cette semaine`} color="#1a2e4a" />
            <Stat icon="✉️" label="Messages envoyés" value={messages.total} sub={`+${messages.msg_week} cette semaine`} color="#2563eb" />
            <Stat icon="📊" label="Moy. messages/conv" value={messages.avg_per_conv} color="#6c63ff" />
          </div>
        </Section>

        {/* ── CROISSANCE ── */}
        <Section title="📈 Croissance (8 semaines)">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

            <div style={{ flex: 1, minWidth: 260, background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>Nouveaux utilisateurs</div>
              {growth.map((w, i) => (
                <Bar key={i} label={i === growth.length - 1 ? 'Cette semaine' : `S-${growth.length - 1 - i}`} value={w.new_users} max={maxGrowthUsers} color="#00c9a7" />
              ))}
            </div>

            <div style={{ flex: 1, minWidth: 260, background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>Nouvelles annonces</div>
              {growth.map((w, i) => (
                <Bar key={i} label={i === growth.length - 1 ? 'Cette semaine' : `S-${growth.length - 1 - i}`} value={w.new_listings} max={maxGrowthListings} color="#6c63ff" />
              ))}
            </div>

          </div>
        </Section>

        {/* ── TOP PARRAINS ── */}
        {referrals.top_inviters.length > 0 && (
          <Section title="🎁 Top parrains">
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>#</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Nom</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Institution</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Invités</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.top_inviters.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #f0f4f8' }}>
                      <td style={{ padding: '12px 20px', color: '#a0aec0', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 600, color: '#1a2e4a' }}>
                        {p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : '—'}
                        {p.invited_count >= 3 && <span style={{ marginLeft: 6, fontSize: 11, background: 'linear-gradient(135deg,#f59e0b,#e53e3e)', color: 'white', borderRadius: 10, padding: '2px 7px', fontWeight: 700 }}>Fondateur</span>}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#64748b' }}>{p.institution || '—'}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 700, color: '#00c9a7' }}>{p.invited_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

      </div>
    </div>
  )
}
