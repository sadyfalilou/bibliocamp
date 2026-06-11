'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminInvitationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [topInviters, setTopInviters] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch('/api/admin/invitations', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      if (!res.ok) {
        setError(res.status === 403 ? "Accès refusé — admin uniquement." : (json.error || 'Erreur'))
        setLoading(false)
        return
      }
      setStats(json.stats)
      setTopInviters(json.top_inviters || [])
      setLoading(false)
    }
    load()
  }, [])

  const pct = (n, total) => total > 0 ? Math.round((n / total) * 100) : 0

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button onClick={() => router.push('/app')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>←</button>
        <h1 style={{ margin: 0 }}>🔗 Suivi des invitations</h1>
      </div>
      <p style={{ color: '#6b7280', marginBottom: 28 }}>
        Qui invite le plus ? Combien se sont inscrits via invitation ?
      </p>

      {loading && <p style={{ color: '#94a3b8' }}>Chargement...</p>}

      {!loading && error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#e53e3e', borderRadius: 10, padding: 16 }}>
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 32 }}>
            {[
              { label: 'Inscrits au total', value: stats.total_users, color: '#1a2e4a', emoji: '👥' },
              { label: 'Via invitation', value: stats.referred_users, color: '#6c63ff', emoji: '🔗' },
              { label: 'Taux de conversion', value: `${pct(stats.referred_users, stats.total_users)}%`, color: '#00c9a7', emoji: '📈' },
              { label: 'Ont un code', value: stats.users_with_code, color: '#f59e0b', emoji: '🎫' },
              { label: 'Ont invité 3+', value: stats.founders, color: '#e53e3e', emoji: '🏅' },
            ].map(({ label, value, color, emoji }) => (
              <div key={label} style={{
                background: 'white', borderRadius: 12, padding: '18px 20px',
                border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Top inviters */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1a2e4a' }}>
                🏆 Top inviters
              </h2>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{topInviters.length} utilisateurs actifs</span>
            </div>

            {topInviters.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                Aucune invitation enregistrée pour l'instant.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Utilisateur', 'Email', 'Code', 'Invités', 'Badge'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topInviters.map((inv, idx) => (
                    <tr key={inv.id} style={{ borderTop: '1px solid #f0f4f8' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e4a' }}>
                          {inv.first_name || '—'} {inv.last_name || ''}
                        </div>
                        {inv.institution && <div style={{ fontSize: 11, color: '#94a3b8' }}>{inv.institution}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{inv.email || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#1a2e4a' }}>
                          {inv.invite_code}
                        </code>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: inv.invited_count >= 3 ? '#dcfce7' : inv.invited_count >= 1 ? '#dbeafe' : '#f1f5f9',
                          color: inv.invited_count >= 3 ? '#16a34a' : inv.invited_count >= 1 ? '#2563eb' : '#94a3b8',
                          fontWeight: 800, fontSize: 13,
                          padding: '3px 10px', borderRadius: 20
                        }}>
                          {inv.invited_count}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 18 }}>
                        {inv.invited_count >= 3 ? '🏅 Fondateur' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </main>
  )
}
