'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

function Stat({ label, value, sub, color = '#1a2e4a', icon, highlight }) {
  return (
    <div style={{
      background: highlight ? 'linear-gradient(135deg, #1a2e4a, #2d4a6b)' : 'white',
      borderRadius: 12, padding: '20px 24px',
      border: highlight ? 'none' : '1px solid #e2e8f0',
      flex: 1, minWidth: 140
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: highlight ? 'white' : color }}>{value ?? '—'}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: highlight ? '#a0c4d8' : '#1a2e4a', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: highlight ? '#7ab0cc' : '#a0aec0', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1.2, margin: '0 0 14px' }}>{title}</h2>
      {children}
    </div>
  )
}

function Bar({ label, value, max, color = '#00c9a7', sub }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
        <span style={{ color: '#1a2e4a', fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#64748b' }}>{value}{sub}</span>
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 6, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', ...style }}>
      {children}
    </div>
  )
}

function CardTitle({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 }}>{children}</div>
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

  const { users, listings, messages, referrals, community, growth, growth_monthly } = data
  const maxGrowthUsers    = Math.max(...growth.map(g => g.new_users), 1)
  const maxGrowthListings = Math.max(...growth.map(g => g.new_listings), 1)
  const maxGrowthConv     = Math.max(...growth.map(g => g.new_conv), 1)
  const maxMonthUsers    = Math.max(...(growth_monthly || []).map(g => g.new_users), 1)
  const maxMonthListings = Math.max(...(growth_monthly || []).map(g => g.new_listings), 1)
  const maxMonthConv     = Math.max(...(growth_monthly || []).map(g => g.new_conv), 1)
  const maxInst = Math.max(...(community.top_institutions.map(i => i.count)), 1)
  const maxProg = Math.max(...(community.top_programs.map(p => p.count)), 1)
  const maxBook = Math.max(...(listings.top_books.map(b => b.count)), 1)
  const maxRange = Math.max(...Object.values(listings.price_ranges), 1)
  const generatedAt = new Date(data.generated_at).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#f5f7fa', padding: '40px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 36 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b', paddingTop: 4 }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a2e4a', margin: 0 }}>📊 Tableau de bord</h1>
            <p style={{ fontSize: 13, color: '#a0aec0', margin: '4px 0 0' }}>Mis à jour le {generatedAt}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/admin/invitations" style={{ fontSize: 13, color: '#00c9a7', fontWeight: 600, textDecoration: 'none' }}>Invitations →</a>
            <a href="/admin/reports" style={{ fontSize: 13, color: '#00c9a7', fontWeight: 600, textDecoration: 'none' }}>Signalements →</a>
          </div>
        </div>

        {/* ── KPIs CLÉS ── */}
        <Section title="🔑 KPIs clés">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Stat icon="👥" label="Utilisateurs" value={users.total} sub={`+${users.week} cette semaine`} color="#1a2e4a" highlight />
            <Stat icon="📚" label="Annonces actives" value={listings.active} sub={`+${listings.week} cette semaine`} color="#16a34a" highlight />
            <Stat icon="🏷️" label="Livres vendus" value={listings.sold} sub={`${listings.sell_rate}% taux de vente`} color="#e53e3e" highlight />
            <Stat icon="💬" label="Conversations" value={messages.conversations} sub={`${messages.avg_per_conv} msg/conv en moy.`} color="#6c63ff" highlight />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Stat icon="💰" label="Économies générées" value={`${listings.total_savings} $`} sub="diff. prix neuf vs occasion" color="#16a34a" />
            <Stat icon="📱" label="Numéros vérifiés" value={`${users.phone_verified}`} sub={`${Math.round(users.phone_verified / Math.max(users.total,1) * 100)}% des comptes`} color="#6c63ff" />
            <Stat icon="🚀" label="Taux d'activation" value={`${users.activation_rate}%`} sub={`${users.with_listing} vendeurs actifs`} color="#f59e0b" />
            <Stat icon="🎁" label="Inscrits par parrainage" value={referrals.total} sub={`${referrals.founders} fondateurs`} color="#e53e3e" />
          </div>
        </Section>

        {/* ── CROISSANCE ── */}
        <Section title="📈 Croissance (8 semaines)">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Card style={{ flex: 1, minWidth: 260 }}>
              <CardTitle>Nouveaux utilisateurs / semaine</CardTitle>
              {growth.map((w, i) => (
                <Bar key={i} label={i === growth.length - 1 ? '← Cette semaine' : `S-${growth.length - 1 - i}`} value={w.new_users} max={maxGrowthUsers} color="#00c9a7" />
              ))}
            </Card>
            <Card style={{ flex: 1, minWidth: 260 }}>
              <CardTitle>Nouvelles annonces / semaine</CardTitle>
              {growth.map((w, i) => (
                <Bar key={i} label={i === growth.length - 1 ? '← Cette semaine' : `S-${growth.length - 1 - i}`} value={w.new_listings} max={maxGrowthListings} color="#6c63ff" />
              ))}
            </Card>
            <Card style={{ flex: 1, minWidth: 260 }}>
              <CardTitle>Nouvelles conversations / semaine</CardTitle>
              {growth.map((w, i) => (
                <Bar key={i} label={i === growth.length - 1 ? '← Cette semaine' : `S-${growth.length - 1 - i}`} value={w.new_conv} max={maxGrowthConv} color="#f59e0b" />
              ))}
            </Card>
          </div>
        </Section>

        {/* ── CROISSANCE MENSUELLE ── */}
        {growth_monthly && (
          <Section title="📅 Croissance mensuelle (24 mois)">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Card style={{ flex: 1, minWidth: 260 }}>
                <CardTitle>Nouveaux utilisateurs / mois</CardTitle>
                {growth_monthly.map((m, i) => (
                  <Bar key={i}
                    label={m.isCurrent ? `← ${m.label}` : m.label}
                    value={m.new_users}
                    max={maxMonthUsers}
                    color={m.isCurrent ? '#00c9a7' : '#a7f3e0'}
                  />
                ))}
              </Card>
              <Card style={{ flex: 1, minWidth: 260 }}>
                <CardTitle>Nouvelles annonces / mois</CardTitle>
                {growth_monthly.map((m, i) => (
                  <Bar key={i}
                    label={m.isCurrent ? `← ${m.label}` : m.label}
                    value={m.new_listings}
                    max={maxMonthListings}
                    color={m.isCurrent ? '#6c63ff' : '#c4b5fd'}
                  />
                ))}
              </Card>
              <Card style={{ flex: 1, minWidth: 260 }}>
                <CardTitle>Nouvelles conversations / mois</CardTitle>
                {growth_monthly.map((m, i) => (
                  <Bar key={i}
                    label={m.isCurrent ? `← ${m.label}` : m.label}
                    value={m.new_conv}
                    max={maxMonthConv}
                    color={m.isCurrent ? '#f59e0b' : '#fde68a'}
                  />
                ))}
              </Card>
            </div>
          </Section>
        )}

        {/* ── ANNONCES ── */}
        <Section title="📚 Annonces & livres">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <CardTitle>Prix des annonces actives</CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Prix moyen', value: `${listings.avg_price} $`, color: '#00c9a7' },
                  { label: 'Prix min', value: `${listings.min_price} $`, color: '#16a34a' },
                  { label: 'Prix max', value: `${listings.max_price} $`, color: '#e53e3e' },
                  { label: 'Prix moyen vendu', value: `${listings.avg_sold_price} $`, color: '#6c63ff' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <CardTitle>Fourchettes de prix</CardTitle>
              {Object.entries(listings.price_ranges).map(([range, count]) => (
                <Bar key={range} label={range} value={count} max={maxRange} color="#1a2e4a" />
              ))}
            </Card>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <CardTitle>État des livres</CardTitle>
              {Object.entries(listings.by_etat).sort((a,b) => b[1]-a[1]).map(([etat, count]) => (
                <Bar key={etat} label={etat} value={count} max={listings.total} color="#00c9a7" />
              ))}
            </Card>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <CardTitle>Méthodes de transaction</CardTitle>
              <Bar label="🏫 Campus" value={listings.meet_campus} max={listings.total} color="#6c63ff" />
              <Bar label="🏙️ Ville" value={listings.meet_city} max={listings.total} color="#f59e0b" />
              <Bar label="📦 Envoi postal" value={listings.meet_post} max={listings.total} color="#2563eb" />
            </Card>

            {listings.top_books.length > 0 && (
              <Card style={{ flex: 2, minWidth: 300 }}>
                <CardTitle>📖 Livres les plus listés</CardTitle>
                {listings.top_books.map((b, i) => (
                  <div key={b.isbn} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < listings.top_books.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#a0aec0', width: 20, flexShrink: 0 }}>{i+1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e4a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title || b.isbn}</div>
                      <div style={{ fontSize: 11, color: '#a0aec0' }}>ISBN {b.isbn}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#00c9a7', background: '#f0fdf9', borderRadius: 6, padding: '2px 8px' }}>{b.count} listés</span>
                      {b.sold > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#e53e3e', background: '#fff5f5', borderRadius: 6, padding: '2px 8px' }}>{b.sold} vendus</span>}
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </Section>

        {/* ── ENGAGEMENT ── */}
        <Section title="💬 Engagement">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Stat icon="💬" label="Conversations total" value={messages.conversations} sub={`+${messages.conv_week} cette semaine`} color="#1a2e4a" />
            <Stat icon="✉️" label="Messages envoyés" value={messages.total} sub={`+${messages.msg_week} cette semaine`} color="#2563eb" />
            <Stat icon="📊" label="Messages / conv" value={messages.avg_per_conv} sub="moyenne" color="#6c63ff" />
            <Stat icon="🔥" label="Taux d'engagement" value={`${messages.engagement_rate}%`} sub="users avec 1+ conversation" color="#f59e0b" />
          </div>
        </Section>

        {/* ── COMMUNAUTÉ ── */}
        <Section title="🏫 Communauté">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {community.top_institutions.length > 0 && (
              <Card style={{ flex: 1, minWidth: 260 }}>
                <CardTitle>Top institutions</CardTitle>
                {community.top_institutions.map(inst => (
                  <Bar key={inst.name} label={inst.name} value={inst.count} max={maxInst} color="#00c9a7" sub=" membres" />
                ))}
              </Card>
            )}
            {community.top_programs.length > 0 && (
              <Card style={{ flex: 1, minWidth: 260 }}>
                <CardTitle>Top programmes</CardTitle>
                {community.top_programs.map(prog => (
                  <Bar key={prog.name} label={prog.name} value={prog.count} max={maxProg} color="#6c63ff" sub=" étudiants" />
                ))}
              </Card>
            )}
          </div>
        </Section>

        {/* ── TOP PARRAINS ── */}
        {referrals.top_inviters.length > 0 && (
          <Section title="🎁 Top parrains">
            <Card>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Nom', 'Institution', 'Invités'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: i === 3 ? 'right' : 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrals.top_inviters.map((p, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f0f4f8' }}>
                      <td style={{ padding: '10px 16px', color: '#a0aec0', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1a2e4a' }}>
                        {p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : '—'}
                        {p.invited_count >= 3 && (
                          <span style={{ marginLeft: 8, fontSize: 11, background: 'linear-gradient(135deg,#f59e0b,#e53e3e)', color: 'white', borderRadius: 10, padding: '2px 7px', fontWeight: 700 }}>Fondateur</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#64748b' }}>{p.institution || '—'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#00c9a7' }}>{p.invited_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </Section>
        )}

      </div>
    </div>
  )
}
