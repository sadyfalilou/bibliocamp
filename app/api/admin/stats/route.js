import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const auth = request.headers.get('Authorization')
  const token = auth?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user } } = await anonClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé — admin uniquement.' }, { status: 403 })

  const now = new Date()
  const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - 7);  startOfWeek.setHours(0,0,0,0)
  const startOfMonth = new Date(now); startOfMonth.setDate(now.getDate() - 30); startOfMonth.setHours(0,0,0,0)

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end   = new Date(now); end.setDate(now.getDate() - i * 7)
    const start = new Date(end); start.setDate(end.getDate() - 7)
    return { start: start.toISOString(), end: end.toISOString() }
  }).reverse()

  // ── Toutes les requêtes parallèles ──────────────────────────────────────
  const [
    { count: total_users },
    { count: users_week },
    { count: users_month },
    { count: phone_verified },
    { count: users_with_listing },

    { count: listings_active },
    { count: listings_sold },
    { count: listings_week },
    { data: all_listings },

    { count: meet_campus },
    { count: meet_city },
    { count: meet_post },

    { count: total_conversations },
    { count: total_messages },
    { count: conv_week },
    { count: msg_week },

    { count: referred_users },
    { data: top_inviters_raw },
    { data: referredProfiles },

    { data: institutions_raw },
    { data: programs_raw },
    { data: wishlist_raw },

    // ── Tuteurs ──
    { count: total_tutors },
    { count: tutors_active },
    { count: tutors_week },
    { count: tutors_pro },
    { count: tutors_verified },
    { count: tutors_online },
    { count: tutors_campus },
    { count: tutors_city },
    { count: total_reviews },
    { data: tutors_raw },

    // Colocs
    { count: roommates_active },
    { count: roommates_rented },
    { count: roommates_week },
    { count: roommate_reports_pending },

    // International
    { count: intl_total },
    { count: intl_week },
    { data: intl_raw },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('phone_verified', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).not('invite_code', 'is', null),

    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('listings').select('title, isbn, price, original_price, description, status, campus, domain, created_at, user_id'),

    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('meet_campus', true),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('meet_city', true),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('post', true),

    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),

    supabase.from('profiles').select('*', { count: 'exact', head: true }).not('referred_by', 'is', null),
    supabase.from('profiles').select('first_name, last_name, invite_code, institution').not('invite_code', 'is', null),
    supabase.from('profiles').select('referred_by').not('referred_by', 'is', null),

    supabase.from('profiles').select('institution').not('institution', 'is', null),
    supabase.from('profiles').select('program').not('program', 'is', null),
    supabase.from('listings').select('isbn, title').eq('status', 'active'),

    // Tuteurs
    supabase.from('tutors').select('*', { count: 'exact', head: true }),
    supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('tutors').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('is_pro', true),
    supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('meet_online', true),
    supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('meet_campus', true),
    supabase.from('tutors').select('*', { count: 'exact', head: true }).eq('meet_city', true),
    supabase.from('tutor_reviews').select('*', { count: 'exact', head: true }),
    supabase.from('tutors_with_rating').select('rate_per_hour, domains, subjects, avg_rating').eq('is_active', true),

    // Colocs
    supabase.from('roommate_listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('roommate_listings').select('*', { count: 'exact', head: true }).eq('status', 'rented'),
    supabase.from('roommate_listings').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('roommate_reports').select('roommate_listing_id', { count: 'exact', head: true }),

    // International
    supabase.from('international_diagnostics').select('*', { count: 'exact', head: true }),
    supabase.from('international_diagnostics').select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('international_diagnostics').select('status, forfait, payment_status'),
  ])

  // ── Calculs ─────────────────────────────────────────────────────────────

  // Prix
  const active_prices = (all_listings || []).filter(l => l.status === 'active').map(l => l.price).filter(Boolean)
  const sold_prices   = (all_listings || []).filter(l => l.status === 'sold').map(l => l.price).filter(Boolean)
  const avg_price     = active_prices.length ? Math.round(active_prices.reduce((a, b) => a + b, 0) / active_prices.length) : 0
  const avg_sold      = sold_prices.length   ? Math.round(sold_prices.reduce((a, b) => a + b, 0) / sold_prices.length) : 0
  const min_price     = active_prices.length ? Math.min(...active_prices) : 0
  const max_price     = active_prices.length ? Math.max(...active_prices) : 0

  // Économies générées (prix original - prix vendu)
  const savings = (all_listings || [])
    .filter(l => l.status === 'sold' && l.original_price && l.price)
    .reduce((sum, l) => sum + (l.original_price - l.price), 0)

  // État des livres
  const etat_counts = {}
  ;(all_listings || []).forEach(l => {
    if (l.description) etat_counts[l.description] = (etat_counts[l.description] || 0) + 1
  })

  // Fourchettes de prix
  const price_ranges = { '0-10$': 0, '11-20$': 0, '21-40$': 0, '41-60$': 0, '60$+': 0 }
  active_prices.forEach(p => {
    if (p <= 10) price_ranges['0-10$']++
    else if (p <= 20) price_ranges['11-20$']++
    else if (p <= 40) price_ranges['21-40$']++
    else if (p <= 60) price_ranges['41-60$']++
    else price_ranges['60$+']++
  })

  // Répartition par domaine d'études
  const domain_counts = {}
  ;(all_listings || []).forEach(l => {
    if (l.domain) domain_counts[l.domain] = (domain_counts[l.domain] || 0) + 1
  })

  // Top livres (par ISBN)
  const isbn_counts = {}
  ;(all_listings || []).forEach(l => {
    if (l.isbn) {
      if (!isbn_counts[l.isbn]) isbn_counts[l.isbn] = { title: l.title, count: 0, sold: 0 }
      isbn_counts[l.isbn].count++
      if (l.status === 'sold') isbn_counts[l.isbn].sold++
    }
  })
  const top_books = Object.entries(isbn_counts)
    .map(([isbn, v]) => ({ isbn, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Top institutions
  const inst_counts = {}
  ;(institutions_raw || []).forEach(p => {
    if (p.institution) inst_counts[p.institution] = (inst_counts[p.institution] || 0) + 1
  })
  const top_institutions = Object.entries(inst_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // Top programmes
  const prog_counts = {}
  ;(programs_raw || []).forEach(p => {
    if (p.program) prog_counts[p.program] = (prog_counts[p.program] || 0) + 1
  })
  const top_programs = Object.entries(prog_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // Top livres en demande (wishlist — isbn les plus sauvegardés)
  const wishlist_counts = {}
  ;(wishlist_raw || []).forEach(l => {
    if (l.isbn) wishlist_counts[l.isbn] = (wishlist_counts[l.isbn] || 0) + 1
  })

  // Parrainages
  const inviteCountMap = {}
  ;(referredProfiles || []).forEach(p => {
    if (p.referred_by) inviteCountMap[p.referred_by] = (inviteCountMap[p.referred_by] || 0) + 1
  })
  const top_inviters = (top_inviters_raw || [])
    .map(p => ({ ...p, invited_count: inviteCountMap[p.invite_code] || 0 }))
    .filter(p => p.invited_count > 0)
    .sort((a, b) => b.invited_count - a.invited_count)
    .slice(0, 10)
  const founders = Object.values(inviteCountMap).filter(c => c >= 3).length

  // Taux d'activation (user avec au moins 1 annonce)
  const sellers_set = new Set((all_listings || []).map(l => l.user_id))
  const active_sellers = sellers_set.size

  // Croissance 8 semaines
  const growth = await Promise.all(weeks.map(async w => {
    const [{ count: new_users }, { count: new_listings }, { count: new_conv }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', w.start).lt('created_at', w.end),
      supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', w.start).lt('created_at', w.end),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).gte('created_at', w.start).lt('created_at', w.end),
    ])
    return { new_users: new_users || 0, new_listings: new_listings || 0, new_conv: new_conv || 0 }
  }))

  // Croissance juin 2026 → juin 2028 (fenêtre fixe depuis le lancement)
  const launchYear = 2026, launchMonth = 5 // juin 2026 (mois 0-indexé)
  const endYear    = 2028, endMonth    = 6 // juillet 2028 (exclusif → affiche jusqu'à juin 2028)
  const months = []
  let y = launchYear, mo = launchMonth
  while (y < endYear || (y === endYear && mo < endMonth)) {
    const start = new Date(y, mo, 1).toISOString()
    const end   = new Date(y, mo + 1, 1).toISOString()
    const label = new Date(y, mo, 1).toLocaleString('fr-CA', { month: 'short', year: '2-digit' })
    const isCurrent = y === now.getFullYear() && mo === now.getMonth()
    const isFuture  = new Date(y, mo, 1) > now
    months.push({ start, end, label, isCurrent, isFuture })
    mo++
    if (mo > 11) { mo = 0; y++ }
  }

  const growth_monthly = await Promise.all(months.map(async m => {
    const [{ count: new_users }, { count: new_listings }, { count: new_conv }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', m.start).lt('created_at', m.end),
      supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', m.start).lt('created_at', m.end),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).gte('created_at', m.start).lt('created_at', m.end),
    ])
    return { label: m.label, isCurrent: m.isCurrent, isFuture: m.isFuture, new_users: new_users || 0, new_listings: new_listings || 0, new_conv: new_conv || 0 }
  }))

  // ── Stats tuteurs ────────────────────────────────────────────────────────
  const tutorRates = (tutors_raw || []).map(t => Number(t.rate_per_hour)).filter(Boolean)
  const avg_rate   = tutorRates.length ? Math.round(tutorRates.reduce((a,b) => a+b,0) / tutorRates.length) : 0
  const min_rate   = tutorRates.length ? Math.min(...tutorRates) : 0
  const max_rate   = tutorRates.length ? Math.max(...tutorRates) : 0

  // Top domaines
  const domainCounts = {}
  ;(tutors_raw || []).forEach(t => {
    (t.domains || []).forEach(d => { domainCounts[d] = (domainCounts[d] || 0) + 1 })
  })
  const top_domains = Object.entries(domainCounts)
    .sort((a,b) => b[1]-a[1]).slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  // Fourchettes de tarifs
  const rate_ranges = { '10-20$/h': 0, '21-40$/h': 0, '41-60$/h': 0, '61-100$/h': 0, '100$+/h': 0 }
  tutorRates.forEach(r => {
    if      (r <= 20)  rate_ranges['10-20$/h']++
    else if (r <= 40)  rate_ranges['21-40$/h']++
    else if (r <= 60)  rate_ranges['41-60$/h']++
    else if (r <= 100) rate_ranges['61-100$/h']++
    else               rate_ranges['100$+/h']++
  })

  // Taux d'avis moyen global
  const rated_tutors = (tutors_raw || []).filter(t => t.avg_rating && Number(t.avg_rating) > 0)
  const platform_avg_rating = rated_tutors.length
    ? (rated_tutors.reduce((s,t) => s + Number(t.avg_rating), 0) / rated_tutors.length).toFixed(1)
    : null

  // ── Stats international ─────────────────────────────────────────────────
  const intl_by_status = {}
  const intl_by_forfait = {}
  let intl_paid = 0
  ;(intl_raw || []).forEach(d => {
    if (d.status) intl_by_status[d.status] = (intl_by_status[d.status] || 0) + 1
    if (d.forfait) intl_by_forfait[d.forfait] = (intl_by_forfait[d.forfait] || 0) + 1
    if (d.payment_status === 'paye') intl_paid++
  })

  return NextResponse.json({
    generated_at: now.toISOString(),
    users: {
      total: total_users || 0,
      week: users_week || 0,
      month: users_month || 0,
      phone_verified: phone_verified || 0,
      with_listing: active_sellers,
      activation_rate: total_users ? Math.round((active_sellers / total_users) * 100) : 0,
    },
    listings: {
      active: listings_active || 0,
      sold: listings_sold || 0,
      week: listings_week || 0,
      total: (listings_active || 0) + (listings_sold || 0),
      sell_rate: ((listings_active || 0) + (listings_sold || 0)) > 0
        ? Math.round(((listings_sold || 0) / ((listings_active || 0) + (listings_sold || 0))) * 100) : 0,
      avg_price,
      avg_sold_price: avg_sold,
      min_price,
      max_price,
      total_savings: Math.round(savings),
      by_etat: etat_counts,
      by_domain: domain_counts,
      price_ranges,
      meet_campus: meet_campus || 0,
      meet_city: meet_city || 0,
      meet_post: meet_post || 0,
      top_books,
    },
    messages: {
      conversations: total_conversations || 0,
      total: total_messages || 0,
      conv_week: conv_week || 0,
      msg_week: msg_week || 0,
      avg_per_conv: total_conversations ? Math.round((total_messages || 0) / total_conversations) : 0,
      engagement_rate: total_users ? Math.round(((total_conversations || 0) / total_users) * 100) : 0,
    },
    referrals: { total: referred_users || 0, founders, top_inviters },
    community: { top_institutions, top_programs },
    growth,
    growth_monthly,
    tutors: {
      total:     total_tutors    || 0,
      active:    tutors_active   || 0,
      week:      tutors_week     || 0,
      pro:       tutors_pro      || 0,
      verified:  tutors_verified || 0,
      meet_online:  tutors_online  || 0,
      meet_campus:  tutors_campus  || 0,
      meet_city:    tutors_city    || 0,
      total_reviews: total_reviews || 0,
      avg_rate,
      min_rate,
      max_rate,
      top_domains,
      rate_ranges,
      platform_avg_rating,
      inactive: (total_tutors || 0) - (tutors_active || 0),
    },
    roommates: {
      active: roommates_active || 0,
      rented: roommates_rented || 0,
      week: roommates_week || 0,
      total: (roommates_active || 0) + (roommates_rented || 0),
      pending_reports: roommate_reports_pending || 0,
    },
    international: {
      total: intl_total || 0,
      week: intl_week || 0,
      paid: intl_paid,
      by_status: intl_by_status,
      by_forfait: intl_by_forfait,
    },
  })
}
